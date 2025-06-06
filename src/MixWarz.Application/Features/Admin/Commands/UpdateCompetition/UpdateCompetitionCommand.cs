using System;
using System.Collections.Generic;
using MediatR;
using Microsoft.AspNetCore.Http;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Commands.UpdateCompetition
{
    /// <summary>
    /// Command for admin to update an existing competition
    /// </summary>
    public class UpdateCompetitionCommand : IRequest<UpdateCompetitionResponse>
    {
        /// <summary>
        /// ID of the competition to update
        /// </summary>
        public int CompetitionId { get; set; }

        /// <summary>
        /// Title of the competition (optional for update)
        /// </summary>
        public string? Title { get; set; }

        /// <summary>
        /// Description of the competition (optional for update)
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Rules of the competition in HTML format (optional for update)
        /// </summary>
        public string? Rules { get; set; }

        /// <summary>
        /// Start date of the competition (optional for update)
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// End date of the competition (optional for update)
        /// </summary>
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// Prize details for the competition (optional for update)
        /// </summary>
        public string? PrizeDetails { get; set; }

        /// <summary>
        /// Status of the competition (optional for update)
        /// </summary>
        public CompetitionStatus? Status { get; set; }

        /// <summary>
        /// Cover image file for the competition (optional for update)
        /// </summary>
        public IFormFile? CoverImage { get; set; }

        /// <summary>
        /// Multitrack ZIP file containing the audio tracks for the competition (optional for update)
        /// </summary>
        public IFormFile? MultitrackZipFile { get; set; }

        /// <summary>
        /// Source track file for users to download and use in mixing (optional for update)
        /// </summary>
        public IFormFile? SourceTrackFile { get; set; }

        /// <summary>
        /// URL for an existing cover image (alternative to uploading a new one, optional for update)
        /// </summary>
        public string? ImageUrl { get; set; }

        /// <summary>
        /// URL for an existing multitrack ZIP file (alternative to uploading a new one, optional for update)
        /// </summary>
        public string? MultitrackZipUrl { get; set; }

        /// <summary>
        /// URL for an existing source track file (alternative to uploading a new one, optional for update)
        /// </summary>
        public string? SourceTrackUrl { get; set; }

        /// <summary>
        /// List of requirements for the competition (optional for update)
        /// </summary>
        public List<string>? Requirements { get; set; }

        /// <summary>
        /// Genre of the competition (optional for update)
        /// </summary>
        public Genre? Genre { get; set; }

        /// <summary>
        /// Submission deadline for the competition (optional for update)
        /// </summary>
        public DateTime? SubmissionDeadline { get; set; }

        /// <summary>
        /// Song creator for the competition (optional for update)
        /// </summary>
        public string? SongCreator { get; set; }

        /// <summary>
        /// Organizer User ID (optional for update - preserve existing if not provided)
        /// </summary>
        public string? OrganizerUserId { get; set; }
    }
}