using MediatR;

namespace MixWarz.Application.Features.Checkout.Commands.CreateSubscriptionCheckoutSession
{
    public class CreateSubscriptionCheckoutSessionCommand : IRequest<CreateSubscriptionCheckoutSessionResponse>
    {
        public required string PriceId { get; set; }
        public required string SubscriptionType { get; set; } // "producer" or "legend"
    }
}