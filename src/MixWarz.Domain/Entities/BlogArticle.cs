using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MixWarz.Domain.Entities
{
    public class BlogArticle
    {
        public int BlogArticleId { get; set; }
        
        [Required]
        public string Title { get; set; }
        
        [Required]
        public string Slug { get; set; }
        
        [Required]
        public string Content { get; set; }
        
        public string? FeaturedImageUrl { get; set; }
        
        [Required]
        public string AuthorId { get; set; }
        
        public string AuthorName { get; set; }
        
        [Required]
        public BlogArticleStatus Status { get; set; }
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime UpdatedAt { get; set; }
        
        public DateTime? PublishedAt { get; set; }
        
        // Navigation properties
        [ForeignKey("AuthorId")]
        public virtual User Author { get; set; }
        
        public virtual ICollection<ArticleCategory> ArticleCategories { get; set; }
        
        public virtual ICollection<ArticleTag> ArticleTags { get; set; }
        
        public BlogArticle()
        {
            ArticleCategories = new HashSet<ArticleCategory>();
            ArticleTags = new HashSet<ArticleTag>();
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
            Status = BlogArticleStatus.Draft;
        }
    }
    
    public enum BlogArticleStatus
    {
        Draft = 0,
        Published = 1
    }
} 