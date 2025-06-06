using System.ComponentModel.DataAnnotations;
using MediatR;

namespace MixWarz.Application.Features.Cart.Commands.AddToCart
{
    public class AddToCartCommand : IRequest<int>
    {
        [Required]
        public required string UserId { get; set; }
        
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        [Range(1, 100, ErrorMessage = "Quantity must be between 1 and 100")]
        public int Quantity { get; set; } = 1;
    }
} 