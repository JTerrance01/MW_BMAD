using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;
using MixWarz.Infrastructure.Persistence;

namespace MixWarz.Infrastructure.Persistence.Repositories
{
    public class UserActivityRepository : IUserActivityRepository
    {
        private readonly AppDbContext _context;

        public UserActivityRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserActivity> CreateActivityAsync(UserActivity activity)
        {
            _context.UserActivities.Add(activity);
            await _context.SaveChangesAsync();
            return activity;
        }

        public async Task<List<UserActivity>> GetUserActivitiesAsync(string userId, int pageNumber, int pageSize)
        {
            return await _context.UserActivities
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Include(a => a.User)
                .ToListAsync();
        }

        public async Task<List<UserActivity>> GetUserActivitiesByTypeAsync(string userId, ActivityType type, int pageNumber, int pageSize)
        {
            return await _context.UserActivities
                .Where(a => a.UserId == userId && a.Type == type)
                .OrderByDescending(a => a.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Include(a => a.User)
                .ToListAsync();
        }

        public async Task<List<UserActivity>> GetActivitiesByDateRangeAsync(string userId, DateTime startDate, DateTime endDate, int pageNumber, int pageSize)
        {
            return await _context.UserActivities
                .Where(a => a.UserId == userId && a.Timestamp >= startDate && a.Timestamp <= endDate)
                .OrderByDescending(a => a.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Include(a => a.User)
                .ToListAsync();
        }

        public async Task<int> GetUserActivityCountAsync(string userId)
        {
            return await _context.UserActivities
                .Where(a => a.UserId == userId)
                .CountAsync();
        }

        public async Task<int> GetUserActivityCountByTypeAsync(string userId, ActivityType type)
        {
            return await _context.UserActivities
                .Where(a => a.UserId == userId && a.Type == type)
                .CountAsync();
        }

        public async Task<Dictionary<ActivityType, int>> GetActivityTypeDistributionAsync(string userId)
        {
            return await _context.UserActivities
                .Where(a => a.UserId == userId)
                .GroupBy(a => a.Type)
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Type, x => x.Count);
        }

        public async Task<Dictionary<DateTime, int>> GetActivityFrequencyByDayAsync(string userId, DateTime startDate, DateTime endDate)
        {
            var results = await _context.UserActivities
                .Where(a => a.UserId == userId && a.Timestamp >= startDate && a.Timestamp <= endDate)
                .GroupBy(a => a.Timestamp.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Date, x => x.Count);

            // Fill in missing days with zero counts
            var allDates = new Dictionary<DateTime, int>();
            for (var day = startDate.Date; day <= endDate.Date; day = day.AddDays(1))
            {
                allDates[day] = results.ContainsKey(day) ? results[day] : 0;
            }

            return allDates;
        }

        public async Task<List<UserActivity>> GetRecentActivitiesAsync(string userId, int count)
        {
            return await _context.UserActivities
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Timestamp)
                .Take(count)
                .Include(a => a.User)
                .ToListAsync();
        }

        public async Task<List<UserActivity>> GetAllRecentActivitiesAsync(int count)
        {
            return await _context.UserActivities
                .OrderByDescending(a => a.Timestamp)
                .Take(count)
                .Include(a => a.User)
                .ToListAsync();
        }
    }
}