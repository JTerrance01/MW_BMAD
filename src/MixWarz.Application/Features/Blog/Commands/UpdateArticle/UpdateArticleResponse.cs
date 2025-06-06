using MixWarz.Application.Features.Blog.DTOs;

namespace MixWarz.Application.Features.Blog.Commands.UpdateArticle
{
    public class UpdateArticleResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public BlogArticleDto Article { get; set; }
    }
}