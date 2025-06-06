using MediatR;

namespace MixWarz.Application.Features.Products.Queries.GetProductDownloadUrl
{
    public class GetProductDownloadUrlQuery : IRequest<ProductDownloadUrlVm>
    {
        public int ProductId { get; set; }
        public string UserId { get; set; }
    }
} 