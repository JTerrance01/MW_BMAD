using MediatR;

namespace MixWarz.Application.Features.Admin.Queries.GetUserDetail
{
    /// <summary>
    /// Query to retrieve detailed information about a specific user
    /// </summary>
    public class GetUserDetailQuery : IRequest<UserDetailVm>
    {
        /// <summary>
        /// Unique identifier of the user to get details for
        /// </summary>
        public string UserId { get; set; }
    }
}