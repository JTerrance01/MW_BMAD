using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MixWarz.Domain.Entities
{
    /// <summary>
    /// Represents a judgement submitted by a judge for an assigned submission in the Hybrid Fair-Play Tournament
    /// </summary>
    public class Judgement
    {
        [Key]
        public int JudgementId { get; set; }

        [Required]
        public int SubmissionId { get; set; }

        [Required]
        public required string JudgeId { get; set; }

        /// <summary>
        /// Score given to the submission (0 = not yet judged, 1-10 = actual score)
        /// </summary>
        [Range(0, 10)]
        public int Score { get; set; }

        /// <summary>
        /// Comments provided by the judge (empty until judge submits their judgement)
        /// </summary>
        public string Comments { get; set; } = string.Empty;

        [Required]
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Submission Submission { get; set; } = null!;
        public virtual User Judge { get; set; } = null!;

        // Navigation property for feedback ratings
        public virtual ICollection<FeedbackRating> FeedbackRatings { get; set; } = [];

        /// <summary>
        /// Indicates whether this judgement has been completed by the judge
        /// </summary>
        public bool IsCompleted => Score > 0 && !string.IsNullOrWhiteSpace(Comments);

        /// <summary>
        /// Validates that the judgement data is valid for submission
        /// </summary>
        public void ValidateForSubmission()
        {
            if (Score < 1 || Score > 10)
                throw new ArgumentException("Score must be between 1 and 10 when submitting a judgement");

            if (string.IsNullOrWhiteSpace(Comments))
                throw new ArgumentException("Comments are required when submitting a judgement");
        }
    }
}
