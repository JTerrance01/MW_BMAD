using MediatR;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Queries.GetProductsList
{
    /// <summary>
    /// Query to retrieve a list of all products for admin view
    /// </summary>
    public class GetProductsListQuery : IRequest<ProductsListVm>
    {
        /// <summary>
        /// Optional category ID to filter products by
        /// </summary>
        public int? CategoryId { get; set; }
        
        /// <summary>
        /// Optional product type to filter by
        /// </summary>
        public ProductType? ProductType { get; set; }
        
        /// <summary>
        /// Optional filter for active/inactive products
        /// </summary>
        public bool? IsActive { get; set; }
        
        /// <summary>
        /// Optional search term to search in product name or description
        /// </summary>
        public string SearchTerm { get; set; }
        
        /// <summary>
        /// Page number (1-based) for pagination
        /// </summary>
        public int Page { get; set; } = 1;
        
        /// <summary>
        /// Number of products per page
        /// </summary>
        public int PageSize { get; set; } = 10;
    }
} 