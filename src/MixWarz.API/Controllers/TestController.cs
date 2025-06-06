using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Text;
using System.Threading.Tasks;
using MediatR;
using MixWarz.Application.Features.Cart.Commands.AddToCart;
using MixWarz.Application.Features.Cart.Commands.ClearCart;
using MixWarz.Application.Features.Cart.Commands.RemoveFromCart;
using MixWarz.Application.Features.Cart.Commands.UpdateCartItem;
using MixWarz.Application.Features.Cart.DTOs;
using MixWarz.Application.Features.Cart.Queries.GetCart;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;
        
        public TestController(IMapper mapper, IMediator mediator)
        {
            _mapper = mapper;
            _mediator = mediator;
        }
        
        [HttpGet("automapper")]
        public IActionResult TestAutoMapper()
        {
            var sb = new StringBuilder();
            
            try
            {
                // Check if AutoMapper configuration is valid
                _mapper.ConfigurationProvider.AssertConfigurationIsValid();
                sb.AppendLine("AutoMapper configuration is valid!");
                
                // We can't list all registered mappings easily, so just report success
                sb.AppendLine("\nAutoMapper configuration has been validated successfully.");
                
                return Ok(sb.ToString());
            }
            catch (AutoMapperConfigurationException ex)
            {
                sb.AppendLine("AutoMapper configuration is invalid!");
                sb.AppendLine($"Error: {ex.Message}");
                
                // Simplify the error extraction
                if (ex.Types != null)
                {
                    sb.AppendLine("\nMapping issues were detected. Check server logs for details.");
                }
                
                return BadRequest(sb.ToString());
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpGet("test")]
        public ActionResult<string> Test()
        {
            return "API is working!";
        }
        
        // Test cart endpoints (for testing without authentication)
        
        [HttpGet("cart")]
        public async Task<ActionResult<CartDto>> GetTestCart([FromQuery] string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("User ID is required");
            }
            
            var result = await _mediator.Send(new GetCartQuery { UserId = userId });
            return Ok(result);
        }
        
        [HttpPost("cart/add")]
        public async Task<ActionResult<int>> AddToTestCart(AddToCartCommand command)
        {
            if (string.IsNullOrEmpty(command.UserId))
            {
                return BadRequest("User ID is required");
            }
            
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        
        [HttpPost("cart/update")]
        public async Task<ActionResult<bool>> UpdateTestCartItem(UpdateCartItemCommand command)
        {
            if (string.IsNullOrEmpty(command.UserId))
            {
                return BadRequest("User ID is required");
            }
            
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        
        [HttpPost("cart/remove")]
        public async Task<ActionResult<bool>> RemoveFromTestCart(RemoveFromCartCommand command)
        {
            if (string.IsNullOrEmpty(command.UserId))
            {
                return BadRequest("User ID is required");
            }
            
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        
        [HttpPost("cart/clear")]
        public async Task<ActionResult<bool>> ClearTestCart([FromBody] ClearCartCommand command)
        {
            if (string.IsNullOrEmpty(command.UserId))
            {
                return BadRequest("User ID is required");
            }
            
            var result = await _mediator.Send(command);
            return Ok(result);
        }
    }
} 