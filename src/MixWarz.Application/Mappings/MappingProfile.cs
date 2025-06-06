using AutoMapper;
using MixWarz.Application.Mappings;

namespace MixWarz.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // This is the main AutoMapper profile that includes all specific profiles
            // All specific mappings have been moved to their respective profile classes:
            // - UserMappingProfile
            // - ProductMappingProfile
            // - CompetitionMappingProfile
            // - OrderMappingProfile
        }
    }
}

