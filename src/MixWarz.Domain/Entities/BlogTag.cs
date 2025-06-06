using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MixWarz.Domain.Entities
{
    public class BlogTag
    {
        public int BlogTagId { get; set; }
        
        [Required]
        public string Name { get; set; }
        
        [Required]
        public string Slug { get; set; }
        
        // Navigation property
        public virtual ICollection<ArticleTag> ArticleTags { get; set; }
        
        public BlogTag()
        {
            ArticleTags = new HashSet<ArticleTag>();
        }
    }
} 