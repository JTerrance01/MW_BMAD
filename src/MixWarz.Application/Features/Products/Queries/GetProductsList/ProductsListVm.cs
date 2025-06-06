namespace MixWarz.Application.Features.Products.Queries.GetProductsList
{
    public class ProductsListVm
    {
        public List<ProductDto> Products { get; set; } = new List<ProductDto>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get => (int)Math.Ceiling((double)TotalCount / PageSize); }
    }
} 