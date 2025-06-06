using FluentValidation;

namespace MixWarz.Application.Features.Submissions.Commands.SubmitJudgment
{
    public class SubmitJudgmentCommandValidator : AbstractValidator<SubmitJudgmentCommand>
    {
        public SubmitJudgmentCommandValidator()
        {
            RuleFor(x => x.CompetitionId)
                .GreaterThan(0)
                .WithMessage("Competition ID must be greater than 0");

            RuleFor(x => x.SubmissionId)
                .GreaterThan(0)
                .WithMessage("Submission ID must be greater than 0");

            RuleFor(x => x.OverallScore)
                .InclusiveBetween(0, 10)
                .WithMessage("Overall score must be between 0 and 10");

            RuleFor(x => x.OverallComments)
                .MaximumLength(2000)
                .WithMessage("Overall comments cannot exceed 2000 characters");

            RuleFor(x => x.JudgeId)
                .NotEmpty()
                .WithMessage("Judge ID is required");

            RuleFor(x => x.VotingRound)
                .InclusiveBetween(1, 2)
                .WithMessage("Voting round must be 1 or 2");

            RuleFor(x => x.CriteriaScores)
                .NotEmpty()
                .WithMessage("At least one criteria score is required");

            RuleForEach(x => x.CriteriaScores)
                .SetValidator(new CriteriaScoreDtoValidator());
        }
    }

    public class CriteriaScoreDtoValidator : AbstractValidator<CriteriaScoreDto>
    {
        public CriteriaScoreDtoValidator()
        {
            RuleFor(x => x.JudgingCriteriaId)
                .GreaterThan(0)
                .WithMessage("Judging criteria ID must be greater than 0");

            RuleFor(x => x.Score)
                .GreaterThan(0)
                .WithMessage("Score must be greater than 0");

            RuleFor(x => x.Comments)
                .MaximumLength(1000)
                .WithMessage("Comments cannot exceed 1000 characters");
        }
    }
}