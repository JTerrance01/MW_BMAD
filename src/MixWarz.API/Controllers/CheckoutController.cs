using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MixWarz.Application.Features.Checkout.Commands.CreateCheckoutSession; // This command will be created next
using MixWarz.Application.Features.Checkout.Commands.CreateSubscriptionCheckoutSession;
using System.Threading.Tasks;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Requires authentication
    public class CheckoutController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IConfiguration _configuration;

        public CheckoutController(IMediator mediator, IConfiguration configuration)
        {
            _mediator = mediator;
            _configuration = configuration;
        }

        [HttpGet("validate-config")]
        public IActionResult ValidateStripeConfiguration()
        {
            var config = new
            {
                hasPublishableKey = !string.IsNullOrEmpty(_configuration["Stripe:PublishableKey"]),
                hasSecretKey = !string.IsNullOrEmpty(_configuration["Stripe:SecretKey"]),
                hasWebhookSecret = !string.IsNullOrEmpty(_configuration["Stripe:WebhookSecret"]),
                publishableKeyPrefix = _configuration["Stripe:PublishableKey"]?.Substring(0, Math.Min(7, _configuration["Stripe:PublishableKey"]?.Length ?? 0)),
                secretKeyPrefix = _configuration["Stripe:SecretKey"]?.Substring(0, Math.Min(7, _configuration["Stripe:SecretKey"]?.Length ?? 0))
            };

            return Ok(new
            {
                message = "Stripe configuration status",
                configuration = config,
                isValid = config.hasPublishableKey && config.hasSecretKey,
                recommendations = new[]
                {
                    !config.hasPublishableKey ? "Add Stripe:PublishableKey to appsettings.json" : null,
                    !config.hasSecretKey ? "Add Stripe:SecretKey to appsettings.json" : null,
                    !config.hasWebhookSecret ? "Add Stripe:WebhookSecret for production webhooks" : null
                }.Where(r => r != null)
            });
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

            return Ok(new { sessionId = result.SessionId });
        }

        [HttpPost("create-subscription-session")]
        public async Task<IActionResult> CreateSubscriptionCheckoutSession([FromBody] CreateSubscriptionCheckoutSessionCommand command)
        {
            // Enhanced logging for debugging
            var logger = HttpContext.RequestServices.GetService<ILogger<CheckoutController>>();
            logger?.LogInformation("Creating subscription checkout session for type: {SubscriptionType}, PriceId: {PriceId}",
                command.SubscriptionType, command.PriceId);

            // Validate price ID format
            if (string.IsNullOrEmpty(command.PriceId))
            {
                logger?.LogWarning("Missing price ID in subscription checkout request");
                return BadRequest(new { error = "Price ID is required for subscription checkout" });
            }

            if (!command.PriceId.StartsWith("price_"))
            {
                logger?.LogWarning("Invalid price ID format: {PriceId}", command.PriceId);
                return BadRequest(new
                {
                    error = "Invalid Stripe Price ID format. Price IDs should start with 'price_'",
                    receivedPriceId = command.PriceId,
                    hint = "Check your REACT_APP_STRIPE_PRODUCER_PRICE_ID and REACT_APP_STRIPE_LEGEND_PRICE_ID environment variables"
                });
            }

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                logger?.LogError("Subscription checkout failed: {Error}", result.Error);

                if (result.HasExistingSubscription)
                {
                    return Conflict(new { error = result.Error, hasExistingSubscription = true });
                }
                return BadRequest(new { error = result.Error });
            }

            logger?.LogInformation("Successfully created subscription checkout session: {SessionId}", result.SessionId);

            return Ok(new
            {
                sessionId = result.SessionId,
                publishableKey = result.PublishableKey
            });
        }
    }
}