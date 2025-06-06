using FluentValidation;
using MediatR;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Commands.UpdateOrderStatus
{
    /// <summary>
    /// Command for updating an order's status
    /// </summary>
    public class UpdateOrderStatusCommand : IRequest<UpdateOrderStatusResponse>
    {
        /// <summary>
        /// ID of the order to update
        /// </summary>
        public int OrderId { get; set; }

        /// <summary>
        /// New status for the order
        /// </summary>
        public OrderStatus NewStatus { get; set; }
    }

    /// <summary>
    /// Response object for order status update operation
    /// </summary>
    public class UpdateOrderStatusResponse
    {
        /// <summary>
        /// Indicates if the update was successful
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Message describing the result of the operation
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// ID of the updated order
        /// </summary>
        public int OrderId { get; set; }

        /// <summary>
        /// The new status of the order
        /// </summary>
        public OrderStatus Status { get; set; }
    }

    /// <summary>
    /// Validator for UpdateOrderStatusCommand
    /// </summary>
    public class UpdateOrderStatusCommandValidator : AbstractValidator<UpdateOrderStatusCommand>
    {
        public UpdateOrderStatusCommandValidator()
        {
            RuleFor(x => x.OrderId)
                .GreaterThan(0)
                .WithMessage("Order ID must be greater than 0");

            RuleFor(x => x.NewStatus)
                .IsInEnum()
                .WithMessage("Invalid order status");
        }
    }
}