using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MixWarz.Application.Features.Competitions.Commands.CreateCompetition;
using MixWarz.Application.Features.Competitions.Queries.GetCompetitionDetail;
using MixWarz.Application.Features.Competitions.Queries.GetCompetitionResults;
using MixWarz.Application.Features.Competitions.Queries.GetCompetitionsList;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/competitions")]
    [Authorize]
    public class CompetitionsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IFileStorageService _fileStorageService;

        public CompetitionsController(
            IMediator mediator,
            IFileStorageService fileStorageService)
        {
            _mediator = mediator;
            _fileStorageService = fileStorageService;
        }

        [HttpGet("{id}/results")]
        public async Task<ActionResult<CompetitionResultsVm>> GetCompetitionResults(int id, [FromQuery] int topCount = 20)
        {
            var query = new GetCompetitionResultsQuery
            {
                CompetitionId = id,
                TopCount = topCount
            };

            try
            {
                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex) when (ex.Message.Contains("not found"))
            {
                return NotFound($"Competition with ID {id} not found");
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<CompetitionListVm>> GetCompetitions(
            [FromQuery] string? status = null,
            [FromQuery] string? genre = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] bool? featured = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                Console.WriteLine($"GetCompetitions called with status={status}, genre={genre}, searchTerm={searchTerm}, featured={featured}, page={page}, pageSize={pageSize}");

                // Parse the status string to enum if provided
                CompetitionStatus? statusEnum = null;
                if (!string.IsNullOrEmpty(status))
                {
                    if (Enum.TryParse<CompetitionStatus>(status, true, out var parsedStatus))
                    {
                        statusEnum = parsedStatus;
                        Console.WriteLine($"Successfully parsed status '{status}' to enum value: {statusEnum}");
                    }
                    else
                    {
                        Console.WriteLine($"Could not parse status '{status}' to a valid CompetitionStatus enum value");
                    }
                }

                // Parse the genre string to enum if provided
                Genre? genreEnum = null;
                if (!string.IsNullOrEmpty(genre))
                {
                    if (Enum.TryParse<Genre>(genre, true, out var parsedGenre))
                    {
                        genreEnum = parsedGenre;
                        Console.WriteLine($"Successfully parsed genre '{genre}' to enum value: {genreEnum}");
                    }
                    else
                    {
                        Console.WriteLine($"Could not parse genre '{genre}' to a valid Genre enum value");
                    }
                }

                var query = new GetCompetitionsListQuery
                {
                    Status = statusEnum,
                    Genre = genreEnum,
                    SearchTerm = searchTerm,
                    Page = page,
                    PageSize = pageSize
                    // Note: featured parameter is ignored for now since it's not implemented in the backend
                    // We'll just log it but not use it until properly implemented in the database
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetCompetitions: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while retrieving competitions" });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<CompetitionDetailDto>> GetCompetitionById(int id)
        {
            var query = new GetCompetitionDetailQuery { CompetitionId = id };

            try
            {
                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex) when (ex.Message.Contains("not found"))
            {
                return NotFound($"Competition with ID {id} not found");
            }
        }

        [HttpGet("{id}/download-multitrack")]
        public async Task<ActionResult> DownloadMultitrackZip(int id)
        {
            try
            {
                var competition = await _mediator.Send(new GetCompetitionDetailQuery { CompetitionId = id });

                if (string.IsNullOrEmpty(competition.MultitrackZipUrl))
                {
                    return NotFound("No multitrack file available for this competition");
                }

                string downloadUrl;

                // The GetCompetitionDetailQuery already processes URLs, so the MultitrackZipUrl 
                // should be properly formatted. However, we'll add a safety check for file keys.
                if (Uri.TryCreate(competition.MultitrackZipUrl, UriKind.Absolute, out var uri) &&
                    (uri.Scheme == "http" || uri.Scheme == "https"))
                {
                    // It's already a full URL (processed by the query handler)
                    downloadUrl = competition.MultitrackZipUrl;
                    Console.WriteLine($"[CONTROLLER] Using processed URL from query: {downloadUrl}");
                }
                else
                {
                    // Fallback: it's a file key, generate a pre-signed URL
                    downloadUrl = await _fileStorageService.GetFileUrlAsync(
                        competition.MultitrackZipUrl,
                        TimeSpan.FromMinutes(15));
                    Console.WriteLine($"[CONTROLLER] Generated URL from file key '{competition.MultitrackZipUrl}': {downloadUrl}");
                }

                // Return the URL to redirect the client to the download
                return Ok(new { downloadUrl });
            }
            catch (Exception ex) when (ex.Message.Contains("not found"))
            {
                return NotFound($"Competition with ID {id} not found");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting multitrack download: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while retrieving the multitrack file" });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<CreateCompetitionResponse>> CreateCompetition([FromForm] CreateCompetitionCommand command)
        {
            // Get the current user's ID from claims
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Set the organizer ID from the authenticated user
            command.OrganizerUserId = userId;

            var result = await _mediator.Send(command);

            if (result.Success)
            {
                return Ok(result);
            }

            return BadRequest(result);
        }
    }
}