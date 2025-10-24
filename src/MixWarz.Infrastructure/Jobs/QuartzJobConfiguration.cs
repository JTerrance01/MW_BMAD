using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MixWarz.Domain.Interfaces;
using Quartz;
using System;

namespace MixWarz.Infrastructure.Jobs
{
    /// <summary>
    /// Configuration for Quartz jobs in the MixWarz application
    /// </summary>
    public class QuartzJobConfiguration
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<QuartzJobConfiguration> _logger;

        public QuartzJobConfiguration(
            IConfiguration configuration,
            ILogger<QuartzJobConfiguration> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Configures a Quartz ISchedulerFactory with the competition job schedules
        /// </summary>
        /// <param name="config">The Quartz configurator</param>
        public void ConfigureCompetitionJobs(IServiceCollectionQuartzConfigurator config)
        {
            // Get configuration settings
            var schedulerConfig = _configuration.GetSection("QuartzScheduler:CompetitionTransitions");
            int checkFrequencyMinutes = schedulerConfig["CheckFrequencyMinutes"] != null
                ? Convert.ToInt32(schedulerConfig["CheckFrequencyMinutes"])
                : 30; // Changed default from 60 to 30 to avoid cron expression issues
            bool enableMonthlyCompetitions = schedulerConfig["MonthlyCompetitions"] != null
                ? Convert.ToBoolean(schedulerConfig["MonthlyCompetitions"])
                : true;

            _logger.LogInformation("Configuring Quartz jobs with frequency: {frequency} minutes", checkFrequencyMinutes);

            // Calculate cron expressions based on configuration
            // Handle different frequency ranges to ensure valid cron expressions
            string upcomingJobsCron;
            if (checkFrequencyMinutes >= 60)
            {
                // For hourly or longer intervals, use hourly cron expression
                int hours = checkFrequencyMinutes / 60;
                upcomingJobsCron = $"0 10 0/{hours} * * ?"; // Run 10 minutes past each hour interval
            }
            else
            {
                // For sub-hourly intervals, use minute-based cron expression with offset
                int offsetMinutes = Math.Max(1, checkFrequencyMinutes / 6);
                upcomingJobsCron = $"0 {offsetMinutes}/{checkFrequencyMinutes} * * * ?";
            }

            // Monthly job runs at midnight on the 1st of every month
            string monthlyJobCron = "0 0 0 1 * ?";

            // Configure the job for transitioning from Upcoming to OpenForSubmissions
            var upcomingToOpenJobKey = new JobKey("TransitionUpcomingToOpenJob");
            config.AddJob<TransitionUpcomingToOpenJob>(opts => opts.WithIdentity(upcomingToOpenJobKey));
            config.AddTrigger(opts => opts
                .ForJob(upcomingToOpenJobKey)
                .WithIdentity("TransitionUpcomingToOpenTrigger")
                .WithCronSchedule(upcomingJobsCron));

            // Note: Old round-based jobs removed with Hybrid Fair-Play Tournament system

            // Configure the job for creating monthly competitions
            if (enableMonthlyCompetitions)
            {
                var createMonthlyJobKey = new JobKey("CreateMonthlyCompetitionsJob");
                config.AddJob<CreateMonthlyCompetitionsJob>(opts => opts.WithIdentity(createMonthlyJobKey));
                config.AddTrigger(opts => opts
                    .ForJob(createMonthlyJobKey)
                    .WithIdentity("CreateMonthlyCompetitionsTrigger")
                    .WithCronSchedule(monthlyJobCron));
            }
        }

        /// <summary>
        /// Gets the voting duration days for Round 1 from configuration
        /// </summary>
        public int GetRound1VotingDurationDays()
        {
            var configSection = _configuration.GetSection("QuartzScheduler:CompetitionTransitions");
            return configSection["Round1VotingDurationDays"] != null
                ? Convert.ToInt32(configSection["Round1VotingDurationDays"])
                : 7;
        }

        /// <summary>
        /// Gets the voting duration days for Round 2 from configuration
        /// </summary>
        public int GetRound2VotingDurationDays()
        {
            var configSection = _configuration.GetSection("QuartzScheduler:CompetitionTransitions");
            return configSection["Round2VotingDurationDays"] != null
                ? Convert.ToInt32(configSection["Round2VotingDurationDays"])
                : 5;
        }
    }
}