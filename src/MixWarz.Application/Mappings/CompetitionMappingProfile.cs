using AutoMapper;
using MixWarz.Application.Features.Admin.Queries.GetCompetitionsList;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Mappings
{
    public class CompetitionMappingProfile : Profile
    {
        public CompetitionMappingProfile()
        {
            CreateMap<Competition, CompetitionDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.CompetitionId))
                .ForMember(dest => dest.Rules, opt => opt.MapFrom(src => src.RulesText))
                .ForMember(dest => dest.Prizes, opt => opt.MapFrom(src => src.PrizeDetails))
                .ForMember(dest => dest.PrizeDetails, opt => opt.MapFrom(src => src.PrizeDetails))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreationDate))
                .ForMember(dest => dest.JudgingStartDate, opt => opt.MapFrom(src => src.EndDate.AddDays(1)))
                .ForMember(dest => dest.JudgingEndDate, opt => opt.MapFrom(src => src.EndDate.AddDays(8)))
                .ForMember(dest => dest.OrganizerId, opt => opt.MapFrom(src => src.OrganizerUserId))
                .ForMember(dest => dest.MultitrackZipUrl, opt => opt.MapFrom(src => src.MultitrackZipUrl))
                .ForMember(dest => dest.MixedTrackUrl, opt => opt.MapFrom(src => src.MixedTrackUrl))
                .ForMember(dest => dest.SourceTrackUrl, opt => opt.MapFrom(src => src.SourceTrackUrl))
                .ForMember(dest => dest.Genre, opt => opt.MapFrom(src => src.Genre))
                .ForMember(dest => dest.SubmissionDeadline, opt => opt.MapFrom(src => src.SubmissionDeadline))
                .ForMember(dest => dest.Round1VotingEndDate, opt => opt.MapFrom(src => src.Round1VotingEndDate))
                .ForMember(dest => dest.Round2VotingEndDate, opt => opt.MapFrom(src => src.Round2VotingEndDate))
                .ForMember(dest => dest.SongCreator, opt => opt.MapFrom(src => src.SongCreator))
                .ForMember(dest => dest.CoverImageUrl, opt => opt.MapFrom(src => src.CoverImageUrl))
                .ForMember(dest => dest.NumberOfSubmissions, opt => opt.Ignore())
                .ForMember(dest => dest.OrganizerUsername, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
        }
    }
}