using MixWarz.Domain.Entities;

namespace MixWarz.Domain.Interfaces
{
    public interface ICartRepository
    {
        Task<Cart> GetUserCartAsync(string userId, bool includeItems = true);
        Task<CartItem> AddItemToCartAsync(string userId, int productId, int quantity = 1);
        Task<CartItem> UpdateCartItemQuantityAsync(string userId, int productId, int quantity);
        Task<bool> RemoveCartItemAsync(string userId, int productId);
        Task<bool> ClearCartAsync(string userId);
        Task<bool> MergeCartsAsync(string userId, IEnumerable<CartItem> clientCartItems);
    }
} 