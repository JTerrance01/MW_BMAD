using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;

namespace MixWarz.Domain.Interfaces
{
    public interface IOrderRepository
    {
        Task<Order> GetByIdAsync(int id);
        Task<IEnumerable<Order>> GetUserOrdersAsync(string userId, int page = 1, int pageSize = 10);
        Task<Order> CreateOrderAsync(string userId, decimal totalAmount, string? stripePaymentIntentId = null, string? billingAddress = null);
        Task<bool> AddOrderItemAsync(int orderId, int productId, int quantity, decimal priceAtPurchase);
        Task<bool> UpdateOrderStatusAsync(int orderId, OrderStatus status);
        Task<bool> UpdateOrderStatusByPaymentIntentAsync(string paymentIntentId, OrderStatus status);
        Task<bool> CreateUserProductAccessAsync(int orderId);
        Task<IEnumerable<UserProductAccess>> GetUserProductAccessesAsync(string userId);
        
        // Admin-specific methods
        Task<(IEnumerable<Order> Orders, int TotalCount)> GetOrdersForAdminAsync(
            string userId,
            OrderStatus? status,
            DateTime? orderDateFrom,
            DateTime? orderDateTo,
            decimal? minAmount,
            decimal? maxAmount,
            int page = 1,
            int pageSize = 10,
            CancellationToken cancellationToken = default);
            
        Task<Order> GetOrderWithItemsAsync(int orderId, CancellationToken cancellationToken = default);
    }
} 