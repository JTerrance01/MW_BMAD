using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Infrastructure.Persistence.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly AppDbContext _context;

        public OrderRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Order> GetByIdAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderId == id);
        }

        public async Task<IEnumerable<Order>> GetUserOrdersAsync(string userId, int page = 1, int pageSize = 10)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Order> CreateOrderAsync(string userId, decimal totalAmount, string? stripePaymentIntentId = null, string? billingAddress = null)
        {
            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.UtcNow,
                TotalAmount = totalAmount,
                Status = OrderStatus.PendingPayment,
                StripePaymentIntentId = stripePaymentIntentId,
                BillingAddress = billingAddress
            };

            await _context.Orders.AddAsync(order);
            await _context.SaveChangesAsync();

            return order;
        }

        public async Task<bool> AddOrderItemAsync(int orderId, int productId, int quantity, decimal priceAtPurchase)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
            {
                return false;
            }

            var orderItem = new OrderItem
            {
                OrderId = orderId,
                ProductId = productId,
                Quantity = quantity,
                PriceAtPurchase = priceAtPurchase
            };

            await _context.OrderItems.AddAsync(orderItem);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateOrderStatusAsync(int orderId, OrderStatus status)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
            {
                return false;
            }

            order.Status = status;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateOrderStatusByPaymentIntentAsync(string paymentIntentId, OrderStatus status)
        {
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.StripePaymentIntentId == paymentIntentId);

            if (order == null)
            {
                return false;
            }

            order.Status = status;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> CreateUserProductAccessAsync(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null || order.Status != OrderStatus.Paid && order.Status != OrderStatus.Fulfilled)
            {
                return false;
            }

            // Create UserProductAccess records for each product in the order
            foreach (var orderItem in order.OrderItems)
            {
                // Check if the access already exists to avoid duplicates
                var existingAccess = await _context.UserProductAccesses
                    .FirstOrDefaultAsync(upa => upa.UserId == order.UserId &&
                                               upa.ProductId == orderItem.ProductId);

                if (existingAccess == null)
                {
                    var userProductAccess = new UserProductAccess
                    {
                        UserId = order.UserId,
                        ProductId = orderItem.ProductId,
                        OrderId = orderId,
                        AccessGrantedDate = DateTime.UtcNow
                    };

                    await _context.UserProductAccesses.AddAsync(userProductAccess);
                }
            }

            // Update order status to fulfilled
            order.Status = OrderStatus.Fulfilled;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<UserProductAccess>> GetUserProductAccessesAsync(string userId)
        {
            return await _context.UserProductAccesses
                .Include(upa => upa.Product)
                .ThenInclude(p => p.Category)
                .Include(upa => upa.Order)
                .Where(upa => upa.UserId == userId)
                .ToListAsync();
        }

        public async Task<(IEnumerable<Order> Orders, int TotalCount)> GetOrdersForAdminAsync(string userId, OrderStatus? status, DateTime? orderDateFrom, DateTime? orderDateTo, decimal? minAmount, decimal? maxAmount, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default)
        {
            // Start with all orders
            var query = _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(userId))
            {
                query = query.Where(o => o.UserId == userId);
            }

            if (status.HasValue)
            {
                query = query.Where(o => o.Status == status.Value);
            }

            if (orderDateFrom.HasValue)
            {
                query = query.Where(o => o.OrderDate >= orderDateFrom.Value);
            }

            if (orderDateTo.HasValue)
            {
                query = query.Where(o => o.OrderDate <= orderDateTo.Value);
            }

            if (minAmount.HasValue)
            {
                query = query.Where(o => o.TotalAmount >= minAmount.Value);
            }

            if (maxAmount.HasValue)
            {
                query = query.Where(o => o.TotalAmount <= maxAmount.Value);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply pagination and retrieve data
            var orders = await query
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (orders, totalCount);
        }

        public async Task<Order> GetOrderWithItemsAsync(int orderId, CancellationToken cancellationToken = default)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId, cancellationToken);
        }
    }
}