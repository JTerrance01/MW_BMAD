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
                : 60;
            bool enableMonthlyCompetitions = schedulerConfig["MonthlyCompetitions"] != null
                ? Convert.ToBoolean(schedulerConfig["MonthlyCompetitions"])
                : true;

            _logger.LogInformation("Configuring Quartz jobs with frequency: {frequency} minutes", checkFrequencyMinutes);

            // Calculate cron expressions based on configuration
            // For frequent jobs, use a schedule that runs every X minutes
            string frequentJobsCron = $"0 0/{checkFrequencyMinutes} * * * ?";

            // Offset the job schedules slightly to prevent resource contention
            string upcomingJobsCron = $"0 {checkFrequencyMinutes / 6} 0/{checkFrequencyMinutes} * * ?";
            string round1JobsCron = $"0 {checkFrequencyMinutes / 4} 0/{checkFrequencyMinutes} * * ?";
            string round1TallyingJobsCron = $"0 {checkFrequencyMinutes / 3} 0/{checkFrequencyMinutes} * * ?";
            string round2JobsCron = $"0 {checkFrequencyMinutes / 2} 0/{checkFrequencyMinutes} * * ?";

            // Monthly job runs at midnight on the 1st of every month
            string monthlyJobCron = "0 0 0 1 * ?";

            // Configure the job for transitioning from Upcoming to OpenForSubmissions
            var upcomingToOpenJobKey = new JobKey("TransitionUpcomingToOpenJob");
            config.AddJob<TransitionUpcomingToOpenJob>(opts => opts.WithIdentity(upcomingToOpenJobKey));
            config.AddTrigger(opts => opts
                .ForJob(upcomingToOpenJobKey)
                .WithIdentity("TransitionUpcomingToOpenTrigger")
                .WithCronSchedule(upcomingJobsCron));

            // Configure the job for transitioning from submissions to Round 1
            var submissionToRound1JobKey = new JobKey("TransitionSubmissionToRound1Job");
            config.AddJob<TransitionSubmissionToRound1Job>(opts => opts.WithIdentity(submissionToRound1JobKey));
            config.AddTrigger(opts => opts
                .ForJob(submissionToRound1JobKey)
                .WithIdentity("TransitionSubmissionToRound1Trigger")
                .WithCronSchedule(frequentJobsCron));

            // Configure the job for transitioning from Round1Setup to Round1Open (automation safety net)
            var round1SetupToOpenJobKey = new JobKey("TransitionRound1SetupToOpenJob");
            config.AddJob<TransitionRound1SetupToOpenJob>(opts => opts.WithIdentity(round1SetupToOpenJobKey));
            config.AddTrigger(opts => opts
                .ForJob(round1SetupToOpenJobKey)
                .WithIdentity("TransitionRound1SetupToOpenTrigger")
                .WithCronSchedule(frequentJobsCron));

            // Configure the job for transitioning from Round 1 voting to tallying
            var round1ToTallyingJobKey = new JobKey("TransitionRound1VotingToTallyingJob");
            config.AddJob<TransitionRound1VotingToTallyingJob>(opts => opts.WithIdentity(round1ToTallyingJobKey));
            config.AddTrigger(opts => opts
                .ForJob(round1ToTallyingJobKey)
                .WithIdentity("TransitionRound1VotingToTallyingTrigger")
                .WithCronSchedule(round1JobsCron));

            // Configure the job for transitioning from Round 1 tallying to Round 2 open
            var round1TallyingToRound2JobKey = new JobKey("TransitionRound1TallyingToRound2OpenJob");
            config.AddJob<TransitionRound1TallyingToRound2OpenJob>(opts => opts.WithIdentity(round1TallyingToRound2JobKey));
            config.AddTrigger(opts => opts
                .ForJob(round1TallyingToRound2JobKey)
                .WithIdentity("TransitionRound1TallyingToRound2OpenTrigger")
                .WithCronSchedule(round1TallyingJobsCron));

            // Configure the job for transitioning from Round 2 voting to tallying
            var round2ToTallyingJobKey = new JobKey("TransitionRound2VotingToTallyingJob");
            config.AddJob<TransitionRound2VotingToTallyingJob>(opts => opts.WithIdentity(round2ToTallyingJobKey));
            config.AddTrigger(opts => opts
                .ForJob(round2ToTallyingJobKey)
                .WithIdentity("TransitionRound2VotingToTallyingTrigger")
                .WithCronSchedule(round2JobsCron));

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