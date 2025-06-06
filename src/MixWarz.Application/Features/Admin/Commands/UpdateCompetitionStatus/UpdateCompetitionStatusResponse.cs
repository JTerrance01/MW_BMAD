using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Commands.UpdateCompetitionStatus
{
    /// <summary>
    /// Response model for the update competition status operation
    /// </summary>
    public class UpdateCompetitionStatusResponse
    {
        /// <summary>
        /// Indicates whether the operation was successful
        /// </summary>
        public bool Success { get; set; }
        
        /// <summary>
        /// Message providing details about the operation result
        /// </summary>
        public string Message { get; set; }
        
        /// <summary>
        /// ID of the competition whose status was updated
        /// </summary>
        public int CompetitionId { get; set; }
        
        /// <summary>
        /// Previous status of the competition
        /// </summary>
        public CompetitionStatus OldStatus { get; set; }
        
        /// <summary>
        /// New status of the competition
        /// </summary>
        public CompetitionStatus NewStatus { get; set; }
    }
} 