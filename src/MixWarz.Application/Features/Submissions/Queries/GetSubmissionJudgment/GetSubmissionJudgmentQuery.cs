using MediatR;
using Microsoft.EntityFrameworkCore;
using MixWarz.Application.Common.Interfaces;

namespace MixWarz.Application.Features.Submissions.Queries.GetSubmissionJudgment
{
    public class GetSubmissionJudgmentQuery : IRequest<GetSubmissionJudgmentResponse>
    {
        public int SubmissionId { get; set; }
        public string JudgeId { get; set; } = string.Empty;
        public int VotingRound { get; set; } = 1;
    }

    public class GetSubmissionJudgmentResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public SubmissionJudgmentDto? Judgment { get; set; }
    }

    public class SubmissionJudgmentDto
    {
        public int SubmissionJudgmentId { get; set; }
        public int SubmissionId { get; set; }
        public string JudgeId { get; set; } = string.Empty;
        public int CompetitionId { get; set; }
        public int VotingRound { get; set; }
        public decimal? OverallScore { get; set; }
        public string? OverallComments { get; set; }
        public DateTimeOffset JudgmentTime { get; set; }
        public DateTimeOffset? LastUpdated { get; set; }
        public bool IsCompleted { get; set; }
        public List<CriteriaScoreDto> CriteriaScores { get; set; } = new();
    }

    public class CriteriaScoreDto
    {
        public int CriteriaScoreId { get; set; }
        public int JudgingCriteriaId { get; set; }
        public decimal Score { get; set; }
        public string? Comments { get; set; }
        public DateTimeOffset ScoreTime { get; set; }
    }

    public class GetSubmissionJudgmentQueryHandler : IRequestHandler<GetSubmissionJudgmentQuery, GetSubmissionJudgmentResponse>
    {
        private readonly IAppDbContext _context;

        public GetSubmissionJudgmentQueryHandler(IAppDbContext context)
        {
            _context = context;
        }

        public async Task<GetSubmissionJudgmentResponse> Handle(GetSubmissionJudgmentQuery request, CancellationToken cancellationToken)
        {
            var judgment = await _context.SubmissionJudgments
                .Include(sj => sj.CriteriaScores)
                .FirstOrDefaultAsync(sj =>
                    sj.SubmissionId == request.SubmissionId &&
                    sj.JudgeId == request.JudgeId &&
                    sj.VotingRound == request.VotingRound,
                    cancellationToken);

            if (judgment == null)
            {
                return new GetSubmissionJudgmentResponse
                {
                    Success = false,
                    Message = "No judgment found for this submission and judge"
                };
            }

            var judgmentDto = new SubmissionJudgmentDto
            {
                SubmissionJudgmentId = judgment.SubmissionJudgmentId,
                SubmissionId = judgment.SubmissionId,
                JudgeId = judgment.JudgeId,
                CompetitionId = judgment.CompetitionId,
                VotingRound = judgment.VotingRound,
                OverallScore = judgment.OverallScore,
                OverallComments = judgment.OverallComments,
                JudgmentTime = judgment.JudgmentTime,
                LastUpdated = judgment.LastUpdated,
                IsCompleted = judgment.IsCompleted,
                CriteriaScores = judgment.CriteriaScores.Select(cs => new CriteriaScoreDto
                {
                    CriteriaScoreId = cs.CriteriaScoreId,
                    JudgingCriteriaId = cs.JudgingCriteriaId,
                    Score = cs.Score,
                    Comments = cs.Comments,
                    ScoreTime = cs.ScoreTime
                }).ToList()
            };

            return new GetSubmissionJudgmentResponse
            {
                Success = true,
                Message = "Judgment retrieved successfully",
                Judgment = judgmentDto
            };
        }
    }
}