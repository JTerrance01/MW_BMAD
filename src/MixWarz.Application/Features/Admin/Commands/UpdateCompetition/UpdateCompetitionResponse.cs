using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Commands.UpdateCompetition
{
    /// <summary>
    /// Response for the UpdateCompetitionCommand
    /// </summary>
    public class UpdateCompetitionResponse
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
        /// The ID of the competition that was updated
        /// </summary>
        public int CompetitionId { get; set; }

        /// <summary>
        /// The title of the updated competition
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// The status of the updated competition
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// URL to the cover image of the competition (may be the existing one or a new one)
        /// </summary>
        public string CoverImageUrl { get; set; }

        /// <summary>
        /// URL to the multitrack zip file of the competition (may be the existing one or a new one)
        /// </summary>
        public string MultitrackZipUrl { get; set; }

        /// <summary>
        /// URL to the source track file of the competition (may be the existing one or a new one)
        /// </summary>
        public string SourceTrackUrl { get; set; }

        /// <summary>
        /// Validation errors if any occurred during update
        /// </summary>
        public List<string> Errors { get; set; } = new List<string>();

        // Include other relevant updated fields in the response if needed by the client
        public Genre Genre { get; set; }
        public DateTime SubmissionDeadline { get; set; }
        public string SongCreator { get; set; }
    }
}