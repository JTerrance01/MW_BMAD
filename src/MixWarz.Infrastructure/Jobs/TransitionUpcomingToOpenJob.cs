using Microsoft.Extensions.Logging;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;
using Quartz;

namespace MixWarz.Infrastructure.Jobs
{
    [DisallowConcurrentExecution]
    public class TransitionUpcomingToOpenJob : IJob
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ILogger<TransitionUpcomingToOpenJob> _logger;

        public TransitionUpcomingToOpenJob(
            ICompetitionRepository competitionRepository,
            ILogger<TransitionUpcomingToOpenJob> logger)
        {
            _competitionRepository = competitionRepository ?? throw new ArgumentNullException(nameof(competitionRepository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task Execute(IJobExecutionContext context)
        {
            try
            {
                _logger.LogInformation("TransitionUpcomingToOpenJob - Starting execution");

                var now = DateTime.UtcNow;
                _logger.LogInformation("Current UTC time: {CurrentTime}", now);

                // Query for competitions with Status == Upcoming where StartDate <= DateTime.UtcNow
                var upcomingCompetitions = await _competitionRepository.GetByStatusAsync(CompetitionStatus.Upcoming, 1, 1000);
                var competitionsToTransition = upcomingCompetitions.Where(c => c.StartDate <= now).ToList();

                _logger.LogInformation("Found {TotalUpcoming} upcoming competitions, {ToTransition} ready to transition to OpenForSubmissions",
                    upcomingCompetitions.Count(), competitionsToTransition.Count);

                if (!competitionsToTransition.Any())
                {
                    _logger.LogInformation("No competitions ready to transition from Upcoming to OpenForSubmissions");
                    return;
                }

                foreach (var competition in competitionsToTransition)
                {
                    try
                    {
                        _logger.LogInformation("Transitioning competition {CompetitionId} '{Title}' from Upcoming to OpenForSubmissions. StartDate: {StartDate}",
                            competition.CompetitionId, competition.Title, competition.StartDate);

                        // Update competition status to OpenForSubmissions
                        competition.Status = CompetitionStatus.OpenForSubmissions;
                        await _competitionRepository.UpdateAsync(competition);

                        _logger.LogInformation("Successfully transitioned competition {CompetitionId} to OpenForSubmissions status",
                            competition.CompetitionId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error transitioning competition {CompetitionId} from Upcoming to OpenForSubmissions",
                            competition.CompetitionId);
                        // Continue with other competitions even if one fails
                    }
                }

                _logger.LogInformation("TransitionUpcomingToOpenJob - Completed execution. Transitioned {Count} competitions",
                    competitionsToTransition.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in TransitionUpcomingToOpenJob execution");
                throw; // Re-throw to let Quartz handle the error
            }
        }
    }
}