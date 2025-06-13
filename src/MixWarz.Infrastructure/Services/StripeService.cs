using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Cart.DTOs;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;

namespace MixWarz.Infrastructure.Services
{
    public class StripeService : IStripeService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<StripeService> _logger;
        private readonly IAppDbContext _dbContext;

        public StripeService(
            IConfiguration configuration,
            ILogger<StripeService> logger,
            IAppDbContext dbContext)
        {
            _configuration = configuration;
            _logger = logger;
            _dbContext = dbContext;
            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
        }

        public async Task<Stripe.Product> CreateProductAsync(string name, string description, string type = "service")
        {
            var options = new ProductCreateOptions
            {
                Name = name,
                Description = description,
                Type = type,
            };

            var service = new ProductService();
            return await service.CreateAsync(options);
        }

        public async Task<Price> CreatePriceAsync(string productId, long unitAmount, string currency, bool isRecurring)
        {
            var options = new PriceCreateOptions
            {
                Product = productId,
                UnitAmount = unitAmount,
                Currency = currency,
            };

            if (isRecurring)
            {
                options.Recurring = new PriceRecurringOptions
                {
                    Interval = "month",
                };
            }

            var service = new PriceService();
            return await service.CreateAsync(options);
        }

        public async Task<Session> CreateCheckoutSessionAsync(
            List<CartItemDto> cartItems,
            string userId,
            string customerId,
            string successUrl,
            string cancelUrl)
        {
            var lineItems = new List<SessionLineItemOptions>();

            foreach (var item in cartItems)
            {
                lineItems.Add(new SessionLineItemOptions
                {
                    Quantity = item.Quantity,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "usd",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = item.ProductName,
                            Images = new List<string> { item.ProductImageUrl },
                        },
                        UnitAmount = (long)(item.ProductPrice * 100), // Stripe expects cents
                    },
                });
            }

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = lineItems,
                Mode = "payment", // For one-time payments
                Customer = customerId,
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Locale = "en", // Fix: Explicitly set locale to prevent module loading errors
                Metadata = new Dictionary<string, string>
                {
                    { "userId", userId },
                },
            };

            var service = new SessionService();
            return await service.CreateAsync(options);
        }

        public async Task<Session> CreateSubscriptionCheckoutSessionAsync(
            string priceId,
            string userId,
            string customerId,
            string successUrl,
            string cancelUrl)
        {
            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        Price = priceId,
                        Quantity = 1,
                    },
                },
                Mode = "subscription", // For recurring subscriptions
                Customer = customerId,
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Locale = "en", // Fix: Explicitly set locale to prevent module loading errors
                Metadata = new Dictionary<string, string>
                {
                    { "userId", userId },
                    { "subscriptionType", "membership" },
                },
            };

            var service = new SessionService();
            return await service.CreateAsync(options);
        }

        public async Task<Customer> CreateOrUpdateCustomerAsync(string userId, string email, string name)
        {
            var service = new CustomerService();

            // Try to find existing customer
            var customers = await service.ListAsync(new CustomerListOptions
            {
                Email = email,
                Limit = 1,
            });

            if (customers.Data.Count > 0)
            {
                var customer = customers.Data[0];

                // Update customer if needed
                if (customer.Name != name)
                {
                    var updateOptions = new CustomerUpdateOptions
                    {
                        Name = name,
                    };
                    customer = await service.UpdateAsync(customer.Id, updateOptions);
                }

                return customer;
            }

            // Create new customer
            var createOptions = new CustomerCreateOptions
            {
                Email = email,
                Name = name,
                Metadata = new Dictionary<string, string>
                {
                    { "userId", userId },
                },
            };

            return await service.CreateAsync(createOptions);
        }

        public async Task<Stripe.Subscription> GetSubscriptionAsync(string subscriptionId)
        {
            var service = new SubscriptionService();
            return await service.GetAsync(subscriptionId);
        }

        public async Task<bool> CancelSubscriptionAsync(string subscriptionId)
        {
            try
            {
                var service = new SubscriptionService();
                await service.CancelAsync(subscriptionId, new SubscriptionCancelOptions());
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error canceling subscription {SubscriptionId}", subscriptionId);
                return false;
            }
        }

        public async Task<bool> HasActiveSubscriptionAsync(string userId)
        {
            try
            {
                var subscription = await _dbContext.Subscriptions
                    .FirstOrDefaultAsync(s => s.UserId == userId &&
                                            (s.Status == SubscriptionStatus.Active ||
                                             s.Status == SubscriptionStatus.Trialing));

                return subscription != null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking subscription for user {UserId}", userId);
                return false;
            }
        }

        public async Task HandleWebhookEventAsync(string json, string stripeSignature)
        {
            try
            {
                var webhookSecret = _configuration["Stripe:WebhookSecret"];
                var stripeEvent = EventUtility.ConstructEvent(json, stripeSignature, webhookSecret);

                _logger.LogInformation("Processing Stripe webhook event: {EventType}", stripeEvent.Type);

                switch (stripeEvent.Type)
                {
                    case "checkout.session.completed":
                        await HandleCheckoutSessionCompleted(stripeEvent);
                        break;
                    case "invoice.payment_succeeded":
                        await HandleInvoicePaymentSucceeded(stripeEvent);
                        break;
                    case "invoice.payment_failed":
                        await HandleInvoicePaymentFailed(stripeEvent);
                        break;
                    case "customer.subscription.created":
                        await HandleSubscriptionCreated(stripeEvent);
                        break;
                    case "customer.subscription.updated":
                        await HandleSubscriptionUpdated(stripeEvent);
                        break;
                    case "customer.subscription.deleted":
                        await HandleSubscriptionDeleted(stripeEvent);
                        break;
                    default:
                        _logger.LogInformation("Unhandled event type: {EventType}", stripeEvent.Type);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Stripe webhook");
                throw;
            }
        }

        private async Task HandleCheckoutSessionCompleted(Event stripeEvent)
        {
            var session = stripeEvent.Data.Object as Session;
            if (session == null) return;

            var userId = session.Metadata?.GetValueOrDefault("userId");
            if (string.IsNullOrEmpty(userId)) return;

            // Check if this is a subscription checkout
            if (session.Mode == "subscription")
            {
                // Handle subscription creation in customer.subscription.created event
                _logger.LogInformation("Subscription checkout session completed for user {UserId}", userId);
                return;
            }

            // Handle one-time payment orders
            var order = await _dbContext.Orders
                .FirstOrDefaultAsync(o => o.StripeCheckoutSessionId == session.Id);

            if (order != null)
            {
                // Update order status to paid
                order.Status = OrderStatus.Paid;
                order.PaymentDate = DateTime.UtcNow;

                _dbContext.Orders.Update(order);
                await _dbContext.SaveChangesAsync(CancellationToken.None);

                // Grant access to digital products or mark physical products for shipment
                await GrantProductAccess(order);

                _logger.LogInformation("Order {OrderId} marked as paid", order.OrderId);
            }
        }

        private async Task HandleInvoicePaymentSucceeded(Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Invoice;
            if (invoice == null) return;

            // Handle subscription payment success
            _logger.LogInformation("Subscription payment succeeded for invoice {InvoiceId}", invoice.Id);
        }

        private async Task HandleInvoicePaymentFailed(Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Invoice;
            if (invoice == null) return;

            // Handle subscription payment failure
            _logger.LogWarning("Subscription payment failed for invoice {InvoiceId}", invoice.Id);
        }

        private async Task HandleSubscriptionCreated(Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Stripe.Subscription;
            if (subscription == null) return;

            var customerId = subscription.CustomerId;
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.StripeCustomerId == customerId);

            if (user == null)
            {
                _logger.LogWarning("User not found for Stripe customer {CustomerId}", customerId);
                return;
            }

            // Get billing period from first subscription item
            var firstItem = subscription.Items?.Data?.FirstOrDefault();

            // Create subscription record using subscription billing period
            var dbSubscription = new Domain.Entities.Subscription
            {
                UserId = user.Id,
                StripeSubscriptionId = subscription.Id,
                Status = subscription.Status switch
                {
                    "active" => SubscriptionStatus.Active,
                    "trialing" => SubscriptionStatus.Trialing,
                    "incomplete" => SubscriptionStatus.Incomplete,
                    "incomplete_expired" => SubscriptionStatus.IncompleteExpired,
                    "past_due" => SubscriptionStatus.PastDue,
                    "canceled" => SubscriptionStatus.Canceled,
                    "unpaid" => SubscriptionStatus.Unpaid,
                    _ => SubscriptionStatus.Incomplete
                },
                CurrentPeriodStart = DateTime.UtcNow, // Will be updated via webhook  
                CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1), // Will be updated via webhook
                TrialEnd = subscription.TrialEnd,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Subscriptions.Add(dbSubscription);
            await _dbContext.SaveChangesAsync(CancellationToken.None);

            _logger.LogInformation("Subscription {SubscriptionId} created for user {UserId}", subscription.Id, user.Id);
        }

        private async Task HandleSubscriptionUpdated(Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Stripe.Subscription;
            if (subscription == null) return;

            var dbSubscription = await _dbContext.Subscriptions
                .FirstOrDefaultAsync(s => s.StripeSubscriptionId == subscription.Id);

            if (dbSubscription == null)
            {
                _logger.LogWarning("Subscription {SubscriptionId} not found in database", subscription.Id);
                return;
            }

            // Update subscription status and billing period
            dbSubscription.Status = subscription.Status switch
            {
                "active" => SubscriptionStatus.Active,
                "trialing" => SubscriptionStatus.Trialing,
                "incomplete" => SubscriptionStatus.Incomplete,
                "incomplete_expired" => SubscriptionStatus.IncompleteExpired,
                "past_due" => SubscriptionStatus.PastDue,
                "canceled" => SubscriptionStatus.Canceled,
                "unpaid" => SubscriptionStatus.Unpaid,
                _ => SubscriptionStatus.Incomplete
            };

            // Note: CurrentPeriod dates will be tracked via invoice events
            // Stripe moved CurrentPeriodStart/End from subscription to subscription items in recent API versions
            dbSubscription.TrialEnd = subscription.TrialEnd;
            dbSubscription.UpdatedAt = DateTime.UtcNow;

            if (subscription.Status == "canceled")
            {
                dbSubscription.CanceledAt = DateTime.UtcNow;
            }

            _dbContext.Subscriptions.Update(dbSubscription);
            await _dbContext.SaveChangesAsync(CancellationToken.None);

            _logger.LogInformation("Subscription {SubscriptionId} updated to status {Status}", subscription.Id, subscription.Status);
        }

        private async Task HandleSubscriptionDeleted(Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Stripe.Subscription;
            if (subscription == null) return;

            // Update subscription status in database
            var dbSubscription = await _dbContext.Subscriptions
                .FirstOrDefaultAsync(s => s.StripeSubscriptionId == subscription.Id);

            if (dbSubscription != null)
            {
                dbSubscription.Status = SubscriptionStatus.Canceled;
                dbSubscription.UpdatedAt = DateTime.UtcNow;

                _dbContext.Subscriptions.Update(dbSubscription);
                await _dbContext.SaveChangesAsync(CancellationToken.None);

                _logger.LogInformation("Subscription {SubscriptionId} marked as canceled", subscription.Id);
            }
        }

        private async Task GrantProductAccess(Order order)
        {
            // Get order items
            var orderItems = await _dbContext.OrderItems
                .Include(oi => oi.Product)
                .Where(oi => oi.OrderId == order.OrderId)
                .ToListAsync();

            foreach (var item in orderItems)
            {
                if (item.Product.IsShippable)
                {
                    // Physical product - mark for shipping
                    order.IsShipped = false; // Will be updated when actually shipped
                }
                else
                {
                    // Digital product - grant immediate access
                    var access = new UserProductAccess
                    {
                        UserId = order.UserId,
                        ProductId = item.ProductId,
                        OrderId = order.OrderId,
                        AccessGrantedDate = DateTime.UtcNow
                    };

                    _dbContext.UserProductAccesses.Add(access);
                }
            }

            await _dbContext.SaveChangesAsync(CancellationToken.None);
        }
    }
}
