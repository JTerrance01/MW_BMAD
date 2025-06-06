using MediatR;
using Microsoft.EntityFrameworkCore;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Cart.DTOs;

namespace MixWarz.Application.Features.Cart.Queries.GetCart
{
    public class GetCartQueryHandler : IRequestHandler<GetCartQuery, CartDto>
    {
        private readonly IAppDbContext _context;

        public GetCartQueryHandler(IAppDbContext context)
        {
            _context = context;
        }

        public async Task<CartDto> Handle(GetCartQuery request, CancellationToken cancellationToken)
        {
            // Get the cart with items
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == request.UserId, cancellationToken);
                
            if (cart == null)
            {
                // Return an empty cart
                return new CartDto
                {
                    UserId = request.UserId,
                    TotalItems = 0,
                    TotalPrice = 0,
                    Items = []
                };
            }
            
            // Build cart DTO with item details
            var cartDto = new CartDto
            {
                CartId = cart.CartId,
                UserId = cart.UserId,
                LastModifiedDate = cart.LastModifiedDate,
                TotalItems = cart.CartItems.Sum(ci => ci.Quantity),
                TotalPrice = cart.CartItems.Sum(ci => ci.Quantity * ci.Product.Price),
                Items = cart.CartItems.Select(ci => new CartItemDto
                {
                    CartItemId = ci.CartItemId,
                    ProductId = ci.ProductId,
                    ProductName = ci.Product.Name,
                    ProductImageUrl = ci.Product.ImagePath,
                    ProductPrice = ci.Product.Price,
                    Quantity = ci.Quantity,
                    TotalPrice = ci.Quantity * ci.Product.Price,
                    DateAdded = ci.DateAdded
                }).ToList()
            };
            
            return cartDto;
        }
    }
} 