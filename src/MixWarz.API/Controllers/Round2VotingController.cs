using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;


namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/competitions/{competitionId}/round2")]
    [Authorize]
    public class Round2VotingController : ControllerBase
    {
        private readonly IRound2VotingService _round2VotingService;
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ISongCreatorPickRepository _songCreatorPickRepository;

        public Round2VotingController(
            IRound2VotingService round2VotingService,
            ICompetitionRepository competitionRepository,
            ISongCreatorPickRepository songCreatorPickRepository)
        {
            _round2VotingService = round2VotingService;
            _competitionRepository = competitionRepository;
            _songCreatorPickRepository = songCreatorPickRepository;
        }

        [HttpPost("setup")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> SetupRound2Voting(int competitionId)
        {
            try
            {
                // Verify competition exists
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
                }

                // Verify user is organizer or admin
                var userId = User.FindFirst("userId")?.Value;
                if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                // Verify competition status is ready for Round 2 setup
                if (competition.Status != CompetitionStatus.VotingRound2Setup)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = $"Competition must be in Round 2 Setup status. Current status: {competition.Status}"
                    });
                }

                int submissionCount = await _round2VotingService.SetupRound2VotingAsync(competitionId);

                return Ok(new
                {
                    success = true,
                    message = $"Round 2 voting setup completed. {submissionCount} submissions are available for voting.",
                    submissionCount
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("advanced-submissions")]
        public async Task<ActionResult<IEnumerable<Submission>>> GetAdvancedSubmissions(int competitionId)
        {
            try
            {
                var submissions = await _round2VotingService.GetRound2SubmissionsAsync(competitionId);
                return Ok(submissions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("eligibility")]
        public async Task<ActionResult> CheckEligibility(int competitionId)
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            bool isEligible = await _round2VotingService.IsUserEligibleForRound2VotingAsync(competitionId, userId);
            return Ok(new { isEligible });
        }

        [HttpPost("vote")]
        public async Task<ActionResult> SubmitVotes(
            int competitionId,
            [FromBody] SubmitRound2VotesRequest request)
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // FIXED: Use ProcessRound2VotesAsync with proper 1st=3pts, 2nd=2pts, 3rd=1pt business logic
            bool success = await _round2VotingService.ProcessRound2VotesAsync(
                competitionId,
                userId,
                request.FirstPlaceSubmissionId,
                request.SecondPlaceSubmissionId,
                request.ThirdPlaceSubmissionId);

            if (success)
            {
                return Ok(new { success = true, message = "Votes submitted successfully" });
            }
            else
            {
                return BadRequest(new { success = false, message = "Failed to submit votes. Please check your eligibility and selections and try again." });
            }
        }

        [HttpPost("tally-votes")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> TallyVotes(int competitionId)
        {
            try
            {
                // Verify competition exists
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
                }

                // Verify user is organizer or admin
                var userId = User.FindFirst("userId")?.Value;
                if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                var (winningSubmissionId, isTie) = await _round2VotingService.TallyRound2VotesAsync(competitionId);

                if (!isTie && winningSubmissionId > 0)
                {
                    return Ok(new
                    {
                        success = true,
                        message = $"Successfully tallied votes. Submission {winningSubmissionId} is the winner.",
                        winningSubmissionId
                    });
                }
                else
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Votes tallied, but there is a true tie. Manual winner selection is required.",
                        requiresManualSelection = true
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("select-winner")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> SelectWinnerManually(
            int competitionId,
            [FromBody] SelectWinnerRequest request)
        {
            try
            {
                // Verify competition exists
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
                }

                // Verify user is organizer or admin
                var userId = User.FindFirst("userId")?.Value;
                if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                bool result = await _round2VotingService.SetCompetitionWinnerAsync(competitionId, request.WinningSubmissionId);

                if (result)
                {
                    return Ok(new
                    {
                        success = true,
                        message = $"Successfully selected Submission {request.WinningSubmissionId} as the winner."
                    });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Failed to select winner. Please verify the submission ID is valid." });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("song-creator-picks")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> RecordSongCreatorPicks(
            int competitionId,
            [FromBody] SongCreatorPicksRequest request)
        {
            try
            {
                // Verify competition exists
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
                }

                // Verify user is organizer or admin
                var userId = User.FindFirst("userId")?.Value;
                if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                var submissionIds = new List<int>
                {
                    request.FirstPlaceSubmissionId,
                    request.SecondPlaceSubmissionId,
                    request.ThirdPlaceSubmissionId
                };

                int recordCount = await _round2VotingService.RecordSongCreatorPicksAsync(
                    competitionId,
                    submissionIds);

                if (recordCount > 0)
                {
                    return Ok(new
                    {
                        success = true,
                        message = $"Song Creator picks recorded successfully. {recordCount} picks saved."
                    });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Failed to record Song Creator picks. Please check the submission IDs." });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("song-creator-picks")]
        public async Task<ActionResult> GetSongCreatorPicks(int competitionId)
        {
            try
            {
                var picks = await _songCreatorPickRepository.GetByCompetitionIdAsync(competitionId);

                var result = picks.Select(p => new
                {
                    Rank = p.Rank,
                    SubmissionId = p.SubmissionId,
                    MixTitle = p.Submission?.MixTitle ?? "Unknown",
                    SubmitterName = p.Submission?.User?.UserName ?? "Unknown",
                    Comment = p.Comment
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("results")]
        public async Task<ActionResult> GetResults(int competitionId)
        {
            try
            {
                var results = await _round2VotingService.GetCompetitionResultsAsync(competitionId);
                return Ok(results);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }

    public class SubmitRound2VotesRequest
    {
        public int FirstPlaceSubmissionId { get; set; }
        public int SecondPlaceSubmissionId { get; set; }
        public int ThirdPlaceSubmissionId { get; set; }
    }

    public class SelectWinnerRequest
    {
        public int WinningSubmissionId { get; set; }
    }

    public class SongCreatorPicksRequest
    {
        public int FirstPlaceSubmissionId { get; set; }
        public int SecondPlaceSubmissionId { get; set; }
        public int ThirdPlaceSubmissionId { get; set; }
        public string Comments { get; set; } = string.Empty;
    }
}