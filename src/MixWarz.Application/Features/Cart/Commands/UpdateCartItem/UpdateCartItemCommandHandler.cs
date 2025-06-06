using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MixWarz.Application.Common.Interfaces;

namespace MixWarz.Application.Features.Cart.Commands.UpdateCartItem
{
    public class UpdateCartItemCommandHandler : IRequestHandler<UpdateCartItemCommand, bool>
    {
        private readonly IAppDbContext _context;

        public UpdateCartItemCommandHandler(IAppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdateCartItemCommand request, CancellationToken cancellationToken)
        {
            // Get the cart item
            var cartItem = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.CartItemId == request.CartItemId, cancellationToken);
                
            if (cartItem == null)
            {
                throw new ApplicationException($"Cart item with ID {request.CartItemId} not found.");
            }
            
            // Get the cart to verify ownership
            var cart = await _context.Carts
                .FirstOrDefaultAsync(c => c.CartId == cartItem.CartId, cancellationToken);
                
            if (cart == null || cart.UserId != request.UserId)
            {
                throw new UnauthorizedAccessException("You do not have permission to modify this cart.");
            }
            
            // Update the cart item quantity
            cartItem.Quantity = request.Quantity;
            
            // Update cart modification date
            cart.LastModifiedDate = DateTime.UtcNow;
            
            await _context.SaveChangesAsync(cancellationToken);
            
            return true;
        }
    }
} 