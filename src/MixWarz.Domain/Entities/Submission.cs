using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MixWarz.Domain.Enums;

namespace MixWarz.Domain.Entities
{
    public class Submission
    {
        [Key]
        public int SubmissionId { get; set; }

        [Required]
        public int CompetitionId { get; set; }

        [Required]
        public required string UserId { get; set; }

        [Required]
        public DateTime SubmissionDate { get; set; } = DateTime.UtcNow;

        [Required]
        public required string AudioFilePath { get; set; }

        [Required]
        public required string MixTitle { get; set; }

        public string? MixDescription { get; set; }

        public string? Feedback { get; set; }

        [Required]
        public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

        // New voting-related fields

        /// <summary>
        /// Indicates if the submission is eligible for Round 1 voting
        /// </summary>
        public bool IsEligibleForRound1Voting { get; set; } = true;

        /// <summary>
        /// Indicates if the submission is eligible for Round 2 voting
        /// </summary>
        public bool IsEligibleForRound2Voting { get; set; } = false;

        /// <summary>
        /// Indicates if the submission has advanced to Round 2
        /// </summary>
        public bool AdvancedToRound2 { get; set; } = false;

        /// <summary>
        /// Indicates if the submission is disqualified (and reason could be stored in Feedback)
        /// </summary>
        public bool IsDisqualified { get; set; } = false;

        /// <summary>
        /// Indicates if this submission is the competition winner
        /// </summary>
        public bool IsWinner { get; set; } = false;

        /// <summary>
        /// Final ranking (filled after completion of Round 2)
        /// </summary>
        public int? FinalRank { get; set; }

        /// <summary>
        /// Score from Round 1 voting
        /// </summary>
        [Column(TypeName = "decimal(5, 2)")]
        public decimal? Round1Score { get; set; }

        /// <summary>
        /// Score from Round 2 voting
        /// </summary>
        [Column(TypeName = "decimal(5, 2)")]
        public decimal? Round2Score { get; set; }

        /// <summary>
        /// Final total score combining Round 1 and Round 2 (if applicable)
        /// </summary>
        [Column(TypeName = "decimal(5, 2)")]
        public decimal? FinalScore { get; set; }

        // Navigation properties
        public virtual Competition Competition { get; set; }
        public virtual User User { get; set; }

        // Navigation property for votes
        public virtual ICollection<SubmissionVote> Votes { get; set; } = [];
    }
}