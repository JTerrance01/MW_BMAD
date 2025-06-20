using Microsoft.Extensions.Logging;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;
using Quartz;


namespace MixWarz.Infrastructure.Jobs
{
    /// <summary>
    /// Job to transition competitions from VotingRound1Open to VotingRound1Tallying when the voting deadline has passed
    /// </summary>
    [DisallowConcurrentExecution]
    public class TransitionRound1VotingToTallyingJob : ICompetitionTransitionJob
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IRound1AssignmentService _round1AssignmentService;
        private readonly ILogger<TransitionRound1VotingToTallyingJob> _logger;
        private readonly QuartzJobConfiguration _jobConfiguration;

        // Default Round 1 voting period in days (used as fallback)
        public const int DefaultRound1VotingPeriodDays = 7;

        public TransitionRound1VotingToTallyingJob(
            ICompetitionRepository competitionRepository,
            IRound1AssignmentService round1AssignmentService,
            ILogger<TransitionRound1VotingToTallyingJob> logger,
            QuartzJobConfiguration jobConfiguration = null)
        {
            _competitionRepository = competitionRepository;
            _round1AssignmentService = round1AssignmentService;
            _logger = logger;
            _jobConfiguration = jobConfiguration;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            _logger.LogInformation("Starting TransitionRound1VotingToTallyingJob at {time}", DateTimeOffset.Now);

            try
            {
                await ProcessDueCompetitionsAsync();
                _logger.LogInformation("Completed TransitionRound1VotingToTallyingJob successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing TransitionRound1VotingToTallyingJob");
                throw;
            }
        }

        public async Task ProcessDueCompetitionsAsync()
        {
            // Get all competitions in Round 1 Voting status
            var competitions = await _competitionRepository.GetByStatusAsync(CompetitionStatus.VotingRound1Open);

            // Determine which competitions have reached their Round1VotingEndDate
            var now = DateTime.UtcNow;
            var dueCompetitions = competitions.Where(c =>
                // Using the new Round1VotingEndDate property for automated lifecycle
                c.Round1VotingEndDate <= now
            ).ToList();

            _logger.LogInformation("Found {total} competitions in VotingRound1Open status, {due} ready for tallying based on Round1VotingEndDate",
                competitions.Count(), dueCompetitions.Count);

            foreach (var competition in dueCompetitions)
            {
                try
                {
                    _logger.LogInformation(
                        "Transitioning competition {competitionId} ({title}) from VotingRound1Open to VotingRound1Tallying. Round1VotingEndDate: {endDate}",
                        competition.CompetitionId, competition.Title, competition.Round1VotingEndDate);

                    // Update competition status to VotingRound1Tallying
                    competition.Status = CompetitionStatus.VotingRound1Tallying;
                    await _competitionRepository.UpdateAsync(competition);

                    // Immediately disqualify any participants who didn't vote
                    int disqualified = await _round1AssignmentService.DisqualifyNonVotersAsync(competition.CompetitionId);
                    _logger.LogInformation("Disqualified {disqualified} non-voting participants for competition {competitionId}",
                        disqualified, competition.CompetitionId);

                    // Immediately tally the votes and determine advancement to Round 2
                    int advanced = await _round1AssignmentService.TallyVotesAndDetermineAdvancementAsync(competition.CompetitionId);
                    _logger.LogInformation("Tallied votes for competition {competitionId}, {advanced} submissions advanced to Round 2",
                        advanced, competition.CompetitionId);

                    _logger.LogInformation(
                        "Successfully completed Round 1 tallying for competition {competitionId}. " +
                        "{disqualified} submissions disqualified, {advanced} submissions advanced to Round 2.",
                        competition.CompetitionId, disqualified, advanced);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Error transitioning competition {competitionId} from VotingRound1Open to Tallying",
                        competition.CompetitionId);
                }
            }
        }
    }
}