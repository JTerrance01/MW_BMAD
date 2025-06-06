using MediatR;
using MixWarz.Domain.Interfaces;
using AutoMapper;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Features.Products.Queries.GetProductsList
{
    public class GetProductsListQueryHandler : IRequestHandler<GetProductsListQuery, ProductsListVm>
    {
        private readonly IProductRepository _productRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly IMapper _mapper;

        public GetProductsListQueryHandler(
            IProductRepository productRepository,
            IFileStorageService fileStorageService,
            IMapper mapper)
        {
            _productRepository = productRepository;
            _fileStorageService = fileStorageService;
            _mapper = mapper;
        }

        public async Task<ProductsListVm> Handle(
            GetProductsListQuery request,
            CancellationToken cancellationToken)
        {
            var products = await _productRepository.GetAllAsync(
                request.CategoryId,
                request.SearchTerm,
                request.IsActive,
                request.Page,
                request.PageSize);

            var totalCount = await _productRepository.GetTotalCountAsync(
                request.CategoryId,
                request.SearchTerm,
                request.IsActive);

            var productDtos = new List<ProductDto>();

            foreach (var product in products)
            {
                var productDto = _mapper.Map<ProductDto>(product);

                // Generate presigned URL for image if it exists
                if (!string.IsNullOrEmpty(product.ImagePath))
                {
                    // Check if ImagePath is already a full URL (to avoid double-encoding)
                    if (Uri.TryCreate(product.ImagePath, UriKind.Absolute, out _))
                    {
                        // ImagePath is already a full URL, use it directly
                        productDto.ImageUrl = product.ImagePath;
                    }
                    else
                    {
                        // ImagePath is a file path, generate URL
                        productDto.ImageUrl = await _fileStorageService.GetFileUrlAsync(
                            product.ImagePath,
                            TimeSpan.FromHours(1));
                    }
                }

                productDtos.Add(productDto);
            }

            return new ProductsListVm
            {
                Products = productDtos,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }
    }
}