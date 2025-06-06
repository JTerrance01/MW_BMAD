using MediatR;

namespace MixWarz.Application.Features.Admin.Commands.DisableUser
{
    /// <summary>
    /// Command to disable or enable a user account
    /// </summary>
    public class DisableUserCommand : IRequest<DisableUserResponse>
    {
        public string UserId { get; set; }
        public bool Disable { get; set; } // true to disable, false to enable
    }
}