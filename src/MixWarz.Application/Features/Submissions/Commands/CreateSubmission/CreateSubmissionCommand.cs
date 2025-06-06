using MediatR;
using Microsoft.AspNetCore.Http;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.Submissions.Commands.CreateSubmission
{
    public class CreateSubmissionCommand : IRequest<CreateSubmissionResponse>
    {
        public int CompetitionId { get; set; }
        public string UserId { get; set; }
        public string MixTitle { get; set; }
        public string MixDescription { get; set; }
        public IFormFile AudioFile { get; set; }
    }

    public class CreateSubmissionResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int SubmissionId { get; set; }
    }

    public class CreateSubmissionCommandHandler : IRequestHandler<CreateSubmissionCommand, CreateSubmissionResponse>
    {
        private readonly ISubmissionRepository _submissionRepository;
        private readonly ICompetitionRepository _competitionRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly IVirusScanService _virusScanService;

        public CreateSubmissionCommandHandler(
            ISubmissionRepository submissionRepository,
            ICompetitionRepository competitionRepository,
            IFileStorageService fileStorageService,
            IVirusScanService virusScanService)
        {
            _submissionRepository = submissionRepository;
            _competitionRepository = competitionRepository;
            _fileStorageService = fileStorageService;
            _virusScanService = virusScanService;
        }

        public async Task<CreateSubmissionResponse> Handle(CreateSubmissionCommand request, CancellationToken cancellationToken)
        {
            // Check if competition exists and is open for submissions
            var competition = await _competitionRepository.GetByIdAsync(request.CompetitionId);
            if (competition == null)
            {
                return new CreateSubmissionResponse
                {
                    Success = false,
                    Message = "Competition not found"
                };
            }

            if (competition.Status != CompetitionStatus.OpenForSubmissions)
            {
                return new CreateSubmissionResponse
                {
                    Success = false,
                    Message = "Competition is not open for submissions"
                };
            }

            // Check for deadline (double-check beyond validator)
            if (DateTime.UtcNow > competition.EndDate)
            {
                return new CreateSubmissionResponse
                {
                    Success = false,
                    Message = "The competition submission deadline has passed. No further submissions are accepted."
                };
            }

            // Check if user has already submitted to this competition (double-check beyond validator)
            if (await _submissionRepository.ExistsByCompetitionAndUserAsync(request.CompetitionId, request.UserId))
            {
                return new CreateSubmissionResponse
                {
                    Success = false,
                    Message = "You have already submitted a mix to this competition. Only one submission per competition is allowed."
                };
            }

            // Perform virus scan
            using (var stream = request.AudioFile.OpenReadStream())
            {
                bool isSafe = await _virusScanService.ScanFileAsync(stream);
                if (!isSafe)
                {
                    return new CreateSubmissionResponse
                    {
                        Success = false,
                        Message = "The uploaded file failed the security check"
                    };
                }

                // Reset stream position after scanning
                if (stream.CanSeek)
                {
                    stream.Position = 0;
                }
            }

            // Upload file to S3
            string audioFilePath = await _fileStorageService.UploadFileAsync(
                request.AudioFile,
                $"submissions/{request.CompetitionId}/{request.UserId}");

            // Create submission in database
            var submission = new Submission
            {
                CompetitionId = request.CompetitionId,
                UserId = request.UserId,
                MixTitle = request.MixTitle,
                MixDescription = request.MixDescription,
                AudioFilePath = audioFilePath,
                SubmissionDate = DateTime.UtcNow,
                Status = SubmissionStatus.Submitted,
                IsEligibleForRound1Voting = true // Mark as eligible for Round 1 voting
            };

            var submissionId = await _submissionRepository.CreateAsync(submission);

            return new CreateSubmissionResponse
            {
                Success = true,
                Message = "Submission created successfully",
                SubmissionId = submissionId
            };
        }
    }
}