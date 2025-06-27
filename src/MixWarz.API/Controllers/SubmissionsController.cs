using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MixWarz.Application.Features.Submissions.Commands.CreateSubmission;
using MixWarz.Application.Features.Submissions.Commands.DeleteSubmission;
using MixWarz.Application.Features.Submissions.Commands.JudgeSubmission;
using MixWarz.Application.Features.Submissions.Queries.GetSubmissionsList;
using MixWarz.Application.Features.Submissions.Queries.GetUserSubmission;
using MixWarz.Application.Features.Submissions.Queries.GetSubmissionScoreBreakdown;
using MixWarz.Domain.Enums;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/competitions/{competitionId}/submissions")]
    public class SubmissionsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SubmissionsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("{submissionId}/score-breakdown")]
        [Authorize]
        public async Task<ActionResult<GetSubmissionScoreBreakdownResponse>> GetSubmissionScoreBreakdown(
            int competitionId,
            int submissionId)
        {
            try
            {
                // Get the current user's ID from claims
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("userId")?.Value
                           ?? User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var query = new GetSubmissionScoreBreakdownQuery
                {
                    SubmissionId = submissionId,
                    UserId = userId
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("my-submission")]
        [Authorize]
        public async Task<ActionResult<UserSubmissionDto>> GetMySubmission(int competitionId)
        {
            try
            {
                // Get the current user's ID from claims - try multiple claim types
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("userId")?.Value
                           ?? User.FindFirst("sub")?.Value;

                // Add detailed logging to help debug the 404 issue
                Console.WriteLine($"[GetMySubmission] CompetitionId: {competitionId}");
                Console.WriteLine($"[GetMySubmission] Extracted UserId from JWT: '{userId}'");
                Console.WriteLine($"[GetMySubmission] User claims count: {User.Claims.Count()}");

                // Log all claims for debugging
                foreach (var claim in User.Claims)
                {
                    Console.WriteLine($"[GetMySubmission] Claim: {claim.Type} = {claim.Value}");
                }

                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("[GetMySubmission] UserId is null or empty, returning Unauthorized");
                    return Unauthorized(new { message = "User not authenticated or user ID not found in token" });
                }

                var query = new GetUserSubmissionQuery
                {
                    CompetitionId = competitionId,
                    UserId = userId
                };

                var result = await _mediator.Send(query);

                if (result == null)
                {
                    Console.WriteLine($"[GetMySubmission] No submission found for user {userId} in competition {competitionId}");
                    // Return 200 with structured response indicating no submission exists
                    // This prevents 404 errors from appearing in browser console
                    return Ok(new
                    {
                        hasSubmission = false,
                        submission = (UserSubmissionDto)null,
                        message = "No submission found for this competition"
                    });
                }

                Console.WriteLine($"[GetMySubmission] Successfully found submission for user {userId} in competition {competitionId}");
                // Return structured response with submission data
                return Ok(new
                {
                    hasSubmission = true,
                    submission = result,
                    message = "Submission found successfully"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetMySubmission] Error: {ex.Message}");
                Console.WriteLine($"[GetMySubmission] StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error while fetching submission", error = ex.Message });
            }
        }

        [HttpDelete("{submissionId}")]
        [Authorize]
        public async Task<ActionResult<DeleteSubmissionResponse>> DeleteSubmission(
            int competitionId,
            int submissionId)
        {
            // Get the current user's ID from claims
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var command = new DeleteSubmissionCommand
            {
                SubmissionId = submissionId,
                UserId = userId
            };

            var result = await _mediator.Send(command);

            if (result.Success)
            {
                return Ok(result);
            }

            if (result.Message.Contains("not found"))
            {
                return NotFound(result.Message);
            }
            else if (result.Message.Contains("not authorized"))
            {
                return Forbid(result.Message);
            }
            else if (result.Message.Contains("no longer open") || result.Message.Contains("deadline has passed"))
            {
                return BadRequest(result.Message);
            }

            return BadRequest(result.Message);
        }

        [HttpPatch("{submissionId}/judge")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult<JudgeSubmissionResponse>> JudgeSubmission(
            int competitionId,
            int submissionId,
            [FromBody] JudgeSubmissionRequest request)
        {
            // Get the current user's ID from claims
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin");

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var command = new JudgeSubmissionCommand
            {
                SubmissionId = submissionId,
                Score = request.Score,
                Feedback = request.Feedback,
                JudgeUserId = userId,
                IsAdmin = isAdmin
            };

            var result = await _mediator.Send(command);

            if (result.Success)
            {
                return Ok(result);
            }

            if (result.Message.Contains("not found"))
            {
                return NotFound(result.Message);
            }
            else if (result.Message.Contains("not authorized"))
            {
                return StatusCode(403, new { message = result.Message });
            }

            return BadRequest(result);
        }

        [HttpGet("manage")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult<SubmissionListVm>> GetSubmissions(
            int competitionId,
            [FromQuery] SubmissionStatus? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // Get the current user's ID from claims
            var userClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var userId = userClaim?.Value ?? string.Empty;
            var isAdmin = User.IsInRole("Admin");

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var query = new GetSubmissionsListQuery
            {
                CompetitionId = competitionId,
                OrganizerUserId = userId,
                Status = status,
                Page = page,
                PageSize = pageSize,
                IsAdmin = isAdmin
            };

            try
            {
                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("not found"))
                {
                    return NotFound($"Competition with ID {competitionId} not found");
                }
                else if (ex.Message.Contains("not authorized"))
                {
                    return Forbid();
                }

                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        [Authorize(Roles = "User")]
        [RequestSizeLimit(104857600)] // 100 MB limit
        [RequestFormLimits(MultipartBodyLengthLimit = 104857600)] // 100 MB limit
        public async Task<ActionResult<CreateSubmissionResponse>> CreateSubmission(
            int competitionId,
            [FromForm] string mixTitle,
            [FromForm] string mixDescription,
            [FromForm] IFormFile audioFile)
        {
            // Get the current user's ID from claims
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Add logging for submission creation
            Console.WriteLine($"[CreateSubmission] CompetitionId: {competitionId}");
            Console.WriteLine($"[CreateSubmission] Extracted UserId from JWT: '{userId}'");
            Console.WriteLine($"[CreateSubmission] MixTitle: '{mixTitle}'");
            Console.WriteLine($"[CreateSubmission] AudioFile: {audioFile?.FileName} ({audioFile?.Length} bytes)");

            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("[CreateSubmission] UserId is null or empty, returning Unauthorized");
                return Unauthorized();
            }

            var command = new CreateSubmissionCommand
            {
                CompetitionId = competitionId,
                UserId = userId,
                MixTitle = mixTitle,
                MixDescription = mixDescription,
                AudioFile = audioFile
            };

            var result = await _mediator.Send(command);

            Console.WriteLine($"[CreateSubmission] Result: Success={result.Success}, Message='{result.Message}', SubmissionId={result.SubmissionId}");

            if (result.Success)
            {
                Console.WriteLine($"[CreateSubmission] Submission created successfully with ID: {result.SubmissionId}");
                return Ok(result);
            }

            Console.WriteLine($"[CreateSubmission] Submission creation failed: {result.Message}");
            return BadRequest(result);
        }
    }

    public class JudgeSubmissionRequest
    {
        public decimal Score { get; set; }
        public required string Feedback { get; set; } = string.Empty;
    }
}