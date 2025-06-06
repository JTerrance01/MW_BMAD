using AutoMapper;
using MixWarz.Application.Features.Admin.Queries.GetOrdersList;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Mappings
{
    public class OrderMappingProfile : Profile
    {
        public OrderMappingProfile()
        {
            // Order -> OrderDto
            CreateMap<Order, OrderDto>()
                .ForMember(dest => dest.OrderId, opt => opt.MapFrom(src => src.OrderId))
                .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
                .ForMember(dest => dest.OrderDate, opt => opt.MapFrom(src => src.OrderDate))
                .ForMember(dest => dest.TotalAmount, opt => opt.MapFrom(src => src.TotalAmount))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
                .ForMember(dest => dest.PaymentIntentId, opt => opt.MapFrom(src => src.StripePaymentIntentId))
                .ForMember(dest => dest.Username, opt => opt.Ignore())
                .ForMember(dest => dest.Email, opt => opt.Ignore())
                .ForMember(dest => dest.Items, opt => opt.Ignore());

            // OrderItem -> OrderItemDto
            CreateMap<OrderItem, OrderItemDto>()
                .ForMember(dest => dest.OrderItemId, opt => opt.MapFrom(src => src.OrderItemId))
                .ForMember(dest => dest.ProductId, opt => opt.MapFrom(src => src.ProductId))
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.Name : $"Product {src.ProductId}"))
                .ForMember(dest => dest.Quantity, opt => opt.MapFrom(src => src.Quantity))
                .ForMember(dest => dest.PriceAtPurchase, opt => opt.MapFrom(src => src.PriceAtPurchase));
        }
    }
} 