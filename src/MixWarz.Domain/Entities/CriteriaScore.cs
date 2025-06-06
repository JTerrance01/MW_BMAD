using System.ComponentModel.DataAnnotations;

namespace MixWarz.Domain.Entities
{
    /// <summary>
    /// Represents a judge's score for a specific criteria of a submission
    /// </summary>
    public class CriteriaScore
    {
        [Key]
        public int CriteriaScoreId { get; set; }

        [Required]
        public int SubmissionJudgmentId { get; set; }

        [Required]
        public int JudgingCriteriaId { get; set; }

        /// <summary>
        /// The numeric score given for this criteria
        /// </summary>
        [Required]
        public decimal Score { get; set; }

        /// <summary>
        /// Optional comments specific to this criteria
        /// </summary>
        [StringLength(1000)]
        public string? Comments { get; set; }

        /// <summary>
        /// Timestamp of when this score was recorded
        /// </summary>
        [Required]
        public DateTimeOffset ScoreTime { get; set; } = DateTimeOffset.UtcNow;

        // Navigation properties
        public virtual SubmissionJudgment SubmissionJudgment { get; set; }
        public virtual JudgingCriteria JudgingCriteria { get; set; }
    }
}