using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MixWarz.Domain.Entities
{
    /// <summary>
    /// Represents the assignment of a user to vote on a specific group of submissions in Round 1
    /// </summary>
    public class Round1Assignment
    {
        [Key]
        public int Round1AssignmentId { get; set; }

        [Required]
        public int CompetitionId { get; set; }

        [Required]
        public required string VoterId { get; set; }

        /// <summary>
        /// The group number that the voter belongs to (their own submission's group)
        /// </summary>
        [Required]
        public int VoterGroupNumber { get; set; }

        /// <summary>
        /// The group number that the voter is assigned to vote on
        /// </summary>
        [Required]
        public int AssignedGroupNumber { get; set; }

        /// <summary>
        /// Indicates whether the voter has completed their voting assignment
        /// </summary>
        [Required]
        public bool HasVoted { get; set; } = false;

        /// <summary>
        /// The date and time when the user completed their voting
        /// </summary>
        public DateTimeOffset? VotingCompletedDate { get; set; }

        // Navigation properties
        public virtual Competition Competition { get; set; }
        public virtual User Voter { get; set; }
    }
}