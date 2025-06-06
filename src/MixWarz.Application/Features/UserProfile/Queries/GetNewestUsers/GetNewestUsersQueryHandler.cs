using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Features.UserProfile.Queries.GetNewestUsers
{
    public class GetNewestUsersQueryHandler : IRequestHandler<GetNewestUsersQuery, GetNewestUsersResponse>
    {
        private readonly UserManager<User> _userManager;

        public GetNewestUsersQueryHandler(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<GetNewestUsersResponse> Handle(GetNewestUsersQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Set a reasonable limit
                int limit = Math.Min(request.Limit, 50);

                // Get users ordered by registration date (newest first)
                var newestUsers = await _userManager.Users
                    .OrderByDescending(u => u.RegistrationDate)
                    .Take(limit)
                    .ToListAsync(cancellationToken);

                // Map to DTOs
                var userDtos = newestUsers.Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.UserName,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    ProfilePictureUrl = u.ProfilePictureUrl,
                    RegistrationDate = (DateTime)u.RegistrationDate
                }).ToList();

                return new GetNewestUsersResponse
                {
                    Success = true,
                    Users = userDtos
                };
            }
            catch (Exception ex)
            {
                return new GetNewestUsersResponse
                {
                    Success = false,
                    Message = $"Error retrieving newest users: {ex.Message}"
                };
            }
        }
    }
}