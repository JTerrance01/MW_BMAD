using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MixWarz.Application.Common.Interfaces;
using System.IO;
using System.Threading.Tasks;

namespace MixWarz.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StripeController : ControllerBase
    {
        private readonly IStripeService _stripeService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<StripeController> _logger;

        public StripeController(
            IStripeService stripeService,
            IConfiguration configuration,
            ILogger<StripeController> logger)
        {
            _stripeService = stripeService;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Handles incoming Stripe webhooks for payment events
        /// </summary>
        /// <returns>200 OK if webhook processed successfully</returns>
        [HttpPost("webhook")]
        public async Task<IActionResult> HandleWebhook()
        {
            try
            {
                _logger.LogInformation("Received Stripe webhook");

                // Read the request body
                string json;
                using (var reader = new StreamReader(Request.Body))
                {
                    json = await reader.ReadToEndAsync();
                }

                // Get the Stripe signature from headers
                var stripeSignature = Request.Headers["Stripe-Signature"].FirstOrDefault();

                if (string.IsNullOrEmpty(stripeSignature))
                {
                    _logger.LogWarning("Missing Stripe signature in webhook request");
                    return BadRequest("Missing Stripe signature");
                }

                // Process the webhook through our service
                await _stripeService.HandleWebhookEventAsync(json, stripeSignature);

                _logger.LogInformation("Successfully processed Stripe webhook");
                return Ok(new { message = "Webhook processed successfully" });
            }
            catch (Stripe.StripeException stripeEx)
            {
                _logger.LogError(stripeEx, "Stripe webhook validation failed: {Message}", stripeEx.Message);
                return BadRequest(new { error = "Invalid webhook signature", message = stripeEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Stripe webhook: {Message}", ex.Message);
                return StatusCode(500, new { error = "Internal server error processing webhook" });
            }
        }

        /// <summary>
        /// Health check endpoint for Stripe integration
        /// </summary>
        /// <returns>200 OK with Stripe integration status</returns>
        [HttpGet("health")]
        public IActionResult Health()
        {
            try
            {
                var stripeSecretKey = _configuration["Stripe:SecretKey"];
                var hasValidConfig = !string.IsNullOrEmpty(stripeSecretKey) && stripeSecretKey.StartsWith("sk_");

                return Ok(new
                {
                    status = "healthy",
                    stripeConfigured = hasValidConfig,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking Stripe health: {Message}", ex.Message);
                return StatusCode(500, new { status = "unhealthy", error = ex.Message });
            }
        }
    }
}