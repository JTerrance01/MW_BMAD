using System.ComponentModel.DataAnnotations;
using MediatR;

namespace MixWarz.Application.Features.Cart.Commands.ClearCart
{
    public class ClearCartCommand : IRequest<bool>
    {
        [Required]
        public required string UserId { get; set; }
    }
} 