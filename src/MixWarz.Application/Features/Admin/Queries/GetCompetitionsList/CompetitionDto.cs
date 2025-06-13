using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Queries.GetCompetitionsList
{
    /// <summary>
    /// Data transfer object for competition information in admin view
    /// </summary>
    public class CompetitionDto
    {
        /// <summary>
        /// Competition's unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Competition title
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Short description of the competition
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Organizer's user ID
        /// </summary>
        public string OrganizerId { get; set; }

        /// <summary>
        /// Organizer's username
        /// </summary>
        public string OrganizerUsername { get; set; }

        /// <summary>
        /// Current status of the competition
        /// </summary>
        public CompetitionStatus Status { get; set; }

        /// <summary>
        /// Date when the competition starts accepting submissions
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// Date when the competition stops accepting submissions
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Date when the judging period starts
        /// </summary>
        public DateTime JudgingStartDate { get; set; }

        /// <summary>
        /// Date when the judging period ends and results are published
        /// </summary>
        public DateTime JudgingEndDate { get; set; }

        /// <summary>
        /// Path to the competition's cover image on file storage
        /// </summary>
        public string CoverImageUrl { get; set; }

        /// <summary>
        /// Rules and guidelines for the competition
        /// </summary>
        public string Rules { get; set; }

        /// <summary>
        /// Prizes offered for winners
        /// </summary>
        public string Prizes { get; set; }

        /// <summary>
        /// Prize details for the competition (actual database field)
        /// </summary>
        public string PrizeDetails { get; set; }

        /// <summary>
        /// URL to the multitrack ZIP file containing source audio tracks
        /// </summary>
        public string? MultitrackZipUrl { get; set; }

        /// <summary>
        /// URL to the mixed track MP3 file for preview
        /// </summary>
        public string? MixedTrackUrl { get; set; }

        /// <summary>
        /// URL to the source track file for download
        /// </summary>
        public string? SourceTrackUrl { get; set; }

        /// <summary>
        /// Genre of the competition
        /// </summary>
        public Genre Genre { get; set; }

        /// <summary>
        /// Deadline for submission entries
        /// </summary>
        public DateTime SubmissionDeadline { get; set; }

        /// <summary>
        /// Automated date when Round 1 voting period ends
        /// </summary>
        public DateTime Round1VotingEndDate { get; set; }

        /// <summary>
        /// Automated date when Round 2 voting period ends
        /// </summary>
        public DateTime Round2VotingEndDate { get; set; }

        /// <summary>
        /// Comma-separated list of artists, writers, producers
        /// </summary>
        public string? SongCreator { get; set; }

        /// <summary>
        /// Number of submissions received for this competition
        /// </summary>
        public int NumberOfSubmissions { get; set; }

        /// <summary>
        /// Date when the competition was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Date when the competition was last updated
        /// </summary>
        public DateTime? UpdatedAt { get; set; }
    }
}