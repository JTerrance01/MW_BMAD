using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MixWarz.Application.Common.Interfaces;

namespace MixWarz.Application.Features.Admin.Queries.GetProductsList
{
    public class GetProductsListQueryHandler : IRequestHandler<GetProductsListQuery, ProductsListVm>
    {
        private readonly IAppDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetProductsListQueryHandler(IAppDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<ProductsListVm> Handle(GetProductsListQuery request, CancellationToken cancellationToken)
        {
            // Start with all products
            var productsQuery = _dbContext.Products
                .Include(p => p.Category)
                .AsQueryable();

            // Apply category filter if provided
            if (request.CategoryId.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.CategoryId == request.CategoryId.Value);
            }

            // Apply product type filter if provided
            if (request.ProductType.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.ProductType == request.ProductType.Value);
            }

            // Apply active status filter if provided
            if (request.IsActive.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.IsActive == request.IsActive.Value);
            }

            // Apply search term filter if provided
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                string searchTerm = request.SearchTerm.Trim().ToLower();
                productsQuery = productsQuery.Where(p =>
                    p.Name.ToLower().Contains(searchTerm) ||
                    p.Description.ToLower().Contains(searchTerm));
            }

            // Get total count for pagination
            int totalCount = await productsQuery.CountAsync(cancellationToken);

            // Apply pagination
            var pagedProducts = await productsQuery
                .OrderByDescending(p => p.CreationDate)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            // Map to DTOs
            var productDtos = pagedProducts.Select(p =>
            {
                var dto = _mapper.Map<ProductDto>(p);
                dto.Id = p.ProductId; // Ensure ID mapping
                dto.CategoryName = p.Category?.Name ?? "Uncategorized";
                dto.CreatedAt = p.CreationDate;

                // Set image URL - use a placeholder if not available
                if (!string.IsNullOrEmpty(p.ImagePath))
                {
                    // Check if the path is already a full URL
                    if (p.ImagePath.StartsWith("http://") || p.ImagePath.StartsWith("https://"))
                    {
                        dto.ImageUrl = p.ImagePath;
                    }
                    else
                    {
                        // Construct relative URL from the path
                        dto.ImageUrl = $"/uploads/products/{p.ImagePath}";
                    }
                }
                else
                {
                    // Use a placeholder image URL
                    dto.ImageUrl = "/uploads/products/default-product.jpg";
                }

                // Set file URL
                if (!string.IsNullOrEmpty(p.DownloadFileS3Key))
                {
                    if (p.DownloadFileS3Key.StartsWith("http://") || p.DownloadFileS3Key.StartsWith("https://"))
                    {
                        dto.FileUrl = p.DownloadFileS3Key;
                    }
                    else
                    {
                        dto.FileUrl = $"/uploads/products/files/{p.DownloadFileS3Key}";
                    }
                }
                else
                {
                    dto.FileUrl = "";
                }

                return dto;
            }).ToList();

            // Create view model
            var productsListVm = new ProductsListVm
            {
                Products = productDtos,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };

            return productsListVm;
        }
    }
}