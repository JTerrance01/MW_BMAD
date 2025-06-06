using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Features.UserProfile.Commands.UpdateUserPassword
{
    public class UpdateUserPasswordCommandHandler : IRequestHandler<UpdateUserPasswordCommand, UpdateUserPasswordResponse>
    {
        private readonly UserManager<User> _userManager;
        private readonly ILogger<UpdateUserPasswordCommandHandler> _logger;

        public UpdateUserPasswordCommandHandler(
            UserManager<User> userManager,
            ILogger<UpdateUserPasswordCommandHandler> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<UpdateUserPasswordResponse> Handle(UpdateUserPasswordCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Password change requested for user {UserId}", request.UserId);

                // Validate input
                if (string.IsNullOrEmpty(request.CurrentPassword))
                {
                    return new UpdateUserPasswordResponse
                    {
                        Success = false,
                        Message = "Current password is required"
                    };
                }

                if (string.IsNullOrEmpty(request.NewPassword))
                {
                    return new UpdateUserPasswordResponse
                    {
                        Success = false,
                        Message = "New password is required"
                    };
                }

                if (request.NewPassword != request.ConfirmPassword)
                {
                    return new UpdateUserPasswordResponse
                    {
                        Success = false,
                        Message = "New password and confirmation password do not match"
                    };
                }

                if (request.CurrentPassword == request.NewPassword)
                {
                    return new UpdateUserPasswordResponse
                    {
                        Success = false,
                        Message = "New password must be different from current password"
                    };
                }

                // Find the user
                var user = await _userManager.FindByIdAsync(request.UserId);
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found for password change", request.UserId);
                    return new UpdateUserPasswordResponse
                    {
                        Success = false,
                        Message = "User not found"
                    };
                }

                // Verify current password
                var isCurrentPasswordValid = await _userManager.CheckPasswordAsync(user, request.CurrentPassword);
                if (!isCurrentPasswordValid)
                {
                    _logger.LogWarning("Invalid current password provided for user {UserId}", request.UserId);
                    return new UpdateUserPasswordResponse
                    {
                        Success = false,
                        Message = "Current password is incorrect"
                    };
                }

                // Change password
                var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    _logger.LogError("Failed to change password for user {UserId}: {Errors}", request.UserId, errors);
                    return new UpdateUserPasswordResponse
                    {
                        Success = false,
                        Message = $"Password change failed: {errors}"
                    };
                }

                _logger.LogInformation("Password successfully changed for user {UserId}", request.UserId);
                return new UpdateUserPasswordResponse
                {
                    Success = true,
                    Message = "Password changed successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for user {UserId}", request.UserId);
                return new UpdateUserPasswordResponse
                {
                    Success = false,
                    Message = "An error occurred while changing the password"
                };
            }
        }
    }
}