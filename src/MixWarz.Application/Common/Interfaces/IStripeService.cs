using MixWarz.Application.Features.Cart.DTOs;

namespace MixWarz.Application.Common.Interfaces
{
    public interface IStripeService
    {
        Task<Stripe.Product> CreateProductAsync(string name, string description, string type = "service");
        Task<Stripe.Price> CreatePriceAsync(string productId, long unitAmount, string currency, bool isRecurring);
        Task<Stripe.Checkout.Session> CreateCheckoutSessionAsync(List<CartItemDto> cartItems, string userId, string customerId, string successUrl, string cancelUrl);
        Task<Stripe.Checkout.Session> CreateSubscriptionCheckoutSessionAsync(string priceId, string userId, string customerId, string successUrl, string cancelUrl);
        Task<Stripe.Customer> CreateOrUpdateCustomerAsync(string userId, string email, string name);
        Task<Stripe.Subscription> GetSubscriptionAsync(string subscriptionId);
        Task<bool> CancelSubscriptionAsync(string subscriptionId);
        Task<bool> HasActiveSubscriptionAsync(string userId);
        Task HandleWebhookEventAsync(string json, string stripeSignature);
    }
}