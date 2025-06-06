using System;
using System.Collections.Generic;

namespace MixWarz.Application.Features.UserProfile.Queries.GetNewestUsers
{
    public class GetNewestUsersResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public List<UserDto> Users { get; set; } = new List<UserDto>();
    }

    public class UserDto
    {
        public string Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string ProfilePictureUrl { get; set; }
        public DateTime RegistrationDate { get; set; }
    }
}