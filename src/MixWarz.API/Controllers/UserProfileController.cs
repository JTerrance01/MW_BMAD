using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MixWarz.Domain.Entities;
using MediatR;
using MixWarz.Application.Features.UserProfile.Commands.UpdateProfilePicture;
using MixWarz.Application.Features.UserProfile.Commands.UpdateBio;
using MixWarz.Application.Features.UserProfile.Commands.UpdateUserProfile;
using MixWarz.Application.Features.UserProfile.Commands.UpdateUserPassword;
using MixWarz.Application.Features.UserProfile.Commands.UpdateUserNotificationPreferences;
using MixWarz.Application.Features.UserProfile.Queries.GetNewestUsers;
using MixWarz.Application.Features.UserProfile.Queries.GetUserPurchases;
using MixWarz.Domain.Enums;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // This ensures only authenticated users can access this controller
    public class UserProfileController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IMediator _mediator;

        public UserProfileController(UserManager<User> userManager, IMediator mediator)
        {
            _userManager = userManager;
            _mediator = mediator;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUserProfile()
        {
            try
            {
                // Get the current authenticated user's ID from claims
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("UserProfileController.GetCurrentUserProfile: No user ID found in claims");
                    return Unauthorized();
                }

                Console.WriteLine($"UserProfileController.GetCurrentUserProfile: Found user ID {userId} in claims");

                // Get the user from the database
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    Console.WriteLine($"UserProfileController.GetCurrentUserProfile: User with ID {userId} not found in database");
                    return NotFound();
                }

                Console.WriteLine($"UserProfileController.GetCurrentUserProfile: Found user {user.UserName} in database");

                // Get user roles with error handling
                IList<string> roles;
                try
                {
                    roles = await _userManager.GetRolesAsync(user);
                    Console.WriteLine($"UserProfileController.GetCurrentUserProfile: User roles: {string.Join(", ", roles)}");
                }
                catch (Exception roleEx)
                {
                    Console.WriteLine($"Error getting roles for user {user.Id}: {roleEx.Message}");
                    // Continue with empty roles rather than failing
                    roles = new List<string>();
                }

                // Return user profile information with null checks
                return Ok(new
                {
                    UserId = user.Id,
                    Username = user.UserName ?? string.Empty,
                    Email = user.Email ?? string.Empty,
                    FirstName = user.FirstName ?? string.Empty,
                    LastName = user.LastName ?? string.Empty,
                    Bio = user.Bio ?? string.Empty,
                    ProfilePictureUrl = user.ProfilePictureUrl ?? string.Empty,
                    Roles = roles
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UserProfileController.GetCurrentUserProfile: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");

                // Include inner exception details if available
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner exception stack trace: {ex.InnerException.StackTrace}");
                }

                return StatusCode(500, new
                {
                    message = "An error occurred while retrieving the user profile",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")] // Only admins can see all users
        public IActionResult GetAllUsers()
        {
            var users = _userManager.Users.Select(u => new
            {
                UserId = u.Id,
                Username = u.UserName,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName
            });

            return Ok(users);
        }

        [HttpPost("update-profile-picture")]
        public async Task<ActionResult<UpdateProfilePictureResponse>> UpdateProfilePicture([FromForm] UpdateProfilePictureCommand command)
        {
            try
            {
                Console.WriteLine("UpdateProfilePicture called");

                // Debug all form data
                Console.WriteLine("BEGIN FORM DATA DEBUG ===================");
                Console.WriteLine($"Request content type: {Request.ContentType}");
                Console.WriteLine($"Request content length: {Request.ContentLength}");
                Console.WriteLine($"Form keys: {string.Join(", ", Request.Form.Keys)}");
                Console.WriteLine($"Form file keys: {string.Join(", ", Request.Form.Files.Select(f => f.Name))}");

                foreach (var key in Request.Form.Keys)
                {
                    Console.WriteLine($"Form key: {key}, Value: {Request.Form[key]}");
                }

                foreach (var file in Request.Form.Files)
                {
                    Console.WriteLine($"Form file: Name={file.Name}, FileName={file.FileName}, ContentType={file.ContentType}, Length={file.Length}");
                }
                Console.WriteLine("END FORM DATA DEBUG ===================");

                // Check ModelState early
                if (!ModelState.IsValid)
                {
                    Console.WriteLine("Model state is invalid:");
                    foreach (var error in ModelState)
                    {
                        Console.WriteLine($"- {error.Key}: {string.Join(", ", error.Value.Errors.Select(e => e.ErrorMessage))}");
                    }

                    return BadRequest(new UpdateProfilePictureResponse
                    {
                        Success = false,
                        Message = "Validation failed. Please check your request data.",
                        ValidationErrors = ModelState.ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                        )
                    });
                }

                // If model binding didn't work (command.ProfilePicture is null), try to get the file directly from Request.Form.Files
                if (command.ProfilePicture == null && Request.Form.Files.Count > 0)
                {
                    Console.WriteLine("Model binding failed, trying to get file directly from Request.Form.Files");

                    // Try to find a file with name "ProfilePicture" first
                    var file = Request.Form.Files["ProfilePicture"];

                    // If not found, try to get the first file (for example if it was uploaded as "file")
                    if (file == null)
                    {
                        file = Request.Form.Files.FirstOrDefault();
                        Console.WriteLine($"Using first file found with name: {file?.Name ?? "no file"}");
                    }

                    if (file != null)
                    {
                        Console.WriteLine($"Found file directly from Request.Form.Files: {file.FileName}");

                        // Create a new command with the correct file
                        var userIdForCommand = User.FindFirstValue(ClaimTypes.NameIdentifier);
                        if (userIdForCommand == null)
                        {
                            return Unauthorized();
                        }

                        command = new UpdateProfilePictureCommand
                        {
                            UserId = userIdForCommand,
                            ProfilePicture = file
                        };
                    }
                    else
                    {
                        Console.WriteLine("No files found in Request.Form.Files");
                    }
                }

                // Always make sure UserId is set - either from form data or from JWT token
                if (string.IsNullOrEmpty(command.UserId))
                {
                    Console.WriteLine("UserId not provided in form data, getting from JWT token");
                    // Get the current user's ID from the claims
                    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (string.IsNullOrEmpty(userId))
                    {
                        Console.WriteLine("No user ID found in claims");
                        return Unauthorized();
                    }

                    Console.WriteLine($"Using userId from JWT token: {userId}");
                    command.UserId = userId;
                }

                // Check if profile picture is null
                if (command.ProfilePicture == null)
                {
                    Console.WriteLine("Profile picture is null");
                    return BadRequest(new UpdateProfilePictureResponse
                    {
                        Success = false,
                        Message = "No profile picture was provided"
                    });
                }

                // More detailed logging of the received file
                Console.WriteLine($"Profile picture received: Name={command.ProfilePicture.FileName}, " +
                    $"Size={command.ProfilePicture.Length}, ContentType={command.ProfilePicture.ContentType}");

                // Validate file type
                if (!command.ProfilePicture.ContentType.StartsWith("image/"))
                {
                    Console.WriteLine($"Invalid content type: {command.ProfilePicture.ContentType}");
                    return BadRequest(new UpdateProfilePictureResponse
                    {
                        Success = false,
                        Message = "Invalid file type. Only image files are allowed."
                    });
                }

                // Validate file size (max 2MB)
                if (command.ProfilePicture.Length > 2 * 1024 * 1024)
                {
                    Console.WriteLine($"File too large: {command.ProfilePicture.Length} bytes");
                    return BadRequest(new UpdateProfilePictureResponse
                    {
                        Success = false,
                        Message = "File size exceeds the maximum allowed (2MB)."
                    });
                }

                // Get the current user's ID from the claims
                var userIdFromClaims = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdFromClaims))
                {
                    Console.WriteLine("No user ID found in claims");
                    return Unauthorized();
                }

                Console.WriteLine($"User ID from claims: {userIdFromClaims}");

                // Set the user ID in the command
                command.UserId = userIdFromClaims;

                // Process the command
                Console.WriteLine("Sending command to handler");
                var result = await _mediator.Send(command);
                Console.WriteLine($"Handler result: Success={result.Success}, Message={result.Message}");

                if (!result.Success)
                {
                    Console.WriteLine($"Error in profile picture upload: {result.Message}");
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateProfilePicture: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");

                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner exception stack trace: {ex.InnerException.StackTrace}");
                }

                return StatusCode(500, new UpdateProfilePictureResponse
                {
                    Success = false,
                    Message = "An error occurred while updating the profile picture",
                    ProfilePictureUrl = string.Empty
                });
            }
        }

        [HttpPut("bio")]
        public async Task<ActionResult<UpdateUserBioResponse>> UpdateBio([FromBody] UpdateUserBioCommand command)
        {
            try
            {
                Console.WriteLine("UpdateBio called");

                // Validate the request
                if (command == null)
                {
                    Console.WriteLine("Bio update command is null");
                    return BadRequest(new UpdateUserBioResponse
                    {
                        Success = false,
                        Message = "No bio data was provided"
                    });
                }

                // Handle null bio value
                if (command.Bio == null)
                {
                    Console.WriteLine("Bio is null, setting to empty string");
                    command.Bio = string.Empty;
                }

                Console.WriteLine($"Bio content: {command.Bio.Substring(0, Math.Min(command.Bio.Length, 30))}... (Length: {command.Bio.Length})");

                // Get the current user's ID from the claims
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("No user ID found in claims");
                    return Unauthorized(new UpdateUserBioResponse
                    {
                        Success = false,
                        Message = "User authentication failed"
                    });
                }

                Console.WriteLine($"User ID from claims: {userId}");

                // Set the user ID in the command
                command.UserId = userId;

                // Process the command
                Console.WriteLine("Sending bio update command to handler");
                var result = await _mediator.Send(command);
                Console.WriteLine($"Handler result: Success={result.Success}, Message={result.Message}");

                if (!result.Success)
                {
                    Console.WriteLine($"Error in bio update: {result.Message}");
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateBio: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");

                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner exception stack trace: {ex.InnerException.StackTrace}");
                }

                return StatusCode(500, new UpdateUserBioResponse
                {
                    Success = false,
                    Message = "An error occurred while updating the bio"
                });
            }
        }

        [HttpGet("newest-users")]
        [AllowAnonymous] // Allow anonymous access to see newest users
        public async Task<ActionResult<GetNewestUsersResponse>> GetNewestUsers([FromQuery] int limit = 5)
        {
            try
            {
                // Enforce a reasonable range
                if (limit < 1) limit = 1;
                if (limit > 50) limit = 50;

                var query = new GetNewestUsersQuery { Limit = limit };
                var result = await _mediator.Send(query);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetNewestUsers: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    message = "An error occurred while retrieving newest users",
                    error = ex.Message
                });
            }
        }

        [HttpGet("{username}")]
        public async Task<IActionResult> GetUserProfile(string username)
        {
            // Find the user by username
            var user = await _userManager.FindByNameAsync(username);

            if (user == null)
            {
                return NotFound();
            }

            // Return public profile information
            return Ok(new
            {
                Username = user.UserName,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Bio = user.Bio,
                ProfilePictureUrl = user.ProfilePictureUrl
                // Note: We don't include private info like email or roles here
            });
        }

        [HttpPut]
        public async Task<ActionResult<UpdateUserProfileResponse>> UpdateProfile([FromBody] UpdateUserProfileCommand command)
        {
            try
            {
                Console.WriteLine("UpdateProfile called");

                // Validate the request
                if (command == null)
                {
                    Console.WriteLine("Profile update command is null");
                    return BadRequest(new UpdateUserProfileResponse
                    {
                        Success = false,
                        Message = "No profile data was provided"
                    });
                }

                // Get the current user's ID from the claims
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("No user ID found in claims");
                    return Unauthorized(new UpdateUserProfileResponse
                    {
                        Success = false,
                        Message = "User authentication failed"
                    });
                }

                Console.WriteLine($"User ID from claims: {userId}");

                // Set the user ID in the command
                command.UserId = userId;

                // Process the command
                Console.WriteLine("Sending profile update command to handler");
                var result = await _mediator.Send(command);
                Console.WriteLine($"Handler result: Success={result.Success}, Message={result.Message}");

                if (!result.Success)
                {
                    Console.WriteLine($"Error in profile update: {result.Message}");
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateProfile: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");

                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner exception stack trace: {ex.InnerException.StackTrace}");
                }

                return StatusCode(500, new UpdateUserProfileResponse
                {
                    Success = false,
                    Message = "An error occurred while updating the profile"
                });
            }
        }

        [HttpPut("password")]
        public async Task<ActionResult<UpdateUserPasswordResponse>> UpdatePassword([FromBody] UpdateUserPasswordCommand command)
        {
            try
            {
                Console.WriteLine("UpdatePassword called");

                // Validate the request
                if (command == null)
                {
                    Console.WriteLine("Password update command is null");
                    return BadRequest(new UpdateUserPasswordResponse
                    {
                        Success = false,
                        Message = "No password data was provided"
                    });
                }

                // Get the current user's ID from the claims
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("No user ID found in claims");
                    return Unauthorized(new UpdateUserPasswordResponse
                    {
                        Success = false,
                        Message = "User authentication failed"
                    });
                }

                Console.WriteLine($"User ID from claims: {userId}");

                // Set the user ID in the command
                command.UserId = userId;

                // Process the command
                Console.WriteLine("Sending password update command to handler");
                var result = await _mediator.Send(command);
                Console.WriteLine($"Handler result: Success={result.Success}, Message={result.Message}");

                if (!result.Success)
                {
                    Console.WriteLine($"Error in password update: {result.Message}");
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdatePassword: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");

                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner exception stack trace: {ex.InnerException.StackTrace}");
                }

                return StatusCode(500, new UpdateUserPasswordResponse
                {
                    Success = false,
                    Message = "An error occurred while updating the password"
                });
            }
        }

        [HttpPut("notifications")]
        public async Task<ActionResult<UpdateUserNotificationPreferencesResponse>> UpdateNotificationPreferences([FromBody] UpdateUserNotificationPreferencesCommand command)
        {
            try
            {
                Console.WriteLine("UpdateNotificationPreferences called");

                // Validate the request
                if (command == null)
                {
                    Console.WriteLine("Notification preferences update command is null");
                    return BadRequest(new UpdateUserNotificationPreferencesResponse
                    {
                        Success = false,
                        Message = "No notification preferences data was provided"
                    });
                }

                // Get the current user's ID from the claims
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("No user ID found in claims");
                    return Unauthorized(new UpdateUserNotificationPreferencesResponse
                    {
                        Success = false,
                        Message = "User authentication failed"
                    });
                }

                Console.WriteLine($"User ID from claims: {userId}");

                // Set the user ID in the command
                command.UserId = userId;

                // Process the command
                Console.WriteLine("Sending notification preferences update command to handler");
                var result = await _mediator.Send(command);
                Console.WriteLine($"Handler result: Success={result.Success}, Message={result.Message}");

                if (!result.Success)
                {
                    Console.WriteLine($"Error in notification preferences update: {result.Message}");
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateNotificationPreferences: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");

                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner exception stack trace: {ex.InnerException.StackTrace}");
                }

                return StatusCode(500, new UpdateUserNotificationPreferencesResponse
                {
                    Success = false,
                    Message = "An error occurred while updating notification preferences"
                });
            }
        }

        [HttpGet("purchases")]
        public async Task<ActionResult<UserPurchasesVm>> GetUserPurchases(
            [FromQuery] string? status = null,
            [FromQuery] string? type = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // Get the current authenticated user's ID from claims
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                // Parse status if provided
                OrderStatus? orderStatus = null;
                if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
                {
                    orderStatus = parsedStatus;
                }

                var query = new GetUserPurchasesQuery
                {
                    UserId = userId,
                    Status = orderStatus,
                    Type = type,
                    Page = page,
                    PageSize = pageSize
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "An error occurred while retrieving user purchases",
                    error = ex.Message
                });
            }
        }
    }
}