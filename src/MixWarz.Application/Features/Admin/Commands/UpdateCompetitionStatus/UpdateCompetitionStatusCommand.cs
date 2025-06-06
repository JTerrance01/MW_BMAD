using MediatR;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Commands.UpdateCompetitionStatus
{
    /// <summary>
    /// Command to update a competition's status
    /// </summary>
    public class UpdateCompetitionStatusCommand : IRequest<UpdateCompetitionStatusResponse>
    {
        /// <summary>
        /// ID of the competition to update
        /// </summary>
        public int CompetitionId { get; set; }
        
        /// <summary>
        /// New status to set for the competition
        /// </summary>
        public CompetitionStatus NewStatus { get; set; }
    }
} 