using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;
using MediatR;
using MixWarz.Application.Common.Models;
using MixWarz.Application.Features.UserProfile.DTOs;
using MixWarz.Application.Features.UserProfile.Queries.GetUserActivities;
using MixWarz.Application.Features.UserProfile.Queries.GetUserStatistics;
using MixWarz.Application.Features.UserProfile.Commands.TrackUserActivity;
using MixWarz.Domain.Enums;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableCors("AllowActivityTracking")] // Use the activity tracking CORS policy
    public class UserActivityController : ControllerBase
    {
        private readonly IMediator _mediator;

        public UserActivityController(IMediator mediator)
        {
            _mediator = mediator;
        }

        private string GetAuthenticatedUserId()
        {
            try
            {
                var userIdClaim = User?.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    Console.WriteLine("[ACTIVITY] No authenticated user found, using 'anonymous'");
                    return "anonymous"; // Return a default value for non-authenticated users
                }

                return userIdClaim;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ACTIVITY] Error getting user ID: {ex.Message}");
                return "anonymous"; // Fallback in case of any errors
            }
        }

        private string GetClientIPAddress()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }

        private string GetUserAgent()
        {
            return HttpContext.Request.Headers["User-Agent"].ToString() ?? "Unknown";
        }

        [HttpGet("activities")]
        [AllowAnonymous] // Make it accessible without authentication
        public async Task<ActionResult<PaginatedList<UserActivityDto>>> GetUserActivities(
            [FromQuery] int? activityType = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? relatedEntityType = null,
            [FromQuery] int? relatedEntityId = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // Validate user is authenticated
                var userId = GetAuthenticatedUserId();
                if (userId == "anonymous")
                {
                    // For anonymous requests, still return empty results rather than unauthorized
                    // This is safer for activity tracking
                    var emptyResult = new PaginatedList<UserActivityDto>(
                        new List<UserActivityDto>(), 0, pageNumber, pageSize);
                    return Ok(emptyResult);
                }

                // Validate and convert activity type enum
                ActivityType? parsedActivityType = null;
                if (activityType.HasValue)
                {
                    if (Enum.IsDefined(typeof(ActivityType), activityType.Value))
                    {
                        parsedActivityType = (ActivityType)activityType.Value;
                    }
                    else
                    {
                        return BadRequest(new
                        {
                            message = $"Invalid activity type value: {activityType.Value}",
                            validTypes = Enum.GetNames(typeof(ActivityType))
                        });
                    }
                }

                // Validate date range if both are provided
                if (startDate.HasValue && endDate.HasValue && startDate > endDate)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                // Validate page size range
                if (pageSize < 1 || pageSize > 100)
                {
                    pageSize = 10; // Reset to default instead of erroring
                }

                // Build and execute query
                var query = new GetUserActivitiesQuery
                {
                    UserId = userId,
                    ActivityType = parsedActivityType,
                    StartDate = startDate,
                    EndDate = endDate,
                    RelatedEntityType = relatedEntityType ?? string.Empty,
                    RelatedEntityId = relatedEntityId,
                    PageNumber = Math.Max(1, pageNumber), // Ensure positive page number
                    PageSize = pageSize
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetUserActivities: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    message = "An error occurred while retrieving user activities",
                    error = ex.Message,
                    details = ex.InnerException?.Message
                });
            }
        }

        [HttpGet("statistics")]
        [AllowAnonymous] // Make it accessible without authentication
        public async Task<ActionResult<UserActivitySummaryDto>> GetUserStatistics()
        {
            try
            {
                var userId = GetAuthenticatedUserId();
                if (userId == "anonymous")
                {
                    // For anonymous requests, return an empty statistics object
                    return Ok(new UserActivitySummaryDto
                    {
                        TotalActivities = 0,
                        ActivityByType = new Dictionary<string, int>(),
                        ActivityByDay = new Dictionary<string, int>(),
                        RecentActivity = new List<UserActivityDto>()
                    });
                }

                var query = new GetUserStatisticsQuery { UserId = userId };
                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetUserStatistics: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    message = "An error occurred while retrieving user statistics",
                    error = ex.Message,
                    details = ex.InnerException?.Message
                });
            }
        }

        // Standard activity tracking endpoint for authenticated users
        [HttpPost("track")]
        [AllowAnonymous] // Allow anonymous tracking for better UX
        public async Task<ActionResult<int>> TrackActivity([FromBody] TrackUserActivityCommand command)
        {
            return await TrackActivityInternal(command);
        }

        // Special dedicated endpoint for anonymous tracking
        // This endpoint is specifically configured for cross-domain access
        [HttpPost("anonymous-track")]
        [AllowAnonymous]
        public async Task<ActionResult<int>> TrackAnonymousActivity([FromBody] TrackUserActivityCommand command)
        {
            // Validate command is not null
            if (command == null)
            {
                return BadRequest(new { message = "Activity data is required" });
            }

            // Ensure this is marked as anonymous regardless of auth status
            command.UserId = "anonymous";

            return await TrackActivityInternal(command);
        }

        // Common implementation for both tracking endpoints
        private async Task<ActionResult<int>> TrackActivityInternal(TrackUserActivityCommand command)
        {
            try
            {
                // Enhanced request logging for debugging
                Console.WriteLine($"[ACTIVITY] Received tracking request: {Request.Method} {Request.Path}");
                Console.WriteLine($"[ACTIVITY] Content-Type: {Request.ContentType ?? "no content type"}");
                Console.WriteLine($"[ACTIVITY] Headers: {string.Join(", ", Request.Headers.Select(h => $"{h.Key}={h.Value}"))}");
                Console.WriteLine($"[ACTIVITY] Body present: {Request.Body != null}");
                Console.WriteLine($"[ACTIVITY] Content-Length: {Request.ContentLength ?? 0}");

                // CORS headers check
                Console.WriteLine($"[ACTIVITY] Origin header: {Request.Headers["Origin"]}");
                Console.WriteLine($"[ACTIVITY] Access-Control-Request-Method: {Request.Headers["Access-Control-Request-Method"]}");

                // Special activity tracking header
                Console.WriteLine($"[ACTIVITY] X-Activity-Client: {Request.Headers["X-Activity-Client"]}");
                Console.WriteLine($"[ACTIVITY] X-Activity-Timestamp: {Request.Headers["X-Activity-Timestamp"]}");

                // Validate command
                if (command == null)
                {
                    Console.WriteLine("[ACTIVITY] Bad request: command is null");
                    return BadRequest(new { message = "Activity data is required" });
                }

                // Log the incoming command for debugging
                Console.WriteLine($"[ACTIVITY] Command: Type={command.Type}, Description={command.Description ?? "null"}, RelatedEntityType={command.RelatedEntityType ?? "null"}, RelatedEntityId={command.RelatedEntityId}");

                // Get user ID - ensure it always has a value
                var userId = string.IsNullOrEmpty(command.UserId) ? GetAuthenticatedUserId() : command.UserId;
                Console.WriteLine($"[ACTIVITY] User ID: {userId}");

                // Validate activity type is defined in the enum
                if (!Enum.IsDefined(typeof(ActivityType), command.Type))
                {
                    Console.WriteLine($"[ACTIVITY] Invalid activity type: {command.Type}");
                    return BadRequest(new
                    {
                        message = $"Invalid activity type: {command.Type}",
                        validTypes = Enum.GetNames(typeof(ActivityType))
                    });
                }

                // Set user ID and request metadata
                command.UserId = userId ?? "anonymous";
                command.IPAddress = GetClientIPAddress();
                command.UserAgent = GetUserAgent();

                // Ensure description has a value
                if (string.IsNullOrWhiteSpace(command.Description))
                {
                    command.Description = $"{command.Type} activity";
                }

                // Track the activity
                Console.WriteLine("[ACTIVITY] Sending command to handler");
                var activityId = await _mediator.Send(command);

                // Log success for debugging
                Console.WriteLine($"[ACTIVITY] Successfully tracked activity: {command.Type} for user {command.UserId}, ID: {activityId}");

                // Return success response with CORS headers explicitly added
                return Ok(new
                {
                    success = true,
                    activityId = activityId,
                    message = "Activity tracked successfully"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ACTIVITY] Exception in TrackActivity: {ex.Message}");
                Console.WriteLine($"[ACTIVITY] Stack trace: {ex.StackTrace}");

                // Add more detailed error information for debugging
                return StatusCode(500, new
                {
                    message = "An error occurred while tracking activity",
                    error = ex.Message,
                    details = ex.InnerException?.Message
                });
            }
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PaginatedList<UserActivityDto>>> GetAllUserActivities(
            [FromQuery] string? userId = null,
            [FromQuery] int? activityType = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // Validate and convert activity type enum
                ActivityType? parsedActivityType = null;
                if (activityType.HasValue)
                {
                    if (Enum.IsDefined(typeof(ActivityType), activityType.Value))
                    {
                        parsedActivityType = (ActivityType)activityType.Value;
                    }
                    else
                    {
                        return BadRequest(new
                        {
                            message = $"Invalid activity type value: {activityType.Value}",
                            validTypes = Enum.GetNames(typeof(ActivityType))
                        });
                    }
                }

                var query = new GetUserActivitiesQuery
                {
                    UserId = userId ?? string.Empty,
                    ActivityType = parsedActivityType,
                    StartDate = startDate,
                    EndDate = endDate,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetAllUserActivities: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    message = "An error occurred while retrieving all user activities",
                    error = ex.Message,
                    details = ex.InnerException?.Message
                });
            }
        }

        [HttpGet("user-statistics/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UserActivitySummaryDto>> GetUserStatisticsById(string userId)
        {
            try
            {
                var query = new GetUserStatisticsQuery { UserId = userId };
                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetUserStatisticsById: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    message = "An error occurred while retrieving user statistics",
                    error = ex.Message,
                    details = ex.InnerException?.Message
                });
            }
        }

        // Add a new endpoint to get current user information
        [HttpGet("me")]
        [AllowAnonymous] // Make it accessible without authentication
        public IActionResult GetCurrentUser()
        {
            try
            {
                var userId = GetAuthenticatedUserId();
                var isAnonymous = userId == "anonymous";

                return Ok(new
                {
                    userId = userId,
                    isAuthenticated = !isAnonymous,
                    trackingEnabled = true // Always enable tracking for this endpoint
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetCurrentUser: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    message = "An error occurred while retrieving user information",
                    error = ex.Message
                });
            }
        }

        // Special endpoint for no-cors tracking with image beacon pattern
        [HttpGet("beacon")]
        [AllowAnonymous]
        public IActionResult TrackBeacon(
            [FromQuery] int type,
            [FromQuery] string? description = null,
            [FromQuery] string? relatedEntityType = null,
            [FromQuery] int? relatedEntityId = null,
            [FromQuery] string? timestamp = null)
        {
            Console.WriteLine("[ACTIVITY] Received beacon tracking request");

            try
            {
                // Create command from query parameters
                var command = new TrackUserActivityCommand
                {
                    Type = (ActivityType)type,
                    Description = description ?? $"Beacon tracking for type {type}",
                    RelatedEntityType = relatedEntityType ?? string.Empty,
                    RelatedEntityId = relatedEntityId,
                    UserId = "anonymous" // Always use anonymous for beacon requests
                };

                // Add metadata
                command.IPAddress = GetClientIPAddress();
                command.UserAgent = GetUserAgent();

                // Track the activity asynchronously - don't wait for result
                // This helps return the image quickly while still tracking
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var activityId = await _mediator.Send(command);
                        Console.WriteLine($"[ACTIVITY] Beacon tracking successful, ID: {activityId}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[ACTIVITY] Beacon tracking failed: {ex.Message}");
                    }
                });

                // Return a 1x1 transparent GIF
                byte[] transparentGif = {
                    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
                    0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21,
                    0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
                    0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
                    0x01, 0x00, 0x3B
                };

                // Set CORS headers
                Response.Headers["Access-Control-Allow-Origin"] = "*";
                Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";

                return File(transparentGif, "image/gif");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ACTIVITY] Exception in beacon tracking: {ex.Message}");

                // Still return the transparent GIF to prevent client errors
                byte[] transparentGif = {
                    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
                    0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21,
                    0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
                    0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
                    0x01, 0x00, 0x3B
                };

                Response.Headers["Access-Control-Allow-Origin"] = "*";
                return File(transparentGif, "image/gif");
            }
        }

        // Handle all OPTIONS requests for the activity endpoints
        [HttpOptions("{action}")]
        [AllowAnonymous]
        public IActionResult HandleOptions(string action)
        {
            // Preflight response
            return NoContent();
        }
    }
}