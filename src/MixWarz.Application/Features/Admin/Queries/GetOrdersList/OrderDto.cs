using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Queries.GetOrdersList
{
    /// <summary>
    /// Data transfer object for order information in admin view
    /// </summary>
    public class OrderDto
    {
        /// <summary>
        /// Order's unique identifier
        /// </summary>
        public int OrderId { get; set; }
        
        /// <summary>
        /// ID of the user who placed the order
        /// </summary>
        public string UserId { get; set; }
        
        /// <summary>
        /// User's username
        /// </summary>
        public string Username { get; set; }
        
        /// <summary>
        /// User's email address
        /// </summary>
        public string Email { get; set; }
        
        /// <summary>
        /// Date when the order was placed
        /// </summary>
        public DateTime OrderDate { get; set; }
        
        /// <summary>
        /// Total amount of the order
        /// </summary>
        public decimal TotalAmount { get; set; }
        
        /// <summary>
        /// Current status of the order
        /// </summary>
        public OrderStatus Status { get; set; }
        
        /// <summary>
        /// Stripe payment intent ID associated with this order
        /// </summary>
        public string PaymentIntentId { get; set; }
        
        /// <summary>
        /// Items in the order
        /// </summary>
        public List<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
    }
    
    /// <summary>
    /// Data transfer object for order item information
    /// </summary>
    public class OrderItemDto
    {
        /// <summary>
        /// Order item's unique identifier
        /// </summary>
        public int OrderItemId { get; set; }
        
        /// <summary>
        /// ID of the product ordered
        /// </summary>
        public int ProductId { get; set; }
        
        /// <summary>
        /// Name of the product
        /// </summary>
        public string ProductName { get; set; }
        
        /// <summary>
        /// Quantity ordered
        /// </summary>
        public int Quantity { get; set; }
        
        /// <summary>
        /// Price per unit at the time of purchase
        /// </summary>
        public decimal PriceAtPurchase { get; set; }
    }
} 