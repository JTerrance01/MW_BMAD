using MediatR;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Blog.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System;

namespace MixWarz.Application.Features.Blog.Queries.GetArticles
{
    public class GetArticlesQueryHandler : IRequestHandler<GetArticlesQuery, GetArticlesResponse>
    {
        private readonly IBlogService _blogService;
        
        public GetArticlesQueryHandler(IBlogService blogService)
        {
            _blogService = blogService;
        }
        
        public async Task<GetArticlesResponse> Handle(GetArticlesQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Ensure valid paging parameters
                if (request.PageNumber < 1) request.PageNumber = 1;
                if (request.PageSize < 1) request.PageSize = 10;
                if (request.PageSize > 50) request.PageSize = 50;
                
                // Get articles with filtering
                var articles = await _blogService.GetArticlesAsync(
                    request.PageNumber,
                    request.PageSize,
                    request.CategorySlug,
                    request.TagSlug,
                    request.Search);
                
                // Map to DTOs
                var articleDtos = new List<BlogArticleDto>();
                foreach (var a in articles)
                {
                    try
                    {
                        var dto = new BlogArticleDto
                        {
                            Id = a.BlogArticleId,
                            Title = a.Title ?? "Untitled",
                            Slug = a.Slug ?? $"article-{a.BlogArticleId}",
                            Content = a.Content ?? string.Empty,
                            FeaturedImageUrl = a.FeaturedImageUrl,
                            AuthorId = a.AuthorId,
                            AuthorName = a.AuthorName ?? "Anonymous",
                            Status = a.Status.ToString(),
                            CreatedAt = a.CreatedAt,
                            UpdatedAt = a.UpdatedAt,
                            PublishedAt = a.PublishedAt
                        };

                        // Safely map categories
                        if (a.ArticleCategories != null)
                        {
                            dto.Categories = a.ArticleCategories
                                .Where(ac => ac.BlogCategory != null)
                                .Select(ac => new BlogCategoryDto
                                {
                                    Id = ac.BlogCategory.BlogCategoryId,
                                    Name = ac.BlogCategory.Name ?? "Uncategorized",
                                    Slug = ac.BlogCategory.Slug ?? $"category-{ac.BlogCategory.BlogCategoryId}"
                                }).ToList();
                        }
                        else
                        {
                            dto.Categories = new List<BlogCategoryDto>();
                        }

                        // Safely map tags
                        if (a.ArticleTags != null)
                        {
                            dto.Tags = a.ArticleTags
                                .Where(at => at.BlogTag != null)
                                .Select(at => new BlogTagDto
                                {
                                    Id = at.BlogTag.BlogTagId,
                                    Name = at.BlogTag.Name ?? "Unnamed",
                                    Slug = at.BlogTag.Slug ?? $"tag-{at.BlogTag.BlogTagId}"
                                }).ToList();
                        }
                        else
                        {
                            dto.Tags = new List<BlogTagDto>();
                        }

                        articleDtos.Add(dto);
                    }
                    catch (Exception ex)
                    {
                        // Log the error but continue processing other articles
                        System.Diagnostics.Debug.WriteLine($"Error mapping article {a.BlogArticleId}: {ex.Message}");
                    }
                }
                
                return new GetArticlesResponse
                {
                    Success = true,
                    Message = "Articles retrieved successfully",
                    Articles = articleDtos,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                    // Placeholder values - should be updated with actual values from proper pagination implementation
                    TotalPages = 1,
                    TotalItems = articleDtos.Count
                };
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetArticlesQueryHandler: {ex.Message}");
                return new GetArticlesResponse
                {
                    Success = false,
                    Message = "An error occurred while retrieving articles",
                    Articles = new List<BlogArticleDto>(),
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                    TotalPages = 0,
                    TotalItems = 0
                };
            }
        }
    }
} 