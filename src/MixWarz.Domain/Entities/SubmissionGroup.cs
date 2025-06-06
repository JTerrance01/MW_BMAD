using System.ComponentModel.DataAnnotations;

namespace MixWarz.Domain.Entities
{
    /// <summary>
    /// Represents a submission's assignment to a specific group in Round 1 voting
    /// </summary>
    public class SubmissionGroup
    {
        [Key]
        public int SubmissionGroupId { get; set; }

        [Required]
        public int CompetitionId { get; set; }

        [Required]
        public int SubmissionId { get; set; }

        [Required]
        public int GroupNumber { get; set; }

        /// <summary>
        /// Total points received by this submission in Round 1
        /// </summary>
        public int? TotalPoints { get; set; }

        /// <summary>
        /// Count of 1st place votes received (used for tie-breaking)
        /// </summary>
        public int? FirstPlaceVotes { get; set; }

        /// <summary>
        /// Count of 2nd place votes received (used for tie-breaking)
        /// </summary>
        public int? SecondPlaceVotes { get; set; }

        /// <summary>
        /// Count of 3rd place votes received (used for tie-breaking)
        /// </summary>
        public int? ThirdPlaceVotes { get; set; }

        /// <summary>
        /// Calculated rank within the group after tallying
        /// </summary>
        public int? RankInGroup { get; set; }

        // Navigation properties
        public virtual Competition Competition { get; set; }
        public virtual Submission Submission { get; set; }
    }
}