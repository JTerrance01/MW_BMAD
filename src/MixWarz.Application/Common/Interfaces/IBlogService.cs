using MixWarz.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MixWarz.Application.Common.Interfaces
{
    public interface IBlogService
    {
        // Category operations
        Task<IEnumerable<BlogCategory>> GetAllCategoriesAsync();
        Task<BlogCategory> GetCategoryByIdAsync(int id);
        Task<BlogCategory> GetCategoryBySlugAsync(string slug);
        Task<BlogCategory> CreateCategoryAsync(string name, string slug = null);
        Task<BlogCategory> UpdateCategoryAsync(int id, string name, string slug = null);
        Task<bool> DeleteCategoryAsync(int id);
        Task<bool> CategoryExistsAsync(int id);
        Task<bool> CategorySlugExistsAsync(string slug);
        
        // Tag operations
        Task<IEnumerable<BlogTag>> GetAllTagsAsync();
        Task<BlogTag> GetTagByIdAsync(int id);
        Task<BlogTag> GetTagBySlugAsync(string slug);
        Task<BlogTag> CreateTagAsync(string name, string slug = null);
        Task<BlogTag> UpdateTagAsync(int id, string name, string slug = null);
        Task<bool> DeleteTagAsync(int id);
        Task<bool> TagExistsAsync(int id);
        Task<bool> TagSlugExistsAsync(string slug);
        
        // Article operations
        Task<IEnumerable<BlogArticle>> GetArticlesAsync(int pageNumber = 1, int pageSize = 10, string? categorySlug = null, string? tagSlug = null, string? search = null);
        Task<IEnumerable<BlogArticle>> GetAllArticlesForAdminAsync(int pageNumber = 1, int pageSize = 10, string? categorySlug = null, string? tagSlug = null, string? search = null);
        Task<BlogArticle> GetArticleByIdAsync(int id);
        Task<BlogArticle> GetArticleBySlugAsync(string slug);
        Task<BlogArticle> GetArticleBySlugForAdminAsync(string slug);
        Task<BlogArticle> CreateArticleAsync(BlogArticle article, IEnumerable<int> categoryIds, IEnumerable<int> tagIds);
        Task<BlogArticle> UpdateArticleAsync(int id, BlogArticle article, IEnumerable<int> categoryIds, IEnumerable<int> tagIds);
        Task<bool> DeleteArticleAsync(int id);
        Task<bool> ArticleExistsAsync(int id);
        Task<bool> ArticleSlugExistsAsync(string slug);
    }
} 