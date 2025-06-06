using MediatR;

namespace MixWarz.Application.Features.UserProfile.Queries.GetNewestUsers
{
    public class GetNewestUsersQuery : IRequest<GetNewestUsersResponse>
    {
        public int Limit { get; set; } = 5; // Default to 5 newest users
    }
}