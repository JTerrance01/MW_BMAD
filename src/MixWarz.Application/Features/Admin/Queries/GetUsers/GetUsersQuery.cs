using MediatR;

namespace MixWarz.Application.Features.Admin.Queries.GetUsers
{
    /// <summary>
    /// Query to retrieve a paginated list of users for admin management
    /// </summary>
    public class GetUsersQuery : IRequest<UserListVm>
    {
        /// <summary>
        /// Optional search term to filter users by username or email
        /// </summary>
        public string SearchTerm { get; set; }

        /// <summary>
        /// Optional role name to filter users by role
        /// </summary>
        public string Role { get; set; }

        /// <summary>
        /// Page number (1-based) for pagination
        /// </summary>
        public int Page { get; set; } = 1;

        /// <summary>
        /// Number of users per page
        /// </summary>
        public int PageSize { get; set; } = 10;
    }
}