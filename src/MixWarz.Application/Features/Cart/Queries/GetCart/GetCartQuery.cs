using System.ComponentModel.DataAnnotations;
using MediatR;
using MixWarz.Application.Features.Cart.DTOs;

namespace MixWarz.Application.Features.Cart.Queries.GetCart
{
    public class GetCartQuery : IRequest<CartDto>
    {
        [Required]
        public required string UserId { get; set; }
    }
} 