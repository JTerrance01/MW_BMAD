using System;
using MediatR;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Queries.GetOrdersList
{
    /// <summary>
    /// Query to retrieve a list of all orders for admin view
    /// </summary>
    public class GetOrdersListQuery : IRequest<OrdersListVm>
    {
        /// <summary>
        /// Optional user ID to filter orders by
        /// </summary>
        public string UserId { get; set; }
        
        /// <summary>
        /// Optional order status to filter by
        /// </summary>
        public OrderStatus? Status { get; set; }
        
        /// <summary>
        /// Optional date range start for order date
        /// </summary>
        public DateTime? OrderDateFrom { get; set; }
        
        /// <summary>
        /// Optional date range end for order date
        /// </summary>
        public DateTime? OrderDateTo { get; set; }
        
        /// <summary>
        /// Optional minimum total amount
        /// </summary>
        public decimal? MinAmount { get; set; }
        
        /// <summary>
        /// Optional maximum total amount
        /// </summary>
        public decimal? MaxAmount { get; set; }
        
        /// <summary>
        /// Page number (1-based) for pagination
        /// </summary>
        public int Page { get; set; } = 1;
        
        /// <summary>
        /// Number of orders per page
        /// </summary>
        public int PageSize { get; set; } = 10;
    }
} 