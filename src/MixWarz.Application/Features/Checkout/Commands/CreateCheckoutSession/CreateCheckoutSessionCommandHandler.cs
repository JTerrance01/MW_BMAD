using MediatR;
using Microsoft.Extensions.Configuration;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;
using MixWarz.Domain.Enums;
using Stripe;
using Stripe.Checkout;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http; // For IHttpContextAccessor
using System.Security.Claims; // For ClaimsPrincipal
using Microsoft.Extensions.Logging;

namespace MixWarz.Application.Features.Checkout.Commands.CreateCheckoutSession
{
    public class CreateCheckoutSessionCommandHandler : IRequestHandler<CreateCheckoutSessionCommand, CreateCheckoutSessionResponse>
    {
        private readonly IAppDbContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IStripeService _stripeService;
        private readonly ILogger<CreateCheckoutSessionCommandHandler> _logger;

        public CreateCheckoutSessionCommandHandler(
            IAppDbContext dbContext,
            IConfiguration configuration,
            IHttpContextAccessor httpContextAccessor,
            IStripeService stripeService,
            ILogger<CreateCheckoutSessionCommandHandler> logger)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
            _stripeService = stripeService;
            _logger = logger;
            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"]; // Ensure API key is set
        }

        public async Task<CreateCheckoutSessionResponse> Handle(CreateCheckoutSessionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Creating checkout session for user {UserId}", request.UserId);

                var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return new CreateCheckoutSessionResponse { Success = false, Message = "User not authenticated." };
                }

                // Get user from database
                var user = await _dbContext.Users.FindAsync(request.UserId);
                if (user == null)
                {
                    return new CreateCheckoutSessionResponse
                    {
                        Success = false,
                        Message = "User not found"
                    };
                }

                // Create or update Stripe customer
                var customer = await _stripeService.CreateOrUpdateCustomerAsync(
                    user.Id, user.Email!, $"{user.FirstName} {user.LastName}");

                // Update user with Stripe customer ID if not already set
                if (string.IsNullOrEmpty(user.StripeCustomerId))
                {
                    user.StripeCustomerId = customer.Id;
                    _dbContext.Users.Update(user);
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }

                // Create order in database
                var order = new Order
                {
                    UserId = request.UserId,
                    OrderDate = DateTime.UtcNow,
                    TotalAmount = request.CartItems.Sum(item => item.TotalPrice),
                    OrderTotal = request.CartItems.Sum(item => item.TotalPrice),
                    Status = OrderStatus.PendingPayment
                };

                _dbContext.Orders.Add(order);
                await _dbContext.SaveChangesAsync(cancellationToken);

                // Create Stripe checkout session
                var session = await _stripeService.CreateCheckoutSessionAsync(
                    request.CartItems, request.UserId, customer.Id, request.SuccessUrl, request.CancelUrl);

                // Update order with Stripe session ID
                order.StripeCheckoutSessionId = session.Id;
                _dbContext.Orders.Update(order);
                await _dbContext.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Checkout session created successfully: {SessionId}", session.Id);

                return new CreateCheckoutSessionResponse
                {
                    Success = true,
                    SessionId = session.Id,
                    CheckoutUrl = session.Url,
                    Message = "Checkout session created successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating checkout session for user {UserId}", request.UserId);

                return new CreateCheckoutSessionResponse
                {
                    Success = false,
                    Message = "An error occurred while creating the checkout session"
                };
            }
        }
    }
}