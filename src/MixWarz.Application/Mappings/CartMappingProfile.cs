using System.Linq;
using AutoMapper;
using MixWarz.Application.Features.Cart.DTOs;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Mappings
{
    public class CartMappingProfile : Profile
    {
        public CartMappingProfile()
        {
            // Map Cart to CartDto
            CreateMap<Cart, CartDto>()
                .ForMember(dest => dest.TotalItems, opt => opt.MapFrom(src => src.CartItems.Sum(ci => ci.Quantity)))
                .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.CartItems.Sum(ci => ci.Quantity * ci.Product.Price)))
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.CartItems));
                
            // Map CartItem to CartItemDto
            CreateMap<CartItem, CartItemDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
                .ForMember(dest => dest.ProductImageUrl, opt => opt.MapFrom(src => src.Product.ImagePath))
                .ForMember(dest => dest.ProductPrice, opt => opt.MapFrom(src => src.Product.Price))
                .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.Quantity * src.Product.Price));
        }
    }
} 