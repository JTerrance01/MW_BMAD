using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace MixWarz.Application.Features.Submissions.Commands.SubmitJudgment
{
    public class SubmitJudgmentCommand : IRequest<SubmitJudgmentResponse>
    {
        public int CompetitionId { get; set; }
        public int SubmissionId { get; set; }
        public decimal OverallScore { get; set; }
        public string? OverallComments { get; set; }
        public List<CriteriaScoreDto> CriteriaScores { get; set; } = new();
        public string? JudgeId { get; set; }
        public int VotingRound { get; set; } = 1; // Default to Round 1
    }

    public class CriteriaScoreDto
    {
        public int JudgingCriteriaId { get; set; }
        public decimal Score { get; set; }
        public string? Comments { get; set; }
    }

    public class SubmitJudgmentResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public int? SubmissionJudgmentId { get; set; }
        public decimal OverallScore { get; set; }
        public bool IsUpdate { get; set; }
        public bool VotesGenerated { get; set; } = false; // UNIFIED APPROACH: Track if votes were auto-generated
    }

    public class SubmitJudgmentCommandHandler : IRequestHandler<SubmitJudgmentCommand, SubmitJudgmentResponse>
    {
        private readonly IAppDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<SubmitJudgmentCommandHandler> _logger;

        public SubmitJudgmentCommandHandler(
            IAppDbContext context,
            UserManager<User> userManager,
            ILogger<SubmitJudgmentCommandHandler> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<SubmitJudgmentResponse> Handle(SubmitJudgmentCommand request, CancellationToken cancellationToken)
        {
            // Validate submission exists
            var submission = await _context.Submissions
                .FirstOrDefaultAsync(s => s.SubmissionId == request.SubmissionId, cancellationToken);

            if (submission == null)
            {
                return new SubmitJudgmentResponse
                {
                    Success = false,
                    Message = $"Submission with ID {request.SubmissionId} not found"
                };
            }

            // Validate competition exists and matches
            var competition = await _context.Competitions
                .FirstOrDefaultAsync(c => c.CompetitionId == request.CompetitionId, cancellationToken);

            if (competition == null)
            {
                return new SubmitJudgmentResponse
                {
                    Success = false,
                    Message = $"Competition with ID {request.CompetitionId} not found"
                };
            }

            if (submission.CompetitionId != request.CompetitionId)
            {
                return new SubmitJudgmentResponse
                {
                    Success = false,
                    Message = "Submission does not belong to the specified competition"
                };
            }

            // Validate judge exists
            var judge = await _userManager.FindByIdAsync(request.JudgeId);
            if (judge == null)
            {
                return new SubmitJudgmentResponse
                {
                    Success = false,
                    Message = "Judge not found"
                };
            }

            // Check if judgment already exists (for updates)
            var existingJudgment = await _context.SubmissionJudgments
                .Include(sj => sj.CriteriaScores)
                .FirstOrDefaultAsync(sj =>
                    sj.SubmissionId == request.SubmissionId &&
                    sj.JudgeId == request.JudgeId &&
                    sj.VotingRound == request.VotingRound,
                    cancellationToken);

            bool isUpdate = existingJudgment != null;

            // BUSINESS RULE: Prevent updates to completed judgments for fair competition
            if (isUpdate && existingJudgment.IsCompleted)
            {
                return new SubmitJudgmentResponse
                {
                    Success = false,
                    Message = "Cannot modify a judgment that has already been completed and submitted. This ensures fair competition by preventing judges from changing their evaluations after submission."
                };
            }

            SubmissionJudgment judgment;

            if (isUpdate)
            {
                // Update existing judgment (only allowed if not yet completed)
                judgment = existingJudgment;
                judgment.OverallScore = request.OverallScore;
                judgment.OverallComments = request.OverallComments;
                judgment.LastUpdated = DateTimeOffset.UtcNow;
                judgment.IsCompleted = true;

                // Remove existing criteria scores
                _context.CriteriaScores.RemoveRange(judgment.CriteriaScores);
            }
            else
            {
                // Create new judgment
                judgment = new SubmissionJudgment
                {
                    SubmissionId = request.SubmissionId,
                    JudgeId = request.JudgeId,
                    CompetitionId = request.CompetitionId,
                    VotingRound = request.VotingRound,
                    OverallScore = request.OverallScore,
                    OverallComments = request.OverallComments,
                    JudgmentTime = DateTimeOffset.UtcNow,
                    IsCompleted = true
                };

                _context.SubmissionJudgments.Add(judgment);
            }

            // Save to get the judgment ID
            await _context.SaveChangesAsync(cancellationToken);

            // Add new criteria scores
            var criteriaScores = request.CriteriaScores.Select(cs => new CriteriaScore
            {
                SubmissionJudgmentId = judgment.SubmissionJudgmentId,
                JudgingCriteriaId = cs.JudgingCriteriaId,
                Score = cs.Score,
                Comments = cs.Comments,
                ScoreTime = DateTimeOffset.UtcNow
            }).ToList();

            _context.CriteriaScores.AddRange(criteriaScores);

            // UNIFIED APPROACH: Auto-generate SubmissionVotes for Round 1 judgments
            bool votesGenerated = false;
            if (request.VotingRound == 1)
            {
                // Get Round1Assignment for the judge
                var round1Assignment = await _context.Round1Assignments
                    .FirstOrDefaultAsync(ra =>
                        ra.CompetitionId == request.CompetitionId &&
                        ra.VoterId == request.JudgeId,
                        cancellationToken);

                if (round1Assignment != null)
                {
                    // Convert judgments to votes when ALL submissions in their assigned group are judged
                    votesGenerated = await ConvertJudgmentsToVotesIfCompleteAsync(
                        request.CompetitionId,
                        request.JudgeId,
                        round1Assignment.AssignedGroupNumber,
                        cancellationToken);

                    // FIXED: Only set HasVoted and VotingCompletedDate when user has completed ALL submissions in their assigned group
                    if (votesGenerated)
                    {
                        round1Assignment.HasVoted = true;
                        round1Assignment.VotingCompletedDate = DateTimeOffset.UtcNow;
                        await _context.SaveChangesAsync(cancellationToken);

                        _logger.LogInformation($"✅ Judge {request.JudgeId} has completed ALL judgments in assigned group {round1Assignment.AssignedGroupNumber} for competition {request.CompetitionId}");
                    }
                    else
                    {
                        _logger.LogInformation($"⏳ Judge {request.JudgeId} submitted judgment but has not completed all submissions in assigned group {round1Assignment.AssignedGroupNumber} yet");
                    }
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            return new SubmitJudgmentResponse
            {
                Success = true,
                Message = isUpdate ? "Judgment updated successfully!" : "Judgment submitted successfully!",
                SubmissionJudgmentId = judgment.SubmissionJudgmentId,
                OverallScore = judgment.OverallScore ?? 0,
                IsUpdate = isUpdate,
                VotesGenerated = votesGenerated
            };
        }

        /// <summary>
        /// UNIFIED APPROACH: Converts completed judgments to SubmissionVotes for traditional tallying
        /// Follows Single Responsibility Principle - handles judgment-to-vote conversion
        /// FIXED: Only converts when judge has completed judgments for ALL submissions in their assigned group
        /// </summary>
        private async Task<bool> ConvertJudgmentsToVotesIfCompleteAsync(
            int competitionId,
            string judgeId,
            int assignedGroupNumber,
            CancellationToken cancellationToken)
        {
            // Get all submissions in the judge's assigned group
            var groupSubmissions = await _context.SubmissionGroups
                .Where(sg => sg.CompetitionId == competitionId && sg.GroupNumber == assignedGroupNumber)
                .Include(sg => sg.Submission)
                .Where(sg => !sg.Submission.IsDisqualified && sg.Submission.IsEligibleForRound1Voting)
                .Select(sg => sg.SubmissionId)
                .ToListAsync(cancellationToken);

            Console.WriteLine($"📊 JUDGING PROGRESS CHECK: Judge {judgeId} assigned to group {assignedGroupNumber} with {groupSubmissions.Count} submissions in Competition {competitionId}");

            if (groupSubmissions.Count < 3)
            {
                // Not enough submissions to create traditional rankings
                Console.WriteLine($"⚠️ INSUFFICIENT SUBMISSIONS: Group {assignedGroupNumber} has only {groupSubmissions.Count} submissions (minimum 3 required for ranking)");
                return false;
            }

            // Check if judge has completed judgments for ALL submissions in their assigned group
            var judgeCompletedJudgments = await _context.SubmissionJudgments
                .Where(sj => sj.CompetitionId == competitionId &&
                           sj.JudgeId == judgeId &&
                           sj.VotingRound == 1 &&
                           sj.IsCompleted &&
                           sj.OverallScore.HasValue &&
                           groupSubmissions.Contains(sj.SubmissionId))
                .ToListAsync(cancellationToken);

            Console.WriteLine($"📝 COMPLETION STATUS: Judge {judgeId} has completed {judgeCompletedJudgments.Count} of {groupSubmissions.Count} required judgments in assigned group {assignedGroupNumber}");

            if (judgeCompletedJudgments.Count != groupSubmissions.Count)
            {
                // Judge hasn't completed all judgments for their assigned group yet
                var remainingSubmissions = groupSubmissions.Count - judgeCompletedJudgments.Count;
                Console.WriteLine($"⏳ JUDGING INCOMPLETE: Judge {judgeId} still needs to judge {remainingSubmissions} more submissions to complete assigned group {assignedGroupNumber}");
                return false;
            }

            // BUSINESS LOGIC: Convert judgment scores to traditional rankings (1st=3pts, 2nd=2pts, 3rd=1pt)
            // Rank submissions by OverallScore (highest first)
            var rankedJudgments = judgeCompletedJudgments
                .OrderByDescending(sj => sj.OverallScore)
                .ThenBy(sj => sj.SubmissionId) // Consistent tie-breaking
                .ToList();

            Console.WriteLine($"🏆 JUDGMENT RANKINGS: Judge {judgeId} ranked {rankedJudgments.Count} submissions for conversion to votes");

            // Check if votes already exist for this judge (prevent duplicate voting)
            var existingVotes = await _context.SubmissionVotes
                .Where(sv => sv.CompetitionId == competitionId &&
                           sv.VoterId == judgeId &&
                           sv.VotingRound == 1)
                .ToListAsync(cancellationToken);

            if (existingVotes.Any())
            {
                Console.WriteLine($"✅ VOTES ALREADY EXIST: Judge {judgeId} already has {existingVotes.Count} votes for Round 1 - skipping conversion");
                return true; // Votes already generated, so consider this complete
            }

            // Create SubmissionVotes based on judgment rankings
            var votesToCreate = new List<SubmissionVote>();
            for (int i = 0; i < Math.Min(3, rankedJudgments.Count); i++) // Top 3 get votes
            {
                var rank = i + 1;
                var points = 4 - rank; // 1st=3pts, 2nd=2pts, 3rd=1pt
                var judgment = rankedJudgments[i];

                var submissionVote = new SubmissionVote
                {
                    CompetitionId = competitionId,
                    SubmissionId = judgment.SubmissionId,
                    VoterId = judgeId,
                    Rank = rank,
                    Points = points,
                    VotingRound = 1,
                    VoteTime = DateTimeOffset.UtcNow
                };

                votesToCreate.Add(submissionVote);

                Console.WriteLine($"🗳️ VOTE CONVERSION: Rank {rank} (Score: {judgment.OverallScore}) → Submission {judgment.SubmissionId} ({points} points)");
            }

            // Save the converted votes
            foreach (var vote in votesToCreate)
            {
                _context.SubmissionVotes.Add(vote);
            }

            await _context.SaveChangesAsync(cancellationToken);

            Console.WriteLine($"✅ JUDGMENT-TO-VOTE CONVERSION COMPLETE: Created {votesToCreate.Count} votes from Judge {judgeId}'s assigned group {assignedGroupNumber} judgments in Competition {competitionId}");

            return true;
        }
    }
}