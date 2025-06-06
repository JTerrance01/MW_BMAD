using System;
using System.Collections.Generic;

namespace MixWarz.Application.Features.Admin.Queries.GetStatistics
{
    public class AdminStatisticsVm
    {
        // Basic counts
        public int UsersCount { get; set; }
        public int ProductsCount { get; set; }
        public int CompetitionsCount { get; set; }
        public int OrdersCount { get; set; }
        public decimal TotalRevenue { get; set; }
        
        // Sales stats
        public int SalesThisMonth { get; set; }
        public decimal RevenueThisMonth { get; set; }
        public decimal AverageOrderValue { get; set; }
        public int NewUsersThisMonth { get; set; }
        
        // Activity metrics
        public int ActiveCompetitions { get; set; }
        public int TotalSubmissions { get; set; }
        public int SubmissionsThisMonth { get; set; }
        public int BlogArticlesCount { get; set; }
        
        // User activity
        public Dictionary<string, int> UserRegistrationsByMonth { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> OrdersByMonth { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, decimal> RevenueByMonth { get; set; } = new Dictionary<string, decimal>();
        
        // Top items
        public List<TopProductDto> TopProducts { get; set; } = new List<TopProductDto>();
        public List<RecentOrderDto> RecentOrders { get; set; } = new List<RecentOrderDto>();
        public List<TopUserDto> TopUsers { get; set; } = new List<TopUserDto>();
        public List<TopCategoryDto> TopCategories { get; set; } = new List<TopCategoryDto>();
    }
    
    public class TopProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        public int SalesCount { get; set; }
        public decimal TotalRevenue { get; set; }
    }
    
    public class RecentOrderDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ItemsCount { get; set; }
    }
    
    public class TopUserDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public int OrdersCount { get; set; }
        public decimal TotalSpent { get; set; }
        public DateTime LastOrderDate { get; set; }
    }
    
    public class TopCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int ProductsCount { get; set; }
        public int SalesCount { get; set; }
        public decimal TotalRevenue { get; set; }
    }
} 