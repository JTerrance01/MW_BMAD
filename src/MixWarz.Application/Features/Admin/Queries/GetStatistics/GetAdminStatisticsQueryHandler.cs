using MediatR;
using Microsoft.EntityFrameworkCore;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Enums;
using System.Linq;

namespace MixWarz.Application.Features.Admin.Queries.GetStatistics
{
    public class GetAdminStatisticsQueryHandler : IRequestHandler<GetAdminStatisticsQuery, AdminStatisticsVm>
    {
        private readonly IAppDbContext _context;
        
        public GetAdminStatisticsQueryHandler(IAppDbContext context)
        {
            _context = context;
        }
        
        public async Task<AdminStatisticsVm> Handle(GetAdminStatisticsQuery request, CancellationToken cancellationToken)
        {
            // Current date info for monthly calculations
            var now = DateTime.UtcNow;
            var firstDayOfMonth = new DateTime(now.Year, now.Month, 1);
            
            // Get user data
            var usersCount = await _context.Users.CountAsync(cancellationToken);
            // Fix for the error CS1061: 'IEnumerable<User>' does not contain a definition for 'CountAsync'.
            // The issue arises because `CountAsync` is an extension method for IQueryable, not IEnumerable.
            // To fix this, remove the `.AsEnumerable()` call, as it converts the query to IEnumerable.

            var nowUtc = DateTime.UtcNow;
            var firstDayOfMonthUtc = new DateTime(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var newUsersThisMonth = await _context.Users.Where(u => u.RegistrationDate.HasValue &&
            u.RegistrationDate.Value >= firstDayOfMonthUtc).CountAsync(cancellationToken); 

            // Get products data
            var productsCount = await _context.Products.CountAsync(cancellationToken);
            
            // Get competitions data
            // Use the Competitions DbSet now that it's added to IAppDbContext
            var competitionsCount = await _context.Competitions.CountAsync(cancellationToken);
            var activeCompetitions = await _context.Competitions
                .CountAsync(c => c.Status == CompetitionStatus.OpenForSubmissions, cancellationToken);
            
            // Get orders data
            var orders = await _context.Orders.ToListAsync(cancellationToken);
            var ordersCount = orders.Count;
            var totalRevenue = orders.Sum(o => o.TotalAmount);
            
            var ordersThisMonth = orders.Where(o => o.OrderDate >= firstDayOfMonth).ToList();
            var salesThisMonth = ordersThisMonth.Count;
            var revenueThisMonth = ordersThisMonth.Sum(o => o.TotalAmount);
            var averageOrderValue = orders.Any() ? totalRevenue / ordersCount : 0;
            
            // Get submissions data
            // Use the Submissions DbSet now that it's added to IAppDbContext
            var totalSubmissions = await _context.Submissions.CountAsync(cancellationToken);
            
            var submissionsThisMonthUtc = new DateTime(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var submissionsThisMonth = await _context.Submissions
                .CountAsync(s => s.SubmissionDate >= submissionsThisMonthUtc, cancellationToken);
            
            // Get blog data
            var blogArticlesCount = await _context.BlogArticles.CountAsync(cancellationToken);
            
            // Get top products (by sales)
            var topProducts = await _context.OrderItems
                .GroupBy(oi => oi.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    SalesCount = g.Count(),
                    TotalRevenue = g.Sum(oi => oi.PriceAtPurchase * oi.Quantity)
                })
                .OrderByDescending(x => x.SalesCount)
                .Take(5)
                .ToListAsync(cancellationToken);
            
            var topProductsWithDetails = new List<TopProductDto>();
            foreach (var p in topProducts)
            {
                var product = await _context.Products
                    .Include(prod => prod.Category)
                    .FirstOrDefaultAsync(prod => prod.ProductId == p.ProductId, cancellationToken);
                
                if (product != null)
                {
                    topProductsWithDetails.Add(new TopProductDto
                    {
                        Id = product.ProductId,
                        Name = product.Name,
                        Price = product.Price,
                        Category = product.Category?.Name ?? "Unknown",
                        SalesCount = p.SalesCount,
                        TotalRevenue = p.TotalRevenue
                    });
                }
            }
            
            // Get recent orders
            var recentOrders = await _context.Orders
                .OrderByDescending(o => o.OrderDate)
                .Take(5)
                .Select(o => new RecentOrderDto
                {
                    Id = o.OrderId,
                    UserId = o.UserId,
                    UserName = o.User.UserName,
                    OrderDate = o.OrderDate,
                    Total = o.TotalAmount,
                    Status = o.Status.ToString(),
                    ItemsCount = o.OrderItems.Count
                })
                .ToListAsync(cancellationToken);
            
            // Get top users (by spending)
            var topUsers = await _context.Orders
                .GroupBy(o => o.UserId)
                .Select(g => new TopUserDto
                {
                    Id = g.Key,
                    UserName = g.First().User.UserName,
                    OrdersCount = g.Count(),
                    TotalSpent = g.Sum(o => o.TotalAmount),
                    LastOrderDate = g.Max(o => o.OrderDate)
                })
                .OrderByDescending(u => u.TotalSpent)
                .Take(5)
                .ToListAsync(cancellationToken);
            
            // Get top categories (by revenue)
            var topCategories = await _context.OrderItems
                .Join(_context.Products, oi => oi.ProductId, p => p.ProductId, (oi, p) => new { OrderItem = oi, Product = p })
                .GroupBy(x => x.Product.CategoryId)
                .Select(g => new
                {
                    CategoryId = g.Key,
                    SalesCount = g.Count(),
                    TotalRevenue = g.Sum(x => x.OrderItem.PriceAtPurchase * x.OrderItem.Quantity)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .Take(5)
                .ToListAsync(cancellationToken);
            
            var topCategoriesWithDetails = new List<TopCategoryDto>();
            foreach (var c in topCategories)
            {
                var category = await _context.Categories
                    .FirstOrDefaultAsync(cat => cat.CategoryId == c.CategoryId, cancellationToken);
                
                if (category != null)
                {
                    var productsInCategory = await _context.Products
                        .CountAsync(p => p.CategoryId == category.CategoryId, cancellationToken);
                    
                    topCategoriesWithDetails.Add(new TopCategoryDto
                    {
                        Id = category.CategoryId,
                        Name = category.Name,
                        ProductsCount = productsInCategory,
                        SalesCount = c.SalesCount,
                        TotalRevenue = c.TotalRevenue
                    });
                }
            }
            
            // Get historical data by month (last 6 months)
            var userRegistrationsByMonth = new Dictionary<string, int>();
            var ordersByMonth = new Dictionary<string, int>();
            var revenueByMonth = new Dictionary<string, decimal>();
            
            for (int i = 5; i >= 0; i--)
            {
                var date = now.AddMonths(-i);
                var monthYear = $"{date.ToString("MMM")} {date.Year}";
                var monthStart = new DateTime(date.Year, date.Month, 1);
                var monthEnd = monthStart.AddMonths(1).AddDays(-1);

                DateTime monthStartUtc = new DateTime(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);

                // nextMonthStartUtc is the beginning of the *next* month in UTC.
                DateTime nextMonthStartUtc = monthStartUtc.AddMonths(1);

                // --- Refactored LINQ Query ---
                var usersInMonth = await _context.Users
                    .CountAsync(u => u.RegistrationDate >= monthStartUtc &&
                                     u.RegistrationDate < nextMonthStartUtc, // Use '<' with the start of the next month
                                  cancellationToken);

                var ordersInMonth = orders
                    .Count(o => o.OrderDate >= monthStart && o.OrderDate <= monthEnd);
                
                var revenueInMonth = orders
                    .Where(o => o.OrderDate >= monthStart && o.OrderDate <= monthEnd)
                    .Sum(o => o.TotalAmount);
                
                userRegistrationsByMonth.Add(monthYear, usersInMonth);
                ordersByMonth.Add(monthYear, ordersInMonth);
                revenueByMonth.Add(monthYear, revenueInMonth);
            }
            
            // Build and return the complete statistics view model
            var statistics = new AdminStatisticsVm
            {
                UsersCount = usersCount,
                ProductsCount = productsCount,
                CompetitionsCount = competitionsCount,
                OrdersCount = ordersCount,
                TotalRevenue = totalRevenue,
                
                SalesThisMonth = salesThisMonth,
                RevenueThisMonth = revenueThisMonth,
                AverageOrderValue = averageOrderValue,
                NewUsersThisMonth = newUsersThisMonth,
                
                ActiveCompetitions = activeCompetitions,
                TotalSubmissions = totalSubmissions,
                SubmissionsThisMonth = submissionsThisMonth,
                BlogArticlesCount = blogArticlesCount,
                
                UserRegistrationsByMonth = userRegistrationsByMonth,
                OrdersByMonth = ordersByMonth,
                RevenueByMonth = revenueByMonth,
                
                TopProducts = topProductsWithDetails,
                RecentOrders = recentOrders,
                TopUsers = topUsers,
                TopCategories = topCategoriesWithDetails
            };
            
            return statistics;
        }
    }
} 