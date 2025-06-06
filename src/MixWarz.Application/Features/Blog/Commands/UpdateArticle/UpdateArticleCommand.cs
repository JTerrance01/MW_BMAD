using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using MediatR;
using MixWarz.Application.Features.Blog.DTOs;

namespace MixWarz.Application.Features.Blog.Commands.UpdateArticle
{
    public class UpdateArticleCommand : IRequest<UpdateArticleResponse>
    {
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public string Slug { get; set; }

        [Required]
        public string Content { get; set; }

        public string FeaturedImageUrl { get; set; }
        public string AuthorName { get; set; }
        public string Status { get; set; }
        public List<int> CategoryIds { get; set; }
        public List<int> TagIds { get; set; }
    }
}