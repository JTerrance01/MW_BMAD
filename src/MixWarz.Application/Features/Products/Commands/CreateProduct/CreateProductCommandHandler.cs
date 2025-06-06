using MediatR;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Products.Commands.CreateProduct
{
    public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, CreateProductResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IFileStorageService _fileStorageService;

        public CreateProductCommandHandler(
            IProductRepository productRepository,
            IFileStorageService fileStorageService)
        {
            _productRepository = productRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<CreateProductResponse> Handle(
            CreateProductCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Upload files to S3
                string imageS3Key = null;
                if (request.ImageFile != null)
                {
                    imageS3Key = await _fileStorageService.UploadFileAsync(
                        request.ImageFile,
                        "products/images");
                }

                // Upload the digital product file
                var downloadFileS3Key = await _fileStorageService.UploadFileAsync(
                    request.DownloadFile,
                    "products/files");

                // Create new product
                var product = new Product
                {
                    Name = request.Name,
                    Description = request.Description,
                    Price = request.Price,
                    CategoryId = request.CategoryId,
                    ProductType = request.ProductType,
                    ImagePath = imageS3Key,
                    DownloadFileS3Key = downloadFileS3Key,
                    IsActive = true,
                    CreationDate = DateTime.UtcNow
                };

                // Save to database
                var createdProduct = await _productRepository.AddAsync(product);

                return new CreateProductResponse
                {
                    Success = true,
                    Message = "Product created successfully",
                    ProductId = createdProduct.ProductId
                };
            }
            catch (Exception ex)
            {
                // Log exception details (would use logger in real app)
                return new CreateProductResponse
                {
                    Success = false,
                    Message = $"Failed to create product: {ex.Message}"
                };
            }
        }
    }
}