using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MixWarz.Application.Common.Interfaces;
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
        private readonly ITournamentLifecycleService _tournamentLifecycleService;

        public AdminCompetitionMonitoringController(
            ICompetitionRepository competitionRepository,
            ISubmissionRepository submissionRepository,
            ITournamentLifecycleService tournamentLifecycleService)
        {
            _competitionRepository = competitionRepository;
            _submissionRepository = submissionRepository;
            _tournamentLifecycleService = tournamentLifecycleService;
        }

        /// <summary>
        /// Gets the judging progress for a competition using Hybrid Fair-Play Tournament system
        /// </summary>
        [HttpGet("judging-progress/{competitionId}")]
        public async Task<IActionResult> GetJudgingProgress(int competitionId)
        {
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return NotFound("Competition not found");
            }

            if (competition.Status != CompetitionStatus.InJudging)
            {
                return BadRequest("Competition is not in judging phase");
            }

            // Note: In Hybrid Fair-Play Tournament, there are no voting groups - individual judging assignments
            // Get preliminary standings 
            var allSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId);
            var preliminaryRankings = allSubmissions
                .Where(s => !s.IsDisqualified)
                .Select(s => new
                {
                    SubmissionId = s.SubmissionId,
                    Title = s.MixTitle,
                    SubmitterId = s.UserId,
                    Status = s.Status.ToString(),
                    JudgingComplete = false // TODO: Calculate from Judgements table
                })
                .OrderBy(s => s.Title)
                .ToList();

            return Ok(new
            {
                CompetitionId = competitionId,
                CompetitionTitle = competition.Title,
                Status = competition.Status.ToString(),
                System = "Hybrid Fair-Play Tournament",
                TotalSubmissions = allSubmissions.Count(s => !s.IsDisqualified),
                PreliminaryRankings = preliminaryRankings
            });
        }

        /// <summary>
        /// Note: Round 2 voting removed with Hybrid Fair-Play Tournament system
        /// This endpoint is deprecated and will be removed in future versions
        /// </summary>
        [HttpGet("round2-progress/{competitionId}")]
        [Obsolete("Round-based voting has been replaced by Hybrid Fair-Play Tournament system")]
        public async Task<IActionResult> GetRound2VotingProgress(int competitionId)
        {
            return BadRequest("Round 2 voting has been replaced by the Hybrid Fair-Play Tournament system. Use /judging-progress/{competitionId} instead.");
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
        /// Manually advances a competition to the next phase using Hybrid Fair-Play Tournament system
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
            string actionTaken = "";

            try
            {
                // Determine the next status based on current status (Hybrid Fair-Play Tournament)
                switch (competition.Status)
                {
                    case CompetitionStatus.Upcoming:
                        newStatus = CompetitionStatus.OpenForSubmissions;
                        actionTaken = "Opened for submissions";
                        break;
                    case CompetitionStatus.OpenForSubmissions:
                        newStatus = CompetitionStatus.InJudging;
                        await _tournamentLifecycleService.StartUniversalJudging(competitionId);
                        actionTaken = "Started judging phase with Hybrid Fair-Play Tournament system";
                        break;
                    case CompetitionStatus.InJudging:
                        var advancedSubmissionIds = await _tournamentLifecycleService.TallyUniversalJudgingResults(competitionId, 10); // Default advancement count
                        newStatus = CompetitionStatus.Completed;
                        actionTaken = $"Completed judging and advanced {advancedSubmissionIds.Count()} submissions. Judging prowess calculated.";
                        break;
                    default:
                        return BadRequest($"Cannot advance from current status: {competition.Status}. Use Hybrid Fair-Play Tournament endpoints.");
                }

                // Update the competition status (this is handled by the lifecycle service)
                return Ok(new
                {
                    PreviousStatus = competition.Status.ToString(),
                    NewStatus = newStatus.ToString(),
                    ActionTaken = actionTaken,
                    System = "Hybrid Fair-Play Tournament"
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error advancing competition: {ex.Message}");
            }
        }

        /// <summary>
        /// Gets a dashboard summary of all active competitions using Hybrid Fair-Play Tournament system
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetCompetitionsDashboard()
        {
            // Get counts of competitions by status (Hybrid Fair-Play Tournament)
            var upcomingCount = await _competitionRepository.GetCountByStatusAsync(CompetitionStatus.Upcoming);
            var openForSubmissionsCount = await _competitionRepository.GetCountByStatusAsync(CompetitionStatus.OpenForSubmissions);
            var inJudgingCount = await _competitionRepository.GetCountByStatusAsync(CompetitionStatus.InJudging);
            var completedCount = await _competitionRepository.GetCountByStatusAsync(CompetitionStatus.Completed);
            var closedCount = await _competitionRepository.GetCountByStatusAsync(CompetitionStatus.Closed);

            // Get competitions that need attention (upcoming or approaching deadlines)
            var now = DateTime.UtcNow;
            var competitions = await _competitionRepository.GetAllAsync();

            var needingAttention = competitions
                .Where(c =>
                    // Competitions that will start within 24 hours
                    (c.Status == CompetitionStatus.Upcoming && c.StartDate <= now.AddDays(1)) ||
                    // Competitions near submission deadlines
                    (c.Status == CompetitionStatus.OpenForSubmissions && c.EndDate <= now.AddDays(1)) ||
                    // Competitions in judging phase
                    (c.Status == CompetitionStatus.InJudging))
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
                    InJudging = inJudgingCount,
                    Completed = completedCount,
                    Closed = closedCount
                },
                NeedsAttention = needingAttention,
                System = "Hybrid Fair-Play Tournament"
            });
        }

        // Helper method to determine why a competition needs attention
        private string GetAttentionReason(Competition competition, DateTime now)
        {
            if (competition.Status == CompetitionStatus.Upcoming && competition.StartDate <= now.AddDays(1))
                return "Starting within 24 hours";

            if (competition.Status == CompetitionStatus.OpenForSubmissions && competition.EndDate <= now.AddDays(1))
                return "Submission deadline within 24 hours";

            if (competition.Status == CompetitionStatus.InJudging)
                return "Judging phase in progress (Hybrid Fair-Play Tournament)";

            return "Needs attention";
        }
    }
}