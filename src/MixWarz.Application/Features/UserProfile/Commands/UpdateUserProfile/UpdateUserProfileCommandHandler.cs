using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Features.UserProfile.Commands.UpdateUserProfile
{
    public class UpdateUserProfileCommandHandler : IRequestHandler<UpdateUserProfileCommand, UpdateUserProfileResponse>
    {
        private readonly UserManager<User> _userManager;
        private readonly ILogger<UpdateUserProfileCommandHandler> _logger;

        public UpdateUserProfileCommandHandler(
            UserManager<User> userManager,
            ILogger<UpdateUserProfileCommandHandler> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<UpdateUserProfileResponse> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Updating profile for user {UserId}", request.UserId);

                // Find the user
                var user = await _userManager.FindByIdAsync(request.UserId);
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found", request.UserId);
                    return new UpdateUserProfileResponse
                    {
                        Success = false,
                        Message = "User not found"
                    };
                }

                // Check if email is being changed and if it's already taken
                if (!string.IsNullOrEmpty(request.Email) &&
                    !string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase))
                {
                    var existingUser = await _userManager.FindByEmailAsync(request.Email);
                    if (existingUser != null && existingUser.Id != user.Id)
                    {
                        _logger.LogWarning("Email {Email} is already taken by another user", request.Email);
                        return new UpdateUserProfileResponse
                        {
                            Success = false,
                            Message = "Email address is already in use"
                        };
                    }
                }

                // Update user properties
                var hasChanges = false;

                if (!string.IsNullOrEmpty(request.FirstName) && user.FirstName != request.FirstName)
                {
                    user.FirstName = request.FirstName.Trim();
                    hasChanges = true;
                }

                if (!string.IsNullOrEmpty(request.LastName) && user.LastName != request.LastName)
                {
                    user.LastName = request.LastName.Trim();
                    hasChanges = true;
                }

                if (!string.IsNullOrEmpty(request.Email) && user.Email != request.Email)
                {
                    user.Email = request.Email.Trim();
                    user.UserName = request.Email.Trim(); // Keep username in sync with email
                    hasChanges = true;
                }

                if (!hasChanges)
                {
                    _logger.LogInformation("No changes detected for user {UserId}", request.UserId);
                    return new UpdateUserProfileResponse
                    {
                        Success = true,
                        Message = "No changes were made",
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Email = user.Email
                    };
                }

                // Save changes
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    _logger.LogError("Failed to update user {UserId}: {Errors}", request.UserId, errors);
                    return new UpdateUserProfileResponse
                    {
                        Success = false,
                        Message = $"Failed to update profile: {errors}"
                    };
                }

                _logger.LogInformation("Successfully updated profile for user {UserId}", request.UserId);
                return new UpdateUserProfileResponse
                {
                    Success = true,
                    Message = "Profile updated successfully",
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating profile for user {UserId}", request.UserId);
                return new UpdateUserProfileResponse
                {
                    Success = false,
                    Message = "An error occurred while updating the profile"
                };
            }
        }
    }
}