using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MixWarz.Domain.Entities
{
    public class SubmissionVote
    {
        [Key]
        public int SubmissionVoteId { get; set; }

        [Required]
        public int SubmissionId { get; set; }

        [Required]
        public required string VoterId { get; set; }

        [Required]
        public int CompetitionId { get; set; }

        /// <summary>
        /// The rank assigned by the voter (1, 2, or 3). Nullable if a voter doesn't rank all 3.
        /// </summary>
        public int? Rank { get; set; }

        /// <summary>
        /// Calculated points based on rank (3 for 1st, 2 for 2nd, 1 for 3rd).
        /// </summary>
        public int Points { get; set; }

        /// <summary>
        /// Indicates which voting round this vote belongs to (1 or 2)
        /// </summary>
        [Required]
        public int VotingRound { get; set; }

        /// <summary>
        /// Timestamp of when the vote was cast.
        /// </summary>
        [Required]
        public DateTimeOffset VoteTime { get; set; } = DateTimeOffset.UtcNow;

        /// <summary>
        /// Optional comment provided by the voter explaining their choice
        /// </summary>
        public string? Comment { get; set; }

        // Navigation properties
        public virtual Submission Submission { get; set; } = null!;
        public virtual User Voter { get; set; } = null!;
        public virtual Competition Competition { get; set; } = null!;
    }
}