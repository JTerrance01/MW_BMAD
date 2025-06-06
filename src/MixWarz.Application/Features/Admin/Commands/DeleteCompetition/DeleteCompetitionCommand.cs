using MediatR;

namespace MixWarz.Application.Features.Admin.Commands.DeleteCompetition
{
    public class DeleteCompetitionCommand : IRequest<DeleteCompetitionResponse>
    {
        public int CompetitionId { get; set; }
    }
}