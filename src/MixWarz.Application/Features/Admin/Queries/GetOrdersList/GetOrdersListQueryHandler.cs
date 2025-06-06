using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Identity;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Admin.Queries.GetOrdersList
{
    public class GetOrdersListQueryHandler : IRequestHandler<GetOrdersListQuery, OrdersListVm>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly UserManager<User> _userManager;
        private readonly IMapper _mapper;

        public GetOrdersListQueryHandler(
            IOrderRepository orderRepository,
            UserManager<User> userManager,
            IMapper mapper)
        {
            _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        public async Task<OrdersListVm> Handle(GetOrdersListQuery request, CancellationToken cancellationToken)
        {
            // Get orders matching the filter criteria
            var result = await _orderRepository.GetOrdersForAdminAsync(
                request.UserId,
                request.Status,
                request.OrderDateFrom,
                request.OrderDateTo,
                request.MinAmount,
                request.MaxAmount,
                request.Page,
                request.PageSize,
                cancellationToken);
                
            var orders = result.Orders;
            var totalCount = result.TotalCount;

            // Use AutoMapper instead of manual mapping
            var orderDtos = _mapper.Map<List<OrderDto>>(orders);
            
            // Set user-specific data that can't be automapped
            foreach (var orderDto in orderDtos)
            {
                // Get user details
                var user = await _userManager.FindByIdAsync(orderDto.UserId);
                if (user != null)
                {
                    orderDto.Username = user.UserName;
                    orderDto.Email = user.Email;
                }
                
                // Map order items if they're included
                var order = orders.FirstOrDefault(o => o.OrderId == orderDto.OrderId);
                if (order?.OrderItems != null)
                {
                    orderDto.Items = _mapper.Map<List<OrderItemDto>>(order.OrderItems);
                }
            }

            // Create and return the view model
            var vm = new OrdersListVm
            {
                Orders = orderDtos,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };

            return vm;
        }
    }
} 