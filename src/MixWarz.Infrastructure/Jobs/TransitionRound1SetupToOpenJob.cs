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
    /// Job to transition competitions from VotingRound1Setup to VotingRound1Open.
    /// This handles cases where competitions might be manually set to VotingRound1Setup
    /// and ensures they automatically progress to open voting status.
    /// </summary>
    [DisallowConcurrentExecution]
    public class TransitionRound1SetupToOpenJob : ICompetitionTransitionJob
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IRound1AssignmentService _round1AssignmentService;
        private readonly ILogger<TransitionRound1SetupToOpenJob> _logger;

        public TransitionRound1SetupToOpenJob(
            ICompetitionRepository competitionRepository,
            IRound1AssignmentService round1AssignmentService,
            ILogger<TransitionRound1SetupToOpenJob> logger)
        {
            _competitionRepository = competitionRepository;
            _round1AssignmentService = round1AssignmentService;
            _logger = logger;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            _logger.LogInformation("Starting TransitionRound1SetupToOpenJob at {time}", DateTimeOffset.Now);

            try
            {
                await ProcessDueCompetitionsAsync();
                _logger.LogInformation("Completed TransitionRound1SetupToOpenJob successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing TransitionRound1SetupToOpenJob");
                throw;
            }
        }

        public async Task ProcessDueCompetitionsAsync()
        {
            // Get all competitions that are in VotingRound1Setup status
            var competitions = await _competitionRepository.GetByStatusAsync(CompetitionStatus.VotingRound1Setup);
            var setupCompetitions = competitions.ToList();

            _logger.LogInformation("Found {count} competitions in VotingRound1Setup status", setupCompetitions.Count);

            foreach (var competition in setupCompetitions)
            {
                try
                {
                    _logger.LogInformation(
                        "Processing competition {competitionId} ({title}) in VotingRound1Setup status",
                        competition.CompetitionId, competition.Title);

                    // Check if voting groups exist - if not, create them
                    var existingSubmissions = await _round1AssignmentService.GetAssignedSubmissionsForVoterAsync(
                        competition.CompetitionId,
                        "test-user-check"); // This will return empty if no groups exist

                    bool hasVotingGroups = existingSubmissions?.Any() == true;

                    if (!hasVotingGroups)
                    {
                        _logger.LogInformation(
                            "No voting groups found for competition {competitionId}. Creating voting groups...",
                            competition.CompetitionId);

                        var groupsCreated = await _round1AssignmentService.CreateGroupsAndAssignVotersAsync(competition.CompetitionId);

                        _logger.LogInformation(
                            "Created {groupsCreated} voting groups for competition {competitionId}",
                            groupsCreated, competition.CompetitionId);
                    }
                    else
                    {
                        _logger.LogInformation(
                            "Voting groups already exist for competition {competitionId}",
                            competition.CompetitionId);
                    }

                    // Transition to VotingRound1Open to enable voting
                    _logger.LogInformation(
                        "Transitioning competition {competitionId} from VotingRound1Setup to VotingRound1Open",
                        competition.CompetitionId);

                    competition.Status = CompetitionStatus.VotingRound1Open;
                    await _competitionRepository.UpdateAsync(competition);

                    _logger.LogInformation(
                        "🎉 AUTOMATION COMPLETE: Competition {competitionId} ({title}) is now open for Round 1 voting!",
                        competition.CompetitionId, competition.Title);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "❌ AUTOMATION FAILED: Error transitioning competition {competitionId} from VotingRound1Setup to VotingRound1Open",
                        competition.CompetitionId);
                }
            }
        }
    }
}