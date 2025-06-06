using MediatR;

namespace MixWarz.Application.Features.Admin.Commands.DeleteUser
{
    /// <summary>
    /// Command to delete a user
    /// </summary>
    public class DeleteUserCommand : IRequest<DeleteUserResponse>
    {
        /// <summary>
        /// Unique identifier of the user to delete
        /// </summary>
        public string UserId { get; set; }
    }
}