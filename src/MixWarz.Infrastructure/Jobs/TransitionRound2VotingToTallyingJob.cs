using Microsoft.Extensions.Logging;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;
using Quartz;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MixWarz.Infrastructure.Jobs
{
    /// <summary>
    /// Job to transition competitions from VotingRound2Open to VotingRound2Tallying when the voting deadline has passed
    /// </summary>
    [DisallowConcurrentExecution]
    public class TransitionRound2VotingToTallyingJob : ICompetitionTransitionJob
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IRound2VotingService _round2VotingService;
        private readonly ILogger<TransitionRound2VotingToTallyingJob> _logger;
        private readonly QuartzJobConfiguration _jobConfiguration;

        // Default Round 2 voting period in days (used as fallback)
        private const int DefaultRound2VotingPeriodDays = 5;

        public TransitionRound2VotingToTallyingJob(
            ICompetitionRepository competitionRepository,
            IRound2VotingService round2VotingService,
            ILogger<TransitionRound2VotingToTallyingJob> logger,
            QuartzJobConfiguration jobConfiguration = null)
        {
            _competitionRepository = competitionRepository;
            _round2VotingService = round2VotingService;
            _logger = logger;
            _jobConfiguration = jobConfiguration;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            _logger.LogInformation("Starting TransitionRound2VotingToTallyingJob at {time}", DateTimeOffset.Now);

            try
            {
                await ProcessDueCompetitionsAsync();
                _logger.LogInformation("Completed TransitionRound2VotingToTallyingJob successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing TransitionRound2VotingToTallyingJob");
                throw;
            }
        }

        public async Task ProcessDueCompetitionsAsync()
        {
            // Get all competitions in Round 2 Voting status
            var competitions = await _competitionRepository.GetByStatusAsync(CompetitionStatus.VotingRound2Open);

            // Determine which competitions have reached their Round2VotingEndDate
            var now = DateTime.UtcNow;
            var dueCompetitions = competitions.Where(c =>
                // Using the new Round2VotingEndDate property for automated lifecycle
                c.Round2VotingEndDate <= now
            ).ToList();

            _logger.LogInformation("Found {total} competitions in VotingRound2Open status, {due} ready for tallying based on Round2VotingEndDate",
                competitions.Count(), dueCompetitions.Count);

            foreach (var competition in dueCompetitions)
            {
                try
                {
                    _logger.LogInformation(
                        "Transitioning competition {competitionId} ({title}) from VotingRound2Open to VotingRound2Tallying. Round2VotingEndDate: {endDate}",
                        competition.CompetitionId, competition.Title, competition.Round2VotingEndDate);

                    // Update competition status to VotingRound2Tallying
                    competition.Status = CompetitionStatus.VotingRound2Tallying;
                    await _competitionRepository.UpdateAsync(competition);

                    // Immediately tally the votes and determine the winner
                    // Note: TallyRound2VotesAsync handles final status transitions internally
                    var (winnerId, isTie) = await _round2VotingService.TallyRound2VotesAsync(competition.CompetitionId);

                    if (isTie)
                    {
                        // TallyRound2VotesAsync detected an unresolvable tie
                        // Set status to RequiresManualWinnerSelection for manual intervention
                        competition.Status = CompetitionStatus.RequiresManualWinnerSelection;
                        await _competitionRepository.UpdateAsync(competition);

                        _logger.LogInformation(
                            "Competition {competitionId} has an unresolvable tie in Round 2. Status set to RequiresManualWinnerSelection. Manual winner selection required.",
                            competition.CompetitionId);
                    }
                    else if (winnerId > 0)
                    {
                        // TallyRound2VotesAsync successfully determined a winner and already set status to Completed
                        _logger.LogInformation(
                            "Competition {competitionId} automatically completed with winner submission ID {winnerId}. Status set to Completed.",
                            competition.CompetitionId, winnerId);
                    }
                    else
                    {
                        // Unexpected case - no winner and no tie detected
                        _logger.LogWarning(
                            "Competition {competitionId} had no valid winner determined and no tie detected. Setting status to RequiresManualWinnerSelection.",
                            competition.CompetitionId);

                        competition.Status = CompetitionStatus.RequiresManualWinnerSelection;
                        await _competitionRepository.UpdateAsync(competition);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Error transitioning competition {competitionId} from VotingRound2Open to Tallying",
                        competition.CompetitionId);
                }
            }
        }
    }
}