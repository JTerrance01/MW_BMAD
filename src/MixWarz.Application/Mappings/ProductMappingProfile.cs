using AutoMapper;
using MixWarz.Domain.Entities;
using MixWarz.Application.Features.Products.Queries.GetProductsList;
using MixWarz.Application.Features.Products.Queries.GetProductDetail;
using MixWarz.Application.Features.Products.Queries.GetCategories;
using MixWarz.Application.Features.Admin.Queries.GetProductsList;

namespace MixWarz.Application.Mappings
{
    public class ProductMappingProfile : Profile
    {
        public ProductMappingProfile()
        {
            // Product -> ProductDto (for Features.Products)
            CreateMap<Product, Features.Products.Queries.GetProductsList.ProductDto>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name))
                .ForMember(dest => dest.ImageUrl, opt => opt.Ignore());

            // Product -> ProductDetailVm
            CreateMap<Product, ProductDetailVm>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name))
                .ForMember(dest => dest.ImageUrl, opt => opt.Ignore())
                .ForMember(dest => dest.Success, opt => opt.Ignore())
                .ForMember(dest => dest.Message, opt => opt.Ignore());

            // Category -> CategoryDto
            CreateMap<Category, CategoryDto>();

            // Product -> Admin ProductDto
            CreateMap<Product, MixWarz.Application.Features.Admin.Queries.GetProductsList.ProductDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.ProductId))
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name))
                .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.ImagePath))
                .ForMember(dest => dest.FileUrl, opt => opt.MapFrom(src => src.DownloadFileS3Key))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreationDate))
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.TotalSales, opt => opt.Ignore());
        }
    }
}