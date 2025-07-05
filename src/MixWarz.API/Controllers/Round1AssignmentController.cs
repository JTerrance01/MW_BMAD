using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;


namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/competitions/{competitionId}/round1")]
    [Authorize]
    public class Round1AssignmentController : ControllerBase
    {
        private readonly IRound1AssignmentService _round1AssignmentService;
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ISubmissionGroupRepository _submissionGroupRepository;
        private readonly IRound1AssignmentRepository _round1AssignmentRepository;

        public Round1AssignmentController(
            IRound1AssignmentService round1AssignmentService,
            ICompetitionRepository competitionRepository,
            ISubmissionGroupRepository submissionGroupRepository,
            IRound1AssignmentRepository round1AssignmentRepository)
        {
            _round1AssignmentService = round1AssignmentService;
            _competitionRepository = competitionRepository;
            _submissionGroupRepository = submissionGroupRepository;
            _round1AssignmentRepository = round1AssignmentRepository;
        }

        [HttpGet("assigned-submissions")]
        public async Task<ActionResult<IEnumerable<Submission>>> GetAssignedSubmissions(int competitionId)
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var submissions = await _round1AssignmentService.GetAssignedSubmissionsForVoterAsync(competitionId, userId);
            return Ok(submissions);
        }

        [HttpPost("vote")]
        public async Task<ActionResult> SubmitVotes(
            int competitionId,
            [FromBody] SubmitVotesRequest request)
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var result = await _round1AssignmentService.ProcessVoterSubmissionAsync(
                competitionId,
                userId,
                request.FirstPlaceSubmissionId,
                request.SecondPlaceSubmissionId,
                request.ThirdPlaceSubmissionId);

            if (result)
            {
                return Ok(new { success = true, message = "Votes submitted successfully" });
            }
            else
            {
                return BadRequest(new { success = false, message = "Failed to submit votes. Please check your selections and try again." });
            }
        }

        [HttpPost("create-groups")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> CreateGroups(
            int competitionId,
            [FromBody] CreateGroupsRequest request)
        {
            try
            {
                // Verify competition exists
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
                }

                // Verify user is organizer or admin
                var userId = User.FindFirst("userId")?.Value;
                if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                int groupCount = await _round1AssignmentService.CreateGroupsAndAssignVotersAsync(
                    competitionId,
                    request.TargetGroupSize);

                return Ok(new
                {
                    success = true,
                    message = $"Successfully created {groupCount} groups for Round 1 voting"
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("tally-votes")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> TallyVotes(int competitionId)
        {
            try
            {
                // Verify competition exists
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
                }

                // Verify user is organizer or admin
                var userId = User.FindFirst("userId")?.Value;
                if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                // UNIFIED APPROACH: This endpoint now handles both traditional votes AND auto-generated votes from judgments
                int advancedCount = await _round1AssignmentService.TallyVotesAndDetermineAdvancementAsync(competitionId);

                return Ok(new
                {
                    success = true,
                    message = $"Successfully tallied votes and advanced {advancedCount} submissions to Round 2."
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("disqualify-non-voters")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> DisqualifyNonVoters(int competitionId)
        {
            try
            {
                // Verify competition exists
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
                }

                // Verify user is organizer or admin
                var userId = User.FindFirst("userId")?.Value;
                if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                int disqualifiedCount = await _round1AssignmentService.DisqualifyNonVotersAsync(competitionId);

                return Ok(new
                {
                    success = true,
                    message = $"Successfully disqualified {disqualifiedCount} submissions from non-voters."
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("groups")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult<IEnumerable<SubmissionGroup>>> GetSubmissionGroups(int competitionId)
        {
            // Verify competition exists
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
            }

            // Verify user is organizer or admin
            var userId = User.FindFirst("userId")?.Value;
            if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var groups = await _submissionGroupRepository.GetByCompetitionIdAsync(competitionId);
            return Ok(groups);
        }

        [HttpGet("has-voted")]
        public async Task<ActionResult> HasVoted(int competitionId)
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var hasVoted = await _round1AssignmentRepository.HasVoterSubmittedAsync(competitionId, userId);

            return Ok(new { hasVoted });
        }

        [HttpGet("voting-stats")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> GetVotingStats(int competitionId)
        {
            // Verify competition exists
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
            }

            // Verify user is organizer or admin
            var userId = User.FindFirst("userId")?.Value;
            if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            // Get all round1 assignments for this competition
            var assignments = await _round1AssignmentRepository.GetByCompetitionIdAsync(competitionId);

            // Get stats
            var totalVoters = assignments.Count();
            var votersCompleted = assignments.Count(a => a.HasVoted);
            var votingCompletionPercentage = totalVoters > 0 ? (double)votersCompleted / totalVoters * 100 : 0;

            // Get submission groups
            var groupCount = await _submissionGroupRepository.GetGroupCountByCompetitionIdAsync(competitionId);
            var submissionGroups = await _submissionGroupRepository.GetByCompetitionIdAsync(competitionId);

            // Get group stats
            var groupStats = Enumerable.Range(1, groupCount)
                .Select(groupNumber =>
                {
                    var groupSubmissions = submissionGroups.Where(sg => sg.GroupNumber == groupNumber).ToList();
                    var totalSubmissionsInGroup = groupSubmissions.Count;
                    var submissionsWithVotes = groupSubmissions.Count(gs => gs.TotalPoints.HasValue && gs.TotalPoints > 0);

                    return new
                    {
                        GroupNumber = groupNumber,
                        TotalSubmissions = totalSubmissionsInGroup,
                        SubmissionsWithVotes = submissionsWithVotes,
                        VotingCompletion = totalSubmissionsInGroup > 0
                            ? (double)submissionsWithVotes / totalSubmissionsInGroup * 100
                            : 0
                    };
                }).ToList();

            return Ok(new
            {
                TotalVoters = totalVoters,
                VotersCompleted = votersCompleted,
                VotingCompletionPercentage = votingCompletionPercentage,
                GroupCount = groupCount,
                GroupStats = groupStats
            });
        }

        [HttpPost("update-status")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> UpdateCompetitionStatus(
            int competitionId,
            [FromBody] UpdateCompetitionStatusRequest request)
        {
            try
            {
                // Verify competition exists
                var competition = await _competitionRepository.GetByIdAsync(competitionId);
                if (competition == null)
                {
                    return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
                }

                // Verify user is organizer or admin
                var userId = User.FindFirst("userId")?.Value;
                if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                // Validate status transition
                if (!IsValidStatusTransition(competition.Status, request.NewStatus))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = $"Invalid status transition from {competition.Status} to {request.NewStatus}"
                    });
                }

                // Update competition status
                competition.Status = request.NewStatus;
                await _competitionRepository.UpdateAsync(competition);

                return Ok(new
                {
                    success = true,
                    message = $"Competition status updated to {request.NewStatus}"
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("non-voters")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult<IEnumerable<NonVoterInfo>>> GetNonVoters(int competitionId)
        {
            // Verify competition exists
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
            }

            // Verify user is organizer or admin
            var userId = User.FindFirst("userId")?.Value;
            if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            // Get non-voters
            var nonVoters = await _round1AssignmentRepository.GetNonVotersAsync(competitionId);

            var result = nonVoters.Select(nv => new NonVoterInfo
            {
                AssignmentId = nv.Round1AssignmentId,
                VoterId = nv.VoterId,
                VoterUsername = nv.Voter?.UserName ?? "Unknown",
                VoterEmail = nv.Voter?.Email ?? "Unknown",
                VoterGroupNumber = nv.VoterGroupNumber,
                AssignedGroupNumber = nv.AssignedGroupNumber
            }).ToList();

            return Ok(result);
        }

        [HttpGet("group-details/{groupNumber}")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> GetGroupDetails(int competitionId, int groupNumber)
        {
            // Verify competition exists
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
            }

            // Verify user is organizer or admin
            var userId = User.FindFirst("userId")?.Value;
            if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            // Get submissions in this group
            var submissionsInGroup = await _submissionGroupRepository.GetByCompetitionAndGroupAsync(competitionId, groupNumber);

            // Get voters assigned to vote on this group
            var votersForGroup = await _round1AssignmentRepository.GetByCompetitionAndGroupAsync(competitionId, groupNumber);

            var groupDetails = new GroupDetailsResponse
            {
                GroupNumber = groupNumber,
                SubmissionsCount = submissionsInGroup.Count(),
                VotersCount = votersForGroup.Count(),
                VotersCompletedCount = votersForGroup.Count(v => v.HasVoted),
                VotingCompletionPercentage = votersForGroup.Any()
                    ? (double)votersForGroup.Count(v => v.HasVoted) / votersForGroup.Count() * 100
                    : 0,

                Submissions = submissionsInGroup.Select(s => new SubmissionDetails
                {
                    SubmissionId = s.SubmissionId,
                    SubmissionGroupId = s.SubmissionGroupId,
                    TrackTitle = s.Submission?.MixTitle ?? "Unknown",
                    SubmittedBy = s.Submission?.User?.UserName ?? "Unknown",
                    TotalPoints = s.TotalPoints ?? 0,
                    FirstPlaceVotes = s.FirstPlaceVotes ?? 0,
                    SecondPlaceVotes = s.SecondPlaceVotes ?? 0,
                    ThirdPlaceVotes = s.ThirdPlaceVotes ?? 0,
                    RankInGroup = s.RankInGroup,
                    IsDisqualified = s.Submission?.IsDisqualified ?? false
                }).ToList(),

                Voters = votersForGroup.Select(v => new VoterDetails
                {
                    VoterId = v.VoterId,
                    Username = v.Voter?.UserName ?? "Unknown",
                    HasVoted = v.HasVoted,
                    VotingCompletedDate = v.VotingCompletedDate,
                    VoterGroupNumber = v.VoterGroupNumber
                }).ToList()
            };

            return Ok(groupDetails);
        }

        [HttpGet("advancing-submissions")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> GetAdvancingSubmissions(int competitionId)
        {
            // Verify competition exists
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
            }

            // Verify user is organizer or admin
            var userId = User.FindFirst("userId")?.Value;
            if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            // Check if competition is in correct status
            if (competition.Status < CompetitionStatus.VotingRound2Setup)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "The competition has not completed Round 1 tallying yet."
                });
            }

            // Get advancing submissions
            var advancingSubmissions = await _submissionGroupRepository.GetAdvancingSubmissionsAsync(competitionId);

            var result = advancingSubmissions.Select(sg => new AdvancingSubmissionInfo
            {
                SubmissionId = sg.SubmissionId,
                MixTitle = sg.Submission?.MixTitle ?? "Unknown",
                Artist = sg.Submission?.User?.UserName ?? "Unknown",
                GroupNumber = sg.GroupNumber,
                RankInGroup = sg.RankInGroup ?? 0,
                TotalPoints = sg.TotalPoints ?? 0,
                FirstPlaceVotes = sg.FirstPlaceVotes ?? 0,
                SecondPlaceVotes = sg.SecondPlaceVotes ?? 0,
                ThirdPlaceVotes = sg.ThirdPlaceVotes ?? 0
            }).ToList();

            return Ok(new
            {
                AdvancingCount = result.Count,
                Submissions = result
            });
        }

        [HttpGet("dashboard-summary")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult> GetDashboardSummary(int competitionId)
        {
            // Verify competition exists
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return NotFound(new { success = false, message = $"Competition with ID {competitionId} not found" });
            }

            // Verify user is organizer or admin
            var userId = User.FindFirst("userId")?.Value;
            if (competition.OrganizerUserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            // Get voting assignments
            var assignments = await _round1AssignmentRepository.GetByCompetitionIdAsync(competitionId);
            var totalVoters = assignments.Count();
            var votersCompleted = assignments.Count(a => a.HasVoted);
            var votingCompletionPercentage = totalVoters > 0 ? (double)votersCompleted / totalVoters * 100 : 0;

            // Get submission groups
            var submissionGroups = await _submissionGroupRepository.GetByCompetitionIdAsync(competitionId);
            var groupCount = submissionGroups.Select(sg => sg.GroupNumber).Distinct().Count();
            var totalSubmissions = submissionGroups.Count();

            // Get voting completion by group
            var votingByGroup = submissionGroups
                .GroupBy(sg => sg.GroupNumber)
                .Select(g => new
                {
                    GroupNumber = g.Key,
                    TotalSubmissions = g.Count(),
                    VotesReceived = g.Count(sg => sg.TotalPoints.HasValue && sg.TotalPoints > 0),
                    CompletionPercentage = g.Count() > 0
                        ? (double)g.Count(sg => sg.TotalPoints.HasValue && sg.TotalPoints > 0) / g.Count() * 100
                        : 0
                }).ToList();

            // Get recent voters (last 10)
            var recentVoters = assignments
                .Where(a => a.HasVoted && a.VotingCompletedDate.HasValue)
                .OrderByDescending(a => a.VotingCompletedDate)
                .Take(10)
                .Select(a => new
                {
                    Username = a.Voter?.UserName ?? "Unknown",
                    CompletedAt = a.VotingCompletedDate,
                    VoterGroup = a.VoterGroupNumber,
                    VotedOnGroup = a.AssignedGroupNumber
                }).ToList();

            // Get top-scoring submissions (top 10)
            var topSubmissions = submissionGroups
                .Where(sg => sg.TotalPoints.HasValue && sg.TotalPoints > 0)
                .OrderByDescending(sg => sg.TotalPoints)
                .ThenByDescending(sg => sg.FirstPlaceVotes)
                .Take(10)
                .Select(sg => new
                {
                    SubmissionId = sg.SubmissionId,
                    MixTitle = sg.Submission?.MixTitle ?? "Unknown",
                    Artist = sg.Submission?.User?.UserName ?? "Unknown",
                    GroupNumber = sg.GroupNumber,
                    TotalPoints = sg.TotalPoints ?? 0,
                    FirstPlaceVotes = sg.FirstPlaceVotes ?? 0
                }).ToList();

            return Ok(new
            {
                CompetitionId = competitionId,
                CompetitionTitle = competition.Title,
                Status = competition.Status.ToString(),
                VotingStats = new
                {
                    TotalVoters = totalVoters,
                    VotersCompleted = votersCompleted,
                    VotingCompletionPercentage = votingCompletionPercentage,
                    TotalSubmissions = totalSubmissions,
                    GroupCount = groupCount
                },
                VotingByGroup = votingByGroup,
                RecentVoters = recentVoters,
                TopSubmissions = topSubmissions,
                CanTallyVotes = competition.Status == CompetitionStatus.VotingRound1Open && votingCompletionPercentage >= 75,
                NonVotersCount = totalVoters - votersCompleted
            });
        }

        // Helper method to validate status transitions
        private bool IsValidStatusTransition(CompetitionStatus currentStatus, CompetitionStatus newStatus)
        {
            // Define valid status transitions
            return (currentStatus, newStatus) switch
            {
                // Submission phase transitions
                (CompetitionStatus.Upcoming, CompetitionStatus.OpenForSubmissions) => true,
                (CompetitionStatus.OpenForSubmissions, CompetitionStatus.VotingRound1Setup) => true,

                // Round 1 transitions
                (CompetitionStatus.VotingRound1Setup, CompetitionStatus.VotingRound1Open) => true,
                (CompetitionStatus.VotingRound1Open, CompetitionStatus.VotingRound1Tallying) => true,
                (CompetitionStatus.VotingRound1Tallying, CompetitionStatus.VotingRound2Setup) => true,

                // Round 2 transitions
                (CompetitionStatus.VotingRound2Setup, CompetitionStatus.VotingRound2Open) => true,
                (CompetitionStatus.VotingRound2Open, CompetitionStatus.VotingRound2Tallying) => true,
                (CompetitionStatus.VotingRound2Tallying, CompetitionStatus.Completed) => true,

                // Allow transition to archived
                (CompetitionStatus.Completed, CompetitionStatus.Archived) => true,

                // Admin can force any transition
                _ => User.IsInRole("Admin")
            };
        }
    }

    public class SubmitVotesRequest
    {
        public int FirstPlaceSubmissionId { get; set; }
        public int SecondPlaceSubmissionId { get; set; }
        public int ThirdPlaceSubmissionId { get; set; }
    }

    public class CreateGroupsRequest
    {
        public int TargetGroupSize { get; set; } = 20;
    }

    public class UpdateCompetitionStatusRequest
    {
        public CompetitionStatus NewStatus { get; set; }
    }

    public class NonVoterInfo
    {
        public int AssignmentId { get; set; }
        public string VoterId { get; set; } = string.Empty;
        public string VoterUsername { get; set; } = string.Empty;
        public string VoterEmail { get; set; } = string.Empty;
        public int VoterGroupNumber { get; set; }
        public int AssignedGroupNumber { get; set; }
    }

    public class GroupDetailsResponse
    {
        public int GroupNumber { get; set; }
        public int SubmissionsCount { get; set; }
        public int VotersCount { get; set; }
        public int VotersCompletedCount { get; set; }
        public double VotingCompletionPercentage { get; set; }
        public List<SubmissionDetails> Submissions { get; set; } = new List<SubmissionDetails>();
        public List<VoterDetails> Voters { get; set; } = new List<VoterDetails>();
    }

    public class SubmissionDetails
    {
        public int SubmissionId { get; set; }
        public int SubmissionGroupId { get; set; }
        public string TrackTitle { get; set; } = string.Empty;
        public string SubmittedBy { get; set; } = string.Empty;
        public int TotalPoints { get; set; }
        public int FirstPlaceVotes { get; set; }
        public int SecondPlaceVotes { get; set; }
        public int ThirdPlaceVotes { get; set; }
        public int? RankInGroup { get; set; }
        public bool IsDisqualified { get; set; }
    }

    public class VoterDetails
    {
        public string VoterId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public bool HasVoted { get; set; }
        public DateTimeOffset? VotingCompletedDate { get; set; }
        public int VoterGroupNumber { get; set; }
    }

    public class AdvancingSubmissionInfo
    {
        public int SubmissionId { get; set; }
        public string MixTitle { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public int GroupNumber { get; set; }
        public int RankInGroup { get; set; }
        public int TotalPoints { get; set; }
        public int FirstPlaceVotes { get; set; }
        public int SecondPlaceVotes { get; set; }
        public int ThirdPlaceVotes { get; set; }
    }
}