using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using System.Collections.Generic;

namespace MixWarz.Application.Features.Admin.Queries.GetUsers
{
    public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, UserListVm>
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly IMapper _mapper;

        public GetUsersQueryHandler(
            UserManager<User> userManager,
            RoleManager<Role> roleManager,
            IMapper mapper)
        {
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _roleManager = roleManager ?? throw new ArgumentNullException(nameof(roleManager));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        public async Task<UserListVm> Handle(GetUsersQuery request, CancellationToken cancellationToken)
        {
            // Start with all users
            IQueryable<User> usersQuery = _userManager.Users;

            // Apply search filter if provided
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                string searchTerm = request.SearchTerm.Trim().ToLower();
                usersQuery = usersQuery.Where(u =>
                    u.UserName.ToLower().Contains(searchTerm) ||
                    u.Email.ToLower().Contains(searchTerm) ||
                    (u.FirstName != null && u.FirstName.ToLower().Contains(searchTerm)) ||
                    (u.LastName != null && u.LastName.ToLower().Contains(searchTerm)));
            }

            // Get all users first to be able to filter by role
            var allUsers = await usersQuery.ToListAsync(cancellationToken);
            List<User> filteredUsers = new List<User>(allUsers);

            // Apply role filter if provided
            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                filteredUsers = new List<User>();
                foreach (var user in allUsers)
                {
                    var userRoles = await _userManager.GetRolesAsync(user);
                    if (userRoles.Contains(request.Role))
                    {
                        filteredUsers.Add(user);
                    }
                }
            }

            // Get total count after role filtering
            int totalCount = filteredUsers.Count;

            // Apply pagination manually after role filtering
            var pagedUsers = filteredUsers
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            // Create response object
            var userListVm = new UserListVm
            {
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize,
                Users = new List<UserDto>()
            };

            // Map users to DTOs and add role information
            foreach (var user in pagedUsers)
            {
                var userDto = _mapper.Map<UserDto>(user);
                userDto.Roles = (await _userManager.GetRolesAsync(user)).ToList();

                // Check if user is disabled (locked out)
                userDto.IsDisabled = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow;

                userListVm.Users.Add(userDto);
            }

            return userListVm;
        }
    }
}