using MediatR;
using System.Collections.Generic;
using MixWarz.Application.Features.Cart.DTOs;

namespace MixWarz.Application.Features.Checkout.Commands.CreateCheckoutSession
{
    public class CreateCheckoutSessionCommand : IRequest<CreateCheckoutSessionResponse>
    {
        public List<CartItemDto> CartItems { get; set; } = new();
        public string UserId { get; set; } = string.Empty;
        public string SuccessUrl { get; set; } = string.Empty;
        public string CancelUrl { get; set; } = string.Empty;
    }

    public class CheckoutItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}