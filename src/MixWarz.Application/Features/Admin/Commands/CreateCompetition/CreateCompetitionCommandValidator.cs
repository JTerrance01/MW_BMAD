using FluentValidation;

namespace MixWarz.Application.Features.Admin.Commands.CreateCompetition
{
    public class CreateCompetitionCommandValidator : AbstractValidator<CreateCompetitionCommand>
    {
        public CreateCompetitionCommandValidator()
        {
            // Use the IsUpdateOperation property directly - more direct than a local function

            // These rules apply to both create and update operations
            RuleFor(c => c.Title)
                .NotEmpty().WithMessage("Title is required")
                .MaximumLength(100).WithMessage("Title must not exceed 100 characters");

            RuleFor(c => c.Description)
                .NotEmpty().WithMessage("Description is required")
                .MaximumLength(500).WithMessage("Description must not exceed 500 characters");

            // Rules are optional for both initial creation and updates
            RuleFor(c => c.Rules)
                .MaximumLength(10000).WithMessage("Rules must not exceed 10000 characters");

            // For updates, use the When() operator to conditionally apply rules
            When(c => !c.IsUpdateOperation, () =>
            {
                // These rules only apply for new competitions
                RuleFor(c => c.StartDate)
                    .NotEmpty().WithMessage("Start date is required");

                RuleFor(c => c.EndDate)
                    .NotEmpty().WithMessage("End date is required")
                    .GreaterThan(DateTime.MinValue).WithMessage("End date must be valid")
                    .GreaterThan(c => c.StartDate).WithMessage("End date must be after start date");

                RuleFor(c => c.PrizeDetails)
                    .NotEmpty().WithMessage("Prize details are required");

                RuleFor(c => c.OrganizerUserId)
                    .NotEmpty().When(_ => !System.Diagnostics.Debugger.IsAttached)
                    .WithMessage("Organizer user ID is required");

                // Require ImageUrl for new competitions (files are processed before validation)
                RuleFor(c => c.ImageUrl)
                    .NotEmpty()
                    .WithMessage("Cover image is required");

                // Require MultitrackZipUrl for new competitions (files are processed before validation)
                RuleFor(c => c.MultitrackZipUrl)
                    .NotEmpty()
                    .WithMessage("Multitrack zip file is required");

                // Require SourceTrackUrl for new competitions (files are processed before validation)
                RuleFor(c => c.SourceTrackUrl)
                    .NotEmpty()
                    .WithMessage("Source track file is required");

                RuleFor(c => c.Genre)
                    .IsInEnum()
                    .WithMessage("Invalid genre selected");

                RuleFor(c => c.SubmissionDeadline)
                    .NotEmpty().WithMessage("Submission deadline is required")
                    .GreaterThan(c => c.StartDate).WithMessage("Submission deadline must be after the start date");

                RuleFor(c => c.SongCreator)
                    .NotEmpty().WithMessage("Song creator is required")
                    .MaximumLength(500).WithMessage("Song creator must not exceed 500 characters");
            });

            // File validation is now handled in the controller before validation
            // Files are uploaded and converted to URLs before this validator runs

            // Status validation should apply to both create and update operations
            RuleFor(c => c.Status)
                .IsInEnum()
                .WithMessage("Invalid competition status");

            // Conditional date validation that applies to both create and update if both dates are provided
            When(c => c.StartDate != default && c.EndDate != default, () =>
            {
                RuleFor(c => c.EndDate)
                    .GreaterThan(c => c.StartDate)
                    .WithMessage("End date must be after start date");
            });

            When(c => c.StartDate != default && c.SubmissionDeadline != default, () =>
            {
                RuleFor(c => c.SubmissionDeadline)
                    .GreaterThan(c => c.StartDate)
                    .WithMessage("Submission deadline must be after the start date");
            });
        }
    }
}