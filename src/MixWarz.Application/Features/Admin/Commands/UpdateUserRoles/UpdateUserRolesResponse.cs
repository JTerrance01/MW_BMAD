
namespace MixWarz.Application.Features.Admin.Commands.UpdateUserRoles
{
    /// <summary>
    /// Response model for the update user roles operation
    /// </summary>
    public class UpdateUserRolesResponse
    {
        /// <summary>
        /// Indicates whether the operation was successful
        /// </summary>
        public bool Success { get; set; }
        
        /// <summary>
        /// Message providing details about the operation result
        /// </summary>
        public string Message { get; set; }
        
        /// <summary>
        /// The ID of the user whose roles were updated
        /// </summary>
        public string UserId { get; set; }
        
        /// <summary>
        /// The updated list of roles assigned to the user
        /// </summary>
        public List<string> Roles { get; set; } = new List<string>();
    }
} 