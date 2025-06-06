using MediatR;
using MixWarz.Application.Features.Blog.DTOs;
using System.Collections.Generic;

namespace MixWarz.Application.Features.Blog.Queries.GetArticles
{
    public class GetArticlesQuery : IRequest<GetArticlesResponse>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? CategorySlug { get; set; }
        public string? TagSlug { get; set; }
        public string? Search { get; set; }
    }
    
    public class GetArticlesResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public IEnumerable<BlogArticleDto> Articles { get; set; } = new List<BlogArticleDto>();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public int TotalItems { get; set; }
    }
} 