using MediatR;

namespace MixWarz.Application.Features.Products.Queries.GetProductsList
{
    public class GetProductsListQuery : IRequest<ProductsListVm>
    {
        public int? CategoryId { get; set; }
        public string SearchTerm { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public bool AdminView { get; set; } = false;
        public bool? IsActive { get; set; } = true;
    }
}