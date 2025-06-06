using MediatR;
using System.Collections.Generic;

namespace MixWarz.Application.Features.Checkout.Commands.CreateCheckoutSession
{
    public class CreateCheckoutSessionCommand : IRequest<CreateCheckoutSessionResponse>
    {
        // Option 1: Specify items directly
        public List<CheckoutItemDto>? Items { get; set; }

        // Option 2: Rely on current user's cart (handler would fetch it)
        // No specific property needed here if using this option, UserId will be from ClaimsPrincipal

        // URLs for Stripe redirection
        public string SuccessUrl { get; set; } = default!;
        public string CancelUrl { get; set; } = default!;
    }

    public class CheckoutItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}