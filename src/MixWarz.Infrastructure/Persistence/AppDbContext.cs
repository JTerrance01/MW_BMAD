using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Application.Common.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Infrastructure.Persistence
{
    public class AppDbContext : IdentityDbContext<User, Role, string>, IAppDbContext
    {
        public DbSet<Competition> Competitions { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<SubmissionVote> SubmissionVotes { get; set; }
        public DbSet<Round1Assignment> Round1Assignments { get; set; }
        public DbSet<SubmissionGroup> SubmissionGroups { get; set; }
        public DbSet<SongCreatorPick> SongCreatorPicks { get; set; }

        // Judging System DbSets
        public DbSet<JudgingCriteria> JudgingCriterias { get; set; }
        public DbSet<SubmissionJudgment> SubmissionJudgments { get; set; }
        public DbSet<CriteriaScore> CriteriaScores { get; set; }

        // E-commerce module DbSets
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<UserProductAccess> UserProductAccesses { get; set; }

        // Enhanced User Profile DbSets - Epic 5
        public DbSet<UserProfileGalleryImage> UserProfileGalleryImages { get; set; }
        public DbSet<UserProfileAudioFile> UserProfileAudioFiles { get; set; }

        // Blog DbSets - Epic 6
        public DbSet<BlogArticle> BlogArticles { get; set; }
        public DbSet<BlogCategory> BlogCategories { get; set; }
        public DbSet<BlogTag> BlogTags { get; set; }
        public DbSet<ArticleCategory> ArticleCategories { get; set; }
        public DbSet<ArticleTag> ArticleTags { get; set; }

        // User Activity Tracking
        public DbSet<UserActivity> UserActivities { get; set; }

        // Stripe Subscriptions
        public DbSet<Subscription> Subscriptions { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Competition entity
            modelBuilder.Entity<Competition>()
                .HasOne(c => c.Organizer)
                .WithMany()
                .HasForeignKey(c => c.OrganizerUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Submission entity
            modelBuilder.Entity<Submission>()
                .HasOne(s => s.Competition)
                .WithMany(c => c.Submissions)
                .HasForeignKey(s => s.CompetitionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Submission>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Add unique constraint to prevent multiple submissions per user per competition
            modelBuilder.Entity<Submission>()
                .HasIndex(s => new { s.CompetitionId, s.UserId })
                .IsUnique();

            // Configure SubmissionVote entity
            modelBuilder.Entity<SubmissionVote>()
                .HasOne(sv => sv.Submission)
                .WithMany(s => s.Votes)
                .HasForeignKey(sv => sv.SubmissionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SubmissionVote>()
                .HasOne(sv => sv.Voter)
                .WithMany()
                .HasForeignKey(sv => sv.VoterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SubmissionVote>()
                .HasOne(sv => sv.Competition)
                .WithMany()
                .HasForeignKey(sv => sv.CompetitionId)
                .OnDelete(DeleteBehavior.Restrict);

            // Add index for querying votes by competition and round
            modelBuilder.Entity<SubmissionVote>()
                .HasIndex(sv => new { sv.CompetitionId, sv.VotingRound });

            // Add index for querying voter's votes in a competition
            modelBuilder.Entity<SubmissionVote>()
                .HasIndex(sv => new { sv.CompetitionId, sv.VoterId, sv.VotingRound });

            // Configure Round1Assignment entity
            modelBuilder.Entity<Round1Assignment>()
                .HasOne(ra => ra.Competition)
                .WithMany()
                .HasForeignKey(ra => ra.CompetitionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Round1Assignment>()
                .HasOne(ra => ra.Voter)
                .WithMany()
                .HasForeignKey(ra => ra.VoterId)
                .OnDelete(DeleteBehavior.Restrict);

            // Add index for querying assignments by competition and voter
            modelBuilder.Entity<Round1Assignment>()
                .HasIndex(ra => new { ra.CompetitionId, ra.VoterId })
                .IsUnique();

            // Add index for querying assignments by competition and assigned group
            modelBuilder.Entity<Round1Assignment>()
                .HasIndex(ra => new { ra.CompetitionId, ra.AssignedGroupNumber });

            // Configure SubmissionGroup entity
            modelBuilder.Entity<SubmissionGroup>()
                .HasOne(sg => sg.Competition)
                .WithMany()
                .HasForeignKey(sg => sg.CompetitionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SubmissionGroup>()
                .HasOne(sg => sg.Submission)
                .WithMany()
                .HasForeignKey(sg => sg.SubmissionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Add index for querying submissions by competition and group
            modelBuilder.Entity<SubmissionGroup>()
                .HasIndex(sg => new { sg.CompetitionId, sg.GroupNumber });

            // Add unique constraint to prevent multiple group assignments per submission
            modelBuilder.Entity<SubmissionGroup>()
                .HasIndex(sg => new { sg.CompetitionId, sg.SubmissionId })
                .IsUnique();

            // Configure E-commerce module entities

            // Product and Category
            modelBuilder.Entity<Product>()
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Cart and CartItems
            modelBuilder.Entity<Cart>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Cart)
                .WithMany(c => c.CartItems)
                .HasForeignKey(ci => ci.CartId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Product)
                .WithMany(p => p.CartItems)
                .HasForeignKey(ci => ci.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Add unique constraint for product in cart
            modelBuilder.Entity<CartItem>()
                .HasIndex(ci => new { ci.CartId, ci.ProductId })
                .IsUnique();

            // Order and OrderItems
            modelBuilder.Entity<Order>()
                .HasOne(o => o.User)
                .WithMany()
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Product)
                .WithMany(p => p.OrderItems)
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // UserProductAccess
            modelBuilder.Entity<UserProductAccess>()
                .HasOne(upa => upa.User)
                .WithMany()
                .HasForeignKey(upa => upa.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserProductAccess>()
                .HasOne(upa => upa.Product)
                .WithMany(p => p.UserProductAccesses)
                .HasForeignKey(upa => upa.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserProductAccess>()
                .HasOne(upa => upa.Order)
                .WithMany()
                .HasForeignKey(upa => upa.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Add unique constraint to prevent duplicate access grants
            modelBuilder.Entity<UserProductAccess>()
                .HasIndex(upa => new { upa.UserId, upa.ProductId })
                .IsUnique();

            // Configure Enhanced User Profile entities - Epic 5

            // UserProfileGalleryImage
            modelBuilder.Entity<UserProfileGalleryImage>()
                .HasOne(upgi => upgi.User)
                .WithMany(u => u.GalleryImages)
                .HasForeignKey(upgi => upgi.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // UserProfileAudioFile
            modelBuilder.Entity<UserProfileAudioFile>()
                .HasOne(upaf => upaf.User)
                .WithMany(u => u.AudioFiles)
                .HasForeignKey(upaf => upaf.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Set optional fields nullable
            modelBuilder.Entity<UserProfileAudioFile>()
                .Property(upaf => upaf.Title)
                .IsRequired(false);

            modelBuilder.Entity<UserProfileAudioFile>()
                .Property(upaf => upaf.Description)
                .IsRequired(false);

            // Configure Blog entities - Epic 6

            // BlogArticle
            modelBuilder.Entity<BlogArticle>()
                .HasOne(ba => ba.Author)
                .WithMany()
                .HasForeignKey(ba => ba.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Add unique constraint for slug
            modelBuilder.Entity<BlogArticle>()
                .HasIndex(ba => ba.Slug)
                .IsUnique();

            // BlogCategory
            modelBuilder.Entity<BlogCategory>()
                .HasIndex(bc => bc.Slug)
                .IsUnique();

            modelBuilder.Entity<BlogCategory>()
                .HasIndex(bc => bc.Name)
                .IsUnique();

            // BlogTag
            modelBuilder.Entity<BlogTag>()
                .HasIndex(bt => bt.Slug)
                .IsUnique();

            modelBuilder.Entity<BlogTag>()
                .HasIndex(bt => bt.Name)
                .IsUnique();

            // ArticleCategory join table
            modelBuilder.Entity<ArticleCategory>()
                .HasKey(ac => new { ac.BlogArticleId, ac.BlogCategoryId });

            modelBuilder.Entity<ArticleCategory>()
                .HasOne(ac => ac.BlogArticle)
                .WithMany(ba => ba.ArticleCategories)
                .HasForeignKey(ac => ac.BlogArticleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ArticleCategory>()
                .HasOne(ac => ac.BlogCategory)
                .WithMany(bc => bc.ArticleCategories)
                .HasForeignKey(ac => ac.BlogCategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            // ArticleTag join table
            modelBuilder.Entity<ArticleTag>()
                .HasKey(at => new { at.BlogArticleId, at.BlogTagId });

            modelBuilder.Entity<ArticleTag>()
                .HasOne(at => at.BlogArticle)
                .WithMany(ba => ba.ArticleTags)
                .HasForeignKey(at => at.BlogArticleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ArticleTag>()
                .HasOne(at => at.BlogTag)
                .WithMany(bt => bt.ArticleTags)
                .HasForeignKey(at => at.BlogTagId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure UserActivity entity
            modelBuilder.Entity<UserActivity>()
                .HasOne(ua => ua.User)
                .WithMany()
                .HasForeignKey(ua => ua.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserActivity>()
                .Property(ua => ua.IPAddress)
                .IsRequired(false);

            modelBuilder.Entity<UserActivity>()
                .Property(ua => ua.UserAgent)
                .IsRequired(false);

            modelBuilder.Entity<UserActivity>()
                .Property(ua => ua.Description)
                .IsRequired(false);

            modelBuilder.Entity<UserActivity>()
                .Property(ua => ua.RelatedEntityType)
                .IsRequired(false);

            // Index for faster queries on UserId and Timestamp
            modelBuilder.Entity<UserActivity>()
                .HasIndex(ua => new { ua.UserId, ua.Timestamp });

            // Configure SongCreatorPick entity
            modelBuilder.Entity<SongCreatorPick>()
                .HasOne(scp => scp.Competition)
                .WithMany()
                .HasForeignKey(scp => scp.CompetitionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SongCreatorPick>()
                .HasOne(scp => scp.Submission)
                .WithMany()
                .HasForeignKey(scp => scp.SubmissionId)
                .OnDelete(DeleteBehavior.Restrict);

            // Add index for querying Song Creator picks by competition
            modelBuilder.Entity<SongCreatorPick>()
                .HasIndex(scp => new { scp.CompetitionId, scp.Rank })
                .IsUnique();

            // Configure Judging System entities

            // JudgingCriteria
            modelBuilder.Entity<JudgingCriteria>()
                .HasOne(jc => jc.Competition)
                .WithMany()
                .HasForeignKey(jc => jc.CompetitionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Add index for querying criteria by competition and display order
            modelBuilder.Entity<JudgingCriteria>()
                .HasIndex(jc => new { jc.CompetitionId, jc.DisplayOrder });

            // SubmissionJudgment
            modelBuilder.Entity<SubmissionJudgment>()
                .HasOne(sj => sj.Submission)
                .WithMany()
                .HasForeignKey(sj => sj.SubmissionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SubmissionJudgment>()
                .HasOne(sj => sj.Judge)
                .WithMany()
                .HasForeignKey(sj => sj.JudgeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SubmissionJudgment>()
                .HasOne(sj => sj.Competition)
                .WithMany()
                .HasForeignKey(sj => sj.CompetitionId)
                .OnDelete(DeleteBehavior.Restrict);

            // Add unique constraint to prevent multiple judgments per judge per submission per round
            modelBuilder.Entity<SubmissionJudgment>()
                .HasIndex(sj => new { sj.SubmissionId, sj.JudgeId, sj.VotingRound })
                .IsUnique();

            // Add index for querying judgments by competition and round
            modelBuilder.Entity<SubmissionJudgment>()
                .HasIndex(sj => new { sj.CompetitionId, sj.VotingRound });

            // CriteriaScore
            modelBuilder.Entity<CriteriaScore>()
                .HasOne(cs => cs.SubmissionJudgment)
                .WithMany(sj => sj.CriteriaScores)
                .HasForeignKey(cs => cs.SubmissionJudgmentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CriteriaScore>()
                .HasOne(cs => cs.JudgingCriteria)
                .WithMany(jc => jc.CriteriaScores)
                .HasForeignKey(cs => cs.JudgingCriteriaId)
                .OnDelete(DeleteBehavior.Restrict);

            // Add unique constraint to prevent multiple scores per criteria per judgment
            modelBuilder.Entity<CriteriaScore>()
                .HasIndex(cs => new { cs.SubmissionJudgmentId, cs.JudgingCriteriaId })
                .IsUnique();

            // Configure Subscription entity
            modelBuilder.Entity<Subscription>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Add unique constraint to prevent multiple active subscriptions per user
            modelBuilder.Entity<Subscription>()
                .HasIndex(s => new { s.UserId, s.StripeSubscriptionId })
                .IsUnique();

            // Add index for querying subscriptions by status
            modelBuilder.Entity<Subscription>()
                .HasIndex(s => s.Status);

            // Seed initial categories
            modelBuilder.Entity<Category>().HasData(
                new Category { CategoryId = 1, Name = "Sample Packs", Description = "High-quality audio samples for music production" },
                new Category { CategoryId = 2, Name = "Synth Presets", Description = "Ready-to-use presets for popular synthesizers" },
                new Category { CategoryId = 3, Name = "DAW Templates", Description = "Project templates for various digital audio workstations" },
                new Category { CategoryId = 4, Name = "Tutorials", Description = "Educational content for music producers" },
                new Category { CategoryId = 5, Name = "Virtual Instruments", Description = "Software instruments for music production" },
                new Category { CategoryId = 6, Name = "Plugins", Description = "Audio processing and effect plugins" }
            );

            // Seed initial roles (Admin, User, Organizer)
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = "1", Name = "Admin", NormalizedName = "ADMIN", Description = "Administrator with full system access" },
                new Role { Id = "2", Name = "User", NormalizedName = "USER", Description = "Standard user with basic system access" },
                new Role { Id = "3", Name = "Organizer", NormalizedName = "ORGANIZER", Description = "Organizer with competition management privileges" }
            );
        }
    }
}