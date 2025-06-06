using MediatR;
using System.Collections.Generic;

namespace MixWarz.Application.Features.Admin.Commands.CreateUser
{
    /// <summary>
    /// Command to create a new user
    /// </summary>
    public class CreateUserCommand : IRequest<CreateUserResponse>
    {
        /// <summary>
        /// Username for the new user
        /// </summary>
        public string Username { get; set; }

        /// <summary>
        /// Email address for the new user
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Password for the new user
        /// </summary>
        public string Password { get; set; }

        /// <summary>
        /// First name of the new user
        /// </summary>
        public string FirstName { get; set; }

        /// <summary>
        /// Last name of the new user
        /// </summary>
        public string LastName { get; set; }

        /// <summary>
        /// Roles to assign to the new user
        /// </summary>
        public List<string> Roles { get; set; } = new List<string>();
    }
}