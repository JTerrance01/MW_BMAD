using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Products.Queries.GetProductDetail
{
    public class ProductDetailVm
    {
        public int ProductId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public ProductType ProductType { get; set; }
        public string ProductTypeName { get => ProductType.ToString(); }
        public string ImageUrl { get; set; }
        public string DownloadFileS3Key { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreationDate { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; }
    }
} 