using Microsoft.EntityFrameworkCore;
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
                Id = 1,
                Title = "Test Competition",
                Description = "Test Description",
                Rules = "Test Rules",
                Status = CompetitionStatus.InJudging,
                SubmissionStartDate = DateTime.UtcNow.AddDays(-10),
                SubmissionEndDate = DateTime.UtcNow.AddDays(-1),
                OrganizerUserId = "organizer-user-id"
            };

            _context.Competitions.Add(competition);

            // Create test submission
            var submission = new Submission
            {
                Id = 1,
                CompetitionId = 1,
                UserId = submitter.Id,
                MixTitle = "Test Mix",
                MixDescription = "Test Mix Description",
                Status = SubmissionStatus.Submitted,
                SubmittedAt = DateTime.UtcNow.AddDays(-2),
                Competition = competition,
                User = submitter
            };

            _context.Submissions.Add(submission);

            // Create test judgement assignment (simulating what SubmissionAssignmentService would create)
            var assignment = new Judgement
            {
                Id = 1,
                SubmissionId = 1,
                JudgeUserId = judge.Id,
                CompetitionId = 1,
                Score = 0, // Not yet scored
                Feedback = null, // Not yet provided
                SubmittedAt = null, // Not yet submitted
                Submission = submission,
                Judge = judge,
                Competition = competition
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
                JudgeUserId = "judge-user-id",
                Score = 8,
                Feedback = "Great mix! Really good use of reverb."
            };

            // Act
            var result = await _service.SubmitJudgement(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.SubmissionId);
            Assert.Equal("judge-user-id", result.JudgeUserId);
            Assert.Equal(8, result.Score);
            Assert.Equal("Great mix! Really good use of reverb.", result.Feedback);
            Assert.NotNull(result.SubmittedAt);
            Assert.True((DateTime.UtcNow - result.SubmittedAt.Value).TotalSeconds < 5);

            // Verify it was saved to database
            var savedJudgement = await _context.Judgements.FirstOrDefaultAsync(j => j.Id == result.Id);
            Assert.NotNull(savedJudgement);
            Assert.Equal(8, savedJudgement.Score);
            Assert.Equal("Great mix! Really good use of reverb.", savedJudgement.Feedback);
        }

        [Fact]
        public async Task SubmitJudgement_NonExistentSubmission_ThrowsArgumentException()
        {
            // Arrange
            var dto = new SubmitJudgementDto
            {
                SubmissionId = 999, // Non-existent
                JudgeUserId = "judge-user-id",
                Score = 8,
                Feedback = "Great mix!"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.SubmitJudgement(dto));
            Assert.Contains("Submission not found", exception.Message);
        }

        [Fact]
        public async Task SubmitJudgement_NonExistentJudge_ThrowsArgumentException()
        {
            // Arrange
            var dto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeUserId = "non-existent-judge", // Non-existent
                Score = 8,
                Feedback = "Great mix!"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.SubmitJudgement(dto));
            Assert.Contains("Judge not found", exception.Message);
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
                JudgeUserId = "unassigned-judge-id", // Not assigned to this submission
                Score = 8,
                Feedback = "Great mix!"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.SubmitJudgement(dto));
            Assert.Contains("Judge is not assigned to this submission", exception.Message);
        }

        [Fact]
        public async Task SubmitJudgement_ScoreOutOfRange_ThrowsArgumentException()
        {
            // Arrange
            var dto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeUserId = "judge-user-id",
                Score = 11, // Out of range (1-10)
                Feedback = "Great mix!"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.SubmitJudgement(dto));
            Assert.Contains("Score must be between 1 and 10", exception.Message);
        }

        [Fact]
        public async Task RateFeedback_ValidRequest_CreatesFeedbackRating()
        {
            // Arrange
            // First submit a judgement
            var judgementDto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeUserId = "judge-user-id",
                Score = 8,
                Feedback = "Great mix! Really good use of reverb."
            };
            var judgement = await _service.SubmitJudgement(judgementDto);

            var ratingDto = new RateFeedbackDto
            {
                JudgementId = judgement.Id,
                RaterUserId = "submitter-user-id", // The submission owner rating the feedback
                IsHelpful = true
            };

            // Act
            var result = await _service.RateFeedback(ratingDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(judgement.Id, result.JudgementId);
            Assert.Equal("submitter-user-id", result.RaterUserId);
            Assert.True(result.IsHelpful);
            Assert.NotNull(result.RatedAt);
            Assert.True((DateTime.UtcNow - result.RatedAt).TotalSeconds < 5);

            // Verify it was saved to database
            var savedRating = await _context.FeedbackRatings.FirstOrDefaultAsync(r => r.Id == result.Id);
            Assert.NotNull(savedRating);
            Assert.True(savedRating.IsHelpful);
        }

        [Fact]
        public async Task RateFeedback_NonExistentJudgement_ThrowsArgumentException()
        {
            // Arrange
            var dto = new RateFeedbackDto
            {
                JudgementId = 999, // Non-existent
                RaterUserId = "submitter-user-id",
                IsHelpful = true
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.RateFeedback(dto));
            Assert.Contains("Judgement not found", exception.Message);
        }

        [Fact]
        public async Task RateFeedback_NonExistentRater_ThrowsArgumentException()
        {
            // Arrange
            // First submit a judgement
            var judgementDto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeUserId = "judge-user-id",
                Score = 8,
                Feedback = "Great mix!"
            };
            var judgement = await _service.SubmitJudgement(judgementDto);

            var ratingDto = new RateFeedbackDto
            {
                JudgementId = judgement.Id,
                RaterUserId = "non-existent-rater", // Non-existent
                IsHelpful = true
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.RateFeedback(ratingDto));
            Assert.Contains("Rater not found", exception.Message);
        }

        [Fact]
        public async Task RateFeedback_AlreadyRated_ThrowsInvalidOperationException()
        {
            // Arrange
            // First submit a judgement
            var judgementDto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeUserId = "judge-user-id",
                Score = 8,
                Feedback = "Great mix!"
            };
            var judgement = await _service.SubmitJudgement(judgementDto);

            var ratingDto = new RateFeedbackDto
            {
                JudgementId = judgement.Id,
                RaterUserId = "submitter-user-id",
                IsHelpful = true
            };

            // Rate it once
            await _service.RateFeedback(ratingDto);

            // Act & Assert - Try to rate it again
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.RateFeedback(ratingDto));
            Assert.Contains("This judgement has already been rated", exception.Message);
        }

        [Fact]
        public async Task SubmitJudgement_UpdatesExistingAssignment_InsteadOfCreatingNew()
        {
            // Arrange
            var initialJudgementCount = await _context.Judgements.CountAsync();

            var dto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeUserId = "judge-user-id",
                Score = 8,
                Feedback = "Great mix! Really good use of reverb."
            };

            // Act
            var result = await _service.SubmitJudgement(dto);

            // Assert
            var finalJudgementCount = await _context.Judgements.CountAsync();
            Assert.Equal(initialJudgementCount, finalJudgementCount); // No new record created

            // Verify the existing assignment was updated
            var updatedJudgement = await _context.Judgements.FirstOrDefaultAsync(j => j.Id == 1);
            Assert.NotNull(updatedJudgement);
            Assert.Equal(8, updatedJudgement.Score);
            Assert.Equal("Great mix! Really good use of reverb.", updatedJudgement.Feedback);
            Assert.NotNull(updatedJudgement.SubmittedAt);
        }

        [Fact]
        public async Task RateFeedback_BothHelpfulAndNotHelpful_AllowsBothTypes()
        {
            // Arrange
            // Create another judgement for testing
            var anotherSubmission = new Submission
            {
                Id = 2,
                CompetitionId = 1,
                UserId = "submitter-user-id",
                MixTitle = "Another Test Mix",
                MixDescription = "Another Test Mix Description",
                Status = SubmissionStatus.Submitted,
                SubmittedAt = DateTime.UtcNow.AddDays(-2)
            };
            _context.Submissions.Add(anotherSubmission);

            var anotherAssignment = new Judgement
            {
                Id = 2,
                SubmissionId = 2,
                JudgeUserId = "judge-user-id",
                CompetitionId = 1,
                Score = 5,
                Feedback = "Not so great.",
                SubmittedAt = DateTime.UtcNow
            };
            _context.Judgements.Add(anotherAssignment);
            _context.SaveChanges();

            // Act - Rate one as helpful and another as not helpful
            var helpfulRating = await _service.RateFeedback(new RateFeedbackDto
            {
                JudgementId = 1,
                RaterUserId = "submitter-user-id",
                IsHelpful = true
            });

            var notHelpfulRating = await _service.RateFeedback(new RateFeedbackDto
            {
                JudgementId = 2,
                RaterUserId = "submitter-user-id",
                IsHelpful = false
            });

            // Assert
            Assert.True(helpfulRating.IsHelpful);
            Assert.False(notHelpfulRating.IsHelpful);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
