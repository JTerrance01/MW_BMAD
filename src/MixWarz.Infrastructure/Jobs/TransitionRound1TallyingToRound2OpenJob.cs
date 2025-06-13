using Microsoft.Extensions.Logging;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;
using Quartz;

namespace MixWarz.Infrastructure.Jobs
{
    /// <summary>
    /// Job to transition competitions from VotingRound1Tallying to VotingRound2Open
    /// This job runs shortly after Round 1 tallying is completed to set up Round 2 voting
    /// </summary>
    [DisallowConcurrentExecution]
    public class TransitionRound1TallyingToRound2OpenJob : IJob
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IRound2VotingService _round2VotingService;
        private readonly ILogger<TransitionRound1TallyingToRound2OpenJob> _logger;

        public TransitionRound1TallyingToRound2OpenJob(
            ICompetitionRepository competitionRepository,
            IRound2VotingService round2VotingService,
            ILogger<TransitionRound1TallyingToRound2OpenJob> logger)
        {
            _competitionRepository = competitionRepository ?? throw new ArgumentNullException(nameof(competitionRepository));
            _round2VotingService = round2VotingService ?? throw new ArgumentNullException(nameof(round2VotingService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task Execute(IJobExecutionContext context)
        {
            try
            {
                _logger.LogInformation("TransitionRound1TallyingToRound2OpenJob - Starting execution");

                // Query for competitions with Status == VotingRound1Tallying
                // Since tallying is now immediate, this job can run shortly after to check for completed tallies
                var tallyingCompetitions = await _competitionRepository.GetByStatusAsync(CompetitionStatus.VotingRound1Tallying, 1, 1000);

                _logger.LogInformation("Found {Count} competitions in VotingRound1Tallying status ready for Round 2 setup",
                    tallyingCompetitions.Count());

                if (!tallyingCompetitions.Any())
                {
                    _logger.LogInformation("No competitions ready to transition from VotingRound1Tallying to Round 2");
                    return;
                }

                foreach (var competition in tallyingCompetitions)
                {
                    try
                    {
                        _logger.LogInformation("Setting up Round 2 voting for competition {CompetitionId} '{Title}'",
                            competition.CompetitionId, competition.Title);

                        // Step 1: Change status to VotingRound2Setup
                        competition.Status = CompetitionStatus.VotingRound2Setup;
                        await _competitionRepository.UpdateAsync(competition);
                        _logger.LogInformation("Updated competition {CompetitionId} status to VotingRound2Setup",
                            competition.CompetitionId);

                        // Step 2: Call Round2VotingService.SetupRound2VotingAsync
                        // This method returns the number of submissions set up for Round 2 voting
                        var submissionCount = await _round2VotingService.SetupRound2VotingAsync(competition.CompetitionId);
                        
                        if (submissionCount > 0)
                        {
                            _logger.LogInformation("Successfully set up Round 2 voting for competition {CompetitionId}. {SubmissionCount} submissions available for voting.",
                                competition.CompetitionId, submissionCount);

                            // Step 3: Change status to VotingRound2Open
                            competition.Status = CompetitionStatus.VotingRound2Open;
                            await _competitionRepository.UpdateAsync(competition);

                            _logger.LogInformation("Successfully transitioned competition {CompetitionId} to VotingRound2Open. " +
                                "Round 2 voting is now active with Round2VotingEndDate: {EndDate}",
                                competition.CompetitionId, competition.Round2VotingEndDate);
                        }
                        else
                        {
                            _logger.LogWarning("Failed to set up Round 2 voting for competition {CompetitionId}: No submissions available for Round 2 voting",
                                competition.CompetitionId);
                            // Keep competition in VotingRound2Setup status for manual intervention
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error transitioning competition {CompetitionId} from VotingRound1Tallying to Round 2",
                            competition.CompetitionId);
                        // Continue with other competitions even if one fails
                    }
                }

                _logger.LogInformation("TransitionRound1TallyingToRound2OpenJob - Completed execution");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in TransitionRound1TallyingToRound2OpenJob execution");
                throw; // Re-throw to let Quartz handle the error
            }
        }
    }
}