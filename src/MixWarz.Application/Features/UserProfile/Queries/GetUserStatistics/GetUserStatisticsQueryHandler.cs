using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using MixWarz.Application.Features.UserProfile.DTOs;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.UserProfile.Queries.GetUserStatistics
{
    public class GetUserStatisticsQueryHandler : IRequestHandler<GetUserStatisticsQuery, UserActivitySummaryDto>
    {
        private readonly IUserActivityRepository _userActivityRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public GetUserStatisticsQueryHandler(
            IUserActivityRepository userActivityRepository,
            IUserRepository userRepository,
            IMapper mapper)
        {
            _userActivityRepository = userActivityRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<UserActivitySummaryDto> Handle(GetUserStatisticsQuery request, CancellationToken cancellationToken)
        {
            // Get the user
            var user = await _userRepository.GetByIdAsync(request.UserId.ToString());
            if (user == null)
            {
                throw new Exception($"User with ID {request.UserId} not found");
            }

            // Get total activity count
            var totalActivities = await _userActivityRepository.GetUserActivityCountAsync(request.UserId);

            // Get counts for specific activity types
            var loginCount = await _userActivityRepository.GetUserActivityCountByTypeAsync(request.UserId, ActivityType.Login);
            var submissionCount = await _userActivityRepository.GetUserActivityCountByTypeAsync(request.UserId, ActivityType.CompetitionSubmission);
            var purchaseCount = await _userActivityRepository.GetUserActivityCountByTypeAsync(request.UserId, ActivityType.ProductPurchase);
            
            // Get blog interaction count (combine different blog activities)
            var blogViewCount = await _userActivityRepository.GetUserActivityCountByTypeAsync(request.UserId, ActivityType.BlogArticleView);
            var blogCommentCount = await _userActivityRepository.GetUserActivityCountByTypeAsync(request.UserId, ActivityType.BlogCommentCreate);
            var blogReplyCount = await _userActivityRepository.GetUserActivityCountByTypeAsync(request.UserId, ActivityType.BlogCommentReply);
            var blogInteractionCount = blogViewCount + blogCommentCount + blogReplyCount;

            // Get profile update count (combine profile related activities)
            var profileUpdateCount = await _userActivityRepository.GetUserActivityCountByTypeAsync(request.UserId, ActivityType.ProfileUpdate);
            var profilePictureUpdateCount = await _userActivityRepository.GetUserActivityCountByTypeAsync(request.UserId, ActivityType.ProfilePictureUpdate);
            var bioUpdateCount = await _userActivityRepository.GetUserActivityCountByTypeAsync(request.UserId, ActivityType.BioUpdate);
            var totalProfileUpdateCount = profileUpdateCount + profilePictureUpdateCount + bioUpdateCount;

            // Get activity type distribution
            var activityTypeDistribution = await _userActivityRepository.GetActivityTypeDistributionAsync(request.UserId);
            
            // Convert enum keys to strings for the DTO
            var activityTypeDistributionStrings = activityTypeDistribution
                .ToDictionary(kvp => kvp.Key.ToString(), kvp => kvp.Value);

            // Find most frequent activity type
            var mostFrequentActivityType = "None";
            if (activityTypeDistribution.Any())
            {
                mostFrequentActivityType = activityTypeDistribution
                    .OrderByDescending(kvp => kvp.Value)
                    .First().Key.ToString();
            }

            // Get activity frequency by day (for last 30 days)
            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddDays(-30);
            var activityFrequencyByDay = await _userActivityRepository.GetActivityFrequencyByDayAsync(request.UserId, startDate, endDate);
            
            // Convert DateTime keys to strings for the DTO
            var activityFrequencyByDayStrings = activityFrequencyByDay
                .ToDictionary(kvp => kvp.Key.ToString("yyyy-MM-dd"), kvp => kvp.Value);

            // Get recent activities
            var recentActivities = await _userActivityRepository.GetRecentActivitiesAsync(request.UserId, 10);
            var recentActivityDtos = _mapper.Map<List<UserActivityDto>>(recentActivities);

            // Calculate first and last activity dates
            var firstActivityDate = DateTime.UtcNow;
            var lastActivityDate = DateTime.MinValue;
            
            if (recentActivities.Any())
            {
                // This is an approximation - we'd need a specific query to get the actual first activity
                firstActivityDate = recentActivities.Min(a => a.Timestamp);
                lastActivityDate = recentActivities.Max(a => a.Timestamp);
            }

            // Calculate activities per day
            var daysSinceFirstActivity = (DateTime.UtcNow - firstActivityDate).TotalDays;
            var activitiesPerDay = daysSinceFirstActivity > 0 
                ? totalActivities / daysSinceFirstActivity 
                : 0;

            // Calculate engagement score (simplified version)
            var engagementScore = CalculateEngagementScore(
                loginCount, 
                submissionCount,
                purchaseCount,
                blogInteractionCount,
                totalProfileUpdateCount,
                totalActivities,
                daysSinceFirstActivity);

            // Create and return the summary DTO
            return new UserActivitySummaryDto
            {
                UserId = request.UserId,
                Username = user.UserName,
                TotalActivities = totalActivities,
                LoginCount = loginCount,
                SubmissionCount = submissionCount,
                PurchaseCount = purchaseCount,
                BlogInteractionCount = blogInteractionCount,
                ProfileUpdateCount = totalProfileUpdateCount,
                ActivityTypeDistribution = activityTypeDistributionStrings,
                ActivityFrequencyByDay = activityFrequencyByDayStrings,
                FirstActivityDate = firstActivityDate,
                LastActivityDate = lastActivityDate,
                MostFrequentActivityType = mostFrequentActivityType,
                ActivitiesPerDay = Math.Round(activitiesPerDay, 2),
                EngagementScore = Math.Round(engagementScore, 2),
                RecentActivities = recentActivityDtos
            };
        }

        private double CalculateEngagementScore(
            int loginCount,
            int submissionCount,
            int purchaseCount,
            int blogInteractionCount,
            int profileUpdateCount,
            int totalActivities,
            double daysSinceFirstActivity)
        {
            // This is a simplified engagement score calculation
            // In a real-world application, you might use a more sophisticated algorithm
            
            // Base score from total activities
            double baseScore = totalActivities > 0 ? Math.Log10(totalActivities) * 10 : 0;
            
            // Activity diversity score (reward users who engage in different ways)
            int activeCategories = 0;
            if (loginCount > 0) activeCategories++;
            if (submissionCount > 0) activeCategories++;
            if (purchaseCount > 0) activeCategories++;
            if (blogInteractionCount > 0) activeCategories++;
            if (profileUpdateCount > 0) activeCategories++;
            
            double diversityScore = activeCategories * 10;
            
            // Frequency score (reward regular usage)
            double frequencyScore = 0;
            if (daysSinceFirstActivity > 0)
            {
                // Higher score for more frequent usage
                frequencyScore = Math.Min(50, (totalActivities / daysSinceFirstActivity) * 5);
            }
            
            // High-value activity score (reward important interactions)
            double valueScore = (submissionCount * 3) + (purchaseCount * 5) + (blogInteractionCount * 2);
            
            // Combine scores with appropriate weights
            return baseScore + diversityScore + frequencyScore + valueScore;
        }
    }
} 