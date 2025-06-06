using MediatR;
using MixWarz.Domain.Interfaces;
using MixWarz.Domain.Entities;
using System;
using System.Diagnostics;

namespace MixWarz.Application.Features.Auth.Commands.RegisterUser
{
    public class RegisterUserCommand : IRequest<RegisterUserResponse>
    {
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }
    
    public class RegisterUserResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
    }
    
    public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, RegisterUserResponse>
    {
        private readonly IUserRepository _userRepository;
        
        public RegisterUserCommandHandler(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }
        
        public async Task<RegisterUserResponse> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
        {
            Console.WriteLine($"Registration attempt: {request.Username}, {request.Email}");
            
            // Check if username already exists
            if (await _userRepository.UsernameExistsAsync(request.Username))
            {
                Console.WriteLine($"Username already exists: {request.Username}");
                return new RegisterUserResponse
                {
                    Success = false,
                    Message = "Username already exists"
                };
            }
            
            // Check if email already exists
            if (await _userRepository.EmailExistsAsync(request.Email))
            {
                Console.WriteLine($"Email already exists: {request.Email}");
                return new RegisterUserResponse
                {
                    Success = false,
                    Message = "Email already exists"
                };
            }
            
            // Create user
            var user = new User
            {
                UserName = request.Username,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName
            };
            
            Console.WriteLine($"Attempting to create user: {user.UserName}");
            var result = await _userRepository.CreateUserAsync(user, request.Password, "User");
            
            if (result)
            {
                Console.WriteLine($"User registered successfully: {user.UserName}");
                return new RegisterUserResponse
                {
                    Success = true,
                    Message = "User registered successfully"
                };
            }
            
            Console.WriteLine($"Failed to register user: {user.UserName}");
            return new RegisterUserResponse
            {
                Success = false,
                Message = "Failed to register user"
            };
        }
    }
} 