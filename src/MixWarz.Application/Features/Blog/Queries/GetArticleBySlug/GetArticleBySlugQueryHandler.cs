using MediatR;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Blog.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.Blog.Queries.GetArticleBySlug
{
    public class GetArticleBySlugQueryHandler : IRequestHandler<GetArticleBySlugQuery, GetArticleBySlugResponse>
    {
        private readonly IBlogService _blogService;
        
        public GetArticleBySlugQueryHandler(IBlogService blogService)
        {
            _blogService = blogService;
        }
        
        public async Task<GetArticleBySlugResponse> Handle(GetArticleBySlugQuery request, CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Slug))
                {
                    return new GetArticleBySlugResponse
                    {
                        Success = false,
                        Message = "Article slug is required"
                    };
                }
                
                var article = await _blogService.GetArticleBySlugAsync(request.Slug);
                
                if (article == null)
                {
                    return new GetArticleBySlugResponse
                    {
                        Success = false,
                        Message = "Article not found"
                    };
                }
                
                // Map to DTO with null safety
                var articleDto = new BlogArticleDto
                {
                    Id = article.BlogArticleId,
                    Title = article.Title ?? "Untitled",
                    Slug = article.Slug ?? $"article-{article.BlogArticleId}",
                    Content = article.Content ?? string.Empty,
                    FeaturedImageUrl = article.FeaturedImageUrl,
                    AuthorId = article.AuthorId,
                    AuthorName = article.AuthorName ?? "Anonymous",
                    Status = article.Status.ToString(),
                    CreatedAt = article.CreatedAt,
                    UpdatedAt = article.UpdatedAt,
                    PublishedAt = article.PublishedAt
                };
                
                // Safely map categories
                var categories = new List<BlogCategoryDto>();
                if (article.ArticleCategories != null)
                {
                    foreach (var ac in article.ArticleCategories)
                    {
                        if (ac.BlogCategory != null)
                        {
                            categories.Add(new BlogCategoryDto
                            {
                                Id = ac.BlogCategory.BlogCategoryId,
                                Name = ac.BlogCategory.Name ?? "Uncategorized",
                                Slug = ac.BlogCategory.Slug ?? $"category-{ac.BlogCategory.BlogCategoryId}"
                            });
                        }
                    }
                }
                articleDto.Categories = categories;
                
                // Safely map tags
                var tags = new List<BlogTagDto>();
                if (article.ArticleTags != null)
                {
                    foreach (var at in article.ArticleTags)
                    {
                        if (at.BlogTag != null)
                        {
                            tags.Add(new BlogTagDto
                            {
                                Id = at.BlogTag.BlogTagId,
                                Name = at.BlogTag.Name ?? "Unnamed",
                                Slug = at.BlogTag.Slug ?? $"tag-{at.BlogTag.BlogTagId}"
                            });
                        }
                    }
                }
                articleDto.Tags = tags;
                
                return new GetArticleBySlugResponse
                {
                    Success = true,
                    Message = "Article retrieved successfully",
                    Article = articleDto
                };
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetArticleBySlugQueryHandler: {ex.Message}");
                return new GetArticleBySlugResponse
                {
                    Success = false,
                    Message = "An error occurred while retrieving the article",
                    Article = null
                };
            }
        }
    }
} 