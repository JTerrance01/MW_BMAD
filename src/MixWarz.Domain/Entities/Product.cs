using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MixWarz.Domain.Enums;

namespace MixWarz.Domain.Entities
{
    public class Product
    {
        [Key]
        public int ProductId { get; set; }

        [Required]
        [StringLength(200)]
        public required string Name { get; set; }

        [Required]
        public required string Description { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Required]
        public ProductType ProductType { get; set; }

        public string? ImagePath { get; set; }

        [Required]
        public required string DownloadFileS3Key { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        public DateTime CreationDate { get; set; } = DateTime.UtcNow;

        [Required]
        public int CategoryId { get; set; }

        public string? FileUrl { get; set; }
        public string? SampleAudioUrl { get; set; }
        public ProductStatus Status { get; set; }
        public string? StripeProductId { get; set; }
        public string? StripePriceId { get; set; }

        public int GenreId { get; set; }

        // Navigation properties
        public virtual Category Category { get; set; }
        public virtual ICollection<CartItem> CartItems { get; set; } = [];
        public virtual ICollection<OrderItem> OrderItems { get; set; } = [];
        public virtual ICollection<UserProductAccess> UserProductAccesses { get; set; } = [];
    }
}