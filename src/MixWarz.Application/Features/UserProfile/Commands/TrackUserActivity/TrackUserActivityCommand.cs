using System;
using MediatR;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.UserProfile.Commands.TrackUserActivity
{
    public class TrackUserActivityCommand : IRequest<int>
    {
        public string UserId { get; set; }
        public ActivityType Type { get; set; }
        public string Description { get; set; }
        public string RelatedEntityType { get; set; }
        public int? RelatedEntityId { get; set; }
        public string IPAddress { get; set; }
        public string UserAgent { get; set; }
    }
} 