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
                
            RuleFor(x => x.JudgeUserId)
                .NotEmpty().WithMessage("Judge user ID is required");
                
            RuleFor(x => x.Feedback)
                .MaximumLength(2000).WithMessage("Feedback must not exceed 2000 characters");
        }
    }
} 