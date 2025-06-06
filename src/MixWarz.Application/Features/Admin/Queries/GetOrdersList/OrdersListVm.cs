using System.Collections.Generic;

namespace MixWarz.Application.Features.Admin.Queries.GetOrdersList
{
    /// <summary>
    /// View model for the order list response for admin view
    /// </summary>
    public class OrdersListVm
    {
        /// <summary>
        /// List of orders matching the query parameters
        /// </summary>
        public List<OrderDto> Orders { get; set; } = new List<OrderDto>();
        
        /// <summary>
        /// Total number of orders matching the search criteria (before pagination)
        /// </summary>
        public int TotalCount { get; set; }
        
        /// <summary>
        /// Current page number
        /// </summary>
        public int Page { get; set; }
        
        /// <summary>
        /// Number of orders per page
        /// </summary>
        public int PageSize { get; set; }
        
        /// <summary>
        /// Total number of pages
        /// </summary>
        public int TotalPages => (TotalCount + PageSize - 1) / PageSize;
    }
} 