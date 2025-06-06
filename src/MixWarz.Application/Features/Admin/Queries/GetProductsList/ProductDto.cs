using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Queries.GetProductsList
{
    /// <summary>
    /// Data transfer object for product information in admin view
    /// </summary>
    public class ProductDto
    {
        /// <summary>
        /// Product's unique identifier
        /// </summary>
        public int Id { get; set; }
        
        /// <summary>
        /// Product name
        /// </summary>
        public string Name { get; set; }
        
        /// <summary>
        /// Product description
        /// </summary>
        public string Description { get; set; }
        
        /// <summary>
        /// Product price
        /// </summary>
        public decimal Price { get; set; }
        
        /// <summary>
        /// Category ID this product belongs to
        /// </summary>
        public int CategoryId { get; set; }
        
        /// <summary>
        /// Category name
        /// </summary>
        public string CategoryName { get; set; }
        
        /// <summary>
        /// Type of product (e.g., SamplePack, Plugin, etc.)
        /// </summary>
        public ProductType ProductType { get; set; }
        
        /// <summary>
        /// Whether the product is currently active and available for purchase
        /// </summary>
        public bool IsActive { get; set; }
        
        /// <summary>
        /// Path to the product's image on file storage
        /// </summary>
        public string ImageUrl { get; set; }
        
        /// <summary>
        /// Path to the product's download file (if any)
        /// </summary>
        public string FileUrl { get; set; }
        
        /// <summary>
        /// Date when the product was created
        /// </summary>
        public DateTime CreatedAt { get; set; }
        
        /// <summary>
        /// Date when the product was last updated
        /// </summary>
        public DateTime? UpdatedAt { get; set; }
        
        /// <summary>
        /// Total number of sales for this product
        /// </summary>
        public int TotalSales { get; set; }
    }
} 