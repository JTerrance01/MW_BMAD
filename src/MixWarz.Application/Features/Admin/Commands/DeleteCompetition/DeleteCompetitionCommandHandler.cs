using MediatR;
using MixWarz.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.Admin.Commands.DeleteCompetition
{
    public class DeleteCompetitionCommandHandler : IRequestHandler<DeleteCompetitionCommand, DeleteCompetitionResponse>
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ILogger<DeleteCompetitionCommandHandler> _logger;

        public DeleteCompetitionCommandHandler(
            ICompetitionRepository competitionRepository,
            ILogger<DeleteCompetitionCommandHandler> logger)
        {
            _competitionRepository = competitionRepository;
            _logger = logger;
        }

        public async Task<DeleteCompetitionResponse> Handle(DeleteCompetitionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var competition = await _competitionRepository.GetByIdAsync(request.CompetitionId);
                if (competition == null)
                {
                    return new DeleteCompetitionResponse
                    {
                        Success = false,
                        Message = $"Competition with ID {request.CompetitionId} not found."
                    };
                }
                await _competitionRepository.DeleteAsync(request.CompetitionId);
                return new DeleteCompetitionResponse
                {
                    Success = true,
                    Message = "Competition deleted successfully."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting competition");
                return new DeleteCompetitionResponse
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                };
            }
        }
    }
}