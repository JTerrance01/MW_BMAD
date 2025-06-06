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

        public VotingController(
            IRound1AssignmentService round1AssignmentService,
            IRound2VotingService round2VotingService,
            ICompetitionRepository competitionRepository,
            IRound1AssignmentRepository round1AssignmentRepository,
            IFileStorageService fileStorageService,
            IMediator mediator)
        {
            _round1AssignmentService = round1AssignmentService;
            _round2VotingService = round2VotingService;
            _competitionRepository = competitionRepository;
            _round1AssignmentRepository = round1AssignmentRepository;
            _fileStorageService = fileStorageService;
            _mediator = mediator;
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

            Console.WriteLine($"[GetRound1VotingAssignments] User ID Claims Debug:");
            Console.WriteLine($"   ClaimTypes.NameIdentifier: '{userIdClaim ?? "NULL"}'");
            Console.WriteLine($"   userId claim: '{userIdClaimAlt1 ?? "NULL"}'");
            Console.WriteLine($"   sub claim: '{userIdClaimAlt2 ?? "NULL"}'");
            Console.WriteLine($"   All claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}='{c.Value}'"))}");

            var userId = userIdClaim ?? userIdClaimAlt1 ?? userIdClaimAlt2;

            Console.WriteLine($"[GetRound1VotingAssignments] CompetitionId: {competitionId}, Selected UserId: '{userId ?? "NULL"}'");

            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("[GetRound1VotingAssignments] UserId is null or empty - authentication failed");
                return Unauthorized(new { message = "User not authenticated or user ID not found in token" });
            }

            // Normalize user ID to handle GUID format variations
            string normalizedUserId;
            try
            {
                if (Guid.TryParse(userId, out var guidResult))
                {
                    normalizedUserId = guidResult.ToString().ToLowerInvariant();
                    Console.WriteLine($"[GetRound1VotingAssignments] Normalized GUID: '{normalizedUserId}'");
                }
                else
                {
                    normalizedUserId = userId.ToLowerInvariant();
                    Console.WriteLine($"[GetRound1VotingAssignments] Non-GUID UserId normalized: '{normalizedUserId}'");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetRound1VotingAssignments] Error normalizing UserId: {ex.Message}");
                normalizedUserId = userId;
            }

            try
            {
                // Get the competition to check status and voting deadline
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    Console.WriteLine($"[GetRound1VotingAssignments] Competition {competitionId} not found");
                    return NotFound(new { message = $"Competition with ID {competitionId} not found" });
                }

                Console.WriteLine($"[GetRound1VotingAssignments] Competition found: Status={competition.Status}, Title='{competition.Title}'");

                // Check if competition is in correct status for Round 1 voting
                if (competition.Status != CompetitionStatus.VotingRound1Open)
                {
                    Console.WriteLine($"[GetRound1VotingAssignments] Competition status invalid: {competition.Status} (expected: {CompetitionStatus.VotingRound1Open})");
                    return BadRequest(new
                    {
                        message = $"Competition is not open for Round 1 voting. Current status: {competition.Status}"
                    });
                }

                // Try to get assignment with both original and normalized user IDs
                Console.WriteLine($"[GetRound1VotingAssignments] Searching for assignment with original UserId: '{userId}'");
                var assignment = await _round1AssignmentRepository.GetByCompetitionAndVoterAsync(competitionId, userId);

                if (assignment == null && normalizedUserId != userId)
                {
                    Console.WriteLine($"[GetRound1VotingAssignments] Original UserId failed, trying normalized: '{normalizedUserId}'");
                    assignment = await _round1AssignmentRepository.GetByCompetitionAndVoterAsync(competitionId, normalizedUserId);
                }

                if (assignment == null)
                {
                    Console.WriteLine($"[GetRound1VotingAssignments] No assignment found for user '{userId}' (normalized: '{normalizedUserId}') in competition {competitionId}");

                    // Debug: Check what assignments DO exist for this competition
                    var allAssignments = await _round1AssignmentRepository.GetByCompetitionIdAsync(competitionId);
                    Console.WriteLine($"[GetRound1VotingAssignments] DEBUG: Found {allAssignments.Count()} total assignments for competition {competitionId}:");
                    foreach (var a in allAssignments.Take(5)) // Show first 5
                    {
                        Console.WriteLine($"   VoterId: '{a.VoterId}', AssignedGroup: {a.AssignedGroupNumber}");
                    }

                    return Ok(new Round1VotingAssignmentsResponse
                    {
                        Submissions = new List<SubmissionForVotingDto>(),
                        HasVoted = false,
                        VotingDeadline = competition.EndDate
                    });
                }

                Console.WriteLine($"[GetRound1VotingAssignments] Assignment found: AssignedGroup={assignment.AssignedGroupNumber}, HasVoted={assignment.HasVoted}");

                // Get assigned submissions for the voter
                Console.WriteLine($"[GetRound1VotingAssignments] Calling GetAssignedSubmissionsForVoterAsync with userId: '{userId}'");
                var submissions = await _round1AssignmentService.GetAssignedSubmissionsForVoterAsync(competitionId, userId);

                if (submissions == null)
                {
                    Console.WriteLine($"[GetRound1VotingAssignments] GetAssignedSubmissionsForVoterAsync returned null");
                    submissions = Enumerable.Empty<Submission>();
                }

                var submissionsList = submissions.ToList();
                Console.WriteLine($"[GetRound1VotingAssignments] Retrieved {submissionsList.Count} submissions from service");

                // Log details about each submission
                foreach (var sub in submissionsList)
                {
                    Console.WriteLine($"[GetRound1VotingAssignments] Submission: ID={sub.SubmissionId}, Title='{sub.MixTitle}', AudioPath='{sub.AudioFilePath}', UserId='{sub.UserId}'");
                }

                // Calculate voting deadline (you may need to adjust this based on your Competition entity structure)
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
                        AudioUrl = audioUrl, // Use the pre-signed URL
                        Number = s.SubmissionId,
                        SubmittedAt = s.SubmissionDate
                    };

                    Console.WriteLine($"[GetRound1VotingAssignments] Mapped DTO: ID={dto.Id}, Title='{dto.Title}', AudioUrl='{dto.AudioUrl}'");
                    submissionDtos.Add(dto);
                }

                Console.WriteLine($"[GetRound1VotingAssignments] Created {submissionDtos.Count} DTOs for frontend");

                var response = new Round1VotingAssignmentsResponse
                {
                    Submissions = submissionDtos,
                    HasVoted = assignment.HasVoted,
                    VotingDeadline = votingDeadline
                };

                Console.WriteLine($"[GetRound1VotingAssignments] SUCCESS: Returning {response.Submissions.Count} submissions, HasVoted={response.HasVoted}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetRound1VotingAssignments] EXCEPTION: {ex.Message}");
                Console.WriteLine($"[GetRound1VotingAssignments] StackTrace: {ex.StackTrace}");
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

                // Submit votes using existing service
                var result = await _round1AssignmentService.ProcessVoterSubmissionAsync(
                    competitionId,
                    userId,
                    firstPlaceId.Value,
                    secondPlaceId.Value,
                    thirdPlaceId.Value);

                if (result)
                {
                    return Ok(new { success = true, message = "Votes submitted successfully" });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Failed to submit votes. Please check your selections and try again." });
                }
            }
            catch (Exception ex)
            {
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
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            try
            {
                // Get the competition to check status and voting deadline
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    return NotFound(new { message = $"Competition with ID {competitionId} not found" });
                }

                // Check if competition is in correct status for Round 2 voting
                if (competition.Status != CompetitionStatus.VotingRound2Open)
                {
                    return BadRequest(new
                    {
                        message = $"Competition is not open for Round 2 voting. Current status: {competition.Status}"
                    });
                }

                // Check if user is eligible for Round 2 voting
                var isEligible = await _round2VotingService.IsUserEligibleForRound2VotingAsync(competitionId, userId);
                if (!isEligible)
                {
                    return Forbid("User is not eligible for Round 2 voting");
                }

                // Get Round 2 submissions
                var submissions = await _round2VotingService.GetRound2SubmissionsAsync(competitionId);

                // For Round 2, we'd need to check if user has voted - this would require extending Round2VotingService
                // For now, setting hasVoted to false - you may need to implement this check
                var hasVoted = false; // TODO: Implement Round 2 voting status check

                // Calculate voting deadline
                var votingDeadline = competition.EndDate;

                var response = new Round2VotingSubmissionsResponse
                {
                    Submissions = submissions.ToList(),
                    HasVoted = hasVoted,
                    IsEligible = isEligible,
                    VotingDeadline = votingDeadline
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
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
                    return Forbid("User is not eligible for Round 2 voting");
                }

                // Submit votes for each submission using existing service
                var submissionIds = new List<int> { firstPlaceId.Value, secondPlaceId.Value, thirdPlaceId.Value };
                bool success = true;

                for (int i = 0; i < submissionIds.Count; i++)
                {
                    var result = await _round2VotingService.RecordRound2VoteAsync(
                        competitionId,
                        userId,
                        submissionIds[i]);

                    if (!result)
                    {
                        success = false;
                        break;
                    }
                }

                if (success)
                {
                    return Ok(new { success = true, message = "Votes submitted successfully" });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Failed to submit votes. Please check your eligibility and selections and try again." });
                }
            }
            catch (Exception ex)
            {
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
                    Round1GroupCount = round1Assignments.GroupBy(r => r.AssignedGroupNumber).Count(),
                    VotingSetupComplete = hasRound1Groups && competition.Status == CompetitionStatus.VotingRound1Open,
                    SetupMessage = GetSetupMessage(competition.Status, hasRound1Groups)
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error checking voting status: {ex.Message}" });
            }
        }

        private string GetSetupMessage(CompetitionStatus status, bool hasGroups)
        {
            return status switch
            {
                CompetitionStatus.VotingRound1Setup when !hasGroups => "Competition needs voting groups created. Admin should call POST /round1/create-groups",
                CompetitionStatus.VotingRound1Setup when hasGroups => "Voting groups created. Competition ready to transition to VotingRound1Open",
                CompetitionStatus.VotingRound1Open when !hasGroups => "ERROR: Competition is open for voting but no groups exist. Contact admin.",
                CompetitionStatus.VotingRound1Open when hasGroups => "Round 1 voting is active and ready",
                _ => $"Competition status: {status}"
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
                // Check Round 1 voting status
                var round1Assignment = await _round1AssignmentRepository.GetByCompetitionAndVoterAsync(competitionId, userId);
                var hasVotedRound1 = round1Assignment?.HasVoted ?? false;

                // Check Round 2 eligibility
                var isEligibleForRound2 = await _round2VotingService.IsUserEligibleForRound2VotingAsync(competitionId, userId);

                // For Round 2 voting status, we'd need to extend the service - for now set to false
                var hasVotedRound2 = false; // TODO: Implement Round 2 voting status check

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
                    OverallScore = request.OverallScore,
                    OverallComments = request.OverallComments,
                    CriteriaScores = request.CriteriaScores.Select(cs => new Application.Features.Submissions.Commands.SubmitJudgment.CriteriaScoreDto
                    {
                        JudgingCriteriaId = cs.JudgingCriteriaId,
                        Score = cs.Score,
                        Comments = cs.Comments
                    }).ToList(),
                    JudgeId = userId,
                    VotingRound = request.VotingRound
                };

                var result = await _mediator.Send(command);

                if (result.Success)
                {
                    return Ok(result);
                }

                return BadRequest(new { message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error submitting judgment: {ex.Message}" });
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
                    SubmissionId = submissionId,
                    JudgeId = userId,
                    VotingRound = votingRound
                };

                var result = await _mediator.Send(query);

                // Always return 200 OK, even when no judgment is found
                // This is a normal state, not an error condition
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error retrieving judgment: {ex.Message}" });
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
        public string? Description { get; set; }

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
        public List<SubmissionForVotingDto> Submissions { get; set; } = new List<SubmissionForVotingDto>();

        [JsonPropertyName("hasVoted")]
        public bool HasVoted { get; set; }

        [JsonPropertyName("votingDeadline")]
        public DateTime VotingDeadline { get; set; }
    }

    public class Round2VotingSubmissionsResponse
    {
        [JsonPropertyName("submissions")]
        public List<Submission> Submissions { get; set; } = new List<Submission>();

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

        // Also support the frontend format
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