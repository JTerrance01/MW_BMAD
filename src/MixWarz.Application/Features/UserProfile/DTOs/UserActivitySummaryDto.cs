using System;
using System.Collections.Generic;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.UserProfile.DTOs
{
    public class UserActivitySummaryDto
    {
        public string UserId { get; set; }
        public string Username { get; set; }
        public int TotalActivities { get; set; }
        public int LoginCount { get; set; }
        public int SubmissionCount { get; set; }
        public int PurchaseCount { get; set; }
        public int BlogInteractionCount { get; set; }
        public int ProfileUpdateCount { get; set; }

        // Renamed property - keeping both for backward compatibility 
        public Dictionary<string, int> ActivityTypeDistribution { get; set; }
        public Dictionary<string, int> ActivityByType { get; set; }

        // Renamed property - keeping both for backward compatibility
        public Dictionary<string, int> ActivityFrequencyByDay { get; set; }
        public Dictionary<string, int> ActivityByDay { get; set; }

        public DateTime FirstActivityDate { get; set; }
        public DateTime LastActivityDate { get; set; }
        public TimeSpan AccountAge => DateTime.UtcNow - FirstActivityDate;
        public string MostFrequentActivityType { get; set; }
        public double ActivitiesPerDay { get; set; }
        public double EngagementScore { get; set; } // Calculated based on various metrics

        // Renamed property - keeping both for backward compatibility
        public List<UserActivityDto> RecentActivities { get; set; }
        public List<UserActivityDto> RecentActivity { get; set; }

        // Constructor to initialize collections and handle property aliases
        public UserActivitySummaryDto()
        {
            ActivityTypeDistribution = new Dictionary<string, int>();
            ActivityByType = ActivityTypeDistribution;

            ActivityFrequencyByDay = new Dictionary<string, int>();
            ActivityByDay = ActivityFrequencyByDay;

            RecentActivities = new List<UserActivityDto>();
            RecentActivity = RecentActivities;
        }
    }
}