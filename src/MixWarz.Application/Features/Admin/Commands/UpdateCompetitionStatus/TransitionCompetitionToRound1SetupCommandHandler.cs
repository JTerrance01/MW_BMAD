using MediatR;
using MixWarz.Domain.Interfaces;
using MixWarz.Domain.Enums;


namespace MixWarz.Application.Features.Admin.Commands.UpdateCompetitionStatus
{
    public class TransitionCompetitionToRound1SetupCommandHandler :
        IRequestHandler<TransitionCompetitionToRound1SetupCommand, TransitionCompetitionToRound1SetupCommandResponse>
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ISubmissionRepository _submissionRepository;

        public TransitionCompetitionToRound1SetupCommandHandler(
            ICompetitionRepository competitionRepository,
            ISubmissionRepository submissionRepository)
        {
            _competitionRepository = competitionRepository;
            _submissionRepository = submissionRepository;
        }

        public async Task<TransitionCompetitionToRound1SetupCommandResponse> Handle(
            TransitionCompetitionToRound1SetupCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Get the competition
                var competition = await _competitionRepository.GetByIdAsync(request.CompetitionId);

                // Validate competition exists
                if (competition == null)
                {
                    return TransitionCompetitionToRound1SetupCommandResponse.FailureResponse(
                        $"Competition with ID {request.CompetitionId} not found");
                }

                // Validate current status is correct for transition
                if (competition.Status != CompetitionStatus.OpenForSubmissions)
                {
                    return TransitionCompetitionToRound1SetupCommandResponse.FailureResponse(
                        $"Competition is in {competition.Status} status. Only competitions in OpenForSubmissions status can be transitioned to Round 1 Setup");
                }

                // Validate submission deadline has passed
                if (DateTime.UtcNow < competition.EndDate)
                {
                    return TransitionCompetitionToRound1SetupCommandResponse.FailureResponse(
                        $"Submission deadline has not passed yet. The deadline is {competition.EndDate}");
                }

                // Get number of submissions
                var submissionCount = await _submissionRepository.GetSubmissionCountForCompetitionAsync(
                    competition.CompetitionId, cancellationToken);

                // Check minimum submissions required for voting (at least 3 submissions)
                if (submissionCount < 3)
                {
                    return TransitionCompetitionToRound1SetupCommandResponse.FailureResponse(
                        $"Not enough submissions for voting. Minimum 3 submissions required, but only {submissionCount} received");
                }

                // Update the competition status
                competition.Status = CompetitionStatus.VotingRound1Setup;
                await _competitionRepository.UpdateAsync(competition);

                return TransitionCompetitionToRound1SetupCommandResponse.SuccessResponse(
                    $"Competition '{competition.Title}' has been transitioned to Voting Round 1 Setup. {submissionCount} submissions will be processed for voting.");
            }
            catch (Exception ex)
            {
                return TransitionCompetitionToRound1SetupCommandResponse.FailureResponse(
                    $"An error occurred: {ex.Message}");
            }
        }
    }
}