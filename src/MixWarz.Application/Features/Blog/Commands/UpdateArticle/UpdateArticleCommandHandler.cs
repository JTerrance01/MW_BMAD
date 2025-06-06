using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Blog.DTOs;
using MixWarz.Domain.Entities;
using System.Linq;

namespace MixWarz.Application.Features.Blog.Commands.UpdateArticle
{
    public class UpdateArticleCommandHandler : IRequestHandler<UpdateArticleCommand, UpdateArticleResponse>
    {
        private readonly IBlogService _blogService;

        public UpdateArticleCommandHandler(IBlogService blogService)
        {
            _blogService = blogService;
        }

        public async Task<UpdateArticleResponse> Handle(UpdateArticleCommand request, CancellationToken cancellationToken)
        {
            // Check if article exists
            var article = await _blogService.GetArticleByIdAsync(request.Id);

            if (article == null)
            {
                return new UpdateArticleResponse
                {
                    Success = false,
                    Message = $"Article with ID {request.Id} not found",
                    Article = null
                };
            }

            // Map request to domain entity
            article.Title = request.Title;
            article.Slug = string.IsNullOrWhiteSpace(request.Slug) ? null : request.Slug;
            article.Content = request.Content;
            article.FeaturedImageUrl = request.FeaturedImageUrl;

            if (!string.IsNullOrWhiteSpace(request.AuthorName))
            {
                article.AuthorName = request.AuthorName;
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                // Try parsing the status
                if (System.Enum.TryParse<BlogArticleStatus>(request.Status, out var status))
                {
                    article.Status = status;

                    // If article is being published now, set published date
                    if (status == BlogArticleStatus.Published && article.PublishedAt == null)
                    {
                        article.PublishedAt = System.DateTime.UtcNow;
                    }
                }
            }

            // Update the article
            var updatedArticle = await _blogService.UpdateArticleAsync(
                request.Id,
                article,
                request.CategoryIds ?? new System.Collections.Generic.List<int>(),
                request.TagIds ?? new System.Collections.Generic.List<int>()
            );

            if (updatedArticle == null)
            {
                return new UpdateArticleResponse
                {
                    Success = false,
                    Message = "Failed to update article",
                    Article = null
                };
            }

            // Map domain entity to DTO
            var articleDto = new BlogArticleDto
            {
                Id = updatedArticle.BlogArticleId,
                Title = updatedArticle.Title,
                Slug = updatedArticle.Slug,
                Content = updatedArticle.Content,
                FeaturedImageUrl = updatedArticle.FeaturedImageUrl,
                AuthorName = updatedArticle.AuthorName,
                Status = updatedArticle.Status.ToString(),
                CreatedAt = updatedArticle.CreatedAt,
                UpdatedAt = updatedArticle.UpdatedAt,
                PublishedAt = updatedArticle.PublishedAt,
                Categories = updatedArticle.ArticleCategories.Select(ac => new BlogCategoryDto
                {
                    Id = ac.BlogCategory.BlogCategoryId,
                    Name = ac.BlogCategory.Name,
                    Slug = ac.BlogCategory.Slug
                }).ToList(),
                Tags = updatedArticle.ArticleTags.Select(at => new BlogTagDto
                {
                    Id = at.BlogTag.BlogTagId,
                    Name = at.BlogTag.Name,
                    Slug = at.BlogTag.Slug
                }).ToList()
            };

            return new UpdateArticleResponse
            {
                Success = true,
                Message = "Article updated successfully",
                Article = articleDto
            };
        }
    }
}