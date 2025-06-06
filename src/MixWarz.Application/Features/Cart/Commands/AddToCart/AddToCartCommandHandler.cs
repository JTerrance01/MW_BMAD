using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Features.Cart.Commands.AddToCart
{
    public class AddToCartCommandHandler : IRequestHandler<AddToCartCommand, int>
    {
        private readonly IAppDbContext _context;

        public AddToCartCommandHandler(IAppDbContext context)
        {
            _context = context;
        }

        public async Task<int> Handle(AddToCartCommand request, CancellationToken cancellationToken)
        {
            // Validate product exists
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.ProductId == request.ProductId && p.IsActive, cancellationToken);
                
            if (product == null)
            {
                throw new ApplicationException($"Product with ID {request.ProductId} not found or is not active.");
            }
            
            // Get or create cart for the user
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == request.UserId, cancellationToken);
                
            if (cart == null)
            {
                cart = new Domain.Entities.Cart
                {
                    UserId = request.UserId,
                    LastModifiedDate = DateTime.UtcNow
                };
                
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync(cancellationToken);
            }
            
            // Check if the product is already in the cart
            var existingCartItem = cart.CartItems
                .FirstOrDefault(ci => ci.ProductId == request.ProductId);
                
            if (existingCartItem != null)
            {
                // Update quantity if product already exists in cart
                existingCartItem.Quantity += request.Quantity;
            }
            else
            {
                // Add new cart item
                var cartItem = new CartItem
                {
                    CartId = cart.CartId,
                    ProductId = request.ProductId,
                    Quantity = request.Quantity,
                    DateAdded = DateTime.UtcNow
                };
                
                _context.CartItems.Add(cartItem);
            }
            
            // Update cart modification date
            cart.LastModifiedDate = DateTime.UtcNow;
            
            await _context.SaveChangesAsync(cancellationToken);
            
            return cart.CartId;
        }
    }
} 