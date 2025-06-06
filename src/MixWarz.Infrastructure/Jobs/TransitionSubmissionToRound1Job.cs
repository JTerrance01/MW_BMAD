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
    /// Job to transition competitions from OpenForSubmissions to VotingRound1Open when the submission deadline has passed.
    /// This provides complete automation: creates voting groups and opens voting without manual intervention.
    /// </summary>
    [DisallowConcurrentExecution]
    public class TransitionSubmissionToRound1Job : ICompetitionTransitionJob
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IRound1AssignmentService _round1AssignmentService;
        private readonly ILogger<TransitionSubmissionToRound1Job> _logger;

        public TransitionSubmissionToRound1Job(
            ICompetitionRepository competitionRepository,
            IRound1AssignmentService round1AssignmentService,
            ILogger<TransitionSubmissionToRound1Job> logger)
        {
            _competitionRepository = competitionRepository;
            _round1AssignmentService = round1AssignmentService;
            _logger = logger;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            _logger.LogInformation("Starting TransitionSubmissionToRound1Job at {time}", DateTimeOffset.Now);

            try
            {
                await ProcessDueCompetitionsAsync();
                _logger.LogInformation("Completed TransitionSubmissionToRound1Job successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing TransitionSubmissionToRound1Job");
                throw;
            }
        }

        public async Task ProcessDueCompetitionsAsync()
        {
            // Get all competitions that are open for submissions and past their end date
            var competitions = await _competitionRepository.GetByStatusAsync(CompetitionStatus.OpenForSubmissions);
            var dueCompetitions = competitions.Where(c => c.EndDate < DateTime.UtcNow).ToList();

            foreach (var competition in dueCompetitions)
            {
                try
                {
                    _logger.LogInformation(
                        "Starting automated voting setup for competition {competitionId} ({title})",
                        competition.CompetitionId, competition.Title);

                    // Step 1: Update competition status to VotingRound1Setup
                    _logger.LogInformation(
                        "Step 1: Setting competition {competitionId} status to VotingRound1Setup",
                        competition.CompetitionId);

                    competition.Status = CompetitionStatus.VotingRound1Setup;
                    await _competitionRepository.UpdateAsync(competition);

                    // Step 2: Setup Round 1 voting groups and assignments
                    _logger.LogInformation(
                        "Step 2: Creating voting groups for competition {competitionId}",
                        competition.CompetitionId);

                    var groupsCreated = await _round1AssignmentService.CreateGroupsAndAssignVotersAsync(competition.CompetitionId);

                    _logger.LogInformation(
                        "Created {groupsCreated} voting groups for competition {competitionId}",
                        groupsCreated, competition.CompetitionId);

                    // Step 3: Automatically transition to VotingRound1Open to enable immediate voting
                    _logger.LogInformation(
                        "Step 3: Opening voting for competition {competitionId} - setting status to VotingRound1Open",
                        competition.CompetitionId);

                    competition.Status = CompetitionStatus.VotingRound1Open;
                    await _competitionRepository.UpdateAsync(competition);

                    _logger.LogInformation(
                        "🎉 AUTOMATION COMPLETE: Competition {competitionId} ({title}) is now open for Round 1 voting with {groupsCreated} groups. Users can immediately start voting!",
                        competition.CompetitionId, competition.Title, groupsCreated);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "❌ AUTOMATION FAILED: Error during automated voting setup for competition {competitionId}. Manual intervention may be required.",
                        competition.CompetitionId);
                }
            }
        }
    }
}