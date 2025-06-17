using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.UserProfile.Queries.GetUserPurchases
{
    /// <summary>
    /// View model for user purchases list
    /// </summary>
    public class UserPurchasesVm
    {
        public IEnumerable<UserPurchaseDto> Items { get; set; } = new List<UserPurchaseDto>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }

    /// <summary>
    /// DTO for individual purchase item
    /// </summary>
    public class UserPurchaseDto
    {
        public int OrderId { get; set; }
        public int OrderItemId { get; set; }
        public DateTime PurchaseDate { get; set; }
        public OrderStatus Status { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public bool IsDigital { get; set; }
        
        // Product information
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ProductImageUrl { get; set; }
        public string? ProductDescription { get; set; }
        
        // Order information
        public string? OrderNumber { get; set; }
        public decimal TotalAmount { get; set; }
    }
} 