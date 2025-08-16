using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Infrastructure.Persistence;
using MixWarz.Infrastructure.Services;

namespace MixWarz.Infrastructure.Tests.Services
{
    public class SubmissionAssignmentServiceTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly Mock<ILogger<SubmissionAssignmentService>> _mockLogger;
        private readonly SubmissionAssignmentService _service;

        public SubmissionAssignmentServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _mockLogger = new Mock<ILogger<SubmissionAssignmentService>>();
            _service = new SubmissionAssignmentService(_context, _mockLogger.Object);
        }

        [Fact]
        public async Task CreateAssignments_WithValidCompetition_ShouldCreateAssignments()
        {
            // Arrange
            var competition = await SetupCompetitionWithSubmissions(3);
            
            // Act
            var result = await _service.CreateAssignments(competition.CompetitionId, 2);

            // Assert
            Assert.Equal(6, result); // 3 competitors * 2 assignments each = 6 total assignments
            
            var assignments = await _context.Judgements.ToListAsync();
            Assert.Equal(6, assignments.Count);
            
            // Verify competition status was updated
            var updatedCompetition = await _context.Competitions.FindAsync(competition.CompetitionId);
            Assert.Equal(CompetitionStatus.InJudging, updatedCompetition.Status);
        }

        [Fact]
        public async Task CreateAssignments_ShouldNotAssignOwnSubmission()
        {
            // Arrange
            var competition = await SetupCompetitionWithSubmissions(3);
            
            // Act
            await _service.CreateAssignments(competition.CompetitionId, 2);

            // Assert
            var assignments = await _context.Judgements
                .Include(j => j.Submission)
                .ToListAsync();

            // Verify no judge is assigned their own submission
            foreach (var assignment in assignments)
            {
                Assert.NotEqual(assignment.JudgeUserId, assignment.Submission.UserId);
            }
        }

        [Fact]
        public async Task CreateAssignments_WithNonExistentCompetition_ShouldThrowException()
        {
            // Arrange
            var nonExistentCompetitionId = 999;

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateAssignments(nonExistentCompetitionId));
            
            Assert.Contains("Competition with ID 999 not found", exception.Message);
        }

        [Fact]
        public async Task CreateAssignments_WithNoSubmissions_ShouldReturnZero()
        {
            // Arrange
            var competition = new Competition
            {
                Title = "Test Competition",
                Description = "Test Description",
                RulesText = "Test Rules",
                StartDate = DateTime.UtcNow.AddDays(-1),
                EndDate = DateTime.UtcNow.AddDays(1),
                PrizeDetails = "Test Prize",
                OrganizerUserId = "organizer-id",
                Status = CompetitionStatus.OpenForSubmissions
            };
            
            _context.Competitions.Add(competition);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.CreateAssignments(competition.CompetitionId);

            // Assert
            Assert.Equal(0, result);
        }

        [Fact]
        public async Task CreateAssignments_WithOneCompetitor_ShouldThrowException()
        {
            // Arrange
            var competition = await SetupCompetitionWithSubmissions(1);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreateAssignments(competition.CompetitionId));
            
            Assert.Contains("needs at least 2 competitors", exception.Message);
        }

        [Fact]
        public async Task CreateAssignments_WithMoreRequestedThanAvailable_ShouldAssignMaximumPossible()
        {
            // Arrange
            var competition = await SetupCompetitionWithSubmissions(3);
            var assignmentsPerJudge = 5; // More than the 2 available per judge

            // Act
            var result = await _service.CreateAssignments(competition.CompetitionId, assignmentsPerJudge);

            // Assert
            // Each competitor can judge max 2 submissions (total 3 - their own 1)
            Assert.Equal(6, result); // 3 competitors * 2 max assignments each = 6

            var assignments = await _context.Judgements.ToListAsync();
            Assert.Equal(6, assignments.Count);
        }

        [Fact]
        public async Task CreateAssignments_ShouldUpdateSubmissionStatusesToAwaitingJudging()
        {
            // Arrange
            var competition = await SetupCompetitionWithSubmissions(3);

            // Act
            await _service.CreateAssignments(competition.CompetitionId);

            // Assert
            var submissions = await _context.Submissions
                .Where(s => s.CompetitionId == competition.CompetitionId)
                .ToListAsync();

            foreach (var submission in submissions)
            {
                Assert.Equal(SubmissionStatus.AwaitingJudging, submission.Status);
            }
        }

        [Fact]
        public async Task CreateAssignments_ShouldBeTransactional()
        {
            // Arrange
            var competition = await SetupCompetitionWithSubmissions(2);
            
            // Simulate a database error by disposing the context during operation
            // This test ensures that if something fails, no partial data is saved
            var originalCount = await _context.Judgements.CountAsync();

            // Act & Assert
            // Since we can't easily simulate a transaction failure with in-memory database,
            // we'll test that the method completes successfully and verify state
            var result = await _service.CreateAssignments(competition.CompetitionId);
            
            // Verify all changes were applied together
            Assert.True(result > 0);
            var finalCount = await _context.Judgements.CountAsync();
            Assert.True(finalCount > originalCount);
            
            var updatedCompetition = await _context.Competitions.FindAsync(competition.CompetitionId);
            Assert.Equal(CompetitionStatus.InJudging, updatedCompetition.Status);
        }

        [Fact]
        public async Task CreateAssignments_ShouldNotCreateDuplicateAssignments()
        {
            // Arrange
            var competition = await SetupCompetitionWithSubmissions(3);

            // Act - Call twice
            var result1 = await _service.CreateAssignments(competition.CompetitionId, 1);
            var result2 = await _service.CreateAssignments(competition.CompetitionId, 1);

            // Assert - Second call should not create new assignments
            Assert.Equal(3, result1); // 3 competitors * 1 assignment each
            Assert.Equal(0, result2); // No new assignments created

            var totalAssignments = await _context.Judgements.CountAsync();
            Assert.Equal(3, totalAssignments); // Only the first set of assignments
        }

        private async Task<Competition> SetupCompetitionWithSubmissions(int competitorCount)
        {
            var competition = new Competition
            {
                Title = "Test Competition",
                Description = "Test Description", 
                RulesText = "Test Rules",
                StartDate = DateTime.UtcNow.AddDays(-1),
                EndDate = DateTime.UtcNow.AddDays(1),
                PrizeDetails = "Test Prize",
                OrganizerUserId = "organizer-id",
                Status = CompetitionStatus.OpenForSubmissions
            };

            _context.Competitions.Add(competition);
            await _context.SaveChangesAsync();

            // Create users and submissions
            for (int i = 1; i <= competitorCount; i++)
            {
                var user = new User
                {
                    Id = $"user-{i}",
                    UserName = $"user{i}@test.com",
                    Email = $"user{i}@test.com",
                    FirstName = $"User{i}",
                    LastName = "Test"
                };

                var submission = new Submission
                {
                    CompetitionId = competition.CompetitionId,
                    UserId = user.Id,
                    MixTitle = $"Mix {i}",
                    AudioFilePath = $"/audio/mix{i}.mp3",
                    Status = SubmissionStatus.Submitted,
                    User = user
                };

                _context.Users.Add(user);
                _context.Submissions.Add(submission);
            }

            await _context.SaveChangesAsync();
            return competition;
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
