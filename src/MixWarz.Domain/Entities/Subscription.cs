using System.ComponentModel.DataAnnotations;
using MixWarz.Domain.Enums;

namespace MixWarz.Domain.Entities
{
    public class Subscription
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public required string UserId { get; set; }

        [Required]
        public required string StripeSubscriptionId { get; set; }

        [Required]
        public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

        [Required]
        public DateTime CurrentPeriodStart { get; set; }

        [Required]
        public DateTime CurrentPeriodEnd { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? CanceledAt { get; set; }

        public DateTime? TrialEnd { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = default!;
    }
}