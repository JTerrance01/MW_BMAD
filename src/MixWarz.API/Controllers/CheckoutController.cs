using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MixWarz.Application.Features.Checkout.Commands.CreateCheckoutSession; // This command will be created next
using System.Threading.Tasks;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Requires authentication
    public class CheckoutController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CheckoutController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("create-session")]
        public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutSessionCommand command)
        {
            // Later, command might take a list of items or rely on current user's cart service
            // For now, it might directly contain the necessary info, or we adapt this
            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(new { sessionId = result.StripeSessionId });
        }
    }
}