namespace MixWarz.Application.Features.Products.Commands.CreateProduct
{
    public class CreateProductResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int? ProductId { get; set; }
    }
} 