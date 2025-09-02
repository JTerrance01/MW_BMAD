using FluentValidation;

namespace MixWarz.Application.Features.Submissions.Commands.JudgeSubmission
{
    public class JudgeSubmissionCommandValidator : AbstractValidator<JudgeSubmissionCommand>
    {
        public JudgeSubmissionCommandValidator()
        {
            RuleFor(x => x.SubmissionId)
                .GreaterThan(0).WithMessage("Submission ID is required");
                
            RuleFor(x => x.Score)
                .InclusiveBetween(1, 100).WithMessage("Score must be between 1 and 100");
                
            RuleFor(x => x.JudgeId)
                .NotEmpty().WithMessage("Judge ID is required");
                
            RuleFor(x => x.Comments)
                .MaximumLength(2000).WithMessage("Comments must not exceed 2000 characters");
        }
    }
} 