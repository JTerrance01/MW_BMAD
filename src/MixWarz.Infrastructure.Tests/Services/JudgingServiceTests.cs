using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.InMemory;
using Microsoft.Extensions.Logging;
using Moq;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Judging.DTOs;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Infrastructure.Persistence;
using MixWarz.Infrastructure.Services;

namespace MixWarz.Infrastructure.Tests.Services
{
    public class JudgingServiceTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly Mock<ILogger<JudgingService>> _mockLogger;
        private readonly JudgingService _service;

        public JudgingServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            _context = new AppDbContext(options);
            _mockLogger = new Mock<ILogger<JudgingService>>();
            _service = new JudgingService(_context, _mockLogger.Object);

            SeedTestData();
        }

        private void SeedTestData()
        {
            // Create test users
            var judge = new User
            {
                Id = "judge-user-id",
                UserName = "judge@test.com",
                Email = "judge@test.com",
                FirstName = "Judge",
                LastName = "User"
            };

            var submitter = new User
            {
                Id = "submitter-user-id",
                UserName = "submitter@test.com",
                Email = "submitter@test.com",
                FirstName = "Submitter",
                LastName = "User"
            };

            _context.Users.AddRange(judge, submitter);

            // Create test competition
            var competition = new Competition
            {
                CompetitionId = 1,
                Title = "Test Competition",
                Description = "Test Description",
                RulesText = "Test Rules",
                PrizeDetails = "Test Prize Details",
                Status = CompetitionStatus.InJudging,
                StartDate = DateTime.UtcNow.AddDays(-10),
                EndDate = DateTime.UtcNow.AddDays(-1),
                OrganizerUserId = "organizer-user-id"
            };

            _context.Competitions.Add(competition);

            // Create test submission
            var submission = new Submission
            {
                SubmissionId = 1,
                CompetitionId = 1,
                UserId = submitter.Id,
                MixTitle = "Test Mix",
                MixDescription = "Test Mix Description",
                AudioFilePath = "/path/to/audio.mp3",
                Status = SubmissionStatus.AwaitingJudging,
                SubmissionDate = DateTime.UtcNow.AddDays(-2),
                Competition = competition,
                User = submitter
            };

            _context.Submissions.Add(submission);

            // Create test judgement assignment (simulating what SubmissionAssignmentService would create)
            var assignment = new Judgement
            {
                JudgementId = 1,
                SubmissionId = 1,
                JudgeId = judge.Id,
                Score = 0, // Will be updated when judgement is submitted
                Comments = "Placeholder", // Will be updated when judgement is submitted
                SubmittedAt = DateTime.UtcNow.AddYears(-1), // Old date to indicate not yet submitted
                Submission = submission,
                Judge = judge
            };

            _context.Judgements.Add(assignment);
            _context.SaveChanges();
        }

        [Fact]
        public async Task SubmitJudgement_ValidRequest_CreatesJudgement()
        {
            // Arrange
            var dto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeId = "judge-user-id",
                Score = 8,
                Comments = "Great mix! Really good use of reverb."
            };

            // Act
            var result = await _service.SubmitJudgement(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.SubmissionId);
            Assert.Equal("judge-user-id", result.JudgeId);
            Assert.Equal(8, result.Score);
            Assert.Equal("Great mix! Really good use of reverb.", result.Comments);
            Assert.True((DateTime.UtcNow - result.SubmittedAt).TotalSeconds < 5);

            // Verify it was saved to database
            var savedJudgement = await _context.Judgements.FirstOrDefaultAsync(j => j.JudgementId == result.JudgementId);
            Assert.NotNull(savedJudgement);
            Assert.Equal(8, savedJudgement.Score);
            Assert.Equal("Great mix! Really good use of reverb.", savedJudgement.Comments);
        }

        [Fact]
        public async Task SubmitJudgement_NonExistentSubmission_ThrowsArgumentException()
        {
            // Arrange
            var dto = new SubmitJudgementDto
            {
                SubmissionId = 999, // Non-existent
                JudgeId = "judge-user-id",
                Score = 8,
                Comments = "Great mix!"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.SubmitJudgement(dto));
            Assert.Contains("Submission with ID 999 not found", exception.Message);
        }

        [Fact]
        public async Task SubmitJudgement_NonExistentJudge_ThrowsArgumentException()
        {
            // Arrange
            var dto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeId = "non-existent-judge", // Non-existent
                Score = 8,
                Comments = "Great mix!"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.SubmitJudgement(dto));
            Assert.Contains("Judge with ID non-existent-judge not found", exception.Message);
        }

        [Fact]
        public async Task SubmitJudgement_JudgeNotAssignedToSubmission_ThrowsInvalidOperationException()
        {
            // Arrange
            // Create another judge who is not assigned to this submission
            var unassignedJudge = new User
            {
                Id = "unassigned-judge-id",
                UserName = "unassigned@test.com",
                Email = "unassigned@test.com",
                FirstName = "Unassigned",
                LastName = "Judge"
            };
            _context.Users.Add(unassignedJudge);
            _context.SaveChanges();

            var dto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeId = "unassigned-judge-id", // Not assigned to this submission
                Score = 8,
                Comments = "Great mix!"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.SubmitJudgement(dto));
            Assert.Contains("Judge unassigned-judge-id is not assigned to judge submission", exception.Message);
        }

        [Fact]
        public async Task SubmitJudgement_ScoreOutOfRange_ThrowsArgumentException()
        {
            // Arrange
            var dto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeId = "judge-user-id",
                Score = 11, // Out of range (1-10)
                Comments = "Great mix!"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.SubmitJudgement(dto));
            Assert.Contains("Score must be between 1 and 10", exception.Message);
        }

        [Fact]
        public async Task RateFeedback_ValidRequest_CreatesCommentsRating()
        {
            // Arrange
            // First submit a judgement
            var judgementDto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeId = "judge-user-id",
                Score = 8,
                Comments = "Great mix! Really good use of reverb."
            };
            var judgement = await _service.SubmitJudgement(judgementDto);

            var ratingDto = new RateFeedbackDto
            {
                JudgementId = judgement.JudgementId,
                ParticipantId = "submitter-user-id", // The submission owner rating the feedback
                Rating = 1
            };

            // Act
            var result = await _service.RateFeedback(ratingDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(judgement.JudgementId, result.JudgementId);
            Assert.Equal("submitter-user-id", result.ParticipantId);
            Assert.Equal(1, result.Rating);
            Assert.True((DateTime.UtcNow - result.RatedAt).TotalSeconds < 5);

            // Verify it was saved to database
            var savedRating = await _context.FeedbackRatings.FirstOrDefaultAsync(r => r.FeedbackRatingId == result.FeedbackRatingId);
            Assert.NotNull(savedRating);
            Assert.Equal(1, savedRating.Rating);
        }

        [Fact]
        public async Task RateFeedback_NonExistentJudgement_ThrowsArgumentException()
        {
            // Arrange
            var dto = new RateFeedbackDto
            {
                JudgementId = 999, // Non-existent
                ParticipantId = "submitter-user-id",
                Rating = 1
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.RateFeedback(dto));
            Assert.Contains("Judgement with ID 999 not found", exception.Message);
        }

        [Fact]
        public async Task RateFeedback_NonExistentRater_ThrowsArgumentException()
        {
            // Arrange
            // First submit a judgement
            var judgementDto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeId = "judge-user-id",
                Score = 8,
                Comments = "Great mix!"
            };
            var judgement = await _service.SubmitJudgement(judgementDto);

            var ratingDto = new RateFeedbackDto
            {
                JudgementId = judgement.JudgementId,
                ParticipantId = "non-existent-rater", // Non-existent
                Rating = 1
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.RateFeedback(ratingDto));
            Assert.Contains("Rater with ID non-existent-rater not found", exception.Message);
        }

        [Fact]
        public async Task RateFeedback_AlreadyRated_ThrowsInvalidOperationException()
        {
            // Arrange
            // First submit a judgement
            var judgementDto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeId = "judge-user-id",
                Score = 8,
                Comments = "Great mix!"
            };
            var judgement = await _service.SubmitJudgement(judgementDto);

            var ratingDto = new RateFeedbackDto
            {
                JudgementId = judgement.JudgementId,
                ParticipantId = "submitter-user-id",
                Rating = 1
            };

            // Rate it once
            await _service.RateFeedback(ratingDto);

            // Act & Assert - Try to rate it again
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.RateFeedback(ratingDto));
            Assert.Contains("User submitter-user-id has already rated judgement", exception.Message);
        }

        [Fact]
        public async Task SubmitJudgement_UpdatesExistingAssignment_InsteadOfCreatingNew()
        {
            // Arrange
            var initialJudgementCount = await _context.Judgements.CountAsync();

            var dto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeId = "judge-user-id",
                Score = 8,
                Comments = "Great mix! Really good use of reverb."
            };

            // Act
            var result = await _service.SubmitJudgement(dto);

            // Assert
            var finalJudgementCount = await _context.Judgements.CountAsync();
            Assert.Equal(initialJudgementCount, finalJudgementCount); // No new record created

            // Verify the existing assignment was updated
            var updatedJudgement = await _context.Judgements.FirstOrDefaultAsync(j => j.JudgementId == 1);
            Assert.NotNull(updatedJudgement);
            Assert.Equal(8, updatedJudgement.Score);
            Assert.Equal("Great mix! Really good use of reverb.", updatedJudgement.Comments);
        }

        [Fact]
        public async Task RateFeedback_BothHelpfulAndNotHelpful_AllowsBothTypes()
        {
            // Arrange
            // Create another submission and judgement for testing
            var anotherSubmission = new Submission
            {
                SubmissionId = 2,
                CompetitionId = 1,
                UserId = "submitter-user-id",
                MixTitle = "Another Test Mix",
                MixDescription = "Another Test Mix Description",
                AudioFilePath = "/path/to/audio2.mp3",
                Status = SubmissionStatus.AwaitingJudging,
                SubmissionDate = DateTime.UtcNow.AddDays(-2)
            };
            _context.Submissions.Add(anotherSubmission);

            var anotherAssignment = new Judgement
            {
                JudgementId = 2,
                SubmissionId = 2,
                JudgeId = "judge-user-id",
                Score = 5,
                Comments = "Not so great.",
                SubmittedAt = DateTime.UtcNow
            };
            _context.Judgements.Add(anotherAssignment);
            _context.SaveChanges();

            // First submit the judgement for ID 1 so it can be rated
            await _service.SubmitJudgement(new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeId = "judge-user-id",
                Score = 8,
                Comments = "Great work!"
            });

            // Act - Rate one as helpful and another as not helpful
            var helpfulRating = await _service.RateFeedback(new RateFeedbackDto
            {
                JudgementId = 1,
                ParticipantId = "submitter-user-id",
                Rating = 1
            });

            var notHelpfulRating = await _service.RateFeedback(new RateFeedbackDto
            {
                JudgementId = 2,
                ParticipantId = "submitter-user-id",
                Rating = 0
            });

            // Assert
            Assert.Equal(1, helpfulRating.Rating);
            Assert.Equal(0, notHelpfulRating.Rating);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
