using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Judging.DTOs;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Infrastructure.Jobs;
using MixWarz.Infrastructure.Persistence;
using MixWarz.Infrastructure.Services;

namespace MixWarz.Infrastructure.Tests.Controllers
{
    public class HybridTournamentsControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public HybridTournamentsControllerTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");

                // Override configuration to disable Quartz and set proper frequency
                builder.ConfigureAppConfiguration((context, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string>
                    {
                        ["EnableQuartzScheduler"] = "false",
                        ["QuartzScheduler:CompetitionTransitions:CheckFrequencyMinutes"] = "30",
                        ["QuartzScheduler:CompetitionTransitions:MonthlyCompetitions"] = "false"
                    });
                });

                builder.ConfigureServices(services =>
                {
                    // Remove existing database context configurations - both direct and through options
                    var dbContextDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (dbContextDescriptor != null)
                    {
                        services.Remove(dbContextDescriptor);
                    }

                    var dbContextOptionsDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions));
                    if (dbContextOptionsDescriptor != null)
                    {
                        services.Remove(dbContextOptionsDescriptor);
                    }

                    var appDbContextDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(AppDbContext));
                    if (appDbContextDescriptor != null)
                    {
                        services.Remove(appDbContextDescriptor);
                    }

                    // Remove any Entity Framework services that might have been registered
                    var efServices = services.Where(s => s.ServiceType.FullName?.Contains("EntityFramework") == true).ToList();
                    foreach (var service in efServices)
                    {
                        services.Remove(service);
                    }

                    // Remove all Quartz services to prevent scheduling issues in tests
                    var quartzServices = services.Where(s =>
                        s.ServiceType.FullName?.Contains("Quartz") == true ||
                        s.ServiceType == typeof(QuartzJobConfiguration) ||
                        s.ImplementationType?.FullName?.Contains("Quartz") == true
                    ).ToList();
                    foreach (var service in quartzServices)
                    {
                        services.Remove(service);
                    }

                    // Remove any hosted services that might be related to Quartz
                    var hostedServices = services.Where(s => s.ServiceType == typeof(IHostedService)).ToList();
                    foreach (var service in hostedServices)
                    {
                        if (service.ImplementationType?.FullName?.Contains("Quartz") == true)
                        {
                            services.Remove(service);
                        }
                    }

                    // Add in-memory database for testing
                    services.AddDbContext<AppDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("HybridTournamentsTestDb");
                    });

                    // Register IAppDbContext
                    services.AddScoped<IAppDbContext>(provider => provider.GetService<AppDbContext>());

                    // Register required hybrid fair-play tournament services
                    services.AddScoped<ISubmissionAssignmentService, SubmissionAssignmentService>();
                    services.AddScoped<ITournamentLifecycleService, TournamentLifecycleService>();
                    services.AddScoped<IJudgingService, JudgingService>();
                    services.AddScoped<IJudgingProwessCalculator, JudgingProwessCalculator>();

                    // Replace authentication with test authentication
                    services.AddAuthentication("Test")
                        .AddScheme<AuthenticationSchemeOptions, TestAuthenticationSchemeHandler>("Test", options => { });
                });

                // Override the web root and content root to avoid file system issues
                builder.UseContentRoot(Directory.GetCurrentDirectory());

                // Create the uploads directory for tests if it doesn't exist
                var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "AppData", "uploads");
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }
            });

            _client = _factory.CreateClient();
        }

        [Fact]
        public async Task SubmitJudgement_ValidRequest_ReturnsCreated()
        {
            // Arrange
            await SeedTestData();

            var judgementDto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeUserId = "judge-user-id", // Will be overridden by controller
                Score = 8,
                Feedback = "Great mix! Really good use of reverb."
            };

            var json = JsonSerializer.Serialize(judgementDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Add test authentication header
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test");

            // Act
            var response = await _client.PostAsync("/api/v2/submissions/1/judgements", content);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var judgement = JsonSerializer.Deserialize<JsonElement>(responseContent);

            Assert.Equal(1, judgement.GetProperty("submissionId").GetInt32());
            Assert.Equal("test-user-id", judgement.GetProperty("judgeUserId").GetString());
            Assert.Equal(8, judgement.GetProperty("score").GetInt32());
            Assert.Equal("Great mix! Really good use of reverb.", judgement.GetProperty("feedback").GetString());
        }

        [Fact]
        public async Task SubmitJudgement_SubmissionIdMismatch_ReturnsBadRequest()
        {
            // Arrange
            await SeedTestData();

            var judgementDto = new SubmitJudgementDto
            {
                SubmissionId = 2, // Different from URL
                JudgeUserId = "judge-user-id",
                Score = 8,
                Feedback = "Great mix!"
            };

            var json = JsonSerializer.Serialize(judgementDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test");

            // Act
            var response = await _client.PostAsync("/api/v2/submissions/1/judgements", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Submission ID in URL does not match the judgement data", responseContent);
        }

        [Fact]
        public async Task SubmitJudgement_InvalidScore_ReturnsBadRequest()
        {
            // Arrange
            await SeedTestData();

            var judgementDto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeUserId = "judge-user-id",
                Score = 11, // Invalid score (out of range 1-10)
                Feedback = "Great mix!"
            };

            var json = JsonSerializer.Serialize(judgementDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test");

            // Act
            var response = await _client.PostAsync("/api/v2/submissions/1/judgements", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task SubmitJudgement_Unauthorized_ReturnsUnauthorized()
        {
            // Arrange
            await SeedTestData();

            var judgementDto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeUserId = "judge-user-id",
                Score = 8,
                Feedback = "Great mix!"
            };

            var json = JsonSerializer.Serialize(judgementDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Don't add authorization header

            // Act
            var response = await _client.PostAsync("/api/v2/submissions/1/judgements", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task RateFeedback_ValidRequest_ReturnsCreated()
        {
            // Arrange
            await SeedTestData();

            // First submit a judgement
            await SubmitTestJudgement();

            var ratingDto = new RateFeedbackDto
            {
                JudgementId = 1,
                RaterUserId = "rater-user-id", // Will be overridden by controller
                IsHelpful = true
            };

            var json = JsonSerializer.Serialize(ratingDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test");

            // Act
            var response = await _client.PostAsync("/api/v2/judgements/1/rate", content);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var feedbackRating = JsonSerializer.Deserialize<JsonElement>(responseContent);

            Assert.Equal(1, feedbackRating.GetProperty("judgementId").GetInt32());
            Assert.Equal("test-user-id", feedbackRating.GetProperty("raterUserId").GetString());
            Assert.True(feedbackRating.GetProperty("isHelpful").GetBoolean());
        }

        [Fact]
        public async Task RateFeedback_JudgementIdMismatch_ReturnsBadRequest()
        {
            // Arrange
            await SeedTestData();
            await SubmitTestJudgement();

            var ratingDto = new RateFeedbackDto
            {
                JudgementId = 2, // Different from URL
                RaterUserId = "rater-user-id",
                IsHelpful = true
            };

            var json = JsonSerializer.Serialize(ratingDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test");

            // Act
            var response = await _client.PostAsync("/api/v2/judgements/1/rate", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Judgement ID in URL does not match the rating data", responseContent);
        }

        [Fact]
        public async Task RateFeedback_Unauthorized_ReturnsUnauthorized()
        {
            // Arrange
            await SeedTestData();
            await SubmitTestJudgement();

            var ratingDto = new RateFeedbackDto
            {
                JudgementId = 1,
                RaterUserId = "rater-user-id",
                IsHelpful = true
            };

            var json = JsonSerializer.Serialize(ratingDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Don't add authorization header

            // Act
            var response = await _client.PostAsync("/api/v2/judgements/1/rate", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task StartUniversalJudging_ValidRequest_ReturnsOk()
        {
            // Arrange
            await SeedTestDataForLifecycle();

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test");

            // Act
            var response = await _client.PostAsync("/api/v2/competitions/1/start-judging", null);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(responseContent);

            Assert.True(result.GetProperty("success").GetBoolean());
            Assert.True(result.GetProperty("assignmentsCreated").GetInt32() > 0);
        }

        [Fact]
        public async Task TallyUniversalJudgingResults_ValidRequest_ReturnsOk()
        {
            // Arrange
            await SeedTestDataForTallying();

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test");

            // Act
            var response = await _client.PostAsync("/api/v2/competitions/1/tally-results?advancementCount=2", null);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(responseContent);

            Assert.True(result.GetProperty("success").GetBoolean());
            Assert.True(result.GetProperty("advancementCount").GetInt32() <= 2);

            // Verify that prowess scores were calculated and saved
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var user1 = await context.Users.FirstOrDefaultAsync(u => u.Id == "test-user-id");
            var user2 = await context.Users.FirstOrDefaultAsync(u => u.Id == "user2-id");

            // Both users should have prowess scores calculated (may be neutral if insufficient data)
            Assert.True(user1?.JudgingProwessScore.HasValue);
            Assert.True(user2?.JudgingProwessScore.HasValue);
        }

        [Fact]
        public async Task GetLifecycleStatus_ValidRequest_ReturnsStatus()
        {
            // Arrange
            await SeedTestData();

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test");

            // Act
            var response = await _client.GetAsync("/api/v2/competitions/1/lifecycle-status");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var status = JsonSerializer.Deserialize<JsonElement>(responseContent);

            Assert.Equal(1, status.GetProperty("competitionId").GetInt32());
            Assert.Equal("Test Competition", status.GetProperty("competitionTitle").GetString());
            Assert.True(status.GetProperty("totalSubmissions").GetInt32() >= 0);
        }

        private async Task SeedTestData()
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Clear existing data
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();

            // Create test users
            var judge = new User
            {
                Id = "test-user-id", // This matches the test authentication
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

            context.Users.AddRange(judge, submitter);

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

            context.Competitions.Add(competition);

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
                SubmissionDate = DateTime.UtcNow.AddDays(-2)
            };

            context.Submissions.Add(submission);

            // Create test judgement assignment (simulating what SubmissionAssignmentService would create)
            var assignment = new Judgement
            {
                JudgementId = 1,
                SubmissionId = 1,
                JudgeUserId = judge.Id,
                Score = 0,
                Feedback = "Placeholder",
                SubmittedAt = DateTime.UtcNow.AddYears(-1) // Old date to indicate not yet submitted
            };

            context.Judgements.Add(assignment);
            await context.SaveChangesAsync();
        }

        private async Task SubmitTestJudgement()
        {
            using var scope = _factory.Services.CreateScope();
            var judgingService = scope.ServiceProvider.GetRequiredService<IJudgingService>();

            var judgementDto = new SubmitJudgementDto
            {
                SubmissionId = 1,
                JudgeUserId = "test-user-id",
                Score = 8,
                Feedback = "Great mix!"
            };

            await judgingService.SubmitJudgement(judgementDto);
        }

        private async Task SeedTestDataForLifecycle()
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Clear existing data
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();

            // Create test users
            var user1 = new User
            {
                Id = "test-user-id",
                UserName = "user1@test.com",
                Email = "user1@test.com",
                FirstName = "User",
                LastName = "One"
            };

            var user2 = new User
            {
                Id = "user2-id",
                UserName = "user2@test.com",
                Email = "user2@test.com",
                FirstName = "User",
                LastName = "Two"
            };

            context.Users.AddRange(user1, user2);

            // Create test competition in OpenForSubmissions status
            var competition = new Competition
            {
                CompetitionId = 1,
                Title = "Test Competition",
                Description = "Test Description",
                RulesText = "Test Rules",
                PrizeDetails = "Test Prize Details",
                Status = CompetitionStatus.OpenForSubmissions,
                StartDate = DateTime.UtcNow.AddDays(-10),
                EndDate = DateTime.UtcNow.AddDays(10),
                OrganizerUserId = "organizer-user-id"
            };

            context.Competitions.Add(competition);

            // Create test submissions
            var submission1 = new Submission
            {
                SubmissionId = 1,
                CompetitionId = 1,
                UserId = user1.Id,
                MixTitle = "Test Mix 1",
                MixDescription = "Test Mix Description 1",
                AudioFilePath = "/path/to/audio1.mp3",
                Status = SubmissionStatus.Submitted,
                SubmissionDate = DateTime.UtcNow.AddDays(-2)
            };

            var submission2 = new Submission
            {
                SubmissionId = 2,
                CompetitionId = 1,
                UserId = user2.Id,
                MixTitle = "Test Mix 2",
                MixDescription = "Test Mix Description 2",
                AudioFilePath = "/path/to/audio2.mp3",
                Status = SubmissionStatus.Submitted,
                SubmissionDate = DateTime.UtcNow.AddDays(-2)
            };

            context.Submissions.AddRange(submission1, submission2);
            await context.SaveChangesAsync();
        }

        private async Task SeedTestDataForTallying()
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Clear existing data
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();

            // Create test users
            var user1 = new User
            {
                Id = "test-user-id",
                UserName = "user1@test.com",
                Email = "user1@test.com",
                FirstName = "User",
                LastName = "One"
            };

            var user2 = new User
            {
                Id = "user2-id",
                UserName = "user2@test.com",
                Email = "user2@test.com",
                FirstName = "User",
                LastName = "Two"
            };

            context.Users.AddRange(user1, user2);

            // Create test competition in InJudging status
            var competition = new Competition
            {
                CompetitionId = 1,
                Title = "Test Competition",
                Description = "Test Description",
                RulesText = "Test Rules",
                PrizeDetails = "Test Prize Details",
                Status = CompetitionStatus.InJudging,
                StartDate = DateTime.UtcNow.AddDays(-10),
                EndDate = DateTime.UtcNow.AddDays(-5),
                OrganizerUserId = "organizer-user-id"
            };

            context.Competitions.Add(competition);

            // Create test submissions in AwaitingJudging status
            var submission1 = new Submission
            {
                SubmissionId = 1,
                CompetitionId = 1,
                UserId = user1.Id,
                MixTitle = "Test Mix 1",
                MixDescription = "Test Mix Description 1",
                AudioFilePath = "/path/to/audio1.mp3",
                Status = SubmissionStatus.AwaitingJudging,
                SubmissionDate = DateTime.UtcNow.AddDays(-7)
            };

            var submission2 = new Submission
            {
                SubmissionId = 2,
                CompetitionId = 1,
                UserId = user2.Id,
                MixTitle = "Test Mix 2",
                MixDescription = "Test Mix Description 2",
                AudioFilePath = "/path/to/audio2.mp3",
                Status = SubmissionStatus.AwaitingJudging,
                SubmissionDate = DateTime.UtcNow.AddDays(-7)
            };

            context.Submissions.AddRange(submission1, submission2);

            // Create some sample judgements
            var judgement1 = new Judgement
            {
                JudgementId = 1,
                SubmissionId = 1,
                JudgeUserId = user2.Id,
                Score = 8,
                Feedback = "Great mix!",
                SubmittedAt = DateTime.UtcNow.AddDays(-1)
            };

            var judgement2 = new Judgement
            {
                JudgementId = 2,
                SubmissionId = 2,
                JudgeUserId = user1.Id,
                Score = 7,
                Feedback = "Good work!",
                SubmittedAt = DateTime.UtcNow.AddDays(-1)
            };

            context.Judgements.AddRange(judgement1, judgement2);

            // Add some feedback ratings to test prowess calculation
            var feedbackRating1 = new FeedbackRating
            {
                FeedbackRatingId = 1,
                JudgementId = 1,
                RaterUserId = user1.Id,
                IsHelpful = true,
                RatedAt = DateTime.UtcNow
            };

            var feedbackRating2 = new FeedbackRating
            {
                FeedbackRatingId = 2,
                JudgementId = 2,
                RaterUserId = user2.Id,
                IsHelpful = true,
                RatedAt = DateTime.UtcNow
            };

            context.FeedbackRatings.AddRange(feedbackRating1, feedbackRating2);
            await context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Test authentication handler that simulates a logged-in admin user
    /// </summary>
    public class TestAuthenticationSchemeHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public TestAuthenticationSchemeHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger, UrlEncoder encoder)
            : base(options, logger, encoder)
        {
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "test-user-id"),
                new Claim(ClaimTypes.Name, "test@example.com"),
                new Claim("userId", "test-user-id"),
                new Claim(ClaimTypes.Role, "Admin") // Add Admin role for testing admin endpoints
            };

            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, "Test");

            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }
}
