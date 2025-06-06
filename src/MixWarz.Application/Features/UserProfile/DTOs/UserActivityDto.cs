using System;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.UserProfile.DTOs
{
    public class UserActivityDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; }
        public ActivityType Type { get; set; }
        public string ActivityTypeDisplay => Type.ToString();
        public string Description { get; set; }
        public string RelatedEntityType { get; set; }
        public int? RelatedEntityId { get; set; }
        public DateTime Timestamp { get; set; }
        public string FormattedTimestamp => Timestamp.ToString("MMM dd, yyyy HH:mm:ss");
        public string TimeAgo => GetTimeAgo(Timestamp);
        
        private string GetTimeAgo(DateTime dateTime)
        {
            var timeSpan = DateTime.UtcNow - dateTime;
            
            if (timeSpan.TotalMinutes < 1)
                return "just now";
            if (timeSpan.TotalHours < 1)
                return $"{(int)timeSpan.TotalMinutes} minutes ago";
            if (timeSpan.TotalDays < 1)
                return $"{(int)timeSpan.TotalHours} hours ago";
            if (timeSpan.TotalDays < 7)
                return $"{(int)timeSpan.TotalDays} days ago";
            if (timeSpan.TotalDays < 30)
                return $"{(int)(timeSpan.TotalDays / 7)} weeks ago";
            if (timeSpan.TotalDays < 365)
                return $"{(int)(timeSpan.TotalDays / 30)} months ago";
            
            return $"{(int)(timeSpan.TotalDays / 365)} years ago";
        }
    }
} 