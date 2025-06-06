using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Features.UserProfile.Commands.UpdateUserNotificationPreferences
{
    public class UpdateUserNotificationPreferencesCommandHandler : IRequestHandler<UpdateUserNotificationPreferencesCommand, UpdateUserNotificationPreferencesResponse>
    {
        private readonly UserManager<User> _userManager;
        private readonly ILogger<UpdateUserNotificationPreferencesCommandHandler> _logger;

        public UpdateUserNotificationPreferencesCommandHandler(
            UserManager<User> userManager,
            ILogger<UpdateUserNotificationPreferencesCommandHandler> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<UpdateUserNotificationPreferencesResponse> Handle(UpdateUserNotificationPreferencesCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Updating notification preferences for user {UserId}", request.UserId);

                // Find the user
                var user = await _userManager.FindByIdAsync(request.UserId);
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found", request.UserId);
                    return new UpdateUserNotificationPreferencesResponse
                    {
                        Success = false,
                        Message = "User not found"
                    };
                }

                // Note: Since the User entity doesn't have notification preference properties yet,
                // we'll store them as user claims for now. In a production system, you might want
                // to add these properties to the User entity or create a separate UserPreferences table.

                // Remove existing notification preference claims
                var existingClaims = await _userManager.GetClaimsAsync(user);
                var notificationClaims = existingClaims.Where(c =>
                    c.Type.StartsWith("notification_") ||
                    c.Type.StartsWith("email_") ||
                    c.Type.StartsWith("competition_") ||
                    c.Type.StartsWith("marketing_") ||
                    c.Type.StartsWith("order_")).ToList();

                if (notificationClaims.Any())
                {
                    var removeResult = await _userManager.RemoveClaimsAsync(user, notificationClaims);
                    if (!removeResult.Succeeded)
                    {
                        _logger.LogWarning("Failed to remove existing notification claims for user {UserId}", request.UserId);
                    }
                }

                // Add new notification preference claims
                var newClaims = new[]
                {
                    new System.Security.Claims.Claim("notification_email", request.EmailNotifications.ToString()),
                    new System.Security.Claims.Claim("notification_competition", request.CompetitionUpdates.ToString()),
                    new System.Security.Claims.Claim("notification_marketing", request.MarketingEmails.ToString()),
                    new System.Security.Claims.Claim("notification_orders", request.OrderUpdates.ToString())
                };

                var addResult = await _userManager.AddClaimsAsync(user, newClaims);
                if (!addResult.Succeeded)
                {
                    var errors = string.Join(", ", addResult.Errors.Select(e => e.Description));
                    _logger.LogError("Failed to update notification preferences for user {UserId}: {Errors}", request.UserId, errors);
                    return new UpdateUserNotificationPreferencesResponse
                    {
                        Success = false,
                        Message = $"Failed to update notification preferences: {errors}"
                    };
                }

                _logger.LogInformation("Successfully updated notification preferences for user {UserId}", request.UserId);
                return new UpdateUserNotificationPreferencesResponse
                {
                    Success = true,
                    Message = "Notification preferences updated successfully",
                    EmailNotifications = request.EmailNotifications,
                    CompetitionUpdates = request.CompetitionUpdates,
                    MarketingEmails = request.MarketingEmails,
                    OrderUpdates = request.OrderUpdates
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification preferences for user {UserId}", request.UserId);
                return new UpdateUserNotificationPreferencesResponse
                {
                    Success = false,
                    Message = "An error occurred while updating notification preferences"
                };
            }
        }
    }
}