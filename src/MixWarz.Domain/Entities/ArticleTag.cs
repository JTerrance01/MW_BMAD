using System.ComponentModel.DataAnnotations.Schema;

namespace MixWarz.Domain.Entities
{
    public class ArticleTag
    {
        public int BlogArticleId { get; set; }
        public int BlogTagId { get; set; }

        // Navigation properties
        [ForeignKey("BlogArticleId")]
        public virtual BlogArticle BlogArticle { get; set; } = null!;

        [ForeignKey("BlogTagId")]
        public virtual BlogTag BlogTag { get; set; } = null!;
    }
}