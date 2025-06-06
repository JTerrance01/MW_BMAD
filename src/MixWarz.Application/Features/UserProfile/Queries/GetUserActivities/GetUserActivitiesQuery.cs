using System;
using MediatR;
using MixWarz.Application.Common.Models;
using MixWarz.Application.Features.UserProfile.DTOs;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.UserProfile.Queries.GetUserActivities
{
    public class GetUserActivitiesQuery : IRequest<PaginatedList<UserActivityDto>>
    {
        public string UserId { get; set; }
        public ActivityType? ActivityType { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string RelatedEntityType { get; set; }
        public int? RelatedEntityId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
} 