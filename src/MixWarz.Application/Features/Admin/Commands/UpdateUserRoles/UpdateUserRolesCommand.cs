using MediatR;

namespace MixWarz.Application.Features.Admin.Commands.UpdateUserRoles
{
    /// <summary>
    /// Command to update the roles assigned to a user
    /// </summary>
    public class UpdateUserRolesCommand : IRequest<UpdateUserRolesResponse>
    {
        /// <summary>
        /// The ID of the user whose roles will be updated
        /// </summary>
        public string UserId { get; set; }
        
        /// <summary>
        /// The list of role names to assign to the user
        /// </summary>
        public List<string> Roles { get; set; } = new List<string>();
    }
} 