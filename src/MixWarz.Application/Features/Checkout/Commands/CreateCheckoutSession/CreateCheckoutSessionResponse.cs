namespace MixWarz.Application.Features.Checkout.Commands.CreateCheckoutSession
{
    public class CreateCheckoutSessionResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public string? StripeSessionId { get; set; } // To be returned to the client
        public string? StripePublishableKey { get; set; } // Might be useful for client-side Stripe.js initialization
    }
}