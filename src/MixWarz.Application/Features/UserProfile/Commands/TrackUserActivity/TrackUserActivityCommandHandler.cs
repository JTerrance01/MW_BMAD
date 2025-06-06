using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.UserProfile.Commands.TrackUserActivity
{
    public class TrackUserActivityCommandHandler : IRequestHandler<TrackUserActivityCommand, int>
    {
        private readonly IUserActivityRepository _userActivityRepository;

        public TrackUserActivityCommandHandler(IUserActivityRepository userActivityRepository)
        {
            _userActivityRepository = userActivityRepository;
        }

        public async Task<int> Handle(TrackUserActivityCommand request, CancellationToken cancellationToken)
        {
            var activity = new UserActivity
            {
                UserId = request.UserId,
                Type = request.Type,
                Description = request.Description,
                RelatedEntityType = request.RelatedEntityType,
                RelatedEntityId = request.RelatedEntityId,
                Timestamp = DateTime.UtcNow,
                IPAddress = request.IPAddress,
                UserAgent = request.UserAgent
            };

            var createdActivity = await _userActivityRepository.CreateActivityAsync(activity);
            return createdActivity.Id;
        }
    }
}