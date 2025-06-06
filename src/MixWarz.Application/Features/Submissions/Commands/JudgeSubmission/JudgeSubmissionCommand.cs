using MediatR;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Features.Submissions.Commands.JudgeSubmission
{
    public class JudgeSubmissionCommand : IRequest<JudgeSubmissionResponse>
    {
        public int SubmissionId { get; set; }
        public decimal Score { get; set; }
        public string? Feedback { get; set; }
        public string? JudgeUserId { get; set; }
        public bool IsAdmin { get; set; }
    }

    public class JudgeSubmissionResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public int SubmissionId { get; set; }
        public decimal Score { get; set; }
    }

    public class JudgeSubmissionCommandHandler : IRequestHandler<JudgeSubmissionCommand, JudgeSubmissionResponse>
    {
        private readonly ISubmissionRepository _submissionRepository;
        private readonly ICompetitionRepository _competitionRepository;

        public JudgeSubmissionCommandHandler(
            ISubmissionRepository submissionRepository,
            ICompetitionRepository competitionRepository)
        {
            _submissionRepository = submissionRepository;
            _competitionRepository = competitionRepository;
        }

        public async Task<JudgeSubmissionResponse> Handle(JudgeSubmissionCommand request, CancellationToken cancellationToken)
        {
            // Get the submission
            var submission = await _submissionRepository.GetByIdAsync(request.SubmissionId);
            if (submission == null)
            {
                return new JudgeSubmissionResponse
                {
                    Success = false,
                    Message = $"Submission with ID {request.SubmissionId} not found"
                };
            }

            // Get the competition
            var competition = await _competitionRepository.GetByIdAsync(submission.CompetitionId);
            if (competition == null)
            {
                return new JudgeSubmissionResponse
                {
                    Success = false,
                    Message = $"Competition with ID {submission.CompetitionId} not found"
                };
            }

            // Check if the user is authorized to judge this submission (admin or organizer)
            if (!request.IsAdmin && competition.OrganizerUserId != request.JudgeUserId)
            {
                return new JudgeSubmissionResponse
                {
                    Success = false,
                    Message = "You are not authorized to judge submissions for this competition"
                };
            }

            // Update the submission
            submission.FinalScore = request.Score;
            submission.Feedback = request.Feedback;
            submission.Status = SubmissionStatus.Judged;

            await _submissionRepository.UpdateAsync(submission);

            // Check if all submissions have been judged and update competition status if needed
            var submissionsCount = await _submissionRepository.GetCountByCompetitionIdAsync(submission.CompetitionId);
            var judgedSubmissions = await _submissionRepository.GetByCompetitionIdAndStatusAsync(
                submission.CompetitionId,
                SubmissionStatus.Judged,
                1,
                submissionsCount);

            int judgedCount = judgedSubmissions.Count();

            // If all submissions are judged, update competition status to Closed
            if (judgedCount == submissionsCount && competition.Status == CompetitionStatus.InJudging)
            {
                competition.Status = CompetitionStatus.Closed;
                await _competitionRepository.UpdateAsync(competition);
            }
            // If some submissions are judged but not all, and competition is not in judging, update to in judging
            else if (judgedCount > 0 && judgedCount < submissionsCount && competition.Status == CompetitionStatus.OpenForSubmissions)
            {
                competition.Status = CompetitionStatus.InJudging;
                await _competitionRepository.UpdateAsync(competition);
            }

            return new JudgeSubmissionResponse
            {
                Success = true,
                Message = "Submission judged successfully",
                SubmissionId = submission.SubmissionId,
                Score = submission.FinalScore.Value
            };
        }
    }
}