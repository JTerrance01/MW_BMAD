using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;

namespace MixWarz.Domain.Interfaces
{
    public interface IUserActivityRepository
    {
        Task<UserActivity> CreateActivityAsync(UserActivity activity);
        Task<List<UserActivity>> GetUserActivitiesAsync(string userId, int pageNumber, int pageSize);
        Task<List<UserActivity>> GetUserActivitiesByTypeAsync(string userId, ActivityType type, int pageNumber, int pageSize);
        Task<List<UserActivity>> GetActivitiesByDateRangeAsync(string userId, DateTime startDate, DateTime endDate, int pageNumber, int pageSize);
        Task<int> GetUserActivityCountAsync(string userId);
        Task<int> GetUserActivityCountByTypeAsync(string userId, ActivityType type);
        Task<Dictionary<ActivityType, int>> GetActivityTypeDistributionAsync(string userId);
        Task<Dictionary<DateTime, int>> GetActivityFrequencyByDayAsync(string userId, DateTime startDate, DateTime endDate);
        Task<List<UserActivity>> GetRecentActivitiesAsync(string userId, int count);
        Task<List<UserActivity>> GetAllRecentActivitiesAsync(int count);
    }
}