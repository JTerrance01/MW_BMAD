using MediatR;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Admin.Commands.UpdateOrderStatus
{
    public class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, UpdateOrderStatusResponse>
    {
        private readonly IOrderRepository _orderRepository;

        public UpdateOrderStatusCommandHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        }

        public async Task<UpdateOrderStatusResponse> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
        {
            // Get the order to verify it exists
            var order = await _orderRepository.GetByIdAsync(request.OrderId);
            if (order == null)
            {
                return new UpdateOrderStatusResponse
                {
                    Success = false,
                    Message = $"Order with ID {request.OrderId} not found",
                    OrderId = request.OrderId
                };
            }

            // Update the order status
            var result = await _orderRepository.UpdateOrderStatusAsync(request.OrderId, request.NewStatus);

            if (!result)
            {
                return new UpdateOrderStatusResponse
                {
                    Success = false,
                    Message = $"Failed to update order status for order {request.OrderId}",
                    OrderId = request.OrderId
                };
            }

            // Return success
            return new UpdateOrderStatusResponse
            {
                Success = true,
                Message = $"Order status updated successfully to {request.NewStatus}",
                OrderId = request.OrderId,
                Status = request.NewStatus
            };
        }
    }
}