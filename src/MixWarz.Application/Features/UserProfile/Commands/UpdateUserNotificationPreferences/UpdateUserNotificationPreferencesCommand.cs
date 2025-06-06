using MediatR;

namespace MixWarz.Application.Features.UserProfile.Commands.UpdateUserNotificationPreferences
{
    public class UpdateUserNotificationPreferencesCommand : IRequest<UpdateUserNotificationPreferencesResponse>
    {
        public string UserId { get; set; } = string.Empty;
        public bool EmailNotifications { get; set; } = true;
        public bool CompetitionUpdates { get; set; } = true;
        public bool MarketingEmails { get; set; } = false;
        public bool OrderUpdates { get; set; } = true;
    }

    public class UpdateUserNotificationPreferencesResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool EmailNotifications { get; set; }
        public bool CompetitionUpdates { get; set; }
        public bool MarketingEmails { get; set; }
        public bool OrderUpdates { get; set; }
    }
}