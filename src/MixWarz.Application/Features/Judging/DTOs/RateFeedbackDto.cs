using System.ComponentModel.DataAnnotations;

namespace MixWarz.Application.Features.Judging.DTOs
{
    /// <summary>
    /// DTO for rating the helpfulness of feedback received from a judge
    /// </summary>
    public class RateFeedbackDto
    {
        /// <summary>
        /// ID of the judgement being rated
        /// </summary>
        [Required]
        public int JudgementId { get; set; }

        /// <summary>
        /// ID of the user rating the feedback (typically the submission owner)
        /// </summary>
        [Required]
        public required string RaterUserId { get; set; }

        /// <summary>
        /// Whether the feedback was helpful or not
        /// </summary>
        [Required]
        public bool IsHelpful { get; set; }
    }
}
