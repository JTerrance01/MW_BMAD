namespace MixWarz.Application.Features.Checkout.Commands.CreateCheckoutSession
{
    public class CreateCheckoutSessionResponse
    {
        public string SessionId { get; set; } = string.Empty;
        public string CheckoutUrl { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}