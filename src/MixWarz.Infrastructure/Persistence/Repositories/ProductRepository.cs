using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;
using MixWarz.Infrastructure.Persistence;

namespace MixWarz.Infrastructure.Persistence.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly AppDbContext _context;

        public ProductRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Product> GetByIdAsync(int id)
        {
            return await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.ProductId == id);
        }

        public async Task<IEnumerable<Product>> GetAllAsync(int? categoryId = null, string searchTerm = null, bool? isActive = true, int page = 1, int pageSize = 10)
        {
            // Start with the base query without any filtering
            IQueryable<Product> query = _context.Products.Include(p => p.Category);

            // Apply isActive filter only if provided
            if (isActive.HasValue)
            {
                query = query.Where(p => p.IsActive == isActive.Value);
            }

            // Apply category filter if provided
            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            // Apply search filter if provided
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(searchTerm) ||
                                        p.Description.ToLower().Contains(searchTerm));
            }

            // Execute the query with ordering and pagination
            var results = await query
                .OrderByDescending(p => p.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return results;
        }

        public async Task<int> GetTotalCountAsync(int? categoryId = null, string searchTerm = null, bool? isActive = true)
        {
            // Start with the base query without any filtering
            IQueryable<Product> query = _context.Products;

            // Apply isActive filter only if provided
            if (isActive.HasValue)
            {
                query = query.Where(p => p.IsActive == isActive.Value);
            }

            // Apply category filter if provided
            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            // Apply search filter if provided
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(searchTerm) ||
                                        p.Description.ToLower().Contains(searchTerm));
            }

            // Count the matching records
            return await query.CountAsync();
        }

        public async Task<IEnumerable<Category>> GetAllCategoriesAsync()
        {
            return await _context.Categories.ToListAsync();
        }

        public async Task<Product> AddAsync(Product product)
        {
            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<Product> UpdateAsync(Product product)
        {
            _context.Products.Update(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<bool> SetActiveStatusAsync(int id, bool isActive)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return false;
            }

            product.IsActive = isActive;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Product>> GetUserPurchasedProductsAsync(string userId)
        {
            return await _context.UserProductAccesses
                .Where(upa => upa.UserId == userId)
                .Include(upa => upa.Product)
                .ThenInclude(p => p.Category)
                .Select(upa => upa.Product)
                .ToListAsync();
        }
    }
}