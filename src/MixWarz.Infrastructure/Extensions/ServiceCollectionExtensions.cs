using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Infrastructure.Persistence;
using MixWarz.Infrastructure.Persistence.Repositories;
using MixWarz.Infrastructure.Services;
using MixWarz.Infrastructure.Persistence.Seed;
using MixWarz.Domain.Interfaces;
using System.Threading.Tasks;
using Quartz;
using MixWarz.Infrastructure.Jobs;
using System;
using Microsoft.Extensions.Hosting;

namespace MixWarz.Infrastructure.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(
                    configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

            services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<ICompetitionRepository, CompetitionRepository>();
            services.AddScoped<ISubmissionRepository, SubmissionRepository>();
            services.AddScoped<ISubmissionVoteRepository, SubmissionVoteRepository>();
            services.AddScoped<IRound1AssignmentRepository, Round1AssignmentRepository>();
            services.AddScoped<ISubmissionGroupRepository, SubmissionGroupRepository>();
            services.AddScoped<IProductRepository, ProductRepository>();
            services.AddScoped<IOrderRepository, OrderRepository>();
            services.AddScoped<ICartRepository, CartRepository>();
            services.AddScoped<IUserActivityRepository, UserActivityRepository>();
            services.AddScoped<ISongCreatorPickRepository, SongCreatorPickRepository>();
            // services.AddScoped<IUserProfileRepository, UserProfileRepository>();
            // services.AddScoped<ICategoryRepository, CategoryRepository>();
            // services.AddScoped<ITagRepository, TagRepository>();
            // services.AddScoped<IArticleRepository, ArticleRepository>();

            services.AddHttpContextAccessor();

            services.AddScoped<IStripeService, StripeService>();
            services.AddScoped<IRound1AssignmentService, Round1AssignmentService>();
            services.AddScoped<IRound2VotingService, Round2VotingService>();

            return services;
        }

        public static async Task SeedDataAsync(this IServiceProvider serviceProvider)
        {
            // DataSeeder is a static class, so we don't need to resolve it
            await DataSeeder.SeedAsync(serviceProvider);
        }

        /// <summary>
        /// Adds Quartz background job scheduling for competition management
        /// </summary>
        public static IServiceCollection AddQuartzScheduledJobs(this IServiceCollection services, IConfiguration configuration)
        {
            // Register QuartzJobConfiguration
            services.AddSingleton<QuartzJobConfiguration>();

            // Register Quartz services
            services.AddQuartz(q =>
            {
                // Register job services
                q.UseMicrosoftDependencyInjectionJobFactory();

                // Create a specific key for the default scheduler
                q.SchedulerId = "MixWarz-Competition-Scheduler";

                // Up the max concurrency to 10 (default is 1)
                q.UseDefaultThreadPool(tp => { tp.MaxConcurrency = 10; });

                // Use the QuartzJobConfiguration to configure the jobs
                var sp = services.BuildServiceProvider();
                var jobConfig = sp.GetRequiredService<QuartzJobConfiguration>();
                jobConfig.ConfigureCompetitionJobs(q);
            });

            // Add the Quartz hosted service
            services.AddQuartzHostedService(options =>
            {
                // Wait for 2 seconds after startup to start the scheduler
                options.StartDelay = TimeSpan.FromSeconds(2);

                // When shutting down wait for jobs to complete
                options.WaitForJobsToComplete = true;
                options.AwaitApplicationStarted = true;
            });

            // Register job implementations as transient services
            services.AddTransient<TransitionSubmissionToRound1Job>();
            services.AddTransient<TransitionRound1SetupToOpenJob>();
            services.AddTransient<TransitionRound1VotingToTallyingJob>();
            services.AddTransient<TransitionRound2VotingToTallyingJob>();
            services.AddTransient<CreateMonthlyCompetitionsJob>();

            return services;
        }
    }
}