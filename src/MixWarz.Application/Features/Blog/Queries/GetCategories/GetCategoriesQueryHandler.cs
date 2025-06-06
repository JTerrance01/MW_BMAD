using MediatR;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Blog.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.Blog.Queries.GetCategories
{
    public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, GetCategoriesResponse>
    {
        private readonly IBlogService _blogService;
        
        public GetCategoriesQueryHandler(IBlogService blogService)
        {
            _blogService = blogService;
        }
        
        public async Task<GetCategoriesResponse> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
        {
            var categories = await _blogService.GetAllCategoriesAsync();
            
            var categoryDtos = categories.Select(c => new BlogCategoryDto
            {
                Id = c.BlogCategoryId,
                Name = c.Name,
                Slug = c.Slug
            });
            
            return new GetCategoriesResponse
            {
                Success = true,
                Message = "Categories retrieved successfully",
                Categories = categoryDtos
            };
        }
    }
} 