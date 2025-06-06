using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using MixWarz.Domain.Entities;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.Admin.Commands.CreateUser
{
    public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, CreateUserResponse>
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly ILogger<CreateUserCommandHandler> _logger;

        public CreateUserCommandHandler(
            UserManager<User> userManager,
            RoleManager<Role> roleManager,
            ILogger<CreateUserCommandHandler> logger)
        {
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _roleManager = roleManager ?? throw new ArgumentNullException(nameof(roleManager));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<CreateUserResponse> Handle(CreateUserCommand request, CancellationToken cancellationToken)
        {
            var response = new CreateUserResponse
            {
                Success = false,
                Message = "Failed to create user"
            };

            // Check if username already exists
            var existingUser = await _userManager.FindByNameAsync(request.Username);
            if (existingUser != null)
            {
                _logger.LogWarning("Username {Username} already exists", request.Username);
                response.Message = "Username already exists";
                response.Errors.Add("Username already exists");
                return response;
            }

            // Check if email already exists
            existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                _logger.LogWarning("Email {Email} already exists", request.Email);
                response.Message = "Email already exists";
                response.Errors.Add("Email already exists");
                return response;
            }

            // Validate that all roles exist
            foreach (var roleName in request.Roles)
            {
                if (!await _roleManager.RoleExistsAsync(roleName))
                {
                    _logger.LogWarning("Role {Role} does not exist", roleName);
                    response.Message = $"Role '{roleName}' does not exist";
                    response.Errors.Add($"Role '{roleName}' does not exist");
                    return response;
                }
            }

            // Create new user
            var newUser = new User
            {
                UserName = request.Username,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                RegistrationDate = DateTime.UtcNow
            };

            // Create the user with the password
            var createResult = await _userManager.CreateAsync(newUser, request.Password);
            if (!createResult.Succeeded)
            {
                _logger.LogError("Failed to create user: {Errors}", string.Join(", ", createResult.Errors.Select(e => e.Description)));
                response.Message = "Failed to create user";
                foreach (var error in createResult.Errors)
                {
                    response.Errors.Add(error.Description);
                }
                return response;
            }

            // Add roles if any are specified
            if (request.Roles.Any())
            {
                var addRolesResult = await _userManager.AddToRolesAsync(newUser, request.Roles);
                if (!addRolesResult.Succeeded)
                {
                    _logger.LogWarning("User created but failed to add roles: {Errors}",
                        string.Join(", ", addRolesResult.Errors.Select(e => e.Description)));

                    // Still consider it a success, but add warnings
                    response.Message = "User created but failed to add some roles";
                    foreach (var error in addRolesResult.Errors)
                    {
                        response.Errors.Add(error.Description);
                    }
                }
                else
                {
                    response.Roles = request.Roles;
                }
            }

            // Success
            _logger.LogInformation("Created new user {Username} with ID {UserId}", newUser.UserName, newUser.Id);
            response.Success = true;
            response.Message = "User created successfully";
            response.UserId = newUser.Id;
            response.Username = newUser.UserName;
            response.Email = newUser.Email;

            return response;
        }
    }
}