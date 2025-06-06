using MediatR;
using MixWarz.Domain.Interfaces;
using AutoMapper;

namespace MixWarz.Application.Features.Products.Queries.GetProductDetail
{
    public class GetProductDetailQueryHandler : IRequestHandler<GetProductDetailQuery, ProductDetailVm>
    {
        private readonly IProductRepository _productRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly IMapper _mapper;

        public GetProductDetailQueryHandler(
            IProductRepository productRepository,
            IFileStorageService fileStorageService,
            IMapper mapper)
        {
            _productRepository = productRepository;
            _fileStorageService = fileStorageService;
            _mapper = mapper;
        }

        public async Task<ProductDetailVm> Handle(
            GetProductDetailQuery request,
            CancellationToken cancellationToken)
        {
            var product = await _productRepository.GetByIdAsync(request.ProductId);

            if (product == null || !product.IsActive)
            {
                return new ProductDetailVm
                {
                    Success = false,
                    Message = "Product not found or inactive"
                };
            }

            var productDetail = _mapper.Map<ProductDetailVm>(product);

            // Generate presigned URL for image if it exists
            if (!string.IsNullOrEmpty(product.ImagePath))
            {
                // Check if ImagePath is already a full URL (to avoid double-encoding)
                if (Uri.TryCreate(product.ImagePath, UriKind.Absolute, out _))
                {
                    // ImagePath is already a full URL, use it directly
                    productDetail.ImageUrl = product.ImagePath;
                }
                else
                {
                    // ImagePath is a file path, generate URL
                    productDetail.ImageUrl = await _fileStorageService.GetFileUrlAsync(
                        product.ImagePath,
                        TimeSpan.FromHours(1));
                }
            }

            productDetail.Success = true;

            return productDetail;
        }
    }
}