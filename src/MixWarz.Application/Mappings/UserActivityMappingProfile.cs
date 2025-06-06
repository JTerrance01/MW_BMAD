using AutoMapper;
using MixWarz.Application.Features.UserProfile.DTOs;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Mappings
{
    public class UserActivityMappingProfile : Profile
    {
        public UserActivityMappingProfile()
        {
            CreateMap<UserActivity, UserActivityDto>()
                .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.User != null ? src.User.UserName : "Unknown"));
        }
    }
} 