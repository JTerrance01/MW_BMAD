using System.ComponentModel.DataAnnotations.Schema;

namespace MixWarz.Domain.Entities
{
    public class ArticleCategory
    {
        public int BlogArticleId { get; set; }
        public int BlogCategoryId { get; set; }
        
        // Navigation properties
        [ForeignKey("BlogArticleId")]
        public virtual BlogArticle BlogArticle { get; set; }
        
        [ForeignKey("BlogCategoryId")]
        public virtual BlogCategory BlogCategory { get; set; }
    }
} 