namespace MixWarz.Application.Features.Products.Commands.UpdateProduct
{
    public class UpdateProductResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int? ProductId { get; set; }
    }
} 