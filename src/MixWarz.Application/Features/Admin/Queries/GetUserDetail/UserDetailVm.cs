using System;
using System.Collections.Generic;

namespace MixWarz.Application.Features.Admin.Queries.GetUserDetail
{
    /// <summary>
    /// View model for detailed user information
    /// </summary>
    public class UserDetailVm
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
        /// Whether the email is confirmed
        /// </summary>
        public bool EmailConfirmed { get; set; }

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
        /// URL to the user's profile picture, if any
        /// </summary>
        public string ProfilePictureUrl { get; set; }

        /// <summary>
        /// User's biography
        /// </summary>
        public string Bio { get; set; }

        /// <summary>
        /// Roles assigned to this user
        /// </summary>
        public List<string> Roles { get; set; } = new List<string>();

        /// <summary>
        /// Number of orders the user has placed
        /// </summary>
        public int OrdersCount { get; set; }

        /// <summary>
        /// Total amount spent by the user
        /// </summary>
        public decimal TotalSpent { get; set; }

        /// <summary>
        /// Number of competition submissions
        /// </summary>
        public int SubmissionsCount { get; set; }
    }
}