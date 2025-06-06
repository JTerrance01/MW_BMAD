using MediatR;
using Microsoft.Extensions.Configuration;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using Stripe;
using Stripe.Checkout;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http; // For IHttpContextAccessor
using System.Security.Claims; // For ClaimsPrincipal

namespace MixWarz.Application.Features.Checkout.Commands.CreateCheckoutSession
{
    public class CreateCheckoutSessionCommandHandler : IRequestHandler<CreateCheckoutSessionCommand, CreateCheckoutSessionResponse>
    {
        private readonly IAppDbContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        // No direct IStripeService needed here if we use Stripe.net SDK directly with API key from config

        public CreateCheckoutSessionCommandHandler(
            IAppDbContext dbContext,
            IConfiguration configuration,
            IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"]; // Ensure API key is set
        }

        public async Task<CreateCheckoutSessionResponse> Handle(CreateCheckoutSessionCommand request, CancellationToken cancellationToken)
        {
            var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return new CreateCheckoutSessionResponse { Success = false, Message = "User not authenticated." };
            }

            // TODO: Logic to get items for checkout.
            // If request.Items is null or empty, try to get from user's cart.
            // For now, assume request.Items is populated or this is a simplified scenario.
            if (request.Items == null || !request.Items.Any())
            {
                // Placeholder: In a real scenario, fetch from ICartRepository for the current user.
                // For now, returning an error if items are not explicitly passed.
                return new CreateCheckoutSessionResponse { Success = false, Message = "No items provided for checkout." };
            }

            // 1. Create Order in MixWarz DB with PendingPayment status
            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.UtcNow,
                Status = OrderStatus.PendingPayment,
                OrderTotal = 0 // Will be calculated based on items
            };

            var orderItems = new List<OrderItem>();
            decimal totalAmount = 0;

            foreach (var itemDto in request.Items)
            {
                var product = await _dbContext.Products.FindAsync(new object[] { itemDto.ProductId }, cancellationToken);
                if (product == null || product.StripePriceId == null)
                {
                    return new CreateCheckoutSessionResponse { Success = false, Message = $"Product with ID {itemDto.ProductId} not found or not configured for Stripe." };
                }

                orderItems.Add(new OrderItem
                {
                    Order = order,
                    ProductId = product.ProductId,
                    Quantity = itemDto.Quantity,
                    Price = product.Price // Price at the time of order creation
                });
                totalAmount += product.Price * itemDto.Quantity;
            }

            order.OrderItems = orderItems;
            order.OrderTotal = totalAmount;

            _dbContext.Orders.Add(order);
            await _dbContext.SaveChangesAsync(cancellationToken); // Save order to get OrderId

            // 2. Create Stripe Checkout Session
            var lineItems = new List<SessionLineItemOptions>();
            foreach (var orderItem in order.OrderItems)
            {
                var product = await _dbContext.Products.FindAsync(new object[] { orderItem.ProductId }, cancellationToken); // Re-fetch for StripePriceId consistency
                lineItems.Add(new SessionLineItemOptions
                {
                    Price = product!.StripePriceId, // product is checked for null and StripePriceId above
                    Quantity = orderItem.Quantity,
                });
            }

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = lineItems,
                Mode = "payment", // For one-time purchases. Change to "subscription" if needed.
                SuccessUrl = request.SuccessUrl + "?session_id={CHECKOUT_SESSION_ID}", // Pass session_id for client-side confirmation
                CancelUrl = request.CancelUrl,
                ClientReferenceId = userId, // Or order.OrderId.ToString(), ensure consistency
                Metadata = new Dictionary<string, string>
                {
                    { "MixWarzOrderId", order.OrderId.ToString() },
                    { "MixWarzUserId", userId }
                }
            };

            var service = new SessionService();
            Session session;
            try
            {
                session = await service.CreateAsync(options, cancellationToken: cancellationToken);
            }
            catch (StripeException e)
            {
                // Log e.StripeError.Message
                return new CreateCheckoutSessionResponse { Success = false, Message = $"Stripe error: {e.StripeError?.Message}" };
            }

            // Store Stripe Checkout Session ID on the order (optional, but can be useful)
            order.StripeCheckoutSessionId = session.Id;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return new CreateCheckoutSessionResponse
            {
                Success = true,
                StripeSessionId = session.Id,
                StripePublishableKey = _configuration["Stripe:PublishableKey"]
            };
        }
    }
}