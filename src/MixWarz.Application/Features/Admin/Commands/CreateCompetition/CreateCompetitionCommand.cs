using System;
using System.Collections.Generic;
using MediatR;
using Microsoft.AspNetCore.Http;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Commands.CreateCompetition
{
    /// <summary>
    /// Command for admin to create or update a competition
    /// </summary>
    public class CreateCompetitionCommand : IRequest<CreateCompetitionResponse>
    {
        /// <summary>
        /// ID is null for new competitions, populated for updates
        /// </summary>
        public int? CompetitionId { get; set; }

        /// <summary>
        /// Added for debugging - quick way to check if this is an update operation
        /// </summary>
        public bool IsUpdateOperation => CompetitionId.HasValue && CompetitionId > 0;

        /// <summary>
        /// Title of the competition
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Description of the competition
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Rules of the competition in HTML format
        /// </summary>
        public string Rules { get; set; }

        /// <summary>
        /// Start date of the competition
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// End date of the competition
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Prize details for the competition
        /// </summary>
        public string PrizeDetails { get; set; }

        /// <summary>
        /// Status of the competition
        /// </summary>
        public CompetitionStatus Status { get; set; }

        /// <summary>
        /// User ID of the organizer
        /// </summary>
        public string OrganizerUserId { get; set; }

        /// <summary>
        /// Cover image file for the competition
        /// </summary>
        public IFormFile CoverImage { get; set; }

        /// <summary>
        /// Multitrack ZIP file containing the audio tracks for the competition
        /// </summary>
        public IFormFile MultitrackZipFile { get; set; }

        /// <summary>
        /// Source track file for users to download and use in mixing
        /// </summary>
        public IFormFile SourceTrackFile { get; set; }

        /// <summary>
        /// URL for an existing cover image (alternative to uploading a new one)
        /// </summary>
        public string ImageUrl { get; set; }

        /// <summary>
        /// URL for an existing multitrack ZIP file (alternative to uploading a new one)
        /// </summary>
        public string MultitrackZipUrl { get; set; }

        /// <summary>
        /// URL for an existing source track file (alternative to uploading a new one)
        /// </summary>
        public string SourceTrackUrl { get; set; }

        /// <summary>
        /// List of requirements for the competition
        /// </summary>
        public List<string> Requirements { get; set; } = new List<string>();

        /// <summary>
        /// Genre of the competition
        /// </summary>
        public Genre Genre { get; set; }

        /// <summary>
        /// Submission deadline for the competition
        /// </summary>
        public DateTime SubmissionDeadline { get; set; }

        /// <summary>
        /// Song creator for the competition
        /// </summary>
        public string SongCreator { get; set; }
    }
}