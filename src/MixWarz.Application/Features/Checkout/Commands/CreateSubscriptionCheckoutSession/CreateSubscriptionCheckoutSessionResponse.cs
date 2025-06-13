namespace MixWarz.Application.Features.Checkout.Commands.CreateSubscriptionCheckoutSession
{
    public class CreateSubscriptionCheckoutSessionResponse
    {
        public string SessionId { get; set; } = string.Empty;
        public string PublishableKey { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string? Error { get; set; }
        public bool HasExistingSubscription { get; set; }
    }
}