using FluentValidation;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Commands.UpdateCompetition
{
    public class UpdateCompetitionCommandValidator : AbstractValidator<UpdateCompetitionCommand>
    {
        public UpdateCompetitionCommandValidator()
        {
            RuleFor(c => c.CompetitionId)
                .NotEmpty().WithMessage("Competition ID is required for update");

            // Optional fields - validate only if provided
            When(c => c.Title != null,
                () => RuleFor(c => c.Title).MaximumLength(100).WithMessage("Title must not exceed 100 characters"));

            When(c => c.Description != null,
                () => RuleFor(c => c.Description).MaximumLength(500).WithMessage("Description must not exceed 500 characters"));

            When(c => c.Rules != null,
                () => RuleFor(c => c.Rules).MaximumLength(10000).WithMessage("Rules must not exceed 10000 characters"));

            When(c => c.PrizeDetails != null,
                () => RuleFor(c => c.PrizeDetails).NotEmpty().WithMessage("Prize details cannot be empty if provided"));

            When(c => c.StartDate.HasValue && c.EndDate.HasValue,
                () => RuleFor(c => c.EndDate).GreaterThan(c => c.StartDate!.Value).WithMessage("End date must be after start date"));

            When(c => c.StartDate.HasValue && c.SubmissionDeadline.HasValue,
                () => RuleFor(c => c.SubmissionDeadline).GreaterThan(c => c.StartDate!.Value).WithMessage("Submission deadline must be after the start date"));

            When(c => c.MultitrackZipFile != null, () =>
            {
                RuleFor(c => c.MultitrackZipFile!.ContentType)
                    .Must(ct => ct == "application/zip" || ct == "application/x-zip-compressed" || ct == "application/octet-stream")
                    .WithMessage("Multitrack file must be a ZIP file");

                RuleFor(c => c.MultitrackZipFile!.FileName)
                    .Must(fn => fn.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                    .WithMessage("Multitrack file must have a .zip extension");

                RuleFor(c => c.MultitrackZipFile!.Length)
                    .LessThanOrEqualTo(1024 * 1024 * 1024) // 1GB max
                    .WithMessage("Multitrack ZIP file must not exceed 1GB");
            });

            When(c => c.SongCreator != null,
               () => RuleFor(c => c.SongCreator).MaximumLength(500).WithMessage("Song creator must not exceed 500 characters"));

            // Note: MultitrackZipUrl and ImageUrl are validated implicitly by the API endpoint
            // receiving them as strings. No specific format validation needed here unless
            // we want to check for valid URL format, which is often handled client-side.
        }
    }
}