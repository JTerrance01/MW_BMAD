using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Blog.DTOs;
using MixWarz.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.Blog.Commands.CreateArticle
{
    public class CreateArticleCommandHandler : IRequestHandler<CreateArticleCommand, CreateArticleResponse>
    {
        private readonly IBlogService _blogService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly UserManager<User> _userManager;
        
        public CreateArticleCommandHandler(
            IBlogService blogService,
            IHttpContextAccessor httpContextAccessor,
            UserManager<User> userManager)
        {
            _blogService = blogService;
            _httpContextAccessor = httpContextAccessor;
            _userManager = userManager;
        }
        
        public async Task<CreateArticleResponse> Handle(CreateArticleCommand request, CancellationToken cancellationToken)
        {
            // Get current user
            var userId = _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null)
            {
                return new CreateArticleResponse
                {
                    Success = false,
                    Message = "User not found"
                };
            }
            
            // Create article entity
            var article = new BlogArticle
            {
                Title = request.Title,
                Slug = request.Slug,
                Content = request.Content,
                FeaturedImageUrl = request.FeaturedImageUrl,
                AuthorId = userId,
                AuthorName = !string.IsNullOrEmpty(request.AuthorName) ? request.AuthorName : user.UserName,
                Status = string.Equals(request.Status, "Published", StringComparison.OrdinalIgnoreCase) 
                    ? BlogArticleStatus.Published 
                    : BlogArticleStatus.Draft
            };
            
            // Create article
            var createdArticle = await _blogService.CreateArticleAsync(article, request.CategoryIds, request.TagIds);
            
            // Map to DTO
            var categories = await _blogService.GetAllCategoriesAsync();
            var tags = await _blogService.GetAllTagsAsync();
            
            var categoryDtos = createdArticle.ArticleCategories?.Select(ac => new BlogCategoryDto
            {
                Id = ac.BlogCategoryId,
                Name = categories.FirstOrDefault(c => c.BlogCategoryId == ac.BlogCategoryId)?.Name,
                Slug = categories.FirstOrDefault(c => c.BlogCategoryId == ac.BlogCategoryId)?.Slug
            }).ToList() ?? new List<BlogCategoryDto>();
            
            var tagDtos = createdArticle.ArticleTags?.Select(at => new BlogTagDto
            {
                Id = at.BlogTagId,
                Name = tags.FirstOrDefault(t => t.BlogTagId == at.BlogTagId)?.Name,
                Slug = tags.FirstOrDefault(t => t.BlogTagId == at.BlogTagId)?.Slug
            }).ToList() ?? new List<BlogTagDto>();
            
            var articleDto = new BlogArticleDto
            {
                Id = createdArticle.BlogArticleId,
                Title = createdArticle.Title,
                Slug = createdArticle.Slug,
                Content = createdArticle.Content,
                FeaturedImageUrl = createdArticle.FeaturedImageUrl,
                AuthorId = createdArticle.AuthorId,
                AuthorName = createdArticle.AuthorName,
                Status = createdArticle.Status.ToString(),
                CreatedAt = createdArticle.CreatedAt,
                UpdatedAt = createdArticle.UpdatedAt,
                PublishedAt = createdArticle.PublishedAt,
                Categories = categoryDtos,
                Tags = tagDtos
            };
            
            return new CreateArticleResponse
            {
                Success = true,
                Message = "Article created successfully",
                Article = articleDto
            };
        }
    }
} 