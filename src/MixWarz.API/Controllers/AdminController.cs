using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using MixWarz.Application.Features.Admin.Queries.GetUsers;
using MixWarz.Application.Features.Admin.Commands.UpdateUserRoles;
using MixWarz.Application.Features.Admin.Queries.GetCompetitionsList;
using MixWarz.Application.Features.Admin.Commands.UpdateCompetitionStatus;
using MixWarz.Application.Features.Admin.Queries.GetProductsList;
using MixWarz.Application.Features.Admin.Commands.UpdateProductStatus;
using MixWarz.Application.Features.Admin.Queries.GetOrdersList;
using MixWarz.Application.Features.Admin.Queries.GetOrderDetail;
using MixWarz.Application.Features.Admin.Queries.GetStatistics;
using MixWarz.Domain.Enums;
using MixWarz.Application.Features.Admin.Queries.GetUserDetail;
using MixWarz.Application.Features.Admin.Commands.CreateUser;
using MixWarz.Application.Features.Admin.Commands.DeleteUser;
using MixWarz.Application.Features.Admin.Commands.DisableUser;
using MixWarz.Application.Features.Products.Commands.CreateProduct;
using MixWarz.Application.Features.Products.Commands.UpdateProduct;
using MixWarz.Application.Features.Admin.Commands.CreateCompetition;
using System.Security.Claims;
using MixWarz.Application.Features.Admin.Commands.UpdateOrderStatus;
using MixWarz.Application.Features.Admin.Commands.UpdateCompetition;
using MixWarz.Domain.Interfaces;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Policy = "RequireAdminRole")]
    public class AdminController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(IMediator mediator, IFileStorageService fileStorageService, ILogger<AdminController> logger)
        {
            _mediator = mediator;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        // GET api/v1/admin/users
        [HttpGet("users")]
        public async Task<ActionResult<UserListVm>> GetUsers(
            [FromQuery] string? searchTerm = "",
            [FromQuery] string? role = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = new GetUsersQuery
            {
                SearchTerm = searchTerm ?? "",
                Role = role ?? "",
                Page = page,
                PageSize = pageSize
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        // PUT api/v1/admin/users/{userId}/roles
        [HttpPut("users/{userId}/roles")]
        public async Task<ActionResult<UpdateUserRolesResponse>> UpdateUserRoles(
            string userId,
            [FromBody] UpdateUserRolesCommand command)
        {
            if (userId != command.UserId)
            {
                return BadRequest("User ID mismatch between route and body");
            }

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // GET api/v1/admin/competitions
        [HttpGet("competitions")]
        public async Task<ActionResult<CompetitionsListVm>> GetCompetitions(
            [FromQuery] string? organizerId = "",
            [FromQuery] string? status = null,
            [FromQuery] string? searchTerm = "",
            [FromQuery] DateTime? startDateFrom = null,
            [FromQuery] DateTime? startDateTo = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // Convert DateTime parameters to UTC for PostgreSQL compatibility
            DateTime? utcStartDateFrom = startDateFrom.HasValue
                ? DateTime.SpecifyKind(startDateFrom.Value, DateTimeKind.Utc)
                : null;

            DateTime? utcStartDateTo = startDateTo.HasValue
                ? DateTime.SpecifyKind(startDateTo.Value, DateTimeKind.Utc)
                : null;

            var query = new GetCompetitionsListQuery
            {
                OrganizerId = organizerId ?? "",
                SearchTerm = searchTerm ?? "",
                StartDateFrom = utcStartDateFrom,
                StartDateTo = utcStartDateTo,
                Page = page,
                PageSize = pageSize
            };

            // Handle multiple statuses if comma-separated list is provided
            if (!string.IsNullOrEmpty(status))
            {
                var statusValues = status.Split(',');
                var statusList = new List<MixWarz.Domain.Enums.CompetitionStatus>();

                foreach (var statusValue in statusValues)
                {
                    if (Enum.TryParse<MixWarz.Domain.Enums.CompetitionStatus>(statusValue.Trim(), out var parsedStatus))
                    {
                        statusList.Add(parsedStatus);
                    }
                }

                if (statusList.Count > 0)
                {
                    query.Statuses = statusList;
                }
                else if (Enum.TryParse<MixWarz.Domain.Enums.CompetitionStatus>(status, out var singleStatus))
                {
                    // For backward compatibility
                    query.Status = singleStatus;
                }
            }

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        // PATCH api/v1/admin/competitions/{competitionId}/status
        [HttpPut("competitions/{competitionId}/status")]
        public async Task<ActionResult<UpdateCompetitionStatusResponse>> UpdateCompetitionStatus(
            int competitionId,
            [FromBody] UpdateCompetitionStatusCommand command)
        {
            // If the command doesn't have the ID set, set it from the URL
            if (command.CompetitionId == 0)
            {
                command.CompetitionId = competitionId;
            }

            // Check for mismatch
            if (competitionId != command.CompetitionId)
            {
                return BadRequest(new { Success = false, Message = "Competition ID mismatch between route and body" });
            }

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // GET api/v1/admin/products
        [HttpGet("products")]
        public async Task<ActionResult<ProductsListVm>> GetProducts(
            [FromQuery] int? categoryId = null,
            [FromQuery] ProductType? productType = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] string? searchTerm = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = new GetProductsListQuery
            {
                CategoryId = categoryId,
                ProductType = productType,
                IsActive = isActive,
                SearchTerm = searchTerm ?? "",
                Page = page,
                PageSize = pageSize
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        // PUT api/v1/admin/products/{productId}
        [HttpPut("products/{productId}")]
        public async Task<ActionResult<UpdateProductResponse>> UpdateProduct(int productId, [FromForm] UpdateProductCommand command)
        {
            if (productId != command.ProductId)
            {
                return BadRequest(new { Success = false, Message = "Product ID mismatch between route and body" });
            }

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // PATCH api/v1/admin/products/{productId}/status
        [HttpPut("products/{productId}/status")]
        public async Task<ActionResult<UpdateProductStatusResponse>> UpdateProductStatus(
            int productId,
            [FromBody] UpdateProductStatusCommand command)
        {
            if (productId != command.ProductId)
            {
                return BadRequest(new { Success = false, Message = "Product ID mismatch between route and body" });
            }

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // GET api/v1/admin/orders
        [HttpGet("orders")]
        public async Task<ActionResult<OrdersListVm>> GetOrders(
            [FromQuery] string? userId = "",
            [FromQuery] string? status = null,
            [FromQuery] DateTime? orderDateFrom = null,
            [FromQuery] DateTime? orderDateTo = null,
            [FromQuery] decimal? minAmount = null,
            [FromQuery] decimal? maxAmount = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // Log the request parameters
                Console.WriteLine($"GetOrders: userId={userId}, status={status}, orderDateFrom={orderDateFrom}, orderDateTo={orderDateTo}, page={page}, pageSize={pageSize}");

                OrderStatus? orderStatusEnum = null;

                // Parse the status string to enum if provided
                if (!string.IsNullOrEmpty(status))
                {
                    if (Enum.TryParse<OrderStatus>(status, out var parsedStatus))
                    {
                        orderStatusEnum = parsedStatus;
                        Console.WriteLine($"Parsed status '{status}' to enum value: {orderStatusEnum}");
                    }
                    else
                    {
                        Console.WriteLine($"Failed to parse status '{status}' to OrderStatus enum");
                    }
                }

                // Convert DateTime parameters to UTC for PostgreSQL compatibility
                DateTime? utcOrderDateFrom = orderDateFrom.HasValue
                    ? DateTime.SpecifyKind(orderDateFrom.Value, DateTimeKind.Utc)
                    : null;

                DateTime? utcOrderDateTo = orderDateTo.HasValue
                    ? DateTime.SpecifyKind(orderDateTo.Value, DateTimeKind.Utc)
                    : null;

                var query = new GetOrdersListQuery
                {
                    UserId = userId ?? "",
                    Status = orderStatusEnum,
                    OrderDateFrom = utcOrderDateFrom,
                    OrderDateTo = utcOrderDateTo,
                    MinAmount = minAmount,
                    MaxAmount = maxAmount,
                    Page = page,
                    PageSize = pageSize
                };

                var result = await _mediator.Send(query);

                // Transform the result to match the expected format in the frontend
                var response = new
                {
                    items = result.Orders,
                    totalCount = result.TotalCount,
                    page = result.Page,
                    pageSize = result.PageSize,
                    totalPages = result.TotalPages
                };

                Console.WriteLine($"GetOrders: Returning {result.Orders.Count} orders, total count: {result.TotalCount}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetOrders: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { Success = false, Message = $"An error occurred: {ex.Message}" });
            }
        }

        // GET api/v1/admin/orders/{orderId}
        [HttpGet("orders/{orderId}")]
        public async Task<ActionResult<OrderDto>> GetOrderDetail(int orderId)
        {
            var query = new GetOrderDetailQuery
            {
                OrderId = orderId
            };

            var result = await _mediator.Send(query);

            if (result == null)
            {
                return NotFound(new { Message = $"Order with ID {orderId} not found" });
            }

            return Ok(result);
        }

        // GET api/v1/admin/statistics
        [HttpGet("statistics")]
        public async Task<ActionResult<AdminStatisticsVm>> GetStatistics()
        {
            var query = new GetAdminStatisticsQuery();
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        // GET api/v1/admin/users/{userId}
        [HttpGet("users/{userId}")]
        public async Task<ActionResult<UserDetailVm>> GetUserDetail(string userId)
        {
            var query = new GetUserDetailQuery
            {
                UserId = userId
            };

            var result = await _mediator.Send(query);

            if (result == null)
            {
                return NotFound(new { Message = $"User with ID {userId} not found" });
            }

            return Ok(result);
        }

        // POST api/v1/admin/users
        [HttpPost("users")]
        public async Task<ActionResult<CreateUserResponse>> CreateUser([FromBody] CreateUserCommand command)
        {
            if (command == null)
            {
                return BadRequest(new { Message = "Invalid request body" });
            }

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetUserDetail), new { userId = result.UserId }, result);
        }

        // DELETE api/v1/admin/users/{userId}
        [HttpDelete("users/{userId}")]
        public async Task<ActionResult<DeleteUserResponse>> DeleteUser(string userId)
        {
            var command = new DeleteUserCommand
            {
                UserId = userId
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // PUT api/v1/admin/users/{userId}/disable
        [HttpPut("users/{userId}/disable")]
        public async Task<ActionResult<DisableUserResponse>> DisableUser(string userId, [FromBody] DisableUserCommand command)
        {
            // Ensure the userId from route matches the command
            command.UserId = userId;

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // POST api/v1/admin/products
        [HttpPost("products")]
        public async Task<ActionResult<CreateProductResponse>> CreateProduct([FromForm] CreateProductCommand command)
        {
            if (command == null)
            {
                return BadRequest(new { Success = false, Message = "Invalid request body" });
            }

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetProducts), new { id = result.ProductId }, result);
        }

        // POST api/v1/admin/competitions
        [HttpPost("competitions")]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        [DisableRequestSizeLimit]
        [RequestFormLimits(MultipartBodyLengthLimit = 2147483648)] // 2GB
        public async Task<ActionResult<CreateCompetitionResponse>> CreateCompetition([FromForm] CreateCompetitionCommand command)
        {
            try
            {
                _logger.LogInformation("==================== BEGIN COMPETITION CREATION ====================");
                _logger.LogInformation("Received CreateCompetition request from admin");

                if (command == null)
                {
                    _logger.LogWarning("Command object is null");
                    return BadRequest(new { Success = false, Message = "Invalid request body" });
                }

                // Log key request information
                _logger.LogInformation("Title: {Title}", command.Title ?? "null");
                _logger.LogInformation("Description length: {DescriptionLength}", command.Description?.Length ?? 0);
                _logger.LogInformation("Cover image present: {CoverImagePresent}", command.CoverImage != null);
                _logger.LogInformation("Multitrack file present: {MultitrackFilePresent}", command.MultitrackZipFile != null);
                _logger.LogInformation("Source track file present: {SourceTrackFilePresent}", command.SourceTrackFile != null);

                // STEP 1: Process file uploads and generate URLs BEFORE validation
                await ProcessFileUploadsAsync(command);

                // STEP 2: Set organizer user ID from claims
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation("Setting organizer ID from claims: {UserId}", userId);
                command.OrganizerUserId = userId;

                // STEP 3: Send command to MediatR (validation will now have URLs available)
                _logger.LogInformation("Sending command to MediatR handler...");
                var result = await _mediator.Send(command);

                if (!result.Success)
                {
                    _logger.LogWarning("Competition creation failed: {Message}", result.Message);
                    return BadRequest(result);
                }

                _logger.LogInformation("Competition created successfully with ID: {CompetitionId}", result.CompetitionId);
                _logger.LogInformation("==================== END COMPETITION CREATION ====================");
                return CreatedAtAction(nameof(GetCompetitions), new { id = result.CompetitionId }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception in CreateCompetition: {Message}", ex.Message);
                _logger.LogInformation("==================== END COMPETITION CREATION (WITH ERROR) ====================");

                return BadRequest(new CreateCompetitionResponse
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        private async Task ProcessFileUploadsAsync(CreateCompetitionCommand command)
        {
            // Added comprehensive logging for debugging
            _logger.LogInformation("Processing file uploads...");
            _logger.LogInformation("Initial URL values - ImageUrl: {ImageUrl}, MultitrackZipUrl: {MultitrackZipUrl}, SourceTrackUrl: {SourceTrackUrl}",
                command.ImageUrl ?? "null", command.MultitrackZipUrl ?? "null", command.SourceTrackUrl ?? "null");

            // Process cover image upload
            if (command.CoverImage != null)
            {
                ValidateCoverImage(command.CoverImage);

                _logger.LogInformation("Processing cover image: {FileName}, size: {Size} KB",
                    command.CoverImage.FileName, command.CoverImage.Length / 1024);

                var coverImageResult = await _fileStorageService.UploadFileAsync(command.CoverImage, "competition-covers");

                // Convert to absolute URL for consistent database storage
                command.ImageUrl = GenerateAbsoluteFileUrl(coverImageResult);

                _logger.LogInformation("Cover image uploaded successfully: {Url}", command.ImageUrl);

                // Clear the file reference since we now have the URL
                command.CoverImage = null;
            }

            // Process multitrack zip upload
            if (command.MultitrackZipFile != null)
            {
                ValidateMultitrackZipFile(command.MultitrackZipFile);

                _logger.LogInformation("Processing multitrack zip: {FileName}, size: {Size} KB",
                    command.MultitrackZipFile.FileName, command.MultitrackZipFile.Length / 1024);

                var multitrackResult = await _fileStorageService.UploadFileAsync(command.MultitrackZipFile, "competition-multitracks");

                // Convert to absolute URL for consistent database storage
                command.MultitrackZipUrl = GenerateAbsoluteFileUrl(multitrackResult);

                _logger.LogInformation("Multitrack zip uploaded successfully: {Url}", command.MultitrackZipUrl);

                // Clear the file reference since we now have the URL
                command.MultitrackZipFile = null;
            }
            else if (string.IsNullOrEmpty(command.MultitrackZipUrl) || command.MultitrackZipUrl == "FILE_UPLOAD_PLACEHOLDER")
            {
                // If no file and no valid URL, this will fail validation as expected
                _logger.LogWarning("No multitrack file provided and no valid URL");
                command.MultitrackZipUrl = null;
            }

            // Process source track upload
            if (command.SourceTrackFile != null)
            {
                ValidateSourceTrackFile(command.SourceTrackFile);

                _logger.LogInformation("Processing source track: {FileName}, size: {Size} KB",
                    command.SourceTrackFile.FileName, command.SourceTrackFile.Length / 1024);

                var sourceTrackResult = await _fileStorageService.UploadFileAsync(command.SourceTrackFile, "competition-source-tracks");

                // Convert to absolute URL for consistent database storage
                command.SourceTrackUrl = GenerateAbsoluteFileUrl(sourceTrackResult);

                _logger.LogInformation("Source track uploaded successfully: {Url}", command.SourceTrackUrl);

                // Clear the file reference since we now have the URL
                command.SourceTrackFile = null;
            }
            else if (string.IsNullOrEmpty(command.SourceTrackUrl) || command.SourceTrackUrl == "FILE_UPLOAD_PLACEHOLDER")
            {
                // If no file and no valid URL, this will fail validation as expected
                _logger.LogWarning("No source track file provided and no valid URL");
                command.SourceTrackUrl = null;
            }

            _logger.LogInformation("Final URL values - ImageUrl: {ImageUrl}, MultitrackZipUrl: {MultitrackZipUrl}, SourceTrackUrl: {SourceTrackUrl}",
                command.ImageUrl ?? "null", command.MultitrackZipUrl ?? "null", command.SourceTrackUrl ?? "null");
        }

        /// <summary>
        /// Generates a correct absolute URL for file storage that will work with the media player.
        /// Converts relative URLs from file storage service to absolute URLs for database storage.
        /// </summary>
        /// <param name="fileStorageResult">The result from IFileStorageService.UploadFileAsync</param>
        /// <returns>Absolute URL in format: https://localhost:7001/uploads/directory/filename.ext</returns>
        private string GenerateAbsoluteFileUrl(string fileStorageResult)
        {
            if (string.IsNullOrEmpty(fileStorageResult))
                return fileStorageResult;

            // If already absolute, return as-is
            if (fileStorageResult.StartsWith("http://") || fileStorageResult.StartsWith("https://"))
            {
                _logger.LogInformation("File storage returned absolute URL: {Url}", fileStorageResult);
                return fileStorageResult;
            }

            // Get the base URL from the current request
            var scheme = Request.Scheme; // http or https
            var host = Request.Host.Value; // localhost:7001
            var baseUrl = $"{scheme}://{host}";

            // Remove leading slash from file storage result if present
            var cleanPath = fileStorageResult.StartsWith("/") ? fileStorageResult.Substring(1) : fileStorageResult;

            // Construct absolute URL
            var absoluteUrl = $"{baseUrl}/{cleanPath}";

            // Clean up any duplicate /uploads/ patterns that might exist
            absoluteUrl = absoluteUrl.Replace("/uploads/uploads/", "/uploads/");

            _logger.LogInformation("Generated absolute URL: {FileStorageResult} → {AbsoluteUrl}", fileStorageResult, absoluteUrl);

            return absoluteUrl;
        }

        private void ValidateCoverImage(IFormFile file)
        {
            if (file.Length > 10 * 1024 * 1024) // 10MB max
                throw new ArgumentException("Cover image must not exceed 10MB");

            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                throw new ArgumentException("Cover image must be a JPEG, PNG, or GIF file");
        }

        private void ValidateMultitrackZipFile(IFormFile file)
        {
            if (file.Length > 1024 * 1024 * 1024) // 1GB max
                throw new ArgumentException("Multitrack ZIP file must not exceed 1GB");

            var allowedTypes = new[] { "application/zip", "application/x-zip-compressed", "application/octet-stream" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                throw new ArgumentException("Multitrack file must be a ZIP file");

            if (!file.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Multitrack file must have a .zip extension");
        }

        private void ValidateSourceTrackFile(IFormFile file)
        {
            if (file.Length > 50 * 1024 * 1024) // 50MB max
                throw new ArgumentException("Source track file must not exceed 50MB");

            var allowedTypes = new[] { "audio/mpeg", "audio/wav", "audio/flac", "audio/aiff", "audio/mp4", "application/octet-stream" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                throw new ArgumentException("Source track must be an audio file");

            var allowedExtensions = new[] { ".wav", ".mp3", ".flac", ".aiff", ".m4a" };
            if (!allowedExtensions.Any(ext => file.FileName.EndsWith(ext, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Source track must be a supported audio format (.wav, .mp3, .flac, .aiff, .m4a)");
        }

        // PUT api/v1/admin/competitions/{competitionId}
        [HttpPut("competitions/{competitionId}")]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        [DisableRequestSizeLimit]
        [RequestFormLimits(MultipartBodyLengthLimit = 2147483648)] // 2GB
        public async Task<ActionResult<UpdateCompetitionResponse>> UpdateCompetition(
            int competitionId,
            [FromForm] UpdateCompetitionCommand command)
        {
            try
            {
                _logger.LogInformation("==================== BEGIN COMPETITION UPDATE ====================");
                _logger.LogInformation("Received UpdateCompetition request for competition {CompetitionId}", competitionId);

                if (command == null)
                {
                    _logger.LogWarning("Command object is null");
                    return BadRequest(new { Success = false, Message = "Invalid request body" });
                }

                // Log key request information
                _logger.LogInformation("Title: {Title}", command.Title ?? "null");
                _logger.LogInformation("Cover image present: {CoverImagePresent}", command.CoverImage != null);
                _logger.LogInformation("Multitrack file present: {MultitrackFilePresent}", command.MultitrackZipFile != null);
                _logger.LogInformation("Source track file present: {SourceTrackFilePresent}", command.SourceTrackFile != null);

                // STEP 1: Process file uploads and generate URLs BEFORE validation
                await ProcessFileUploadsForUpdateAsync(command);

                // STEP 2: Set the ID for the update from the route parameter
                command.CompetitionId = competitionId;

                // STEP 3: Set organizer user ID from claims
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation("Setting organizer ID from claims: {UserId}", userId);
                command.OrganizerUserId = userId;

                // STEP 4: Send command to MediatR (validation will now have URLs available)
                _logger.LogInformation("Sending command to MediatR handler...");
                var result = await _mediator.Send(command);

                if (!result.Success)
                {
                    _logger.LogWarning("Competition update failed: {Message}", result.Message);
                    if (result.Errors != null && result.Errors.Any())
                    {
                        _logger.LogWarning("Validation errors from handler/validator:");
                        foreach (var error in result.Errors)
                        {
                            _logger.LogWarning("  - {Error}", error);
                        }
                    }
                    return BadRequest(result);
                }

                _logger.LogInformation("Competition updated successfully with ID: {CompetitionId}", competitionId);
                _logger.LogInformation("==================== END COMPETITION UPDATE ====================");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception in UpdateCompetition: {Message}", ex.Message);
                _logger.LogInformation("==================== END COMPETITION UPDATE (WITH ERROR) ====================");

                return StatusCode(500, new UpdateCompetitionResponse
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        private async Task ProcessFileUploadsForUpdateAsync(UpdateCompetitionCommand command)
        {
            // Added comprehensive logging for debugging
            _logger.LogInformation("Processing file uploads for update...");
            _logger.LogInformation("Initial URL values - ImageUrl: {ImageUrl}, MultitrackZipUrl: {MultitrackZipUrl}, SourceTrackUrl: {SourceTrackUrl}",
                command.ImageUrl ?? "null", command.MultitrackZipUrl ?? "null", command.SourceTrackUrl ?? "null");

            // Process cover image upload
            if (command.CoverImage != null)
            {
                ValidateCoverImage(command.CoverImage);

                _logger.LogInformation("Processing cover image: {FileName}, size: {Size} KB",
                    command.CoverImage.FileName, command.CoverImage.Length / 1024);

                var coverImageResult = await _fileStorageService.UploadFileAsync(command.CoverImage, "competition-covers");

                // Convert to absolute URL for consistent database storage
                command.ImageUrl = GenerateAbsoluteFileUrl(coverImageResult);

                _logger.LogInformation("Cover image uploaded successfully: {Url}", command.ImageUrl);

                // Clear the file reference since we now have the URL
                command.CoverImage = null;
            }

            // Process multitrack zip upload
            if (command.MultitrackZipFile != null)
            {
                ValidateMultitrackZipFile(command.MultitrackZipFile);

                _logger.LogInformation("Processing multitrack zip: {FileName}, size: {Size} KB",
                    command.MultitrackZipFile.FileName, command.MultitrackZipFile.Length / 1024);

                var multitrackResult = await _fileStorageService.UploadFileAsync(command.MultitrackZipFile, "competition-multitracks");

                // Convert to absolute URL for consistent database storage
                command.MultitrackZipUrl = GenerateAbsoluteFileUrl(multitrackResult);

                _logger.LogInformation("Multitrack zip uploaded successfully: {Url}", command.MultitrackZipUrl);

                // Clear the file reference since we now have the URL
                command.MultitrackZipFile = null;
            }

            // Process source track upload
            if (command.SourceTrackFile != null)
            {
                ValidateSourceTrackFile(command.SourceTrackFile);

                _logger.LogInformation("Processing source track: {FileName}, size: {Size} KB",
                    command.SourceTrackFile.FileName, command.SourceTrackFile.Length / 1024);

                var sourceTrackResult = await _fileStorageService.UploadFileAsync(command.SourceTrackFile, "competition-source-tracks");

                // Convert to absolute URL for consistent database storage
                command.SourceTrackUrl = GenerateAbsoluteFileUrl(sourceTrackResult);

                _logger.LogInformation("Source track uploaded successfully: {Url}", command.SourceTrackUrl);

                // Clear the file reference since we now have the URL
                command.SourceTrackFile = null;
            }

            _logger.LogInformation("Final URL values - ImageUrl: {ImageUrl}, MultitrackZipUrl: {MultitrackZipUrl}, SourceTrackUrl: {SourceTrackUrl}",
                command.ImageUrl ?? "null", command.MultitrackZipUrl ?? "null", command.SourceTrackUrl ?? "null");
        }

        // PUT api/v1/admin/orders/{orderId}/status
        [HttpPut("orders/{orderId}/status")]
        public async Task<ActionResult<UpdateOrderStatusResponse>> UpdateOrderStatus(
            int orderId,
            [FromBody] UpdateOrderStatusCommand command)
        {
            try
            {
                // Log detailed request information for debugging
                Console.WriteLine($"Received order status update request for order {orderId}");
                Console.WriteLine($"Request body: OrderId={command?.OrderId}, NewStatus={command?.NewStatus}");

                // Check if command is null
                if (command == null)
                {
                    return BadRequest(new { Success = false, Message = "Request body is missing or invalid" });
                }

                // Check for mismatch between route and body
                if (orderId != command.OrderId)
                {
                    var errorMsg = $"Order ID mismatch between route ({orderId}) and body ({command.OrderId})";
                    Console.WriteLine(errorMsg);
                    return BadRequest(new { Success = false, Message = errorMsg });
                }

                // Validate the status is a valid enum value
                if (!Enum.IsDefined(typeof(OrderStatus), command.NewStatus))
                {
                    var errorMsg = $"Invalid order status: {command.NewStatus}";
                    Console.WriteLine(errorMsg);

                    // List valid values for better error reporting
                    var validValues = string.Join(", ", Enum.GetNames(typeof(OrderStatus)));
                    Console.WriteLine($"Valid status values are: {validValues}");

                    return BadRequest(new { Success = false, Message = $"{errorMsg}. Valid values are: {validValues}" });
                }

                var result = await _mediator.Send(command);

                if (!result.Success)
                {
                    Console.WriteLine($"Failed to update order status: {result.Message}");
                    return BadRequest(result);
                }

                Console.WriteLine($"Successfully updated order {orderId} status to {command.NewStatus}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateOrderStatus: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { Success = false, Message = $"An error occurred: {ex.Message}" });
            }
        }

        // POST api/v1/admin/competitions/{competitionId}/transition-to-round1
        [HttpPost("competitions/{competitionId}/transition-to-round1")]
        public async Task<ActionResult<TransitionCompetitionToRound1SetupCommandResponse>> TransitionCompetitionToRound1Setup(
            int competitionId)
        {
            var command = new TransitionCompetitionToRound1SetupCommand(competitionId);
            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
