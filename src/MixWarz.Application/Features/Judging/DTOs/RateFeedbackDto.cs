using System.ComponentModel.DataAnnotations;

namespace MixWarz.Application.Features.Judging.DTOs
{
    /// <summary>
    /// DTO for rating the quality of feedback received from a judge
    /// </summary>
    public class RateFeedbackDto
    {
        /// <summary>
        /// ID of the judgement being rated
        /// </summary>
        [Required]
        public int JudgementId { get; set; }

        /// <summary>
        /// ID of the participant rating the feedback (typically the submission owner)
        /// </summary>
        [Required]
        public required string ParticipantId { get; set; }

        /// <summary>
        /// Rating given to the feedback quality
        /// </summary>
        [Required]
        public int Rating { get; set; }
    }
}
