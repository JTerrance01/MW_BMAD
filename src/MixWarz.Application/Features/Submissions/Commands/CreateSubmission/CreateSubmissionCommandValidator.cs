using FluentValidation;
using Microsoft.AspNetCore.Http;
using MixWarz.Domain.Interfaces;
using NAudio.Wave;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.Submissions.Commands.CreateSubmission
{
    public class CreateSubmissionCommandValidator : AbstractValidator<CreateSubmissionCommand>
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ISubmissionRepository _submissionRepository;

        public CreateSubmissionCommandValidator(
            ICompetitionRepository competitionRepository,
            ISubmissionRepository submissionRepository)
        {
            _competitionRepository = competitionRepository;
            _submissionRepository = submissionRepository;

            RuleFor(x => x.CompetitionId)
                .GreaterThan(0).WithMessage("Competition ID is required");

            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("User ID is required");

            RuleFor(x => x.MixTitle)
                .NotEmpty().WithMessage("Mix title is required")
                .MaximumLength(100).WithMessage("Mix title must not exceed 100 characters");

            RuleFor(x => x.MixDescription)
                .MaximumLength(2000).WithMessage("Mix description must not exceed 2000 characters");

            RuleFor(x => x.AudioFile)
                .NotNull().WithMessage("Audio file is required");

            RuleFor(x => x.AudioFile)
                .Must(file => file == null || file.Length <= 104857600) // 100 MB limit
                .WithMessage("Audio file must not exceed 100 MB");

            // Validate file format (must be MP3)
            RuleFor(x => x.AudioFile)
                .Must(file => file == null || file.ContentType == "audio/mpeg" || file.ContentType == "audio/mp3")
                .WithMessage("Audio file must be in MP3 format");

            // Check that submission is before competition deadline
            RuleFor(x => x.CompetitionId)
                .MustAsync(BeBeforeCompetitionDeadline)
                .WithMessage("The competition submission deadline has passed. No further submissions are accepted.");

            // Check that user has not already submitted to this competition
            RuleFor(x => x)
                .MustAsync(BeUserFirstSubmissionToCompetition)
                .WithMessage("You have already submitted a mix to this competition. Only one submission per competition is allowed.");

            // Validate MP3 bitrate (320kbps)
            RuleFor(x => x.AudioFile)
                .MustAsync(HaveRequiredMp3Bitrate)
                .WithMessage("Audio file must be encoded as 320kbps MP3. Please re-encode your file and try again.");
        }

        private async Task<bool> BeBeforeCompetitionDeadline(int competitionId, CancellationToken cancellationToken)
        {
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return false;
            }

            return DateTime.UtcNow < competition.EndDate;
        }

        private async Task<bool> BeUserFirstSubmissionToCompetition(CreateSubmissionCommand command, CancellationToken cancellationToken)
        {
            return !await _submissionRepository.ExistsByCompetitionAndUserAsync(command.CompetitionId, command.UserId);
        }

        private async Task<bool> HaveRequiredMp3Bitrate(IFormFile file, CancellationToken cancellationToken)
        {
            if (file == null)
            {
                return false;
            }

            try
            {
                using (var stream = file.OpenReadStream())
                using (var reader = new Mp3FileReader(stream))
                {
                    var mp3Frame = reader.Mp3WaveFormat;
                    int bitrate = mp3Frame.AverageBytesPerSecond * 8 / 1000;

                    // Check if bitrate is 320kbps (allow slight variation)
                    return bitrate >= 315 && bitrate <= 325;
                }
            }
            catch (Exception)
            {
                // If there's an error reading the MP3 file, it's invalid
                return false;
            }
        }
    }
}