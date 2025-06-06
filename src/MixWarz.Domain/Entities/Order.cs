using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MixWarz.Domain.Enums;

namespace MixWarz.Domain.Entities
{
    public class Order
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        public required string UserId { get; set; }

        [Required]
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        public OrderStatus Status { get; set; } = OrderStatus.PendingPayment;

        public string? StripePaymentIntentId { get; set; }

        public string? StripeCheckoutSessionId { get; set; }

        public string? BillingAddress { get; set; }

        public decimal OrderTotal { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = default!;
        public virtual ICollection<OrderItem> OrderItems { get; set; } = [];
    }
}