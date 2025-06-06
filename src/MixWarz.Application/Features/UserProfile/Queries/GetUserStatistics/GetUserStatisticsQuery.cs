using MediatR;
using MixWarz.Application.Features.UserProfile.DTOs;

namespace MixWarz.Application.Features.UserProfile.Queries.GetUserStatistics
{
    public class GetUserStatisticsQuery : IRequest<UserActivitySummaryDto>
    {
        public string UserId { get; set; }
    }
} 