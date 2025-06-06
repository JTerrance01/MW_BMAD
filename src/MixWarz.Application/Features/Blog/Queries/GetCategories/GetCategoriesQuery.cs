using MediatR;
using MixWarz.Application.Features.Blog.DTOs;
using System.Collections.Generic;

namespace MixWarz.Application.Features.Blog.Queries.GetCategories
{
    public class GetCategoriesQuery : IRequest<GetCategoriesResponse>
    {
    }
    
    public class GetCategoriesResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public IEnumerable<BlogCategoryDto> Categories { get; set; }
    }
} 