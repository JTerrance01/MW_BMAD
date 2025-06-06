using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Features.Admin.Commands.DisableUser
{
    public class DisableUserCommandHandler : IRequestHandler<DisableUserCommand, DisableUserResponse>
    {
        private readonly UserManager<User> _userManager;
        private readonly ILogger<DisableUserCommandHandler> _logger;

        public DisableUserCommandHandler(UserManager<User> userManager, ILogger<DisableUserCommandHandler> logger)
        {
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<DisableUserResponse> Handle(DisableUserCommand request, CancellationToken cancellationToken)
        {
            var response = new DisableUserResponse
            {
                UserId = request.UserId,
                Success = false,
                Message = "Failed to update user status"
            };

            // Find the user
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                _logger.LogWarning("User with ID {UserId} not found", request.UserId);
                response.Message = "User not found";
                return response;
            }

            // Check if user is an Admin role and we're trying to disable them
            if (request.Disable && await _userManager.IsInRoleAsync(user, "Admin"))
            {
                // Count how many admin users there are that are not disabled
                var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
                var enabledAdminCount = 0;

                foreach (var admin in adminUsers)
                {
                    if (admin.Id == user.Id) continue; // Skip current user
                    if (admin.LockoutEnd == null || admin.LockoutEnd <= DateTimeOffset.UtcNow)
                    {
                        enabledAdminCount++;
                    }
                }

                if (enabledAdminCount == 0)
                {
                    _logger.LogWarning("Cannot disable the last active admin user with ID {UserId}", request.UserId);
                    response.Message = "Cannot disable the last active admin user";
                    return response;
                }
            }

            // Set lockout status
            IdentityResult result;
            if (request.Disable)
            {
                // Disable user by setting lockout end to far future
                result = await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
                if (result.Succeeded)
                {
                    // Also enable lockout for this user if it wasn't already
                    await _userManager.SetLockoutEnabledAsync(user, true);
                }
            }
            else
            {
                // Enable user by removing lockout
                result = await _userManager.SetLockoutEndDateAsync(user, null);
            }

            if (result.Succeeded)
            {
                var action = request.Disable ? "disabled" : "enabled";
                _logger.LogInformation("User with ID {UserId} has been {Action}", request.UserId, action);

                response.Success = true;
                response.Message = $"User {action} successfully";
                response.IsDisabled = request.Disable;
                return response;
            }

            // If operation failed, log the errors
            _logger.LogError("Failed to update user {UserId} status. Errors: {Errors}",
                request.UserId, string.Join(", ", result.Errors));

            response.Message = "Failed to update user status: " + string.Join(", ", result.Errors.Select(e => e.Description));
            return response;
        }
    }
}