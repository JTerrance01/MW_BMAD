using Microsoft.Extensions.Logging;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;
using Quartz;
using System;
using System.Threading.Tasks;

namespace MixWarz.Infrastructure.Jobs
{
    /// <summary>
    /// Job to automatically create new competitions on the 1st of each month
    /// </summary>
    [DisallowConcurrentExecution]
    public class CreateMonthlyCompetitionsJob : IJob
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ILogger<CreateMonthlyCompetitionsJob> _logger;

        // Configuration for system admin user ID who will be the "organizer" of auto-generated competitions
        private const string SystemAdminUserId = "admin";

        public CreateMonthlyCompetitionsJob(
            ICompetitionRepository competitionRepository,
            ILogger<CreateMonthlyCompetitionsJob> logger)
        {
            _competitionRepository = competitionRepository;
            _logger = logger;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            _logger.LogInformation("Starting CreateMonthlyCompetitionsJob at {time}", DateTimeOffset.Now);

            try
            {
                await CreateMonthlyCompetitionsAsync();
                _logger.LogInformation("Completed CreateMonthlyCompetitionsJob successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing CreateMonthlyCompetitionsJob");
                throw;
            }
        }

        private async Task CreateMonthlyCompetitionsAsync()
        {
            // Get current month and year for competition title
            var now = DateTime.UtcNow;
            var monthName = now.ToString("MMMM");
            var year = now.Year;

            // Calculate start and end dates
            var startDate = new DateTime(now.Year, now.Month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            // Create the main monthly competition
            var mainCompetition = new Competition
            {
                Title = $"Monthly Mix Competition - {monthName} {year}",
                Description = $"Official MixWarz monthly competition for {monthName} {year}. Submit your best mix for a chance to win prizes and recognition!",
                RulesText = "1. Submissions must be in 320kbps MP3 format.\n" +
                           "2. Only one submission per contestant.\n" +
                           "3. All submissions will be judged through two rounds of peer voting.\n" +
                           "4. Participants must vote in Round 1 to be eligible for advancement.\n" +
                           "5. The song creator will provide special recognition to their favorites.",
                StartDate = startDate,
                EndDate = endDate.AddDays(-10), // Submissions due 10 days before month end
                PrizeDetails = "1st Place: Featured spotlight on MixWarz homepage and social media, plus exclusive plugin bundle.\n" +
                              "Top Finalists: Recognized on the MixWarz leaderboard and eligible for future featured opportunities.",
                Status = CompetitionStatus.Upcoming,
                OrganizerUserId = SystemAdminUserId,
                CoverImageUrl = "/images/default-competition-cover.jpg"
            };

            // Create the experimental competition (if needed)
            var experimentalCompetition = new Competition
            {
                Title = $"Experimental Mix Challenge - {monthName} {year}",
                Description = $"Push the boundaries with our experimental mix challenge for {monthName} {year}. Get creative with unusual processing techniques and sound design!",
                RulesText = "1. Submissions must be in 320kbps MP3 format.\n" +
                           "2. Only one submission per contestant.\n" +
                           "3. This is an experimental challenge - creative, unusual, and innovative mixes encouraged.\n" +
                           "4. Participants must vote in Round 1 to be eligible for advancement.\n" +
                           "5. The song creator will provide special recognition to their favorites.",
                StartDate = startDate.AddDays(15), // Starts mid-month
                EndDate = startDate.AddMonths(1).AddDays(5), // Ends 5 days into next month
                PrizeDetails = "1st Place: Featured in MixWarz's 'Innovative Masters' collection and social media, plus exclusive experimental VST pack.\n" +
                              "Top Finalists: Recognized in the MixWarz experimental showcase and eligible for future specialized competitions.",
                Status = CompetitionStatus.Upcoming,
                OrganizerUserId = SystemAdminUserId,
                CoverImageUrl = "/images/experimental-competition-cover.jpg"
            };

            try
            {
                // Save the competitions to the database
                var mainCompetitionId = await _competitionRepository.CreateAsync(mainCompetition);
                _logger.LogInformation("Created main monthly competition with ID {competitionId}", mainCompetitionId);

                var experimentalCompetitionId = await _competitionRepository.CreateAsync(experimentalCompetition);
                _logger.LogInformation("Created experimental monthly competition with ID {competitionId}", experimentalCompetitionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating monthly competitions");
                throw;
            }
        }
    }
}