using System.Collections.Generic;

namespace MixWarz.Application.Features.Admin.Commands.CreateUser
{
    /// <summary>
    /// Response for the CreateUserCommand
    /// </summary>
    public class CreateUserResponse
    {
        /// <summary>
        /// Indicates whether the operation was successful
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// A message describing the result of the operation
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// The ID of the user that was created
        /// </summary>
        public string UserId { get; set; }

        /// <summary>
        /// Username of the created user
        /// </summary>
        public string Username { get; set; }

        /// <summary>
        /// Email of the created user
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Roles assigned to the created user
        /// </summary>
        public List<string> Roles { get; set; } = new List<string>();

        /// <summary>
        /// Validation errors if any occurred during creation
        /// </summary>
        public List<string> Errors { get; set; } = new List<string>();
    }
}