
namespace MixWarz.Application.Features.Admin.Queries.GetProductsList
{
    /// <summary>
    /// View model for the product list response for admin view
    /// </summary>
    public class ProductsListVm
    {
        /// <summary>
        /// List of products matching the query parameters
        /// </summary>
        public List<ProductDto> Products { get; set; } = new List<ProductDto>();
        
        /// <summary>
        /// Total number of products matching the search criteria (before pagination)
        /// </summary>
        public int TotalCount { get; set; }
        
        /// <summary>
        /// Current page number
        /// </summary>
        public int Page { get; set; }
        
        /// <summary>
        /// Number of products per page
        /// </summary>
        public int PageSize { get; set; }
        
        /// <summary>
        /// Total number of pages
        /// </summary>
        public int TotalPages => (TotalCount + PageSize - 1) / PageSize;
    }
} 