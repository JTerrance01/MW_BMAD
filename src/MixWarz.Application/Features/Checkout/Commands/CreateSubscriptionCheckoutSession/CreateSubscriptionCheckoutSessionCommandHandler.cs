using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MixWarz.Application.Common.Interfaces;
using System.Security.Claims;

namespace MixWarz.Application.Features.Checkout.Commands.CreateSubscriptionCheckoutSession
{
    public class CreateSubscriptionCheckoutSessionCommandHandler
        : IRequestHandler<CreateSubscriptionCheckoutSessionCommand, CreateSubscriptionCheckoutSessionResponse>
    {
        private readonly IStripeService _stripeService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IConfiguration _configuration;
        private readonly ILogger<CreateSubscriptionCheckoutSessionCommandHandler> _logger;

        public CreateSubscriptionCheckoutSessionCommandHandler(
            IStripeService stripeService,
            IHttpContextAccessor httpContextAccessor,
            IConfiguration configuration,
            ILogger<CreateSubscriptionCheckoutSessionCommandHandler> logger)
        {
            _stripeService = stripeService;
            _httpContextAccessor = httpContextAccessor;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<CreateSubscriptionCheckoutSessionResponse> Handle(
            CreateSubscriptionCheckoutSessionCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var httpContext = _httpContextAccessor.HttpContext;
                var userId = httpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(userId))
                {
                    return new CreateSubscriptionCheckoutSessionResponse
                    {
                        Success = false,
                        Error = "User authentication required"
                    };
                }

                // Check if user already has an active subscription
                var hasActiveSubscription = await _stripeService.HasActiveSubscriptionAsync(userId);
                if (hasActiveSubscription)
                {
                    return new CreateSubscriptionCheckoutSessionResponse
                    {
                        Success = false,
                        Error = "You already have an active subscription. Each account can only have one subscription at a time.",
                        HasExistingSubscription = true
                    };
                }

                var userEmail = httpContext?.User?.FindFirstValue(ClaimTypes.Email) ?? "";
                var userName = httpContext?.User?.FindFirstValue(ClaimTypes.Name) ?? "";

                // Create or get Stripe customer
                var customer = await _stripeService.CreateOrUpdateCustomerAsync(userId, userEmail, userName);

                // Generate URLs
                var baseUrl = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}";
                var successUrl = $"{baseUrl}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}";
                var cancelUrl = $"{baseUrl}/pricing";

                // Create subscription checkout session
                var session = await _stripeService.CreateSubscriptionCheckoutSessionAsync(
                    request.PriceId,
                    userId,
                    customer.Id,
                    successUrl,
                    cancelUrl);

                _logger.LogInformation("Created subscription checkout session {SessionId} for user {UserId} with subscription type {SubscriptionType}",
                    session.Id, userId, request.SubscriptionType);

                return new CreateSubscriptionCheckoutSessionResponse
                {
                    SessionId = session.Id,
                    PublishableKey = _configuration["Stripe:PublishableKey"] ?? "",
                    Success = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating subscription checkout session for user");
                return new CreateSubscriptionCheckoutSessionResponse
                {
                    Success = false,
                    Error = "An error occurred while creating the checkout session. Please try again."
                };
            }
        }
    }
}