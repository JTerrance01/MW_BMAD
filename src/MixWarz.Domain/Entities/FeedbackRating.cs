using System.ComponentModel.DataAnnotations;

namespace MixWarz.Domain.Entities
{
    /// <summary>
    /// Represents a rating given by a submission owner on the feedback they received from a judge
    /// </summary>
    public class FeedbackRating
    {
        [Key]
        public int FeedbackRatingId { get; set; }

        [Required]
        public int JudgementId { get; set; }

        [Required]
        public required string RaterUserId { get; set; }

        [Required]
        public bool IsHelpful { get; set; }

        [Required]
        public DateTime RatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Judgement Judgement { get; set; } = null!;
        public virtual User Rater { get; set; } = null!;
    }
}
