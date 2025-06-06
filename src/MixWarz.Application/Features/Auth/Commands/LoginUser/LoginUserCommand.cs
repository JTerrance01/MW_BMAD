using MediatR;
using MixWarz.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Features.Auth.Commands.LoginUser
{
    public class LoginUserCommand : IRequest<LoginUserResponse>
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
    
    public class LoginUserResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public  string? Token { get; set; }
        public string? Username { get; set; }
        public List<string> Roles { get; set; }
    }
    
    public interface ITokenService
    {
        Task<string> GenerateJwtTokenAsync(string userId, string username, IList<string> roles);
    }
    
    public class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, LoginUserResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        
        public LoginUserCommandHandler(
            IUserRepository userRepository, 
            ITokenService tokenService,
            UserManager<User> userManager,
            SignInManager<User> signInManager)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _userManager = userManager;
            _signInManager = signInManager;
        }
        
        public async Task<LoginUserResponse> Handle(LoginUserCommand request, CancellationToken cancellationToken)
        {
            // Find user by email
            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null)
            {
                return new LoginUserResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                };
            }
            
            // Verify password
            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded)
            {
                return new LoginUserResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                };
            }
            
            // Update last login date
            user.LastLoginDate = DateTime.UtcNow;
            await _userRepository.UpdateUserAsync(user);
            
            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);
            
            // Generate JWT token
            var token = await _tokenService.GenerateJwtTokenAsync(user.Id, user.UserName, roles);
            
            // Return successful response with token
            return new LoginUserResponse
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                Username = user.UserName,
                Roles = new List<string>(roles)
            };
        }
    }
} 