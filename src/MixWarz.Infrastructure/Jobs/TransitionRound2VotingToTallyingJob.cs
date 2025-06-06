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

            // Get the configured voting periods
            int round1VotingPeriodDays = _jobConfiguration?.GetRound1VotingDurationDays() ??
                TransitionRound1VotingToTallyingJob.DefaultRound1VotingPeriodDays;

            int round2VotingPeriodDays = _jobConfiguration?.GetRound2VotingDurationDays() ?? DefaultRound2VotingPeriodDays;

            _logger.LogInformation("Using Round 2 voting period of {days} days (after Round 1 period of {round1Days} days)",
                round2VotingPeriodDays, round1VotingPeriodDays);

            // Determine which competitions have completed their voting period
            var now = DateTime.UtcNow;
            var dueCompetitions = competitions.Where(c =>
                // Calculate an estimated Round 2 start date from EndDate + Round1VotingPeriodDays
                c.EndDate.AddDays(round1VotingPeriodDays + round2VotingPeriodDays) < now
            ).ToList();

            foreach (var competition in dueCompetitions)
            {
                try
                {
                    _logger.LogInformation(
                        "Transitioning competition {competitionId} ({title}) from VotingRound2Open to VotingRound2Tallying",
                        competition.CompetitionId, competition.Title);

                    // Update competition status
                    competition.Status = CompetitionStatus.VotingRound2Tallying;
                    await _competitionRepository.UpdateAsync(competition);

                    // Tally the votes and determine the winner
                    (int winnerId, bool isTie) = await _round2VotingService.TallyRound2VotesAsync(competition.CompetitionId);

                    if (isTie)
                    {
                        // If there's a tie, we need manual intervention from the song creator
                        competition.Status = CompetitionStatus.RequiresManualWinnerSelection;
                        await _competitionRepository.UpdateAsync(competition);

                        _logger.LogInformation(
                            "Competition {competitionId} has a tie in Round 2. Status set to RequiresManualWinnerSelection",
                            competition.CompetitionId);
                    }
                    else if (winnerId > 0)
                    {
                        // Update winner status and transition to Completed
                        await _round2VotingService.SetCompetitionWinnerAsync(competition.CompetitionId, winnerId);

                        competition.Status = CompetitionStatus.Completed;
                        await _competitionRepository.UpdateAsync(competition);

                        _logger.LogInformation(
                            "Competition {competitionId} completed with winner submission ID {winnerId}",
                            competition.CompetitionId, winnerId);
                    }
                    else
                    {
                        _logger.LogWarning(
                            "Competition {competitionId} had no valid winner determined. Manual intervention required.",
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