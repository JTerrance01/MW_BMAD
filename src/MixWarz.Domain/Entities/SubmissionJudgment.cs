using System.ComponentModel.DataAnnotations;

namespace MixWarz.Domain.Entities
{
    /// <summary>
    /// Represents a judge's overall evaluation of a submission
    /// </summary>
    public class SubmissionJudgment
    {
        [Key]
        public int SubmissionJudgmentId { get; set; }

        [Required]
        public int SubmissionId { get; set; }

        [Required]
        public required string JudgeId { get; set; }

        [Required]
        public int CompetitionId { get; set; }

        /// <summary>
        /// Indicates which voting round this judgment belongs to (1 or 2)
        /// </summary>
        [Required]
        public int VotingRound { get; set; }

        /// <summary>
        /// Calculated overall score based on weighted criteria scores
        /// </summary>
        public decimal? OverallScore { get; set; }

        /// <summary>
        /// Overall comments about the submission
        /// </summary>
        [StringLength(2000)]
        public string? OverallComments { get; set; }

        /// <summary>
        /// Timestamp of when the judgment was submitted
        /// </summary>
        [Required]
        public DateTimeOffset JudgmentTime { get; set; } = DateTimeOffset.UtcNow;

        /// <summary>
        /// Timestamp of when the judgment was last updated
        /// </summary>
        public DateTimeOffset? LastUpdated { get; set; }

        /// <summary>
        /// Whether this judgment has been completed and submitted
        /// </summary>
        [Required]
        public bool IsCompleted { get; set; } = false;

        // Navigation properties
        public virtual Submission Submission { get; set; }
        public virtual User Judge { get; set; }
        public virtual Competition Competition { get; set; }
        public virtual ICollection<CriteriaScore> CriteriaScores { get; set; } = new List<CriteriaScore>();
    }
}