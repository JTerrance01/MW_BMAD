using MediatR;
using Microsoft.AspNetCore.Mvc;
using MixWarz.Application.Features.Auth.Commands.RegisterUser;
using MixWarz.Application.Features.Auth.Commands.LoginUser;
using System;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;
        
        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }
        
        [HttpPost("register")]
        public async Task<ActionResult<RegisterUserResponse>> Register(RegisterUserCommand command)
        {
            Console.WriteLine($"AuthController.Register called with username: {command.Username}, email: {command.Email}");
            
            try 
            {
                var result = await _mediator.Send(command);
                
                if (result.Success)
                {
                    Console.WriteLine("Registration successful");
                    return Ok(result);
                }
                
                Console.WriteLine($"Registration failed: {result.Message}");
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in AuthController.Register: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                return StatusCode(500, new RegisterUserResponse { Success = false, Message = "An unexpected error occurred during registration." });
            }
        }
        
        [HttpPost("login")]
        public async Task<ActionResult<LoginUserResponse>> Login(LoginUserCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                
                if (result.Success)
                {
                    return Ok(result);
                }
                
                return Unauthorized(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in AuthController.Login: {ex.Message}");
                return StatusCode(500, new LoginUserResponse { Success = false, Message = "An unexpected error occurred during login." });
            }
        }
    }
} 