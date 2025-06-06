using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MixWarz.Application.Common.Interfaces;

namespace MixWarz.Application.Features.Cart.Commands.ClearCart
{
    public class ClearCartCommandHandler : IRequestHandler<ClearCartCommand, bool>
    {
        private readonly IAppDbContext _context;

        public ClearCartCommandHandler(IAppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(ClearCartCommand request, CancellationToken cancellationToken)
        {
            // Get the cart with items
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == request.UserId, cancellationToken);
                
            if (cart == null)
            {
                // No cart exists, so it's technically already "cleared"
                return true;
            }
            
            if (cart.CartItems.Any())
            {
                // Remove all cart items
                _context.CartItems.RemoveRange(cart.CartItems);
                
                // Update cart modification date
                cart.LastModifiedDate = DateTime.UtcNow;
                
                await _context.SaveChangesAsync(cancellationToken);
            }
            
            return true;
        }
    }
} 