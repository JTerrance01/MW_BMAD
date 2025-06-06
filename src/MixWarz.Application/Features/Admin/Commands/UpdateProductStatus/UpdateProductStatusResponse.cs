namespace MixWarz.Application.Features.Admin.Commands.UpdateProductStatus
{
    /// <summary>
    /// Response model for the update product status operation
    /// </summary>
    public class UpdateProductStatusResponse
    {
        /// <summary>
        /// Indicates whether the operation was successful
        /// </summary>
        public bool Success { get; set; }
        
        /// <summary>
        /// Message providing details about the operation result
        /// </summary>
        public string Message { get; set; }
        
        /// <summary>
        /// ID of the product whose status was updated
        /// </summary>
        public int ProductId { get; set; }
        
        /// <summary>
        /// Previous active status of the product
        /// </summary>
        public bool OldStatus { get; set; }
        
        /// <summary>
        /// New active status of the product
        /// </summary>
        public bool NewStatus { get; set; }
    }
} 