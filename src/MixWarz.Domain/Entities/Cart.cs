using System.ComponentModel.DataAnnotations;

namespace MixWarz.Domain.Entities
{
    public class Cart
    {
        [Key]
        public int CartId { get; set; }

        [Required]
        public required string UserId { get; set; }

        [Required]
        public DateTime LastModifiedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual ICollection<CartItem> CartItems { get; set; } = [];
    }
}