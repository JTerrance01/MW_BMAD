using MediatR;

namespace MixWarz.Application.Features.Admin.Commands.UpdateProductStatus
{
    /// <summary>
    /// Command to update a product's active status
    /// </summary>
    public class UpdateProductStatusCommand : IRequest<UpdateProductStatusResponse>
    {
        /// <summary>
        /// ID of the product to update
        /// </summary>
        public int ProductId { get; set; }
        
        /// <summary>
        /// New active status to set for the product
        /// </summary>
        public bool IsActive { get; set; }
    }
} 