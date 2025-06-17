using MediatR;
using MixWarz.Domain.Interfaces;
using MixWarz.Domain.Enums;
using AutoMapper;

namespace MixWarz.Application.Features.UserProfile.Queries.GetUserPurchases
{
    /// <summary>
    /// Handler for GetUserPurchasesQuery
    /// </summary>
    public class GetUserPurchasesQueryHandler : IRequestHandler<GetUserPurchasesQuery, UserPurchasesVm>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IMapper _mapper;

        public GetUserPurchasesQueryHandler(IOrderRepository orderRepository, IMapper mapper)
        {
            _orderRepository = orderRepository;
            _mapper = mapper;
        }

        public async Task<UserPurchasesVm> Handle(GetUserPurchasesQuery request, CancellationToken cancellationToken)
        {
            // Get user orders with filtering
            var (orders, totalCount) = await _orderRepository.GetOrdersForAdminAsync(
                userId: request.UserId,
                status: request.Status,
                orderDateFrom: null,
                orderDateTo: null,
                minAmount: null,
                maxAmount: null,
                page: request.Page,
                pageSize: request.PageSize,
                cancellationToken: cancellationToken
            );

            // Convert orders to purchase DTOs
            var purchaseItems = new List<UserPurchaseDto>();

            foreach (var order in orders)
            {
                foreach (var orderItem in order.OrderItems)
                {
                    // Apply type filter if specified
                    if (!string.IsNullOrEmpty(request.Type))
                    {
                        // Determine if product is digital based on IsShippable property
                        // If IsShippable is false, it's a digital product
                        var isDigital = orderItem.Product?.IsShippable == false;
                        var typeMatches = request.Type.ToLower() switch
                        {
                            "digital" => isDigital,
                            "physical" => !isDigital,
                            _ => true
                        };

                        if (!typeMatches) continue;
                    }

                    purchaseItems.Add(new UserPurchaseDto
                    {
                        OrderId = order.OrderId,
                        OrderItemId = orderItem.OrderItemId,
                        PurchaseDate = order.OrderDate,
                        Status = order.Status,
                        Price = orderItem.Price,
                        Quantity = orderItem.Quantity,
                        IsDigital = orderItem.Product?.IsShippable == false, // Digital if not shippable
                        ProductId = orderItem.ProductId,
                        ProductName = orderItem.Product?.Name ?? "Unknown Product",
                        ProductImageUrl = orderItem.Product?.ImagePath,
                        ProductDescription = orderItem.Product?.Description,
                        OrderNumber = order.OrderId.ToString(),
                        TotalAmount = order.TotalAmount
                    });
                }
            }

            // Apply pagination to purchase items if type filtering was applied
            var finalItems = purchaseItems;
            var finalTotalCount = totalCount;

            if (!string.IsNullOrEmpty(request.Type))
            {
                finalTotalCount = purchaseItems.Count;
                finalItems = purchaseItems
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToList();
            }

            return new UserPurchasesVm
            {
                Items = finalItems,
                TotalCount = finalTotalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }
    }
}