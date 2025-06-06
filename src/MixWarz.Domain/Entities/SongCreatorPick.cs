using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MixWarz.Domain.Entities
{
    /// <summary>
    /// Represents a pick by the song creator in the final round of a competition
    /// </summary>
    public class SongCreatorPick
    {
        [Key]
        public int PickId { get; set; }

        [Required]
        public int CompetitionId { get; set; }

        [Required]
        public int SubmissionId { get; set; }

        /// <summary>
        /// The rank assigned to this submission by the Song Creator (1 = 1st place, 2 = 2nd place, 3 = 3rd place)
        /// </summary>
        [Required]
        public int Rank { get; set; }

        /// <summary>
        /// Comments or feedback from the Song Creator about this submission
        /// </summary>
        [Required]
        public string Comment { get; set; } = string.Empty;

        /// <summary>
        /// Date and time when this pick was recorded
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Competition Competition { get; set; }
        public virtual Submission Submission { get; set; }
    }
}