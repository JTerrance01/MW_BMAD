using MediatR;
using MixWarz.Application.Features.Blog.DTOs;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MixWarz.Application.Features.Blog.Commands.CreateArticle
{
    public class CreateArticleCommand : IRequest<CreateArticleResponse>
    {
        [Required]
        public string Title { get; set; }
        
        public string Slug { get; set; }
        
        [Required]
        public string Content { get; set; }
        
        public string FeaturedImageUrl { get; set; }
        
        // If not provided, current user will be the author
        public string AuthorName { get; set; }
        
        // Published or Draft, defaults to Draft if not specified
        public string Status { get; set; }
        
        public List<int> CategoryIds { get; set; }
        
        public List<int> TagIds { get; set; }
    }
    
    public class CreateArticleResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public BlogArticleDto Article { get; set; }
    }
} 