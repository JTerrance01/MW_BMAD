using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Identity;
using MixWarz.Application.Features.Admin.Queries.GetOrdersList;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Admin.Queries.GetOrderDetail
{
    public class GetOrderDetailQueryHandler : IRequestHandler<GetOrderDetailQuery, OrderDto>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly UserManager<User> _userManager;
        private readonly IMapper _mapper;
        
        public GetOrderDetailQueryHandler(
            IOrderRepository orderRepository,
            UserManager<User> userManager,
            IMapper mapper)
        {
            _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }
        
        public async Task<OrderDto> Handle(GetOrderDetailQuery request, CancellationToken cancellationToken)
        {
            // Get the order with its items
            var order = await _orderRepository.GetOrderWithItemsAsync(request.OrderId, cancellationToken);
            if (order == null)
            {
                return null;
            }
            
            // Use AutoMapper instead of manual mapping
            var orderDto = _mapper.Map<OrderDto>(order);
            
            // Get user details
            var user = await _userManager.FindByIdAsync(order.UserId);
            if (user != null)
            {
                orderDto.Username = user.UserName;
                orderDto.Email = user.Email;
            }
            
            // Map order items
            orderDto.Items = _mapper.Map<List<OrderItemDto>>(order.OrderItems);
            
            return orderDto;
        }
    }
} 