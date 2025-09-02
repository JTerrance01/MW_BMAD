using System.ComponentModel.DataAnnotations;

namespace MixWarz.Application.Features.Judging.DTOs
{
    /// <summary>
    /// DTO for submitting a judgement on an assigned submission
    /// </summary>
    public class SubmitJudgementDto
    {
        /// <summary>
        /// ID of the submission being judged
        /// </summary>
        [Required]
        public int SubmissionId { get; set; }

        /// <summary>
        /// ID of the user submitting the judgement (the judge)
        /// </summary>
        [Required]
        public required string JudgeId { get; set; }

        /// <summary>
        /// Score given to the submission (1-10)
        /// </summary>
        [Required]
        [Range(1, 10, ErrorMessage = "Score must be between 1 and 10")]
        public int Score { get; set; }

        /// <summary>
        /// Comments provided to the submitter
        /// </summary>
        [Required]
        public required string Comments { get; set; }
    }
}
