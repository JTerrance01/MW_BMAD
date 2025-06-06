using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using MixWarz.Domain.Entities;
using MixWarz.Application.Common.Interfaces;
using System.Threading.Tasks;
using System;
using System.IO;
using System.Linq;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TestUploadController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IS3ProfileMediaService _s3ProfileMediaService;
        private readonly IAppDbContext _dbContext;

        public TestUploadController(
            UserManager<User> userManager,
            IS3ProfileMediaService s3ProfileMediaService,
            IAppDbContext dbContext)
        {
            _userManager = userManager;
            _s3ProfileMediaService = s3ProfileMediaService;
            _dbContext = dbContext;
        }

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            try
            {
                // Get current user
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                // Log file details
                Console.WriteLine($"TestUploadController: Received file upload: {file?.FileName}, " +
                    $"Size: {file?.Length}, Type: {file?.ContentType}");

                // Validate file
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { success = false, message = "No file provided" });
                }

                if (!file.ContentType.StartsWith("image/"))
                {
                    return BadRequest(new { success = false, message = "File must be an image" });
                }

                // Manual file save for testing
                try
                {
                    var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "AppData", "uploads", "test-images");
                    if (!Directory.Exists(uploadsPath))
                    {
                        Directory.CreateDirectory(uploadsPath);
                    }

                    var fileName = $"test_{DateTime.UtcNow.Ticks}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                    var filePath = Path.Combine(uploadsPath, fileName);

                    Console.WriteLine($"Saving test file to {filePath}");
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/test-images/{fileName}";
                    return Ok(new { success = true, message = "File uploaded successfully", fileUrl });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error saving test file: {ex.Message}");
                    return StatusCode(500, new { success = false, message = $"Error saving file: {ex.Message}" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in TestUploadController.UploadImage: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPost("update-bio")]
        public async Task<IActionResult> UpdateBio([FromBody] UpdateBioModel model)
        {
            try
            {
                // Get current user
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                // Log request details
                Console.WriteLine($"TestUploadController: Bio update request for user {userId}");
                Console.WriteLine($"Bio content: {model.Bio?.Substring(0, Math.Min(model.Bio?.Length ?? 0, 30))}... (Length: {model.Bio?.Length ?? 0})");

                // Find user
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                // Update bio directly
                try
                {
                    user.Bio = model.Bio;
                    var result = await _userManager.UpdateAsync(user);

                    if (result.Succeeded)
                    {
                        return Ok(new { success = true, message = "Bio updated successfully", bio = model.Bio });
                    }
                    else
                    {
                        return BadRequest(new { success = false, message = "Failed to update bio", errors = result.Errors });
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error updating bio: {ex.Message}");
                    return StatusCode(500, new { success = false, message = $"Error updating bio: {ex.Message}" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in TestUploadController.UpdateBio: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPost("debug-bio")]
        [AllowAnonymous]
        public async Task<IActionResult> DebugBioUpdate([FromBody] UpdateBioModel model)
        {
            try
            {
                // Log everything for debugging
                Console.WriteLine("DebugBioUpdate called");
                Console.WriteLine($"Bio content: {model?.Bio ?? "null"}");
                Console.WriteLine($"Request content type: {Request.ContentType}");
                Console.WriteLine($"Headers: {string.Join(", ", Request.Headers.Select(h => $"{h.Key}={h.Value}"))}");

                // Return success for testing
                return Ok(new
                {
                    success = true,
                    message = "Debug bio update successful",
                    receivedBio = model?.Bio,
                    bioLength = model?.Bio?.Length ?? 0
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in DebugBioUpdate: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost("test-profile-picture")]
        public async Task<IActionResult> TestProfilePicture([FromForm] IFormFile ProfilePicture)
        {
            try
            {
                // Get current user
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                // Log file details
                Console.WriteLine($"TestUploadController: Received profile picture: {ProfilePicture?.FileName}, " +
                    $"Size: {ProfilePicture?.Length}, Type: {ProfilePicture?.ContentType}");

                // Validate file
                if (ProfilePicture == null || ProfilePicture.Length == 0)
                {
                    return BadRequest(new { success = false, message = "No file provided" });
                }

                // Basic validation
                if (!ProfilePicture.ContentType.StartsWith("image/"))
                {
                    return BadRequest(new { success = false, message = "File is not an image" });
                }

                // Return success without actually saving anything
                return Ok(new
                {
                    success = true,
                    message = "Profile picture received successfully (test)",
                    filename = ProfilePicture.FileName,
                    size = ProfilePicture.Length,
                    contentType = ProfilePicture.ContentType
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"TestProfilePicture error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // Model for bio update
        public class UpdateBioModel
        {
            public string Bio { get; set; }
        }
    }
}