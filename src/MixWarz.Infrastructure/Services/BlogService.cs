using Microsoft.EntityFrameworkCore;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Utilities;
using MixWarz.Infrastructure.Persistence;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace MixWarz.Infrastructure.Services
{
    public class BlogService : IBlogService
    {
        private readonly AppDbContext _dbContext;

        public BlogService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        #region Helper Methods

        // Generic method to ensure a unique slug for any entity
        private async Task<string> EnsureUniqueSlug<TEntity>(string slug, Func<string, Task<bool>> existsFunc)
        {
            // Create a function that checks if a slug exists using the provided function
            bool SlugExists(string s) => existsFunc(s).GetAwaiter().GetResult();

            // Use the common utility to ensure uniqueness
            return await Task.FromResult(SlugGenerator.EnsureUniqueSlug(slug, SlugExists));
        }

        // Generic method to generate a slug from a name or title
        private string GenerateSlug(string name)
        {
            return SlugGenerator.GenerateSlug(name);
        }

        #endregion

        #region Category Operations

        public async Task<IEnumerable<BlogCategory>> GetAllCategoriesAsync()
        {
            try
            {
                return await _dbContext.BlogCategories
                    .OrderBy(c => c.Name)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetAllCategoriesAsync: {ex.Message}");
                return new List<BlogCategory>();
            }
        }

        public async Task<BlogCategory> GetCategoryByIdAsync(int id)
        {
            return await _dbContext.BlogCategories.FindAsync(id);
        }

        public async Task<BlogCategory> GetCategoryBySlugAsync(string slug)
        {
            return await _dbContext.BlogCategories
                .FirstOrDefaultAsync(c => c.Slug == slug);
        }

        public async Task<BlogCategory> CreateCategoryAsync(string name, string slug = null)
        {
            // Generate slug if not provided
            if (string.IsNullOrEmpty(slug))
            {
                slug = GenerateSlug(name);
            }

            // Ensure slug is unique
            slug = await EnsureUniqueSlug<BlogCategory>(slug, CategorySlugExistsAsync);

            var category = new BlogCategory
            {
                Name = name,
                Slug = slug
            };

            await _dbContext.BlogCategories.AddAsync(category);
            await _dbContext.SaveChangesAsync();

            return category;
        }

        public async Task<BlogCategory> UpdateCategoryAsync(int id, string name, string slug = null)
        {
            var category = await _dbContext.BlogCategories.FindAsync(id);

            if (category == null)
                return null;

            category.Name = name;

            // Generate slug if not provided
            if (string.IsNullOrEmpty(slug))
            {
                slug = GenerateSlug(name);
            }

            // Only ensure unique slug if it has changed
            if (slug != category.Slug)
            {
                slug = await EnsureUniqueSlug<BlogCategory>(slug, CategorySlugExistsAsync);
                category.Slug = slug;
            }

            _dbContext.BlogCategories.Update(category);
            await _dbContext.SaveChangesAsync();

            return category;
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var category = await _dbContext.BlogCategories
                .Include(c => c.ArticleCategories)
                .FirstOrDefaultAsync(c => c.BlogCategoryId == id);

            if (category == null)
                return false;

            // Remove all associations with articles
            if (category.ArticleCategories.Any())
            {
                _dbContext.ArticleCategories.RemoveRange(category.ArticleCategories);
            }

            _dbContext.BlogCategories.Remove(category);
            await _dbContext.SaveChangesAsync();

            return true;
        }

        public async Task<bool> CategoryExistsAsync(int id)
        {
            return await _dbContext.BlogCategories.AnyAsync(c => c.BlogCategoryId == id);
        }

        public async Task<bool> CategorySlugExistsAsync(string slug)
        {
            return await _dbContext.BlogCategories.AnyAsync(c => c.Slug == slug);
        }

        #endregion

        #region Tag Operations

        public async Task<IEnumerable<BlogTag>> GetAllTagsAsync()
        {
            try
            {
                return await _dbContext.BlogTags
                    .OrderBy(t => t.Name)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetAllTagsAsync: {ex.Message}");
                return new List<BlogTag>();
            }
        }

        public async Task<BlogTag> GetTagByIdAsync(int id)
        {
            return await _dbContext.BlogTags.FindAsync(id);
        }

        public async Task<BlogTag> GetTagBySlugAsync(string slug)
        {
            return await _dbContext.BlogTags
                .FirstOrDefaultAsync(t => t.Slug == slug);
        }

        public async Task<BlogTag> CreateTagAsync(string name, string slug = null)
        {
            // Generate slug if not provided
            if (string.IsNullOrEmpty(slug))
            {
                slug = GenerateSlug(name);
            }

            // Ensure slug is unique
            slug = await EnsureUniqueSlug<BlogTag>(slug, TagSlugExistsAsync);

            var tag = new BlogTag
            {
                Name = name,
                Slug = slug
            };

            await _dbContext.BlogTags.AddAsync(tag);
            await _dbContext.SaveChangesAsync();

            return tag;
        }

        public async Task<BlogTag> UpdateTagAsync(int id, string name, string slug = null)
        {
            var tag = await _dbContext.BlogTags.FindAsync(id);
            if (tag == null) return null;

            tag.Name = name;

            // Update slug if provided or if name has changed
            if (!string.IsNullOrEmpty(slug) || tag.Name != name)
            {
                // Generate new slug if not provided
                if (string.IsNullOrEmpty(slug))
                {
                    slug = GenerateSlug(name);
                }

                // Ensure slug is unique
                slug = await EnsureUniqueSlug<BlogTag>(slug, TagSlugExistsAsync);
                tag.Slug = slug;
            }

            _dbContext.BlogTags.Update(tag);
            await _dbContext.SaveChangesAsync();

            return tag;
        }

        public async Task<bool> DeleteTagAsync(int id)
        {
            var tag = await _dbContext.BlogTags.FindAsync(id);
            if (tag == null) return false;

            _dbContext.BlogTags.Remove(tag);
            await _dbContext.SaveChangesAsync();

            return true;
        }

        public async Task<bool> TagExistsAsync(int id)
        {
            return await _dbContext.BlogTags.AnyAsync(t => t.BlogTagId == id);
        }

        public async Task<bool> TagSlugExistsAsync(string slug)
        {
            return await _dbContext.BlogTags.AnyAsync(t => t.Slug == slug);
        }

        #endregion

        #region Article Operations

        public async Task<IEnumerable<BlogArticle>> GetArticlesAsync(int pageNumber = 1, int pageSize = 10, string? categorySlug = null, string? tagSlug = null, string? search = null)
        {
            try
            {
                IQueryable<BlogArticle> query = _dbContext.BlogArticles
                    .Include(a => a.ArticleCategories)
                        .ThenInclude(ac => ac.BlogCategory)
                    .Include(a => a.ArticleTags)
                        .ThenInclude(at => at.BlogTag)
                    .Include(a => a.Author);

                // Only return published articles for public viewing
                query = query.Where(a => a.Status == BlogArticleStatus.Published);

                // Filter by category if provided
                if (!string.IsNullOrEmpty(categorySlug))
                {
                    query = query.Where(a => a.ArticleCategories.Any(ac => ac.BlogCategory != null && ac.BlogCategory.Slug == categorySlug));
                }

                // Filter by tag if provided
                if (!string.IsNullOrEmpty(tagSlug))
                {
                    query = query.Where(a => a.ArticleTags.Any(at => at.BlogTag != null && at.BlogTag.Slug == tagSlug));
                }

                // Filter by search term if provided
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(a =>
                        (a.Title != null && a.Title.Contains(search)) ||
                        (a.Content != null && a.Content.Contains(search)) ||
                        (a.AuthorName != null && a.AuthorName.Contains(search)));
                }

                // Apply paging with safe defaults
                var articles = await query
                    .OrderByDescending(a => a.PublishedAt)
                    .ThenByDescending(a => a.CreatedAt)
                    .Skip(Math.Max(0, (pageNumber - 1) * pageSize))
                    .Take(Math.Max(1, pageSize))
                    .ToListAsync();

                // Initialize empty collections to prevent null reference exceptions
                foreach (var article in articles)
                {
                    article.ArticleCategories ??= new List<ArticleCategory>();
                    article.ArticleTags ??= new List<ArticleTag>();
                }

                return articles;
            }
            catch (Exception ex)
            {
                // Log the exception 
                System.Diagnostics.Debug.WriteLine($"Error in GetArticlesAsync: {ex.Message}");
                // Return an empty list instead of throwing, to avoid 500 errors
                return new List<BlogArticle>();
            }
        }

        public async Task<BlogArticle> GetArticleByIdAsync(int id)
        {
            var article = await _dbContext.BlogArticles
                .Include(a => a.ArticleCategories)
                    .ThenInclude(ac => ac.BlogCategory)
                .Include(a => a.ArticleTags)
                    .ThenInclude(at => at.BlogTag)
                .Include(a => a.Author)
                .FirstOrDefaultAsync(a => a.BlogArticleId == id);

            if (article != null)
            {
                // Initialize empty collections to prevent null reference exceptions
                article.ArticleCategories ??= new List<ArticleCategory>();
                article.ArticleTags ??= new List<ArticleTag>();
            }

            return article;
        }

        public async Task<BlogArticle> GetArticleBySlugAsync(string slug)
        {
            try
            {
                if (string.IsNullOrEmpty(slug))
                {
                    return null;
                }

                var article = await _dbContext.BlogArticles
                    .Include(a => a.ArticleCategories)
                        .ThenInclude(ac => ac.BlogCategory)
                    .Include(a => a.ArticleTags)
                        .ThenInclude(at => at.BlogTag)
                    .Include(a => a.Author)
                    .FirstOrDefaultAsync(a => a.Slug == slug && a.Status == BlogArticleStatus.Published);

                if (article != null)
                {
                    // Initialize empty collections to prevent null reference exceptions
                    article.ArticleCategories ??= new List<ArticleCategory>();
                    article.ArticleTags ??= new List<ArticleTag>();
                }

                return article;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetArticleBySlugAsync: {ex.Message}");
                return null;
            }
        }

        public async Task<BlogArticle> CreateArticleAsync(BlogArticle article, IEnumerable<int> categoryIds, IEnumerable<int> tagIds)
        {
            // Generate slug if not provided
            if (string.IsNullOrEmpty(article.Slug))
            {
                article.Slug = GenerateSlug(article.Title);
            }

            // Ensure slug is unique
            article.Slug = await EnsureUniqueSlug<BlogArticle>(article.Slug, ArticleSlugExistsAsync);

            // Set creation date and update date
            article.CreatedAt = System.DateTime.UtcNow;
            article.UpdatedAt = System.DateTime.UtcNow;

            // Set published date if article is published
            if (article.Status == BlogArticleStatus.Published && !article.PublishedAt.HasValue)
            {
                article.PublishedAt = System.DateTime.UtcNow;
            }

            // Add the article
            await _dbContext.BlogArticles.AddAsync(article);
            await _dbContext.SaveChangesAsync();

            // Add article-category associations
            if (categoryIds != null && categoryIds.Any())
            {
                foreach (var categoryId in categoryIds)
                {
                    if (await _dbContext.BlogCategories.AnyAsync(c => c.BlogCategoryId == categoryId))
                    {
                        var articleCategory = new ArticleCategory
                        {
                            BlogArticleId = article.BlogArticleId,
                            BlogCategoryId = categoryId
                        };
                        await _dbContext.ArticleCategories.AddAsync(articleCategory);
                    }
                }
            }

            // Add article-tag associations
            if (tagIds != null && tagIds.Any())
            {
                foreach (var tagId in tagIds)
                {
                    if (await _dbContext.BlogTags.AnyAsync(t => t.BlogTagId == tagId))
                    {
                        var articleTag = new ArticleTag
                        {
                            BlogArticleId = article.BlogArticleId,
                            BlogTagId = tagId
                        };
                        await _dbContext.ArticleTags.AddAsync(articleTag);
                    }
                }
            }

            await _dbContext.SaveChangesAsync();

            return article;
        }

        public async Task<BlogArticle> UpdateArticleAsync(int id, BlogArticle articleUpdate, IEnumerable<int> categoryIds, IEnumerable<int> tagIds)
        {
            var article = await _dbContext.BlogArticles
                .Include(a => a.ArticleCategories)
                .Include(a => a.ArticleTags)
                .FirstOrDefaultAsync(a => a.BlogArticleId == id);

            if (article == null)
                return null;

            // Update article properties
            article.Title = articleUpdate.Title;
            article.Content = articleUpdate.Content;
            article.FeaturedImageUrl = articleUpdate.FeaturedImageUrl;
            article.AuthorName = articleUpdate.AuthorName;
            article.UpdatedAt = System.DateTime.UtcNow;

            // Handle status and published date changes
            if (article.Status != BlogArticleStatus.Published && articleUpdate.Status == BlogArticleStatus.Published)
            {
                // Article is being published for the first time
                article.PublishedAt = System.DateTime.UtcNow;
            }
            article.Status = articleUpdate.Status;

            // Update slug if provided and different
            if (!string.IsNullOrEmpty(articleUpdate.Slug) && articleUpdate.Slug != article.Slug)
            {
                article.Slug = await EnsureUniqueSlug<BlogArticle>(articleUpdate.Slug, ArticleSlugExistsAsync);
            }
            // Generate new slug from title if title changed and slug not provided
            else if (string.IsNullOrEmpty(articleUpdate.Slug) && article.Title != articleUpdate.Title)
            {
                article.Slug = await EnsureUniqueSlug<BlogArticle>(GenerateSlug(articleUpdate.Title), ArticleSlugExistsAsync);
            }

            // Update the article
            _dbContext.BlogArticles.Update(article);

            // Update categories
            if (categoryIds != null)
            {
                // Remove existing associations
                _dbContext.ArticleCategories.RemoveRange(article.ArticleCategories);

                // Add new associations
                foreach (var categoryId in categoryIds)
                {
                    if (await _dbContext.BlogCategories.AnyAsync(c => c.BlogCategoryId == categoryId))
                    {
                        var articleCategory = new ArticleCategory
                        {
                            BlogArticleId = article.BlogArticleId,
                            BlogCategoryId = categoryId
                        };
                        await _dbContext.ArticleCategories.AddAsync(articleCategory);
                    }
                }
            }

            // Update tags
            if (tagIds != null)
            {
                // Remove existing associations
                _dbContext.ArticleTags.RemoveRange(article.ArticleTags);

                // Add new associations
                foreach (var tagId in tagIds)
                {
                    if (await _dbContext.BlogTags.AnyAsync(t => t.BlogTagId == tagId))
                    {
                        var articleTag = new ArticleTag
                        {
                            BlogArticleId = article.BlogArticleId,
                            BlogTagId = tagId
                        };
                        await _dbContext.ArticleTags.AddAsync(articleTag);
                    }
                }
            }

            await _dbContext.SaveChangesAsync();

            return article;
        }

        public async Task<bool> DeleteArticleAsync(int id)
        {
            var article = await _dbContext.BlogArticles
                .Include(a => a.ArticleCategories)
                .Include(a => a.ArticleTags)
                .FirstOrDefaultAsync(a => a.BlogArticleId == id);

            if (article == null)
                return false;

            // Remove all associations
            _dbContext.ArticleCategories.RemoveRange(article.ArticleCategories);
            _dbContext.ArticleTags.RemoveRange(article.ArticleTags);

            // Remove the article
            _dbContext.BlogArticles.Remove(article);
            await _dbContext.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ArticleExistsAsync(int id)
        {
            return await _dbContext.BlogArticles.AnyAsync(a => a.BlogArticleId == id);
        }

        public async Task<bool> ArticleSlugExistsAsync(string slug)
        {
            return await _dbContext.BlogArticles.AnyAsync(a => a.Slug == slug);
        }

        public async Task<IEnumerable<BlogArticle>> GetAllArticlesForAdminAsync(int pageNumber = 1, int pageSize = 10, string? categorySlug = null, string? tagSlug = null, string? search = null)
        {
            try
            {
                IQueryable<BlogArticle> query = _dbContext.BlogArticles
                    .Include(a => a.ArticleCategories)
                        .ThenInclude(ac => ac.BlogCategory)
                    .Include(a => a.ArticleTags)
                        .ThenInclude(at => at.BlogTag)
                    .Include(a => a.Author);

                // Return all articles regardless of status for admin view

                // Filter by category if provided
                if (!string.IsNullOrEmpty(categorySlug))
                {
                    query = query.Where(a => a.ArticleCategories.Any(ac => ac.BlogCategory != null && ac.BlogCategory.Slug == categorySlug));
                }

                // Filter by tag if provided
                if (!string.IsNullOrEmpty(tagSlug))
                {
                    query = query.Where(a => a.ArticleTags.Any(at => at.BlogTag != null && at.BlogTag.Slug == tagSlug));
                }

                // Filter by search term if provided
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(a =>
                        (a.Title != null && a.Title.Contains(search)) ||
                        (a.Content != null && a.Content.Contains(search)) ||
                        (a.AuthorName != null && a.AuthorName.Contains(search)));
                }

                // Apply paging with safe defaults
                var articles = await query
                    .OrderByDescending(a => a.UpdatedAt)
                    .Skip(Math.Max(0, (pageNumber - 1) * pageSize))
                    .Take(Math.Max(1, pageSize))
                    .ToListAsync();

                // Initialize empty collections to prevent null reference exceptions
                foreach (var article in articles)
                {
                    article.ArticleCategories ??= new List<ArticleCategory>();
                    article.ArticleTags ??= new List<ArticleTag>();
                }

                return articles;
            }
            catch (Exception ex)
            {
                // Log the exception 
                System.Diagnostics.Debug.WriteLine($"Error in GetAllArticlesForAdminAsync: {ex.Message}");
                // Return an empty list instead of throwing, to avoid 500 errors
                return new List<BlogArticle>();
            }
        }

        public async Task<BlogArticle> GetArticleBySlugForAdminAsync(string slug)
        {
            try
            {
                if (string.IsNullOrEmpty(slug))
                {
                    return null;
                }

                var article = await _dbContext.BlogArticles
                    .Include(a => a.ArticleCategories)
                        .ThenInclude(ac => ac.BlogCategory)
                    .Include(a => a.ArticleTags)
                        .ThenInclude(at => at.BlogTag)
                    .Include(a => a.Author)
                    .FirstOrDefaultAsync(a => a.Slug == slug);

                if (article != null)
                {
                    // Initialize empty collections to prevent null reference exceptions
                    article.ArticleCategories ??= new List<ArticleCategory>();
                    article.ArticleTags ??= new List<ArticleTag>();
                }

                return article;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetArticleBySlugForAdminAsync: {ex.Message}");
                return null;
            }
        }

        #endregion
    }
}