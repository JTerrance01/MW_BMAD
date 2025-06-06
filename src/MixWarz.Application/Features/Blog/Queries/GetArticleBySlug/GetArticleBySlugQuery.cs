using MediatR;
using MixWarz.Application.Features.Blog.DTOs;
using System.ComponentModel.DataAnnotations;

namespace MixWarz.Application.Features.Blog.Queries.GetArticleBySlug
{
    public class GetArticleBySlugQuery : IRequest<GetArticleBySlugResponse>
    {
        [Required]
        public string Slug { get; set; }
    }
    
    public class GetArticleBySlugResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public BlogArticleDto Article { get; set; }
    }
} 