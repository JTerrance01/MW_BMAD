using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CartController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<CartDto>> GetCart()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _mediator.Send(new GetCartQuery { UserId = userId });
            return Ok(result);
        }

        [HttpPost("add")]
        public async Task<ActionResult<int>> AddToCart(AddToCartCommand command)
        {
            // Override the UserId with the authenticated user's ID
            command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPost("update")]
        public async Task<ActionResult<bool>> UpdateCartItem(UpdateCartItemCommand command)
        {
            // Override the UserId with the authenticated user's ID
            command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPost("remove")]
        public async Task<ActionResult<bool>> RemoveFromCart(RemoveFromCartCommand command)
        {
            // Override the UserId with the authenticated user's ID
            command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPost("clear")]
        public async Task<ActionResult<bool>> ClearCart()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var command = new ClearCartCommand { UserId = userId };
            var result = await _mediator.Send(command);
            return Ok(result);
        }
    }
} 