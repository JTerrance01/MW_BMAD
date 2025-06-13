using System.ComponentModel.DataAnnotations;
using MixWarz.Domain.Enums;

namespace MixWarz.Domain.Entities
{
    public class Competition
    {
        [Key]
        public int CompetitionId { get; set; }

        [Required]
        public required string Title { get; set; }

        [Required]
        public required string Description { get; set; }

        [Required]
        public required string RulesText { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public required string PrizeDetails { get; set; }

        [Required]
        public CompetitionStatus Status { get; set; } = CompetitionStatus.Upcoming;

        [Required]
        public required string OrganizerUserId { get; set; }

        [Required]
        public DateTime CreationDate { get; set; } = DateTime.UtcNow;

        // Date when competition is actually completed (Round 2 tallying finished)
        public DateTime? CompletedDate { get; set; }

        public string? CoverImageUrl { get; set; }

        public string? MultitrackZipUrl { get; set; }

        public string? MixedTrackUrl { get; set; }

        public string? SourceTrackUrl { get; set; }

        [Required]
        public Genre Genre { get; set; } = Genre.Unknown;

        [Required]
        public DateTime SubmissionDeadline { get; set; }

        // Automated competition lifecycle dates
        [Required]
        public DateTime Round1VotingEndDate { get; set; }

        [Required]
        public DateTime Round2VotingEndDate { get; set; }

        // Comma-separated list of artists, writers, producers
        public string SongCreator { get; set; }

        // Navigation properties
        public virtual User Organizer { get; set; }
        public virtual ICollection<Submission> Submissions { get; set; } = [];
    }
}