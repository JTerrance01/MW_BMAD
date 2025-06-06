using System.ComponentModel.DataAnnotations;
using MediatR;

namespace MixWarz.Application.Features.Cart.Commands.RemoveFromCart
{
    public class RemoveFromCartCommand : IRequest<bool>
    {
        [Required]
        public required string UserId { get; set; }
        
        [Required]
        public int CartItemId { get; set; }
    }
} 