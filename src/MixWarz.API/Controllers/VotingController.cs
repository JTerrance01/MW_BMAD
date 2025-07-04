using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using MixWarz.Application.Common.Utilities;
using MixWarz.Application.Features.Submissions.Commands.SubmitJudgment;
using MixWarz.Application.Features.Submissions.Queries.GetSubmissionJudgment;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;
using System.Security.Claims;
using System.Text.Json.Serialization;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/competitions/{competitionId}/voting")]
    [Authorize]
    public class VotingController : ControllerBase
    {
        private readonly IRound1AssignmentService _round1AssignmentService;
        private readonly IRound2VotingService _round2VotingService;
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IRound1AssignmentRepository _round1AssignmentRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly IMediator _mediator;
        private readonly ISubmissionVoteRepository _submissionVoteRepository;
        private readonly ILogger<VotingController> _logger;

        public VotingController(
            IRound1AssignmentService round1AssignmentService,
            IRound2VotingService round2VotingService,
            ICompetitionRepository competitionRepository,
            IRound1AssignmentRepository round1AssignmentRepository,
            IFileStorageService fileStorageService,
            IMediator mediator,
            ISubmissionVoteRepository submissionVoteRepository,
            ILogger<VotingController> logger)
        {
            _round1AssignmentService = round1AssignmentService;
            _round2VotingService = round2VotingService;
            _competitionRepository = competitionRepository;
            _round1AssignmentRepository = round1AssignmentRepository;
            _fileStorageService = fileStorageService;
            _mediator = mediator;
            _submissionVoteRepository = submissionVoteRepository;
            _logger = logger;
        }

        /// <summary>
        /// Get Round 1 voting assignments for the current user
        /// GET /api/competitions/{competitionId}/voting/round1/assignments
        /// </summary>
        [HttpGet("round1/assignments")]
        public async Task<ActionResult<Round1VotingAssignmentsResponse>> GetRound1VotingAssignments(int competitionId)
        {
            // Enhanced user ID extraction with comprehensive logging
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userIdClaimAlt1 = User.FindFirst("userId")?.Value;
            var userIdClaimAlt2 = User.FindFirst("sub")?.Value;

            _logger.LogDebug("User ID Claims Debug: NameIdentifier={UserIdClaim}, userId={UserIdClaimAlt1}, sub={UserIdClaimAlt2}",
                userIdClaim, userIdClaimAlt1, userIdClaimAlt2);

            var userId = userIdClaim ?? userIdClaimAlt1 ?? userIdClaimAlt2;

            _logger.LogDebug("GetRound1VotingAssignments - CompetitionId: {CompetitionId}, UserId: {UserId}", competitionId, userId);

            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("GetRound1VotingAssignments - UserId is null or empty - authentication failed");
                return Unauthorized(new { message = "User not authenticated or user ID not found in token" });
            }

            // Normalize user ID to handle GUID format variations
            string normalizedUserId;
            try
            {
                if (Guid.TryParse(userId, out var guidResult))
                {
                    normalizedUserId = guidResult.ToString().ToLowerInvariant();
                    _logger.LogDebug("Normalized GUID: {NormalizedUserId}", normalizedUserId);
                }
                else
                {
                    normalizedUserId = userId.ToLowerInvariant();
                    _logger.LogDebug("Non-GUID UserId normalized: {NormalizedUserId}", normalizedUserId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error normalizing UserId: {UserId}", userId);
                normalizedUserId = userId;
            }

            try
            {
                // Get the competition to check status and voting deadline
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    _logger.LogWarning("Competition {CompetitionId} not found", competitionId);
                    return NotFound(new { message = $"Competition with ID {competitionId} not found" });
                }

                _logger.LogDebug("Competition found: Status={Status}, Title={Title}", competition.Status, competition.Title);

                // Check if competition is in correct status for Round 1 voting
                if (competition.Status != CompetitionStatus.VotingRound1Open)
                {
                    _logger.LogWarning("Competition status invalid: {Status} (expected: {ExpectedStatus})", 
                        competition.Status, CompetitionStatus.VotingRound1Open);
                    return BadRequest(new
                    {
                        message = $"Competition is not open for Round 1 voting. Current status: {competition.Status}"
                    });
                }

                // Try to get assignment with both original and normalized user IDs
                _logger.LogDebug("Searching for assignment with original UserId: {UserId}", userId);
                var assignment = await _round1AssignmentRepository.GetByCompetitionAndVoterAsync(competitionId, userId);

                if (assignment == null && normalizedUserId != userId)
                {
                    _logger.LogDebug("Original UserId failed, trying normalized: {NormalizedUserId}", normalizedUserId);
                    assignment = await _round1AssignmentRepository.GetByCompetitionAndVoterAsync(competitionId, normalizedUserId);
                }

                if (assignment == null)
                {
                    _logger.LogWarning("No assignment found for user {UserId} in competition {CompetitionId}", userId, competitionId);
                    return Ok(new Round1VotingAssignmentsResponse
                    {
                        Submissions = new List<SubmissionForVotingDto>(),
                        HasVoted = false,
                        VotingDeadline = competition.EndDate
                    });
                }

                _logger.LogDebug("Assignment found: AssignedGroup={AssignedGroup}, HasVoted={HasVoted}", 
                    assignment.AssignedGroupNumber, assignment.HasVoted);

                // Get assigned submissions for the voter
                var submissions = await _round1AssignmentService.GetAssignedSubmissionsForVoterAsync(competitionId, userId);

                if (submissions == null)
                {
                    _logger.LogWarning("GetAssignedSubmissionsForVoterAsync returned null for user {UserId}", userId);
                    submissions = Enumerable.Empty<Submission>();
                }

                var submissionsList = submissions.ToList();
                _logger.LogDebug("Retrieved {Count} submissions from service", submissionsList.Count);

                // Calculate voting deadline
                var votingDeadline = competition.EndDate;

                // Map submissions to DTO format expected by frontend
                var submissionDtos = new List<SubmissionForVotingDto>();

                foreach (var s in submissionsList)
                {
                    // Generate a pre-signed URL for accessing the audio file (valid for 1 hour)
                    var audioUrl = await FileUrlHelper.ResolveFileUrlAsync(
                        _fileStorageService,
                        s.AudioFilePath ?? "",
                        TimeSpan.FromHours(1));

                    var dto = new SubmissionForVotingDto
                    {
                        Id = s.SubmissionId,
                        Title = s.MixTitle ?? $"Submission {s.SubmissionId}",
                        Description = s.MixDescription ?? "",
                        AudioUrl = audioUrl,
                        Number = s.SubmissionId,
                        SubmittedAt = s.SubmissionDate
                    };

                    submissionDtos.Add(dto);
                }

                _logger.LogDebug("Created {Count} DTOs for frontend", submissionDtos.Count);

                var response = new Round1VotingAssignmentsResponse
                {
                    Submissions = submissionDtos,
                    HasVoted = assignment.HasVoted,
                    VotingDeadline = votingDeadline
                };

                _logger.LogDebug("Returning {Count} submissions, HasVoted={HasVoted}", response.Submissions.Count, response.HasVoted);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Round 1 voting assignments for user {UserId} in competition {CompetitionId}", 
                    userId, competitionId);
                return BadRequest(new { message = $"Error retrieving Round 1 voting assignments: {ex.Message}" });
            }
        }

        /// <summary>
        /// Submit Round 1 votes
        /// POST /api/competitions/{competitionId}/voting/round1/votes
        /// </summary>
        [HttpPost("round1/votes")]
        public async Task<ActionResult> SubmitRound1Votes(
            int competitionId,
            [FromBody] VotingSubmitRound1VotesRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("userId")?.Value
                       ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            try
            {
                // Validate the votes object
                if (request.Votes == null)
                {
                    return BadRequest(new { message = "Votes object is required" });
                }

                // Extract the submission IDs from the votes object
                var firstPlaceId = request.Votes.FirstPlace ?? request.Votes.First;
                var secondPlaceId = request.Votes.SecondPlace ?? request.Votes.Second;
                var thirdPlaceId = request.Votes.ThirdPlace ?? request.Votes.Third;

                // Validate that all ranks are provided
                if (firstPlaceId == null || secondPlaceId == null || thirdPlaceId == null)
                {
                    return BadRequest(new { message = "All three ranks (first, second, third) must be provided" });
                }

                _logger.LogInformation("Submitting Round 1 votes for user {UserId} in competition {CompetitionId}", userId, competitionId);

                // Submit votes using existing service
                var result = await _round1AssignmentService.ProcessVoterSubmissionAsync(
                    competitionId,
                    userId,
                    firstPlaceId.Value,
                    secondPlaceId.Value,
                    thirdPlaceId.Value);

                if (result)
                {
                    _logger.LogInformation("Round 1 votes submitted successfully for user {UserId}", userId);
                    return Ok(new { success = true, message = "Votes submitted successfully" });
                }
                else
                {
                    _logger.LogWarning("Failed to submit Round 1 votes for user {UserId}", userId);
                    return BadRequest(new { success = false, message = "Failed to submit votes. Please check your selections and try again." });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting Round 1 votes for user {UserId} in competition {CompetitionId}", 
                    userId, competitionId);
                return BadRequest(new { message = $"Error submitting Round 1 votes: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get Round 2 voting submissions for the current user
        /// GET /api/competitions/{competitionId}/voting/round2/submissions
        /// </summary>
        [HttpGet("round2/submissions")]
        public async Task<ActionResult<Round2VotingSubmissionsResponse>> GetRound2VotingSubmissions(int competitionId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("userId")?.Value
                       ?? User.FindFirst("sub")?.Value;

            _logger.LogDebug("GetRound2VotingSubmissions - CompetitionId: {CompetitionId}, UserId: {UserId}", competitionId, userId);

            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User not authenticated for Round 2 voting");
                return Unauthorized(new { message = "User not authenticated" });
            }

            try
            {
                // Get the competition to check status and voting deadline
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    _logger.LogWarning("Competition {CompetitionId} not found", competitionId);
                    return NotFound(new { message = $"Competition with ID {competitionId} not found" });
                }

                _logger.LogDebug("Competition found - Status: {Status}", competition.Status);

                // Check if competition is in correct status for Round 2 voting
                if (competition.Status != CompetitionStatus.VotingRound2Open)
                {
                    _logger.LogWarning("Competition not open for Round 2 voting. Status: {Status}", competition.Status);
                    return BadRequest(new
                    {
                        message = $"Competition is not open for Round 2 voting. Current status: {competition.Status}"
                    });
                }

                // Check if user is eligible for Round 2 voting
                var isEligible = await _round2VotingService.IsUserEligibleForRound2VotingAsync(competitionId, userId);
                _logger.LogDebug("User eligibility for Round 2: {IsEligible}", isEligible);

                // Get Round 2 submissions
                var submissions = await _round2VotingService.GetRound2SubmissionsAsync(competitionId);
                _logger.LogDebug("Retrieved {Count} Round 2 submissions", submissions?.Count() ?? 0);

                // Check if we got any submissions
                if (submissions == null || !submissions.Any())
                {
                    _logger.LogWarning("No Round 2 submissions found for competition {CompetitionId}", competitionId);
                    var emptyResponse = new Round2VotingSubmissionsResponse
                    {
                        Submissions = new List<SubmissionForVotingDto>(),
                        HasVoted = false,
                        IsEligible = isEligible,
                        VotingDeadline = competition.EndDate
                    };
                    return Ok(emptyResponse);
                }

                // For Round 2, check if user has voted
                var hasVoted = await _submissionVoteRepository.HasVoterSubmittedAllVotesAsync(userId, competitionId, 2, 3);
                _logger.LogDebug("User has voted in Round 2: {HasVoted}", hasVoted);

                // Calculate voting deadline
                var votingDeadline = competition.EndDate;

                // Map submissions to DTO format to avoid circular reference issues
                var submissionDtos = new List<SubmissionForVotingDto>();

                foreach (var s in submissions)
                {
                    try
                    {
                        // Generate a pre-signed URL for accessing the audio file (valid for 1 hour)
                        var audioUrl = await FileUrlHelper.ResolveFileUrlAsync(
                            _fileStorageService,
                            s.AudioFilePath ?? "",
                            TimeSpan.FromHours(1));

                        var dto = new SubmissionForVotingDto
                        {
                            Id = s.SubmissionId,
                            Title = s.MixTitle ?? $"Submission {s.SubmissionId}",
                            Description = s.MixDescription ?? "",
                            AudioUrl = audioUrl,
                            Number = s.SubmissionId,
                            SubmittedAt = s.SubmissionDate
                        };

                        submissionDtos.Add(dto);
                    }
                    catch (Exception submissionEx)
                    {
                        _logger.LogError(submissionEx, "Error processing submission {SubmissionId}", s?.SubmissionId);
                    }
                }

                _logger.LogDebug("Successfully processed {Count} submissions", submissionDtos.Count);

                var response = new Round2VotingSubmissionsResponse
                {
                    Submissions = submissionDtos,
                    HasVoted = hasVoted,
                    IsEligible = isEligible,
                    VotingDeadline = votingDeadline
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Round 2 voting submissions for user {UserId} in competition {CompetitionId}", 
                    userId, competitionId);
                return BadRequest(new { message = $"Error retrieving Round 2 voting submissions: {ex.Message}" });
            }
        }

        /// <summary>
        /// Submit Round 2 votes
        /// POST /api/competitions/{competitionId}/voting/round2/votes
        /// </summary>
        [HttpPost("round2/votes")]
        public async Task<ActionResult> SubmitRound2Votes(
            int competitionId,
            [FromBody] VotingSubmitRound2VotesRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("userId")?.Value
                       ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            try
            {
                // Validate the votes object
                if (request.Votes == null)
                {
                    return BadRequest(new { message = "Votes object is required" });
                }

                // Extract the submission IDs from the votes object
                var firstPlaceId = request.Votes.FirstPlace ?? request.Votes.First;
                var secondPlaceId = request.Votes.SecondPlace ?? request.Votes.Second;
                var thirdPlaceId = request.Votes.ThirdPlace ?? request.Votes.Third;

                // Validate that all ranks are provided
                if (firstPlaceId == null || secondPlaceId == null || thirdPlaceId == null)
                {
                    return BadRequest(new { message = "All three ranks (first, second, third) must be provided" });
                }

                // Check eligibility
                var isEligible = await _round2VotingService.IsUserEligibleForRound2VotingAsync(competitionId, userId);
                if (!isEligible)
                {
                    _logger.LogWarning("User {UserId} is not eligible for Round 2 voting in competition {CompetitionId}", userId, competitionId);
                    return StatusCode(403, new { message = "User is not eligible for Round 2 voting" });
                }

                _logger.LogInformation("Submitting Round 2 votes for user {UserId} in competition {CompetitionId}", userId, competitionId);

                // Use ProcessRound2VotesAsync with proper 1st=3pts, 2nd=2pts, 3rd=1pt business logic
                bool success = await _round2VotingService.ProcessRound2VotesAsync(
                    competitionId,
                    userId,
                    firstPlaceId.Value,
                    secondPlaceId.Value,
                    thirdPlaceId.Value);

                if (success)
                {
                    _logger.LogInformation("Round 2 votes submitted successfully for user {UserId}", userId);
                    return Ok(new { success = true, message = "Votes submitted successfully" });
                }
                else
                {
                    _logger.LogWarning("Failed to submit Round 2 votes for user {UserId}", userId);
                    return BadRequest(new { success = false, message = "Failed to submit votes. Please check your eligibility and selections and try again." });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting Round 2 votes for user {UserId} in competition {CompetitionId}", 
                    userId, competitionId);
                return BadRequest(new { message = $"Error submitting Round 2 votes: {ex.Message}" });
            }
        }

        /// <summary>
        /// Check voting setup status for the competition
        /// GET /api/competitions/{competitionId}/voting/status
        /// </summary>
        [HttpGet("status")]
        public async Task<ActionResult<VotingStatusResponse>> GetVotingStatus(int competitionId)
        {
            try
            {
                // Get the competition to check status
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    return NotFound(new { message = $"Competition with ID {competitionId} not found" });
                }

                // Check if voting groups exist for Round 1
                var round1Assignments = await _round1AssignmentRepository.GetByCompetitionIdAsync(competitionId);
                var hasRound1Groups = round1Assignments.Any();

                var response = new VotingStatusResponse
                {
                    CompetitionId = competitionId,
                    CompetitionStatus = competition.Status,
                    CompetitionStatusText = competition.Status.ToString(),
                    HasRound1VotingGroups = hasRound1Groups,
                    Round1GroupCount = round1Assignments.GroupBy(ra => ra.AssignedGroupNumber).Count(),
                    VotingSetupComplete = IsVotingSetupComplete(competition.Status, hasRound1Groups),
                    SetupMessage = GetSetupMessage(competition.Status, hasRound1Groups)
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting voting status for competition {CompetitionId}", competitionId);
                return BadRequest(new { message = $"Error getting voting status: {ex.Message}" });
            }
        }

        private bool IsVotingSetupComplete(CompetitionStatus status, bool hasGroups)
        {
            return status == CompetitionStatus.VotingRound1Open && hasGroups;
        }

        private string GetSetupMessage(CompetitionStatus status, bool hasGroups)
        {
            return status switch
            {
                CompetitionStatus.SubmissionsPeriod => "Competition is in submission period. Voting setup will be available after submissions close.",
                CompetitionStatus.VotingRound1Setup => hasGroups ? "Round 1 voting groups are set up and ready." : "Round 1 voting groups need to be created.",
                CompetitionStatus.VotingRound1Open => hasGroups ? "Round 1 voting is open." : "Round 1 voting groups need to be created before voting can begin.",
                CompetitionStatus.VotingRound2Open => "Round 2 voting is open.",
                CompetitionStatus.Completed => "Competition has been completed.",
                _ => "Competition status not recognized."
            };
        }

        /// <summary>
        /// Check user's voting eligibility for the competition
        /// GET /api/competitions/{competitionId}/voting/eligibility
        /// </summary>
        [HttpGet("eligibility")]
        public async Task<ActionResult<VotingEligibilityResponse>> CheckVotingEligibility(int competitionId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("userId")?.Value
                       ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            try
            {
                // Check if user has voted in Round 1
                var hasVotedRound1 = await _submissionVoteRepository.HasVoterSubmittedAllVotesAsync(userId, competitionId, 1, 3);

                // Check if user has voted in Round 2
                var hasVotedRound2 = await _submissionVoteRepository.HasVoterSubmittedAllVotesAsync(userId, competitionId, 2, 3);

                // Check if user is eligible for Round 2 voting
                var isEligibleForRound2 = await _round2VotingService.IsUserEligibleForRound2VotingAsync(competitionId, userId);

                var response = new VotingEligibilityResponse
                {
                    HasVotedRound1 = hasVotedRound1,
                    HasVotedRound2 = hasVotedRound2,
                    IsEligibleForRound2 = isEligibleForRound2
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking voting eligibility for user {UserId} in competition {CompetitionId}", 
                    userId, competitionId);
                return BadRequest(new { message = $"Error checking voting eligibility: {ex.Message}" });
            }
        }

        /// <summary>
        /// Submit a detailed judgment for a submission
        /// POST /api/competitions/{competitionId}/voting/judgments
        /// </summary>
        [HttpPost("judgments")]
        public async Task<ActionResult<SubmitJudgmentResponse>> SubmitJudgment(
            int competitionId,
            [FromBody] SubmitJudgmentRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("userId")?.Value
                       ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            try
            {
                var command = new SubmitJudgmentCommand
                {
                    CompetitionId = competitionId,
                    SubmissionId = request.SubmissionId,
                    JudgeId = userId,
                    OverallScore = request.OverallScore,
                    OverallComments = request.OverallComments,
                    VotingRound = request.VotingRound,
                    CriteriaScores = request.CriteriaScores.Select(cs => new Application.Features.Submissions.Commands.SubmitJudgment.CriteriaScoreDto
                    {
                        JudgingCriteriaId = cs.JudgingCriteriaId,
                        Score = cs.Score,
                        Comments = cs.Comments
                    }).ToList()
                };

                var result = await _mediator.Send(command);

                if (result.Success)
                {
                    _logger.LogInformation("Judgment submitted successfully for submission {SubmissionId} by judge {JudgeId}", 
                        request.SubmissionId, userId);
                    return Ok(result);
                }
                else
                {
                    _logger.LogWarning("Failed to submit judgment for submission {SubmissionId} by judge {JudgeId}: {Message}", 
                        request.SubmissionId, userId, result.Message);
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting judgment for submission {SubmissionId} by judge {JudgeId}", 
                    request.SubmissionId, userId);
                return BadRequest(new SubmitJudgmentResponse
                {
                    Success = false,
                    Message = $"Error submitting judgment: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get existing judgment for a submission by the current user
        /// GET /api/competitions/{competitionId}/voting/judgments/{submissionId}
        /// </summary>
        [HttpGet("judgments/{submissionId}")]
        public async Task<ActionResult<GetSubmissionJudgmentResponse>> GetSubmissionJudgment(
            int competitionId,
            int submissionId,
            [FromQuery] int votingRound = 1)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("userId")?.Value
                       ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            try
            {
                var query = new GetSubmissionJudgmentQuery
                {
                    CompetitionId = competitionId,
                    SubmissionId = submissionId,
                    JudgeId = userId,
                    VotingRound = votingRound
                };

                var result = await _mediator.Send(query);

                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting judgment for submission {SubmissionId} by judge {JudgeId}", 
                    submissionId, userId);
                return BadRequest(new GetSubmissionJudgmentResponse
                {
                    Success = false,
                    Message = $"Error getting judgment: {ex.Message}"
                });
            }
        }
    }

    // Response DTOs
    public class SubmissionForVotingDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("audioUrl")]
        public string AudioUrl { get; set; } = string.Empty;

        [JsonPropertyName("number")]
        public int Number { get; set; }

        [JsonPropertyName("submittedAt")]
        public DateTime SubmittedAt { get; set; }
    }

    public class Round1VotingAssignmentsResponse
    {
        [JsonPropertyName("submissions")]
        public List<SubmissionForVotingDto> Submissions { get; set; } = new();

        [JsonPropertyName("hasVoted")]
        public bool HasVoted { get; set; }

        [JsonPropertyName("votingDeadline")]
        public DateTime VotingDeadline { get; set; }
    }

    public class Round2VotingSubmissionsResponse
    {
        [JsonPropertyName("submissions")]
        public List<SubmissionForVotingDto> Submissions { get; set; } = new();

        [JsonPropertyName("hasVoted")]
        public bool HasVoted { get; set; }

        [JsonPropertyName("isEligible")]
        public bool IsEligible { get; set; }

        [JsonPropertyName("votingDeadline")]
        public DateTime VotingDeadline { get; set; }
    }

    public class VotingEligibilityResponse
    {
        [JsonPropertyName("hasVotedRound1")]
        public bool HasVotedRound1 { get; set; }

        [JsonPropertyName("hasVotedRound2")]
        public bool HasVotedRound2 { get; set; }

        [JsonPropertyName("isEligibleForRound2")]
        public bool IsEligibleForRound2 { get; set; }
    }

    // Request DTOs
    public class VotingSubmitRound1VotesRequest
    {
        public VotingVotesData Votes { get; set; } = new VotingVotesData();
    }

    public class VotingSubmitRound2VotesRequest
    {
        public VotingVotesData Votes { get; set; } = new VotingVotesData();
    }

    public class VotingVotesData
    {
        [JsonPropertyName("first")]
        public int? First { get; set; }

        [JsonPropertyName("second")]
        public int? Second { get; set; }

        [JsonPropertyName("third")]
        public int? Third { get; set; }

        // Alternative property names for flexibility
        [JsonPropertyName("firstPlace")]
        public int? FirstPlace { get; set; }

        [JsonPropertyName("secondPlace")]
        public int? SecondPlace { get; set; }

        [JsonPropertyName("thirdPlace")]
        public int? ThirdPlace { get; set; }
    }

    public class VotingStatusResponse
    {
        public int CompetitionId { get; set; }
        public CompetitionStatus CompetitionStatus { get; set; }
        public string CompetitionStatusText { get; set; } = string.Empty;
        public bool HasRound1VotingGroups { get; set; }
        public int Round1GroupCount { get; set; }
        public bool VotingSetupComplete { get; set; }
        public string SetupMessage { get; set; } = string.Empty;
    }

    // Judgment Request DTOs
    public class SubmitJudgmentRequest
    {
        public int SubmissionId { get; set; }
        public decimal OverallScore { get; set; }
        public string? OverallComments { get; set; }
        public List<JudgmentCriteriaScoreDto> CriteriaScores { get; set; } = new();
        public int VotingRound { get; set; } = 1;
    }

    public class JudgmentCriteriaScoreDto
    {
        public int JudgingCriteriaId { get; set; }
        public decimal Score { get; set; }
        public string? Comments { get; set; }
    }
}