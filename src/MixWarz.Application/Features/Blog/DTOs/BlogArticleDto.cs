using System;
using System.Collections.Generic;

namespace MixWarz.Application.Features.Blog.DTOs
{
    public class BlogArticleDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string FeaturedImageUrl { get; set; } = string.Empty;
        public string AuthorId { get; set; } = string.Empty;
        public string AuthorName { get; set; } = string.Empty;
        public string Status { get; set; } = "Draft"; // "Draft" or "Published"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PublishedAt { get; set; }
        public IEnumerable<BlogCategoryDto> Categories { get; set; } = new List<BlogCategoryDto>();
        public IEnumerable<BlogTagDto> Tags { get; set; } = new List<BlogTagDto>();
    }
} 