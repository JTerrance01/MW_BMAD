using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Infrastructure.Persistence.Repositories
{
    public class CartRepository : ICartRepository
    {
        private readonly AppDbContext _context;

        public CartRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Cart> GetUserCartAsync(string userId, bool includeItems = true)
        {
            var cart = await _context.Carts
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                // Create a new cart for the user if none exists
                cart = new Cart
                {
                    UserId = userId,
                    LastModifiedDate = DateTime.UtcNow
                };
                await _context.Carts.AddAsync(cart);
                await _context.SaveChangesAsync();
            }

            if (includeItems)
            {
                await _context.Entry(cart)
                    .Collection(c => c.CartItems)
                    .Query()
                    .Include(ci => ci.Product)
                    .ThenInclude(p => p.Category)
                    .LoadAsync();
            }

            return cart;
        }

        public async Task<CartItem> AddItemToCartAsync(string userId, int productId, int quantity = 1)
        {
            var cart = await GetUserCartAsync(userId, false);
            
            var existingItem = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cart.CartId && ci.ProductId == productId);

            if (existingItem != null)
            {
                // If item already exists, update quantity
                existingItem.Quantity += quantity;
                _context.CartItems.Update(existingItem);
            }
            else
            {
                // If item doesn't exist, create a new cart item
                existingItem = new CartItem
                {
                    CartId = cart.CartId,
                    ProductId = productId,
                    Quantity = quantity,
                    DateAdded = DateTime.UtcNow
                };
                await _context.CartItems.AddAsync(existingItem);
            }

            // Update cart's last modified date
            cart.LastModifiedDate = DateTime.UtcNow;
            _context.Carts.Update(cart);
            
            await _context.SaveChangesAsync();
            
            // Load the product for the cart item
            await _context.Entry(existingItem)
                .Reference(ci => ci.Product)
                .LoadAsync();
                
            return existingItem;
        }

        public async Task<CartItem> UpdateCartItemQuantityAsync(string userId, int productId, int quantity)
        {
            var cart = await GetUserCartAsync(userId, false);
            
            var cartItem = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cart.CartId && ci.ProductId == productId);

            if (cartItem == null)
            {
                return null;
            }

            // Update quantity
            cartItem.Quantity = quantity;
            _context.CartItems.Update(cartItem);

            // Update cart's last modified date
            cart.LastModifiedDate = DateTime.UtcNow;
            _context.Carts.Update(cart);
            
            await _context.SaveChangesAsync();
            
            // Load the product for the cart item
            await _context.Entry(cartItem)
                .Reference(ci => ci.Product)
                .LoadAsync();
                
            return cartItem;
        }

        public async Task<bool> RemoveCartItemAsync(string userId, int productId)
        {
            var cart = await GetUserCartAsync(userId, false);
            
            var cartItem = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cart.CartId && ci.ProductId == productId);

            if (cartItem == null)
            {
                return false;
            }

            _context.CartItems.Remove(cartItem);

            // Update cart's last modified date
            cart.LastModifiedDate = DateTime.UtcNow;
            _context.Carts.Update(cart);
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ClearCartAsync(string userId)
        {
            var cart = await GetUserCartAsync(userId, true);
            
            if (cart.CartItems.Any())
            {
                _context.CartItems.RemoveRange(cart.CartItems);
                
                // Update cart's last modified date
                cart.LastModifiedDate = DateTime.UtcNow;
                _context.Carts.Update(cart);
                
                await _context.SaveChangesAsync();
            }
            
            return true;
        }

        public async Task<bool> MergeCartsAsync(string userId, IEnumerable<CartItem> clientCartItems)
        {
            var cart = await GetUserCartAsync(userId, true);
            
            foreach (var clientItem in clientCartItems)
            {
                var existingItem = cart.CartItems
                    .FirstOrDefault(ci => ci.ProductId == clientItem.ProductId);
                
                if (existingItem != null)
                {
                    // If item already exists in server cart, update quantity
                    existingItem.Quantity += clientItem.Quantity;
                    _context.CartItems.Update(existingItem);
                }
                else
                {
                    // If item doesn't exist in server cart, create a new item
                    var newItem = new CartItem
                    {
                        CartId = cart.CartId,
                        ProductId = clientItem.ProductId,
                        Quantity = clientItem.Quantity,
                        DateAdded = DateTime.UtcNow
                    };
                    await _context.CartItems.AddAsync(newItem);
                }
            }
            
            // Update cart's last modified date
            cart.LastModifiedDate = DateTime.UtcNow;
            _context.Carts.Update(cart);
            
            await _context.SaveChangesAsync();
            return true;
        }
    }
} 