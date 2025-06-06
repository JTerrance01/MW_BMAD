namespace MixWarz.Application.Features.Admin.Commands.CreateProduct
{
    /// <summary>
    /// Response for the create product command
    /// </summary>
    public class CreateProductResponse
    {
        /// <summary>
        /// Whether the operation was successful
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Message describing the result of the operation
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// ID of the newly created product
        /// </summary>
        public int ProductId { get; set; }

        /// <summary>
        /// Name of the newly created product
        /// </summary>
        public string ProductName { get; set; }
    }
}