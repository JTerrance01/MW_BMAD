using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using MixWarz.Domain.Entities;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.Admin.Commands.DeleteUser
{
    public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand, DeleteUserResponse>
    {
        private readonly UserManager<User> _userManager;
        private readonly ILogger<DeleteUserCommandHandler> _logger;

        public DeleteUserCommandHandler(UserManager<User> userManager, ILogger<DeleteUserCommandHandler> logger)
        {
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<DeleteUserResponse> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
        {
            var response = new DeleteUserResponse
            {
                UserId = request.UserId,
                Success = false,
                Message = "Failed to delete user"
            };

            // Find the user
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                _logger.LogWarning("User with ID {UserId} not found", request.UserId);
                response.Message = "User not found";
                return response;
            }

            // Check if user is an Admin role
            if (await _userManager.IsInRoleAsync(user, "Admin"))
            {
                // Count how many admin users there are
                var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
                if (adminUsers.Count <= 1)
                {
                    _logger.LogWarning("Cannot delete the last admin user with ID {UserId}", request.UserId);
                    response.Message = "Cannot delete the last admin user";
                    return response;
                }
            }

            // Attempt to delete the user
            var result = await _userManager.DeleteAsync(user);

            if (result.Succeeded)
            {
                _logger.LogInformation("User with ID {UserId} has been deleted", request.UserId);
                response.Success = true;
                response.Message = "User deleted successfully";
                return response;
            }

            // If deletion failed, log the errors
            foreach (var error in result.Errors)
            {
                _logger.LogError("Error deleting user {UserId}: {ErrorCode} - {ErrorDescription}",
                    request.UserId, error.Code, error.Description);
            }

            response.Message = "Failed to delete user: " + string.Join(", ", result.Errors.Select(e => e.Description));
            return response;
        }
    }
}