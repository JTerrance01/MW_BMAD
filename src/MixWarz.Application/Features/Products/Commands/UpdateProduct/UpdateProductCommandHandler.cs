using MediatR;
using MixWarz.Domain.Interfaces;
using MixWarz.Domain.Enums;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.Products.Commands.UpdateProduct
{
    public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, UpdateProductResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IFileStorageService _fileStorageService;

        public UpdateProductCommandHandler(
            IProductRepository productRepository,
            IFileStorageService fileStorageService)
        {
            _productRepository = productRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<UpdateProductResponse> Handle(
            UpdateProductCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                Console.WriteLine($"Handling UpdateProduct request for ProductId: {request.ProductId}");
                Console.WriteLine($"UpdateImage: {request.UpdateImage}, UpdateDownloadFile: {request.UpdateDownloadFile}");

                // Get the existing product
                var product = await _productRepository.GetByIdAsync(request.ProductId);

                if (product == null)
                {
                    Console.WriteLine($"Product with ID {request.ProductId} not found");
                    return new UpdateProductResponse
                    {
                        Success = false,
                        Message = $"Product with ID {request.ProductId} not found"
                    };
                }

                // Update fields if they are provided in the request
                if (request.Name != null) product.Name = request.Name;
                if (request.Description != null) product.Description = request.Description;
                if (request.Price.HasValue) product.Price = request.Price.Value;
                if (request.ProductType.HasValue) product.ProductType = request.ProductType.Value;
                if (request.DownloadFileS3Key != null) product.DownloadFileS3Key = request.DownloadFileS3Key;
                if (request.CategoryId.HasValue) product.CategoryId = request.CategoryId.Value;
                if (request.IsActive.HasValue) product.IsActive = request.IsActive.Value;
                if (request.GenreId.HasValue) product.GenreId = request.GenreId.Value;
                if (request.Status.HasValue) product.Status = request.Status.Value;

                // Update Stripe IDs - allow them to be set to null if explicitly provided as such
                // Or only update if not null, depending on desired behavior for clearing these fields.
                // For now, let's assume if they are in the request, they are meant to be updated.
                if (request.StripeProductId != null || product.StripeProductId != request.StripeProductId)
                {
                    product.StripeProductId = request.StripeProductId;
                }
                if (request.StripePriceId != null || product.StripePriceId != request.StripePriceId)
                {
                    product.StripePriceId = request.StripePriceId;
                }

                // Update image if requested
                if (request.UpdateImage && request.ImageFile != null)
                {
                    // Delete old image if exists
                    if (!string.IsNullOrEmpty(product.ImagePath))
                    {
                        await _fileStorageService.DeleteFileAsync(product.ImagePath);
                    }

                    // Upload new image
                    product.ImagePath = await _fileStorageService.UploadFileAsync(
                        request.ImageFile,
                        "products/images");
                }

                // Update download file if requested
                if (request.UpdateDownloadFile && request.DownloadFile != null)
                {
                    // Delete old file if exists
                    if (!string.IsNullOrEmpty(product.DownloadFileS3Key))
                    {
                        await _fileStorageService.DeleteFileAsync(product.DownloadFileS3Key);
                    }

                    // Upload new file
                    product.DownloadFileS3Key = await _fileStorageService.UploadFileAsync(
                        request.DownloadFile,
                        "products/files");
                }

                // Save updates to database
                var updatedProduct = await _productRepository.UpdateAsync(product);

                return new UpdateProductResponse
                {
                    Success = true,
                    Message = "Product updated successfully",
                    ProductId = updatedProduct.ProductId
                };
            }
            catch (Exception ex)
            {
                // Enhanced error handling with more detailed message
                string errorDetails = $"Error updating product {request.ProductId}: {ex.Message}";
                if (ex.InnerException != null)
                {
                    errorDetails += $" | Inner Exception: {ex.InnerException.Message}";
                }

                // Log exception details (would use logger in real app)
                Console.WriteLine(errorDetails);

                return new UpdateProductResponse
                {
                    Success = false,
                    Message = $"Failed to update product: {ex.Message}"
                };
            }
        }
    }
}