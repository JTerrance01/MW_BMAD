using MediatR;
using Microsoft.AspNetCore.Mvc;
using Stripe;
using Stripe.Checkout;
using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Infrastructure.Persistence;
using Newtonsoft.Json.Linq;

namespace MixWarz.API.Controllers
{
    [Route("api/webhooks/[controller]")]
    [ApiController]
    public class StripeController : ControllerBase // Renamed to StripeController for `[controller]` routing, or use explicit route
    {
        private readonly IMediator _mediator; // Will be used in later stories to dispatch events
        private readonly IConfiguration _configuration;
        private readonly ILogger<StripeController> _logger;
        private readonly string _webhookSecret;
        private readonly AppDbContext _dbContext;

        public StripeController(
            IMediator mediator,
            IConfiguration configuration,
            ILogger<StripeController> logger,
            AppDbContext dbContext)
        {
            _mediator = mediator;
            _configuration = configuration;
            _logger = logger;
            _webhookSecret = _configuration["Stripe:WebhookSecret"];
            _dbContext = dbContext;
        }

        [HttpPost]
        public async Task<IActionResult> Post()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            try
            {
                var stripeEvent = EventUtility.ConstructEvent(json,
                    Request.Headers["Stripe-Signature"],
                    _webhookSecret);

                _logger.LogInformation($"Stripe event received: {stripeEvent.Type}");

                // In later stories, we will dispatch this event to a MediatR handler
                // For now, just acknowledging receipt is enough for Story 7.4
                // Example: await _mediator.Send(new StripeEventReceivedCommand(stripeEvent));

                if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = stripeEvent.Data.Object as Session;
                    _logger.LogInformation($"Processing checkout.session.completed: SessionID={session?.Id}, PaymentStatus={session?.PaymentStatus}");

                    if (session?.PaymentStatus == "paid")
                    {
                        var mixWarzOrderIdString = session.Metadata.TryGetValue("MixWarzOrderId", out var orderIdVal) ? orderIdVal : null;
                        var mixWarzUserId = session.Metadata.TryGetValue("MixWarzUserId", out var userIdVal) ? userIdVal : null;

                        if (int.TryParse(mixWarzOrderIdString, out int mixWarzOrderId) && !string.IsNullOrEmpty(mixWarzUserId))
                        {
                            _logger.LogInformation($"MixWarz OrderID: {mixWarzOrderId}, UserID: {mixWarzUserId} from metadata.");
                            var order = await _dbContext.Orders
                                .Include(o => o.OrderItems)
                                .FirstOrDefaultAsync(o => o.OrderId == mixWarzOrderId && o.UserId == mixWarzUserId);

                            if (order != null)
                            {
                                order.Status = OrderStatus.Paid;
                                order.StripePaymentIntentId = session.PaymentIntentId;
                                // Consider also storing session.Id in order.StripeCheckoutSessionId if not already done

                                foreach (var item in order.OrderItems)
                                {
                                    var existingAccess = await _dbContext.UserProductAccesses
                                        .FirstOrDefaultAsync(upa => upa.UserId == mixWarzUserId && upa.ProductId == item.ProductId && upa.OrderId == order.OrderId);

                                    if (existingAccess == null)
                                    {
                                        var userProductAccess = new UserProductAccess
                                        {
                                            UserId = mixWarzUserId,
                                            ProductId = item.ProductId,
                                            OrderId = order.OrderId,
                                            AccessGrantedDate = DateTime.UtcNow,
                                            // For one-time purchase, AccessExpiresDate is null.
                                            // If it were a subscription (session.Mode == "subscription"):
                                            // StripeSubscriptionId = session.SubscriptionId,
                                            // StripeCustomerId = session.CustomerId,
                                            // AccessExpiresDate would be set by customer.subscription.updated event initially or here based on current period end.
                                        };
                                        _dbContext.UserProductAccesses.Add(userProductAccess);
                                        _logger.LogInformation($"Granted access to ProductID: {item.ProductId} for UserID: {mixWarzUserId}");
                                    }
                                }
                                await _dbContext.SaveChangesAsync();
                                _logger.LogInformation($"Order {mixWarzOrderId} status updated to Paid and product access granted.");
                                // TODO: Enqueue email notification to user
                            }
                            else
                            {
                                _logger.LogWarning($"Order not found for MixWarzOrderId: {mixWarzOrderId} and UserId: {mixWarzUserId}");
                            }
                        }
                        else
                        {
                            _logger.LogWarning("MixWarzOrderId or MixWarzUserId missing or invalid in checkout session metadata.");
                        }
                    }
                    else
                    {
                        _logger.LogInformation($"Checkout session {session?.Id} not paid. Status: {session?.PaymentStatus}");
                    }
                }
                else if (stripeEvent.Type == "invoice.payment_succeeded") // Using direct string as workaround
                {
                    // Convert the Stripe.Invoice to dynamic to avoid type resolution issues
                    dynamic invoice = JObject.Parse(stripeEvent.Data.RawObject);
                    _logger.LogInformation($"Processing invoice.payment_succeeded: InvoiceID={invoice.id}, SubscriptionID={invoice.subscription}, Paid={invoice.paid}");

                    if (invoice.paid == true && invoice.subscription != null)
                    {
                        var subscriptionService = new SubscriptionService();
                        dynamic stripeSubscription = null;

                        // Get subscription ID as string for the LINQ query
                        string subscriptionId = (string)invoice.subscription;

                        try
                        {
                            var subscription = await subscriptionService.GetAsync(subscriptionId);
                            // Convert to dynamic for property access
                            stripeSubscription = JObject.Parse(subscription.ToJson());
                        }
                        catch (StripeException ex)
                        {
                            _logger.LogError(ex, $"Error fetching subscription {subscriptionId} from Stripe.");
                        }

                        if (stripeSubscription != null)
                        {
                            var userAccess = await _dbContext.UserProductAccesses
                                .FirstOrDefaultAsync(upa => upa.StripeSubscriptionId == subscriptionId);

                            if (userAccess != null)
                            {
                                // Convert Unix timestamp to DateTime
                                DateTime periodEnd = DateTimeOffset.FromUnixTimeSeconds((long)stripeSubscription.current_period_end).DateTime;
                                userAccess.AccessExpiresDate = periodEnd;
                                await _dbContext.SaveChangesAsync();
                                _logger.LogInformation($"Subscription access for StripeSubscriptionId: {subscriptionId} (UserProductAccessId: {userAccess.UserProductAccessId}) extended to {periodEnd}.");
                            }
                            else
                            {
                                _logger.LogWarning($"No UserProductAccess record found for StripeSubscriptionId: {subscriptionId}");
                            }
                        }
                    }
                    else
                    {
                        _logger.LogInformation($"Invoice {invoice.id} not paid or no subscription ID. Paid: {invoice.paid}, SubscriptionID: {invoice.subscription}");
                    }
                }
                // Add more event handlers here: invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted

                return Ok();
            }
            catch (StripeException e)
            {
                _logger.LogError(e, "Stripe webhook signature verification failed.");
                return BadRequest();
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "An error occurred processing the Stripe webhook.");
                return StatusCode(500, "Internal server error"); // Or BadRequest depending on error
            }
        }
    }
}