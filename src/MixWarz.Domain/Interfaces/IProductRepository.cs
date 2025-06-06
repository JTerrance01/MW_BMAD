using MixWarz.Domain.Entities;

namespace MixWarz.Domain.Interfaces
{
    public interface IProductRepository
    {
        Task<Product> GetByIdAsync(int id);
        Task<IEnumerable<Product>> GetAllAsync(int? categoryId = null, string searchTerm = null, bool? isActive = true, int page = 1, int pageSize = 10);
        Task<int> GetTotalCountAsync(int? categoryId = null, string searchTerm = null, bool? isActive = true);
        Task<IEnumerable<Category>> GetAllCategoriesAsync();
        Task<Product> AddAsync(Product product);
        Task<Product> UpdateAsync(Product product);
        Task<bool> SetActiveStatusAsync(int id, bool isActive);
        Task<IEnumerable<Product>> GetUserPurchasedProductsAsync(string userId);
    }
}