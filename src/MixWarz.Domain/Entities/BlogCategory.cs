using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MixWarz.Domain.Entities
{
    public class BlogCategory
    {
        public int BlogCategoryId { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string Slug { get; set; }

        // Navigation property
        public virtual ICollection<ArticleCategory> ArticleCategories { get; set; }

        public BlogCategory()
        {
            Name = string.Empty;
            Slug = string.Empty;
            ArticleCategories = new HashSet<ArticleCategory>();
        }
    }
}