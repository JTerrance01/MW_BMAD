using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using Moq;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Infrastructure.Persistence;
using MixWarz.Infrastructure.Services;

namespace MixWarz.Infrastructure.Tests.Services
{
    public class JudgingProwessCalculatorTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly Mock<ILogger<JudgingProwessCalculator>> _mockLogger;
        private readonly JudgingProwessCalculator _calculator;

        public JudgingProwessCalculatorTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            _context = new AppDbContext(options);
            _mockLogger = new Mock<ILogger<JudgingProwessCalculator>>();
            _calculator = new JudgingProwessCalculator(_context, _mockLogger.Object);

            SeedTestData();
        }

        private void SeedTestData()
        {
            // Create test users
            var perfectJudge = new User
            {
                Id = "perfect-judge-id",
                UserName = "perfect@test.com",
                Email = "perfect@test.com",
                FirstName = "Perfect",
                LastName = "Judge"
            };

            var inaccurateJudge = new User
            {
                Id = "inaccurate-judge-id",
                UserName = "inaccurate@test.com",
                Email = "inaccurate@test.com",
                FirstName = "Inaccurate",
                LastName = "Judge"
            };

            var helpfulJudge = new User
            {
                Id = "helpful-judge-id",
                UserName = "helpful@test.com",
                Email = "helpful@test.com",
                FirstName = "Helpful",
                LastName = "Judge"
            };

            var submitter1 = new User
            {
                Id = "submitter1-id",
                UserName = "submitter1@test.com",
                Email = "submitter1@test.com",
                FirstName = "Submitter",
                LastName = "One"
            };

            var submitter2 = new User
            {
                Id = "submitter2-id",
                UserName = "submitter2@test.com",
                Email = "submitter2@test.com",
                FirstName = "Submitter",
                LastName = "Two"
            };

            _context.Users.AddRange(perfectJudge, inaccurateJudge, helpfulJudge, submitter1, submitter2);

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

            // Create test submissions
            var submission1 = new Submission
            {
                SubmissionId = 1,
                CompetitionId = 1,
                UserId = submitter1.Id,
                MixTitle = "Test Mix 1",
                MixDescription = "Test Mix Description 1",
                AudioFilePath = "/path/to/audio1.mp3",
                Status = SubmissionStatus.AwaitingJudging,
                SubmissionDate = DateTime.UtcNow.AddDays(-2)
            };

            var submission2 = new Submission
            {
                SubmissionId = 2,
                CompetitionId = 1,
                UserId = submitter2.Id,
                MixTitle = "Test Mix 2",
                MixDescription = "Test Mix Description 2",
                AudioFilePath = "/path/to/audio2.mp3",
                Status = SubmissionStatus.AwaitingJudging,
                SubmissionDate = DateTime.UtcNow.AddDays(-2)
            };

            var submission3 = new Submission
            {
                SubmissionId = 3,
                CompetitionId = 1,
                UserId = submitter1.Id,
                MixTitle = "Test Mix 3",
                MixDescription = "Test Mix Description 3",
                AudioFilePath = "/path/to/audio3.mp3",
                Status = SubmissionStatus.AwaitingJudging,
                SubmissionDate = DateTime.UtcNow.AddDays(-2)
            };

            _context.Submissions.AddRange(submission1, submission2, submission3);
            _context.SaveChanges();
        }

        [Fact]
        public async Task CalculateJudgeProwessScore_PerfectAccuracy_ReturnsHighScore()
        {
            // Arrange
            // Create judgements where the perfect judge's scores exactly match the final averages
            var judgements = new List<Judgement>
            {
                // Perfect judge's scores: 8, 7, 9
                new Judgement { JudgementId = 1, SubmissionId = 1, JudgeId = "perfect-judge-id", Score = 8, Comments = "Great work!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 2, SubmissionId = 2, JudgeId = "perfect-judge-id", Score = 7, Comments = "Good job!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 3, SubmissionId = 3, JudgeId = "perfect-judge-id", Score = 9, Comments = "Excellent!", SubmittedAt = DateTime.UtcNow },

                // Other judges' scores to create the same averages
                new Judgement { JudgementId = 4, SubmissionId = 1, JudgeId = "inaccurate-judge-id", Score = 8, Comments = "Okay", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 5, SubmissionId = 2, JudgeId = "inaccurate-judge-id", Score = 7, Comments = "Okay", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 6, SubmissionId = 3, JudgeId = "inaccurate-judge-id", Score = 9, Comments = "Okay", SubmittedAt = DateTime.UtcNow }
            };

            _context.Judgements.AddRange(judgements);

            // Add helpful feedback ratings for perfect judge
            var feedbackRatings = new List<FeedbackRating>
            {
                new FeedbackRating { FeedbackRatingId = 1, JudgementId = 1, ParticipantId = "submitter1-id", Rating = 1, RatedAt = DateTime.UtcNow },
                new FeedbackRating { FeedbackRatingId = 2, JudgementId = 2, ParticipantId = "submitter2-id", Rating = 1, RatedAt = DateTime.UtcNow },
                new FeedbackRating { FeedbackRatingId = 3, JudgementId = 3, ParticipantId = "submitter1-id", Rating = 1, RatedAt = DateTime.UtcNow }
            };

            _context.FeedbackRatings.AddRange(feedbackRatings);
            _context.SaveChanges();

            // Act
            var prowessScore = await _calculator.CalculateJudgeProwessScore(1, "perfect-judge-id");

            // Assert
            Assert.True(prowessScore > 85, $"Expected high prowess score for perfect accuracy, got {prowessScore}");
            Assert.True(prowessScore <= 100, $"Prowess score should not exceed 100, got {prowessScore}");
        }

        [Fact]
        public async Task CalculateJudgeProwessScore_PoorAccuracy_ReturnsLowScore()
        {
            // Arrange
            // Create judgements where the inaccurate judge's scores are far from averages
            var judgements = new List<Judgement>
            {
                // Inaccurate judge's scores: 3, 2, 4 (far from actual averages of 8, 7, 9)
                new Judgement { JudgementId = 1, SubmissionId = 1, JudgeId = "inaccurate-judge-id", Score = 3, Comments = "Bad", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 2, SubmissionId = 2, JudgeId = "inaccurate-judge-id", Score = 2, Comments = "Terrible", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 3, SubmissionId = 3, JudgeId = "inaccurate-judge-id", Score = 4, Comments = "Poor", SubmittedAt = DateTime.UtcNow },

                // Other judges create high averages (8, 7, 9)
                new Judgement { JudgementId = 4, SubmissionId = 1, JudgeId = "perfect-judge-id", Score = 8, Comments = "Great!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 5, SubmissionId = 2, JudgeId = "perfect-judge-id", Score = 7, Comments = "Good!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 6, SubmissionId = 3, JudgeId = "perfect-judge-id", Score = 9, Comments = "Excellent!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 7, SubmissionId = 1, JudgeId = "helpful-judge-id", Score = 8, Comments = "Nice!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 8, SubmissionId = 2, JudgeId = "helpful-judge-id", Score = 7, Comments = "Solid!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 9, SubmissionId = 3, JudgeId = "helpful-judge-id", Score = 9, Comments = "Amazing!", SubmittedAt = DateTime.UtcNow }
            };

            _context.Judgements.AddRange(judgements);

            // Add unhelpful feedback ratings for inaccurate judge
            var feedbackRatings = new List<FeedbackRating>
            {
                new FeedbackRating { FeedbackRatingId = 1, JudgementId = 1, ParticipantId = "submitter1-id", Rating = 0, RatedAt = DateTime.UtcNow },
                new FeedbackRating { FeedbackRatingId = 2, JudgementId = 2, ParticipantId = "submitter2-id", Rating = 0, RatedAt = DateTime.UtcNow },
                new FeedbackRating { FeedbackRatingId = 3, JudgementId = 3, ParticipantId = "submitter1-id", Rating = 0, RatedAt = DateTime.UtcNow }
            };

            _context.FeedbackRatings.AddRange(feedbackRatings);
            _context.SaveChanges();

            // Act
            var prowessScore = await _calculator.CalculateJudgeProwessScore(1, "inaccurate-judge-id");

            // Assert
            Assert.True(prowessScore < 40, $"Expected low prowess score for poor accuracy, got {prowessScore}");
            Assert.True(prowessScore >= 0, $"Prowess score should not be negative, got {prowessScore}");
        }

        [Fact]
        public async Task CalculateJudgeProwessScore_MixedHelpfulness_ReturnsModerateScore()
        {
            // Arrange
            // Create judgements with moderate accuracy but mixed helpfulness
            var judgements = new List<Judgement>
            {
                // Helpful judge with moderate accuracy
                new Judgement { JudgementId = 1, SubmissionId = 1, JudgeId = "helpful-judge-id", Score = 7, Comments = "Detailed feedback", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 2, SubmissionId = 2, JudgeId = "helpful-judge-id", Score = 6, Comments = "Constructive criticism", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 3, SubmissionId = 3, JudgeId = "helpful-judge-id", Score = 8, Comments = "Useful suggestions", SubmittedAt = DateTime.UtcNow },

                // Create averages of 8, 7, 9
                new Judgement { JudgementId = 4, SubmissionId = 1, JudgeId = "perfect-judge-id", Score = 8, Comments = "Great!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 5, SubmissionId = 2, JudgeId = "perfect-judge-id", Score = 7, Comments = "Good!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 6, SubmissionId = 3, JudgeId = "perfect-judge-id", Score = 9, Comments = "Excellent!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 7, SubmissionId = 1, JudgeId = "inaccurate-judge-id", Score = 9, Comments = "Okay", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 8, SubmissionId = 2, JudgeId = "inaccurate-judge-id", Score = 8, Comments = "Okay", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 9, SubmissionId = 3, JudgeId = "inaccurate-judge-id", Score = 9, Comments = "Okay", SubmittedAt = DateTime.UtcNow }
            };

            _context.Judgements.AddRange(judgements);

            // Mixed feedback ratings (2 helpful, 1 not helpful)
            var feedbackRatings = new List<FeedbackRating>
            {
                new FeedbackRating { FeedbackRatingId = 1, JudgementId = 1, ParticipantId = "submitter1-id", Rating = 1, RatedAt = DateTime.UtcNow },
                new FeedbackRating { FeedbackRatingId = 2, JudgementId = 2, ParticipantId = "submitter2-id", Rating = 1, RatedAt = DateTime.UtcNow },
                new FeedbackRating { FeedbackRatingId = 3, JudgementId = 3, ParticipantId = "submitter1-id", Rating = 0, RatedAt = DateTime.UtcNow }
            };

            _context.FeedbackRatings.AddRange(feedbackRatings);
            _context.SaveChanges();

            // Act
            var prowessScore = await _calculator.CalculateJudgeProwessScore(1, "helpful-judge-id");

            // Assert
            Assert.True(prowessScore >= 40 && prowessScore <= 80,
                $"Expected moderate prowess score for mixed performance, got {prowessScore}");
        }

        [Fact]
        public async Task CalculateJudgeProwessScore_InsufficientJudgements_ReturnsNeutralScore()
        {
            // Arrange
            // Create only 2 judgements (below minimum of 3)
            var judgements = new List<Judgement>
            {
                new Judgement { JudgementId = 1, SubmissionId = 1, JudgeId = "perfect-judge-id", Score = 8, Comments = "Good work!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 2, SubmissionId = 2, JudgeId = "perfect-judge-id", Score = 7, Comments = "Nice job!", SubmittedAt = DateTime.UtcNow }
            };

            _context.Judgements.AddRange(judgements);
            _context.SaveChanges();

            // Act
            var prowessScore = await _calculator.CalculateJudgeProwessScore(1, "perfect-judge-id");

            // Assert
            Assert.Equal(50.0m, prowessScore); // Should return neutral score for insufficient data
        }

        [Fact]
        public async Task CalculateJudgeProwessScore_NoFeedbackRatings_UsesNeutralHelpfulnessScore()
        {
            // Arrange
            // Create judgements with perfect accuracy but no feedback ratings
            var judgements = new List<Judgement>
            {
                new Judgement { JudgementId = 1, SubmissionId = 1, JudgeId = "perfect-judge-id", Score = 8, Comments = "Great work!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 2, SubmissionId = 2, JudgeId = "perfect-judge-id", Score = 7, Comments = "Good job!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 3, SubmissionId = 3, JudgeId = "perfect-judge-id", Score = 9, Comments = "Excellent!", SubmittedAt = DateTime.UtcNow },

                // Other judge to create same averages
                new Judgement { JudgementId = 4, SubmissionId = 1, JudgeId = "inaccurate-judge-id", Score = 8, Comments = "Okay", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 5, SubmissionId = 2, JudgeId = "inaccurate-judge-id", Score = 7, Comments = "Okay", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 6, SubmissionId = 3, JudgeId = "inaccurate-judge-id", Score = 9, Comments = "Okay", SubmittedAt = DateTime.UtcNow }
            };

            _context.Judgements.AddRange(judgements);
            _context.SaveChanges();

            // Act
            var prowessScore = await _calculator.CalculateJudgeProwessScore(1, "perfect-judge-id");

            // Assert
            // Should be high due to perfect accuracy (70% weight) but neutral helpfulness (30% weight)
            // Expected: (100 * 0.7) + (50 * 0.3) = 70 + 15 = 85
            Assert.True(prowessScore >= 80, $"Expected high score due to perfect accuracy despite no feedback ratings, got {prowessScore}");
        }

        [Fact]
        public async Task GetProwessCalculationDetails_ReturnsCompleteBreakdown()
        {
            // Arrange
            var judgements = new List<Judgement>
            {
                new Judgement { JudgementId = 1, SubmissionId = 1, JudgeId = "perfect-judge-id", Score = 8, Comments = "Great work!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 2, SubmissionId = 2, JudgeId = "perfect-judge-id", Score = 7, Comments = "Good job!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 3, SubmissionId = 3, JudgeId = "perfect-judge-id", Score = 9, Comments = "Excellent!", SubmittedAt = DateTime.UtcNow }
            };

            _context.Judgements.AddRange(judgements);

            var feedbackRatings = new List<FeedbackRating>
            {
                new FeedbackRating { FeedbackRatingId = 1, JudgementId = 1, ParticipantId = "submitter1-id", Rating = 1, RatedAt = DateTime.UtcNow },
                new FeedbackRating { FeedbackRatingId = 2, JudgementId = 2, ParticipantId = "submitter2-id", Rating = 0, RatedAt = DateTime.UtcNow }
            };

            _context.FeedbackRatings.AddRange(feedbackRatings);
            _context.SaveChanges();

            // Act
            var details = await _calculator.GetProwessCalculationDetails(1, "perfect-judge-id");

            // Assert
            Assert.Equal("perfect-judge-id", details.JudgeId);
            Assert.Equal(1, details.CompetitionId);
            Assert.Equal(3, details.TotalJudgements);
            Assert.Equal(1, details.HelpfulFeedbackCount);
            Assert.Equal(2, details.TotalFeedbackRatings);
            Assert.Equal(0.5m, details.HelpfulnessRatio);
            Assert.Equal(3, details.JudgementDetails.Count);
            Assert.True(details.FinalProwessScore > 0);
        }

        [Fact]
        public async Task CalculateAndUpdateJudgingProwess_UpdatesAllJudges()
        {
            // Arrange
            var judgements = new List<Judgement>
            {
                new Judgement { JudgementId = 1, SubmissionId = 1, JudgeId = "perfect-judge-id", Score = 8, Comments = "Great!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 2, SubmissionId = 2, JudgeId = "perfect-judge-id", Score = 7, Comments = "Good!", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 3, SubmissionId = 3, JudgeId = "perfect-judge-id", Score = 9, Comments = "Excellent!", SubmittedAt = DateTime.UtcNow },

                new Judgement { JudgementId = 4, SubmissionId = 1, JudgeId = "inaccurate-judge-id", Score = 5, Comments = "Meh", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 5, SubmissionId = 2, JudgeId = "inaccurate-judge-id", Score = 4, Comments = "Poor", SubmittedAt = DateTime.UtcNow },
                new Judgement { JudgementId = 6, SubmissionId = 3, JudgeId = "inaccurate-judge-id", Score = 6, Comments = "Okay", SubmittedAt = DateTime.UtcNow }
            };

            _context.Judgements.AddRange(judgements);
            _context.SaveChanges();

            // Act
            var prowessScores = await _calculator.CalculateAndUpdateJudgingProwess(1);

            // Assert
            Assert.Equal(2, prowessScores.Count);
            Assert.Contains("perfect-judge-id", prowessScores.Keys);
            Assert.Contains("inaccurate-judge-id", prowessScores.Keys);

            // Verify users were updated
            var perfectJudge = await _context.Users.FirstAsync(u => u.Id == "perfect-judge-id");
            var inaccurateJudge = await _context.Users.FirstAsync(u => u.Id == "inaccurate-judge-id");

            Assert.NotNull(perfectJudge.JudgingProwessScore);
            Assert.NotNull(inaccurateJudge.JudgingProwessScore);
            Assert.True(perfectJudge.JudgingProwessScore > inaccurateJudge.JudgingProwessScore);
        }

        [Fact]
        public async Task CalculateJudgeProwessScore_NonExistentJudge_ReturnsNeutralScore()
        {
            // Arrange
            // No judgements for this judge

            // Act
            var prowessScore = await _calculator.CalculateJudgeProwessScore(1, "non-existent-judge-id");

            // Assert
            Assert.Equal(50.0m, prowessScore); // Should return neutral score for no data
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
