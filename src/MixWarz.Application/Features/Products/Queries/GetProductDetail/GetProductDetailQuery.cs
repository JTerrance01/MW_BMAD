using MediatR;

namespace MixWarz.Application.Features.Products.Queries.GetProductDetail
{
    public class GetProductDetailQuery : IRequest<ProductDetailVm>
    {
        public int ProductId { get; set; }
    }
} 