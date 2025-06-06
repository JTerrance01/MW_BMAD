using MediatR;
using MixWarz.Domain.Interfaces;
using System.IO;

namespace MixWarz.Application.Features.Products.Queries.GetProductDownloadUrl
{
    public class GetProductDownloadUrlQueryHandler : IRequestHandler<GetProductDownloadUrlQuery, ProductDownloadUrlVm>
    {
        private readonly IProductRepository _productRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IFileStorageService _fileStorageService;
        
        public GetProductDownloadUrlQueryHandler(
            IProductRepository productRepository,
            IOrderRepository orderRepository,
            IFileStorageService fileStorageService)
        {
            _productRepository = productRepository;
            _orderRepository = orderRepository;
            _fileStorageService = fileStorageService;
        }
        
        public async Task<ProductDownloadUrlVm> Handle(
            GetProductDownloadUrlQuery request, 
            CancellationToken cancellationToken)
        {
            // Admin can download any product
            bool isAdmin = true; // TODO: Implement proper admin check
            
            // If not admin, verify the user has purchased this product
            if (!isAdmin)
            {
                var userAccesses = await _orderRepository.GetUserProductAccessesAsync(request.UserId);
                bool hasAccess = userAccesses.Any(upa => upa.ProductId == request.ProductId);
                
                if (!hasAccess)
                {
                    return new ProductDownloadUrlVm
                    {
                        Success = false,
                        Message = "You do not have access to this product"
                    };
                }
            }
            
            // Get product details to get the S3 key
            var product = await _productRepository.GetByIdAsync(request.ProductId);
            
            if (product == null)
            {
                return new ProductDownloadUrlVm
                {
                    Success = false,
                    Message = "Product not found"
                };
            }
            
            // Generate a pre-signed URL for downloading the file
            var downloadUrl = await _fileStorageService.GetFileUrlAsync(
                product.DownloadFileS3Key, 
                TimeSpan.FromMinutes(10));
                
            // Extract file name from S3 key
            string fileName = Path.GetFileName(product.DownloadFileS3Key);
            
            return new ProductDownloadUrlVm
            {
                Success = true,
                DownloadUrl = downloadUrl,
                FileName = fileName
            };
        }
    }
} 