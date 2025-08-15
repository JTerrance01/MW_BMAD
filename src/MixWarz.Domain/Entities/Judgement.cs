using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MixWarz.Domain.Entities
{
    /// <summary>
    /// Represents a judgement submitted by a competitor for an assigned submission in the Hybrid Fair-Play Tournament
    /// </summary>
    public class Judgement
    {
        [Key]
        public int JudgementId { get; set; }

        [Required]
        public int SubmissionId { get; set; }

        [Required]
        public required string JudgeUserId { get; set; }

        [Required]
        [Range(1, 10)]
        public int Score { get; set; }

        [Required]
        public required string Feedback { get; set; }

        [Required]
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Submission Submission { get; set; } = null!;
        public virtual User Judge { get; set; } = null!;

        // Navigation property for feedback ratings
        public virtual ICollection<FeedbackRating> FeedbackRatings { get; set; } = [];
    }
}
