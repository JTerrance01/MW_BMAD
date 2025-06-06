using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Commands.CreateCompetition
{
    /// <summary>
    /// Response for the CreateCompetitionCommand
    /// </summary>
    public class CreateCompetitionResponse
    {
        /// <summary>
        /// Indicates whether the operation was successful
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// A message describing the result of the operation
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// The ID of the competition that was created or updated
        /// </summary>
        public int CompetitionId { get; set; }

        /// <summary>
        /// The title of the created/updated competition
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// The status of the created/updated competition
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// URL to the cover image of the competition
        /// </summary>
        public string CoverImageUrl { get; set; }

        /// <summary>
        /// Validation errors if any occurred during creation/update
        /// </summary>
        public List<string> Errors { get; set; } = new List<string>();

        public Genre Genre { get; set; }
        public DateTime SubmissionDeadline { get; set; }
        public string SongCreator { get; set; }
    }
}