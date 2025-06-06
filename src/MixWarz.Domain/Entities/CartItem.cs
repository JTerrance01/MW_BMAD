using System.ComponentModel.DataAnnotations;

namespace MixWarz.Domain.Entities
{
    public class CartItem
    {
        [Key]
        public int CartItemId { get; set; }
        
        [Required]
        public int CartId { get; set; }
        
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        public int Quantity { get; set; } = 1;
        
        [Required]
        public DateTime DateAdded { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual Cart Cart { get; set; }
        public virtual Product Product { get; set; }
    }
} 