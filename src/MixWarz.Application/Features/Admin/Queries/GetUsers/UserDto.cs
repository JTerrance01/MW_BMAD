
namespace MixWarz.Application.Features.Admin.Queries.GetUsers
{
    /// <summary>
    /// Data transfer object for user information in admin view
    /// </summary>
    public class UserDto
    {
        /// <summary>
        /// User's unique identifier
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// User's username
        /// </summary>
        public string Username { get; set; }

        /// <summary>
        /// User's email address
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// User's first name
        /// </summary>
        public string FirstName { get; set; }

        /// <summary>
        /// User's last name
        /// </summary>
        public string LastName { get; set; }

        /// <summary>
        /// Date when the user registered
        /// </summary>
        public DateTime? RegistrationDate { get; set; }

        /// <summary>
        /// Last time the user logged in
        /// </summary>
        public DateTime? LastLoginDate { get; set; }

        /// <summary>
        /// Roles assigned to this user
        /// </summary>
        public List<string> Roles { get; set; } = new List<string>();

        /// <summary>
        /// Whether the user account is disabled (locked out)
        /// </summary>
        public bool IsDisabled { get; set; }
    }
}