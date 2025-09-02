using System.ComponentModel.DataAnnotations;

namespace MixWarz.Domain.Entities
{
    /// <summary>
    /// Represents a rating given by a participant on the feedback they received from a judge
    /// </summary>
    public class FeedbackRating
    {
        [Key]
        public int FeedbackRatingId { get; set; }

        [Required]
        public int JudgementId { get; set; }

        [Required]
        public required string ParticipantId { get; set; }

        [Required]
        public int Rating { get; set; }

        [Required]
        public DateTime RatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Judgement Judgement { get; set; } = null!;
        public virtual User Participant { get; set; } = null!;
    }
}
