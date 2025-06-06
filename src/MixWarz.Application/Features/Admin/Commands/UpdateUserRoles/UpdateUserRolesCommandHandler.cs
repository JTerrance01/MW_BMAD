using MediatR;
using Microsoft.AspNetCore.Identity;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Features.Admin.Commands.UpdateUserRoles
{
    public class UpdateUserRolesCommandHandler : IRequestHandler<UpdateUserRolesCommand, UpdateUserRolesResponse>
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        
        public UpdateUserRolesCommandHandler(
            UserManager<User> userManager,
            RoleManager<Role> roleManager)
        {
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _roleManager = roleManager ?? throw new ArgumentNullException(nameof(roleManager));
        }
        
        public async Task<UpdateUserRolesResponse> Handle(UpdateUserRolesCommand request, CancellationToken cancellationToken)
        {
            var response = new UpdateUserRolesResponse
            {
                UserId = request.UserId,
                Success = false,
                Message = "Failed to update user roles"
            };
            
            // Find the user
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                response.Message = "User not found";
                return response;
            }
            
            // Validate that all roles exist
            foreach (var roleName in request.Roles)
            {
                if (!await _roleManager.RoleExistsAsync(roleName))
                {
                    response.Message = $"Role '{roleName}' does not exist";
                    return response;
                }
            }
            
            // Check if removing Admin role from the last admin
            if (!request.Roles.Contains("Admin"))
            {
                var isCurrentUserAdmin = await _userManager.IsInRoleAsync(user, "Admin");
                if (isCurrentUserAdmin)
                {
                    // Count how many admin users there are using UserManager
                    var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
                    if (adminUsers.Count <= 1)
                    {
                        response.Message = "Cannot remove Admin role from the last admin user";
                        return response;
                    }
                }
            }
            
            // Get current roles
            var currentRoles = await _userManager.GetRolesAsync(user);
            
            // Remove all current roles first
            var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
            {
                response.Message = "Failed to remove existing roles: " + 
                    string.Join(", ", removeResult.Errors.Select(e => e.Description));
                return response;
            }
            
            // Add the new roles
            var addResult = await _userManager.AddToRolesAsync(user, request.Roles);
            if (!addResult.Succeeded)
            {
                // Try to restore original roles if adding new ones fails
                await _userManager.AddToRolesAsync(user, currentRoles);
                
                response.Message = "Failed to add new roles: " + 
                    string.Join(", ", addResult.Errors.Select(e => e.Description));
                return response;
            }
            
            // Success
            response.Success = true;
            response.Message = "User roles updated successfully";
            response.Roles = request.Roles;
            
            return response;
        }
    }
} 