using MediatR;

namespace MixWarz.Application.Features.Submissions.Queries.GetSubmissionScoreBreakdown
{
    public class GetSubmissionScoreBreakdownQuery : IRequest<GetSubmissionScoreBreakdownResponse>
    {
        public int SubmissionId { get; set; }
        public string UserId { get; set; } = string.Empty;
    }
}