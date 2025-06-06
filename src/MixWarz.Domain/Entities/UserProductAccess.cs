using System.ComponentModel.DataAnnotations;

namespace MixWarz.Domain.Entities
{
    public class UserProductAccess
    {
        [Key]
        public int UserProductAccessId { get; set; }

        [Required]
        public required string UserId { get; set; }

        [Required]
        public int ProductId { get; set; }

        // OrderId might not be strictly required if access is granted differently (e.g. admin)
        // For webhook-driven access via order, it will be present.
        public int? OrderId { get; set; } // Made nullable, as direct grant might not have an order. Original was Required.

        [Required]
        public DateTime AccessGrantedDate { get; set; } = DateTime.UtcNow; // Renamed from GrantDate

        public DateTime? AccessExpiresDate { get; set; } // For subscriptions
        public string? StripeSubscriptionId { get; set; } // If tied to a Stripe subscription
        public string? StripeCustomerId { get; set; } // Store customer ID associated with this access/subscription. Could also be on User entity.

        // Navigation properties
        public virtual User User { get; set; } = default!;
        public virtual Product Product { get; set; } = default!;
        public virtual Order? Order { get; set; } // Made nullable to match OrderId. Original was not nullable.
    }
}