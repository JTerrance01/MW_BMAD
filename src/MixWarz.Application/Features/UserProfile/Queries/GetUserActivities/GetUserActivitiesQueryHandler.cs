using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using MixWarz.Application.Common.Models;
using MixWarz.Application.Features.UserProfile.DTOs;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.UserProfile.Queries.GetUserActivities
{
    public class GetUserActivitiesQueryHandler : IRequestHandler<GetUserActivitiesQuery, PaginatedList<UserActivityDto>>
    {
        private readonly IUserActivityRepository _userActivityRepository;
        private readonly IMapper _mapper;

        public GetUserActivitiesQueryHandler(IUserActivityRepository userActivityRepository, IMapper mapper)
        {
            _userActivityRepository = userActivityRepository;
            _mapper = mapper;
        }

        public async Task<PaginatedList<UserActivityDto>> Handle(GetUserActivitiesQuery request, CancellationToken cancellationToken)
        {
            List<Domain.Entities.UserActivity> activities;
            int totalCount;

            // Apply filters based on request
            if (request.ActivityType.HasValue && request.StartDate.HasValue && request.EndDate.HasValue)
            {
                // Filter by type and date range
                activities = await _userActivityRepository.GetActivitiesByDateRangeAsync(
                    request.UserId,
                    request.StartDate.Value,
                    request.EndDate.Value,
                    request.PageNumber,
                    request.PageSize);
                
                // We just get the activities matching the type from the result
                activities = activities.Where(a => a.Type == request.ActivityType.Value).ToList();
                totalCount = await _userActivityRepository.GetUserActivityCountByTypeAsync(request.UserId, request.ActivityType.Value);
            }
            else if (request.ActivityType.HasValue)
            {
                // Filter by activity type
                activities = await _userActivityRepository.GetUserActivitiesByTypeAsync(
                    request.UserId,
                    request.ActivityType.Value,
                    request.PageNumber,
                    request.PageSize);
                totalCount = await _userActivityRepository.GetUserActivityCountByTypeAsync(request.UserId, request.ActivityType.Value);
            }
            else if (request.StartDate.HasValue && request.EndDate.HasValue)
            {
                // Filter by date range
                activities = await _userActivityRepository.GetActivitiesByDateRangeAsync(
                    request.UserId,
                    request.StartDate.Value,
                    request.EndDate.Value,
                    request.PageNumber,
                    request.PageSize);
                totalCount = activities.Count; // This is just an approximation
            }
            else
            {
                // No specific filters
                activities = await _userActivityRepository.GetUserActivitiesAsync(
                    request.UserId,
                    request.PageNumber,
                    request.PageSize);
                totalCount = await _userActivityRepository.GetUserActivityCountAsync(request.UserId);
            }

            var activityDtos = _mapper.Map<List<UserActivityDto>>(activities);
            
            return new PaginatedList<UserActivityDto>(
                activityDtos,
                totalCount,
                request.PageNumber,
                request.PageSize);
        }
    }
} 