using System.ComponentModel.DataAnnotations;

namespace MixWarz.Domain.Entities
{
    public class Category
    {
        [Key]
        public int CategoryId { get; set; }
        
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }
        
        public string? Description { get; set; }
        
        // Navigation property
        public virtual ICollection<Product> Products { get; set; } = [];
    }
} 