
namespace MixWarz.Application.Features.Admin.Queries.GetUsers
{
    /// <summary>
    /// View model for the user list response
    /// </summary>
    public class UserListVm
    {
        /// <summary>
        /// List of users matching the query parameters
        /// </summary>
        public List<UserDto> Users { get; set; } = new List<UserDto>();
        
        /// <summary>
        /// Total number of users matching the search criteria (before pagination)
        /// </summary>
        public int TotalCount { get; set; }
        
        /// <summary>
        /// Current page number
        /// </summary>
        public int Page { get; set; }
        
        /// <summary>
        /// Number of users per page
        /// </summary>
        public int PageSize { get; set; }
        
        /// <summary>
        /// Total number of pages
        /// </summary>
        public int TotalPages => (TotalCount + PageSize - 1) / PageSize;
    }
} 