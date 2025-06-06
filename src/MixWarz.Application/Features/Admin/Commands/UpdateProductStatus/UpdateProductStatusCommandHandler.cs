using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Admin.Commands.UpdateProductStatus
{
    public class UpdateProductStatusCommandHandler : IRequestHandler<UpdateProductStatusCommand, UpdateProductStatusResponse>
    {
        private readonly IProductRepository _productRepository;
        
        public UpdateProductStatusCommandHandler(IProductRepository productRepository)
        {
            _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        }
        
        public async Task<UpdateProductStatusResponse> Handle(UpdateProductStatusCommand request, CancellationToken cancellationToken)
        {
            var response = new UpdateProductStatusResponse
            {
                Success = false,
                ProductId = request.ProductId,
                NewStatus = request.IsActive,
                Message = "Failed to update product status"
            };
            
            // Get the product
            var product = await _productRepository.GetByIdAsync(request.ProductId);
            if (product == null)
            {
                response.Message = "Product not found";
                return response;
            }
            
            // Store the old status for the response
            response.OldStatus = product.IsActive;
            
            // Perform the status update
            try
            {
                product.IsActive = request.IsActive;
                
                await _productRepository.UpdateAsync(product);
                
                response.Success = true;
                response.Message = "Product status updated successfully";
                return response;
            }
            catch (Exception ex)
            {
                response.Message = $"Error updating product status: {ex.Message}";
                return response;
            }
        }
    }
} 