using AutoMapper;
using MixWarz.Application.Features.Admin.Queries.GetUsers;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Mappings
{
    public class UserMappingProfile : Profile
    {
        public UserMappingProfile()
        {
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.UserName))
                .ForMember(dest => dest.IsDisabled, opt => opt.MapFrom(src => src.LockoutEnd.HasValue && src.LockoutEnd > DateTimeOffset.UtcNow))
                .ForMember(dest => dest.Roles, opt => opt.Ignore()); // Roles are filled separately
        }
    }
}