using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MixWarz.Application.Features.Submissions.Queries.GetUserSubmissions;
using MixWarz.Domain.Enums;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/users/submissions")]
    [Authorize]
    public class UserSubmissionsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public UserSubmissionsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Get all submissions for the current user across all competitions
        /// </summary>
        [HttpGet("my-submissions")]
        public async Task<ActionResult<UserSubmissionsListVm>> GetMySubmissions(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] SubmissionStatus? statusFilter = null,
            [FromQuery] CompetitionStatus? competitionStatusFilter = null)
        {
            try
            {
                // Get the current user's ID from claims
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("userId")?.Value
                           ?? User.FindFirst("sub")?.Value;

                Console.WriteLine($"[GetMySubmissions] Fetching submissions for user: {userId}");
                Console.WriteLine($"[GetMySubmissions] Page: {page}, PageSize: {pageSize}");
                Console.WriteLine($"[GetMySubmissions] StatusFilter: {statusFilter}, CompetitionStatusFilter: {competitionStatusFilter}");

                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("[GetMySubmissions] UserId is null or empty, returning Unauthorized");
                    return Unauthorized(new { message = "User not authenticated or user ID not found in token" });
                }

                var query = new GetUserSubmissionsQuery
                {
                    UserId = userId,
                    Page = page,
                    PageSize = pageSize,
                    StatusFilter = statusFilter,
                    CompetitionStatusFilter = competitionStatusFilter
                };

                var result = await _mediator.Send(query);

                Console.WriteLine($"[GetMySubmissions] Found {result.TotalCount} total submissions for user {userId}");
                Console.WriteLine($"[GetMySubmissions] Returning {result.Submissions.Count} submissions for page {page}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetMySubmissions] Error: {ex.Message}");
                Console.WriteLine($"[GetMySubmissions] StackTrace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    message = "Internal server error while fetching submissions",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get submissions for a specific user by username (public endpoint with limited info)
        /// </summary>
        [HttpGet("user/{username}")]
        [AllowAnonymous]
        public async Task<ActionResult<UserSubmissionsListVm>> GetUserSubmissions(
            string username,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                Console.WriteLine($"[GetUserSubmissions] Fetching public submissions for username: {username}");

                // For public view, we only show completed submissions from completed competitions
                var query = new GetUserSubmissionsQuery
                {
                    UserId = username, // This will need to be resolved to user ID in the handler
                    Page = page,
                    PageSize = pageSize,
                    StatusFilter = SubmissionStatus.Judged,
                    CompetitionStatusFilter = CompetitionStatus.Completed
                };

                var result = await _mediator.Send(query);

                // For public view, remove sensitive information
                foreach (var submission in result.Submissions)
                {
                    submission.Feedback = null; // Don't show private feedback publicly
                    submission.CanDelete = false; // Others can't delete submissions
                }

                Console.WriteLine($"[GetUserSubmissions] Returning {result.Submissions.Count} public submissions for {username}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetUserSubmissions] Error: {ex.Message}");
                Console.WriteLine($"[GetUserSubmissions] StackTrace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    message = "Internal server error while fetching user submissions",
                    error = ex.Message
                });
            }
        }
    }
}