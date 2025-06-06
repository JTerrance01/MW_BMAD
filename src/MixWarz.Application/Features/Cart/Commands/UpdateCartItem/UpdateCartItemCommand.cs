using System.ComponentModel.DataAnnotations;
using MediatR;

namespace MixWarz.Application.Features.Cart.Commands.UpdateCartItem
{
    public class UpdateCartItemCommand : IRequest<bool>
    {
        [Required]
        public required string UserId { get; set; }
        
        [Required]
        public int CartItemId { get; set; }
        
        [Required]
        [Range(1, 100, ErrorMessage = "Quantity must be between 1 and 100")]
        public int Quantity { get; set; }
    }
} 