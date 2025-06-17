using MediatR;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.UserProfile.Queries.GetUserPurchases
{
    /// <summary>
    /// Query to retrieve a user's purchase history
    /// </summary>
    public class GetUserPurchasesQuery : IRequest<UserPurchasesVm>
    {
        /// <summary>
        /// User ID to get purchases for
        /// </summary>
        public string UserId { get; set; } = string.Empty;
        
        /// <summary>
        /// Optional order status to filter by
        /// </summary>
        public OrderStatus? Status { get; set; }
        
        /// <summary>
        /// Optional product type filter (digital/physical)
        /// </summary>
        public string? Type { get; set; }
        
        /// <summary>
        /// Page number (1-based) for pagination
        /// </summary>
        public int Page { get; set; } = 1;
        
        /// <summary>
        /// Number of purchases per page
        /// </summary>
        public int PageSize { get; set; } = 10;
    }
} 