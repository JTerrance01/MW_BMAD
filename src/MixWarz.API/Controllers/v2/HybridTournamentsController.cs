using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Judging.DTOs;
using MixWarz.Domain.Entities;

namespace MixWarz.API.Controllers.v2
{
    /// <summary>
    /// API Controller for Hybrid Fair-Play Tournament judging actions
    /// </summary>
    [ApiController]
    [Route("api/v2")]
    [Authorize]
    public class HybridTournamentsController : ControllerBase
    {
        private readonly IJudgingService _judgingService;
        private readonly ITournamentLifecycleService _tournamentLifecycleService;
        private readonly ILogger<HybridTournamentsController> _logger;

        public HybridTournamentsController(
            IJudgingService judgingService,
            ITournamentLifecycleService tournamentLifecycleService,
            ILogger<HybridTournamentsController> logger)
        {
            _judgingService = judgingService;
            _tournamentLifecycleService = tournamentLifecycleService;
            _logger = logger;
        }

        /// <summary>
        /// Submit a judgement for an assigned submission
        /// </summary>
        /// <param name="submissionId">The ID of the submission being judged</param>
        /// <param name="judgementDto">The judgement data including score and feedback</param>
        /// <returns>The created judgement</returns>
        [HttpPost("submissions/{submissionId}/judgements")]
        public async Task<ActionResult<Judgement>> SubmitJudgement(
            int submissionId,
            [FromBody] SubmitJudgementDto judgementDto)
        {
            try
            {
                // Get the current user's ID from claims
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("userId")?.Value
                           ?? User.FindFirst("sub")?.Value;

                _logger.LogInformation("[SubmitJudgement] Submitting judgement for submission {SubmissionId} by user {UserId}",
                    submissionId, userId);

                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("[SubmitJudgement] User ID not found in token");
                    return Unauthorized(new { message = "User not authenticated or user ID not found in token" });
                }

                // Validate that the submissionId matches the DTO
                if (judgementDto.SubmissionId != submissionId)
                {
                    _logger.LogWarning("[SubmitJudgement] SubmissionId mismatch: URL={UrlSubmissionId}, DTO={DtoSubmissionId}",
                        submissionId, judgementDto.SubmissionId);
                    return BadRequest(new { message = "Submission ID in URL does not match the judgement data" });
                }

                // Set the judge user ID from the authenticated user
                judgementDto.JudgeUserId = userId;

                // Validate model state
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("[SubmitJudgement] Invalid model state: {Errors}",
                        string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                    return BadRequest(ModelState);
                }

                // Submit the judgement
                var judgement = await _judgingService.SubmitJudgement(judgementDto);

                _logger.LogInformation("[SubmitJudgement] Successfully created judgement {JudgementId} for submission {SubmissionId}",
                    judgement.JudgementId, submissionId);

                return CreatedAtAction(
                    nameof(SubmitJudgement),
                    new { submissionId = judgement.SubmissionId },
                    judgement);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "[SubmitJudgement] Invalid operation: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "[SubmitJudgement] Invalid argument: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SubmitJudgement] Unexpected error occurred while submitting judgement for submission {SubmissionId}",
                    submissionId);
                return StatusCode(500, new { message = "An unexpected error occurred while submitting the judgement" });
            }
        }

        /// <summary>
        /// Rate the helpfulness of feedback received from a judge
        /// </summary>
        /// <param name="judgementId">The ID of the judgement being rated</param>
        /// <param name="ratingDto">The feedback rating data</param>
        /// <returns>The created feedback rating</returns>
        [HttpPost("judgements/{judgementId}/rate")]
        public async Task<ActionResult<FeedbackRating>> RateFeedback(
            int judgementId,
            [FromBody] RateFeedbackDto ratingDto)
        {
            try
            {
                // Get the current user's ID from claims
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("userId")?.Value
                           ?? User.FindFirst("sub")?.Value;

                _logger.LogInformation("[RateFeedback] Rating feedback for judgement {JudgementId} by user {UserId}",
                    judgementId, userId);

                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("[RateFeedback] User ID not found in token");
                    return Unauthorized(new { message = "User not authenticated or user ID not found in token" });
                }

                // Validate that the judgementId matches the DTO
                if (ratingDto.JudgementId != judgementId)
                {
                    _logger.LogWarning("[RateFeedback] JudgementId mismatch: URL={UrlJudgementId}, DTO={DtoJudgementId}",
                        judgementId, ratingDto.JudgementId);
                    return BadRequest(new { message = "Judgement ID in URL does not match the rating data" });
                }

                // Set the rater user ID from the authenticated user
                ratingDto.RaterUserId = userId;

                // Validate model state
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("[RateFeedback] Invalid model state: {Errors}",
                        string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                    return BadRequest(ModelState);
                }

                // Rate the feedback
                var feedbackRating = await _judgingService.RateFeedback(ratingDto);

                _logger.LogInformation("[RateFeedback] Successfully created feedback rating {FeedbackRatingId} for judgement {JudgementId}",
                    feedbackRating.FeedbackRatingId, judgementId);

                return CreatedAtAction(
                    nameof(RateFeedback),
                    new { judgementId = feedbackRating.JudgementId },
                    feedbackRating);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "[RateFeedback] Invalid operation: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "[RateFeedback] Invalid argument: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[RateFeedback] Unexpected error occurred while rating feedback for judgement {JudgementId}",
                    judgementId);
                return StatusCode(500, new { message = "An unexpected error occurred while rating the feedback" });
            }
        }

        /// <summary>
        /// [ADMIN ONLY] Manually trigger the start of universal judging for a competition
        /// </summary>
        /// <param name="competitionId">The ID of the competition to start judging for</param>
        /// <returns>Result of the judging start operation</returns>
        [HttpPost("competitions/{competitionId}/start-judging")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> StartUniversalJudging(int competitionId)
        {
            try
            {
                _logger.LogInformation("[StartUniversalJudging] Admin manually triggering universal judging for competition {CompetitionId}",
                    competitionId);

                var assignmentsCreated = await _tournamentLifecycleService.StartUniversalJudging(competitionId);

                _logger.LogInformation("[StartUniversalJudging] Successfully started universal judging for competition {CompetitionId}. " +
                    "{AssignmentCount} assignments created.", competitionId, assignmentsCreated);

                return Ok(new
                {
                    success = true,
                    message = $"Universal judging started successfully for competition {competitionId}",
                    assignmentsCreated = assignmentsCreated
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "[StartUniversalJudging] Invalid argument: {Message}", ex.Message);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "[StartUniversalJudging] Invalid operation: {Message}", ex.Message);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[StartUniversalJudging] Unexpected error occurred while starting universal judging for competition {CompetitionId}",
                    competitionId);
                return StatusCode(500, new { success = false, message = "An unexpected error occurred while starting universal judging" });
            }
        }

        /// <summary>
        /// [ADMIN ONLY] Manually trigger the tallying of universal judging results for a competition
        /// </summary>
        /// <param name="competitionId">The ID of the competition to tally results for</param>
        /// <param name="advancementCount">Number of submissions to advance (defaults to 3)</param>
        /// <returns>Result of the tallying operation</returns>
        [HttpPost("competitions/{competitionId}/tally-results")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> TallyUniversalJudgingResults(
            int competitionId,
            [FromQuery] int advancementCount = 3)
        {
            try
            {
                _logger.LogInformation("[TallyUniversalJudgingResults] Admin manually triggering result tallying for competition {CompetitionId}",
                    competitionId);

                var advancedSubmissionIds = await _tournamentLifecycleService.TallyUniversalJudgingResults(competitionId, advancementCount);
                var advancedList = advancedSubmissionIds.ToList();

                _logger.LogInformation("[TallyUniversalJudgingResults] Successfully tallied results for competition {CompetitionId}. " +
                    "{AdvancedCount} submissions advanced.", competitionId, advancedList.Count);

                return Ok(new
                {
                    success = true,
                    message = $"Universal judging results tallied successfully for competition {competitionId}",
                    advancedSubmissions = advancedList,
                    advancementCount = advancedList.Count
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "[TallyUniversalJudgingResults] Invalid argument: {Message}", ex.Message);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "[TallyUniversalJudgingResults] Invalid operation: {Message}", ex.Message);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[TallyUniversalJudgingResults] Unexpected error occurred while tallying results for competition {CompetitionId}",
                    competitionId);
                return StatusCode(500, new { success = false, message = "An unexpected error occurred while tallying universal judging results" });
            }
        }

        /// <summary>
        /// [ADMIN ONLY] Get the current lifecycle status of a hybrid tournament
        /// </summary>
        /// <param name="competitionId">The ID of the competition to get status for</param>
        /// <returns>Current tournament lifecycle status</returns>
        [HttpGet("competitions/{competitionId}/lifecycle-status")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<TournamentLifecycleStatus>> GetLifecycleStatus(int competitionId)
        {
            try
            {
                _logger.LogInformation("[GetLifecycleStatus] Admin requesting lifecycle status for competition {CompetitionId}",
                    competitionId);

                var status = await _tournamentLifecycleService.GetLifecycleStatus(competitionId);

                return Ok(status);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "[GetLifecycleStatus] Invalid argument: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GetLifecycleStatus] Unexpected error occurred while getting lifecycle status for competition {CompetitionId}",
                    competitionId);
                return StatusCode(500, new { message = "An unexpected error occurred while getting lifecycle status" });
            }
        }
    }
}
