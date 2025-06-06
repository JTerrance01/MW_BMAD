using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;


namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/admin/competitions/monitoring")]
    [Authorize(Roles = "Admin")]
    public class AdminCompetitionMonitoringController : ControllerBase
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ISubmissionRepository _submissionRepository;
        private readonly IRound1AssignmentService _round1AssignmentService;
        private readonly IRound2VotingService _round2VotingService;

        public AdminCompetitionMonitoringController(
            ICompetitionRepository competitionRepository,
            ISubmissionRepository submissionRepository,
            IRound1AssignmentService round1AssignmentService,
            IRound2VotingService round2VotingService)
        {
            _competitionRepository = competitionRepository;
            _submissionRepository = submissionRepository;
            _round1AssignmentService = round1AssignmentService;
            _round2VotingService = round2VotingService;
        }

        /// <summary>
        /// Gets the voting progress for a competition in Round 1
        /// </summary>
        [HttpGet("round1-progress/{competitionId}")]
        public async Task<IActionResult> GetRound1VotingProgress(int competitionId)
        {
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return NotFound("Competition not found");
            }

            if (competition.Status != CompetitionStatus.VotingRound1Open &&
                competition.Status != CompetitionStatus.VotingRound1Tallying)
            {
                return BadRequest("Competition is not in Round 1 voting phase");
            }

            // TODO: Implement proper voting group retrieval
            var votingGroups = new List<object>(); // Placeholder for voting groups

            // TODO: Implement proper voting statistics
            int totalVoters = 0; // Placeholder
            int votesSubmitted = 0; // Placeholder
            double votingProgress = totalVoters > 0 ? (double)votesSubmitted / (totalVoters * 3) : 0;

            // Get preliminary standings 
            var allSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId);
            var preliminaryRankings = allSubmissions
                .Where(s => !s.IsDisqualified)
                .Select(s => new
                {
                    SubmissionId = s.SubmissionId,
                    Title = s.MixTitle,
                    SubmitterId = s.UserId,
                    Round1Score = s.Round1Score,
                    AdvancedToRound2 = s.AdvancedToRound2
                })
                .OrderByDescending(s => s.Round1Score)
                .ToList();

            return Ok(new
            {
                CompetitionId = competitionId,
                CompetitionTitle = competition.Title,
                Status = competition.Status.ToString(),
                EligibleVoters = totalVoters,
                VotesSubmitted = votesSubmitted,
                VotingProgressPercentage = Math.Round(votingProgress * 100, 2),
                VotingGroupsCount = votingGroups.Count,
                VotingGroups = votingGroups,
                PreliminaryRankings = preliminaryRankings
            });
        }

        /// <summary>
        /// Gets the voting progress for a competition in Round 2
        /// </summary>
        [HttpGet("round2-progress/{competitionId}")]
        public async Task<IActionResult> GetRound2VotingProgress(int competitionId)
        {
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return NotFound("Competition not found");
            }

            if (competition.Status != CompetitionStatus.VotingRound2Open &&
                competition.Status != CompetitionStatus.VotingRound2Tallying)
            {
                return BadRequest("Competition is not in Round 2 voting phase");
            }

            // Get Round 2 submissions
            var eligibleSubmissions = await _round2VotingService.GetRound2SubmissionsAsync(competitionId);

            // TODO: Implement proper voting statistics
            int eligibleVoters = 0; // Placeholder
            int votesSubmitted = 0; // Placeholder
            double votingProgress = eligibleVoters > 0 ? (double)votesSubmitted / (eligibleVoters * 3) : 0;

            // Get preliminary standings
            var preliminaryRankings = eligibleSubmissions
                .Select(s => new
                {
                    SubmissionId = s.SubmissionId,
                    Title = s.MixTitle,
                    SubmitterId = s.UserId,
                    Round2Score = s.Round2Score,
                    FinalScore = s.FinalScore
                })
                .OrderByDescending(s => s.Round2Score)
                .ToList();

            // TODO: Check if song creator has submitted picks
            bool creatorPicks = false; // Placeholder

            return Ok(new
            {
                CompetitionId = competitionId,
                CompetitionTitle = competition.Title,
                Status = competition.Status.ToString(),
                EligibleSubmissions = eligibleSubmissions.Count(),
                EligibleVoters = eligibleVoters,
                VotesSubmitted = votesSubmitted,
                VotingProgressPercentage = Math.Round(votingProgress * 100, 2),
                PreliminaryRankings = preliminaryRankings,
                SongCreatorPicksSubmitted = creatorPicks
            });
        }

        /// <summary>
        /// Gets a list of disqualified submissions for a competition
        /// </summary>
        [HttpGet("disqualified/{competitionId}")]
        public async Task<IActionResult> GetDisqualifiedSubmissions(int competitionId)
        {
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return NotFound("Competition not found");
            }

            var allSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId);
            var disqualifiedSubmissions = allSubmissions
                .Where(s => s.IsDisqualified)
                .Select(s => new
                {
                    SubmissionId = s.SubmissionId,
                    MixTitle = s.MixTitle,
                    UserId = s.UserId,
                    Username = s.User?.UserName,
                    DisqualificationReason = "Disqualified" // Placeholder since property is missing
                })
                .ToList();

            return Ok(disqualifiedSubmissions);
        }

        /// <summary>
        /// Manually advances a competition to the next phase (for administrative control)
        /// </summary>
        [HttpPost("advance-status/{competitionId}")]
        public async Task<IActionResult> AdvanceCompetitionStatus(int competitionId)
        {
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return NotFound("Competition not found");
            }

            CompetitionStatus newStatus;

            // Determine the next status based on current status
            switch (competition.Status)
            {
                case CompetitionStatus.Upcoming:
                    newStatus = CompetitionStatus.OpenForSubmissions;
                    break;
                case CompetitionStatus.OpenForSubmissions:
                    newStatus = CompetitionStatus.VotingRound1Setup;
                    await _round1AssignmentService.CreateGroupsAndAssignVotersAsync(competitionId);
                    break;
                case CompetitionStatus.VotingRound1Setup:
                    newStatus = CompetitionStatus.VotingRound1Open;
                    break;
                case CompetitionStatus.VotingRound1Open:
                    newStatus = CompetitionStatus.VotingRound1Tallying;
                    await _round1AssignmentService.DisqualifyNonVotersAsync(competitionId);
                    await _round1AssignmentService.TallyVotesAndDetermineAdvancementAsync(competitionId);
                    break;
                case CompetitionStatus.VotingRound1Tallying:
                    newStatus = CompetitionStatus.VotingRound2Setup;
                    break;
                case CompetitionStatus.VotingRound2Setup:
                    newStatus = CompetitionStatus.VotingRound2Open;
                    break;
                case CompetitionStatus.VotingRound2Open:
                    newStatus = CompetitionStatus.VotingRound2Tallying;
                    var (winnerId, isTie) = await _round2VotingService.TallyRound2VotesAsync(competitionId);
                    if (isTie)
                    {
                        newStatus = CompetitionStatus.RequiresManualWinnerSelection;
                    }
                    else if (winnerId > 0)
                    {
                        await _round2VotingService.SetCompetitionWinnerAsync(competitionId, winnerId);
                        newStatus = CompetitionStatus.Completed;
                    }
                    break;
                case CompetitionStatus.RequiresManualWinnerSelection:
                    // Can't automatically advance from this state
                    return BadRequest("Manual winner selection required before advancing");
                default:
                    return BadRequest("Cannot advance from current competition status");
            }

            // Update the competition status
            await _competitionRepository.UpdateCompetitionStatusAsync(competitionId, newStatus);

            return Ok(new
            {
                PreviousStatus = competition.Status.ToString(),
                NewStatus = newStatus.ToString()
            });
        }

        /// <summary>
        /// Gets a dashboard summary of all active competitions
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetCompetitionsDashboard()
        {
            // Get counts of competitions by status
            var upcomingCount = await _competitionRepository.GetCountByStatusAsync(CompetitionStatus.Upcoming);
            var openForSubmissionsCount = await _competitionRepository.GetCountByStatusAsync(CompetitionStatus.OpenForSubmissions);
            var inRound1VotingCount = await _competitionRepository.GetCountByStatusAsync(CompetitionStatus.VotingRound1Open);
            var inRound2VotingCount = await _competitionRepository.GetCountByStatusAsync(CompetitionStatus.VotingRound2Open);
            var requiresManualSelectionCount = await _competitionRepository.GetCountByStatusAsync(CompetitionStatus.RequiresManualWinnerSelection);
            var completedCount = await _competitionRepository.GetCountByStatusAsync(CompetitionStatus.Completed);

            // Get competitions that need attention (upcoming or approaching deadlines)
            var now = DateTime.UtcNow;
            var competitions = await _competitionRepository.GetAllAsync();

            var needingAttention = competitions
                .Where(c =>
                    // Competitions that will start within 24 hours
                    (c.Status == CompetitionStatus.Upcoming && c.StartDate <= now.AddDays(1)) ||
                    // Competitions near submission deadlines
                    (c.Status == CompetitionStatus.OpenForSubmissions && c.EndDate <= now.AddDays(1)) ||
                    // Competitions in Round 1 that require tallying soon
                    (c.Status == CompetitionStatus.VotingRound1Open) ||
                    // Competitions in Round 2 that require tallying soon
                    (c.Status == CompetitionStatus.VotingRound2Open) ||
                    // Competitions requiring manual decision
                    c.Status == CompetitionStatus.RequiresManualWinnerSelection)
                .Select(c => new
                {
                    CompetitionId = c.CompetitionId,
                    Title = c.Title,
                    Status = c.Status.ToString(),
                    Reason = GetAttentionReason(c, now)
                })
                .ToList();

            return Ok(new
            {
                StatusCounts = new
                {
                    Upcoming = upcomingCount,
                    OpenForSubmissions = openForSubmissionsCount,
                    InRound1Voting = inRound1VotingCount,
                    InRound2Voting = inRound2VotingCount,
                    RequiresManualSelection = requiresManualSelectionCount,
                    Completed = completedCount
                },
                NeedsAttention = needingAttention
            });
        }

        // Helper method to determine why a competition needs attention
        private string GetAttentionReason(Competition competition, DateTime now)
        {
            if (competition.Status == CompetitionStatus.Upcoming && competition.StartDate <= now.AddDays(1))
                return "Starting within 24 hours";

            if (competition.Status == CompetitionStatus.OpenForSubmissions && competition.EndDate <= now.AddDays(1))
                return "Submission deadline within 24 hours";

            if (competition.Status == CompetitionStatus.VotingRound1Open)
                return "Round 1 voting in progress";

            if (competition.Status == CompetitionStatus.VotingRound2Open)
                return "Round 2 voting in progress";

            if (competition.Status == CompetitionStatus.RequiresManualWinnerSelection)
                return "Requires manual winner selection";

            return "Needs attention";
        }
    }
}