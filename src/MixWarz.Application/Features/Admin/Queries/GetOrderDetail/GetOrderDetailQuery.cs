using MediatR;
using MixWarz.Application.Features.Admin.Queries.GetOrdersList;

namespace MixWarz.Application.Features.Admin.Queries.GetOrderDetail
{
    /// <summary>
    /// Query to retrieve detailed information about a specific order
    /// </summary>
    public class GetOrderDetailQuery : IRequest<OrderDto>
    {
        /// <summary>
        /// ID of the order to retrieve
        /// </summary>
        public int OrderId { get; set; }
    }
} 