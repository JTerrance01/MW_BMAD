using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Common.Interfaces
{
    public interface IAppDbContext
    {
        DbSet<User> Users { get; set; }
        DbSet<UserProfileGalleryImage> UserProfileGalleryImages { get; set; }
        DbSet<UserProfileAudioFile> UserProfileAudioFiles { get; set; }

        // E-commerce entities
        DbSet<Product> Products { get; set; }
        DbSet<Category> Categories { get; set; }
        DbSet<Order> Orders { get; set; }
        DbSet<OrderItem> OrderItems { get; set; }
        DbSet<Cart> Carts { get; set; }
        DbSet<CartItem> CartItems { get; set; }
        DbSet<UserProductAccess> UserProductAccesses { get; set; }

        // Competition entities
        DbSet<Competition> Competitions { get; set; }
        DbSet<Submission> Submissions { get; set; }
        DbSet<SubmissionVote> SubmissionVotes { get; set; }
        DbSet<Round1Assignment> Round1Assignments { get; set; }
        DbSet<SubmissionGroup> SubmissionGroups { get; set; }
        DbSet<SongCreatorPick> SongCreatorPicks { get; set; }

        // Judging System entities
        DbSet<JudgingCriteria> JudgingCriterias { get; set; }
        DbSet<SubmissionJudgment> SubmissionJudgments { get; set; }
        DbSet<CriteriaScore> CriteriaScores { get; set; }

        // Blog entities - Epic 6
        DbSet<BlogArticle> BlogArticles { get; set; }
        DbSet<BlogCategory> BlogCategories { get; set; }
        DbSet<BlogTag> BlogTags { get; set; }
        DbSet<ArticleCategory> ArticleCategories { get; set; }
        DbSet<ArticleTag> ArticleTags { get; set; }

        // User Activity Tracking
        DbSet<UserActivity> UserActivities { get; set; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}