using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using MixWarz.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Common.Interfaces
{
    public interface IAppDbContext
    {
        DatabaseFacade Database { get; }
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

        DbSet<SubmissionGroup> SubmissionGroups { get; set; }
        DbSet<SongCreatorPick> SongCreatorPicks { get; set; }



        // Hybrid Fair-Play Tournament entities
        DbSet<Judgement> Judgements { get; set; }
        DbSet<FeedbackRating> FeedbackRatings { get; set; }

        // Blog entities - Epic 6
        DbSet<BlogArticle> BlogArticles { get; set; }
        DbSet<BlogCategory> BlogCategories { get; set; }
        DbSet<BlogTag> BlogTags { get; set; }
        DbSet<ArticleCategory> ArticleCategories { get; set; }
        DbSet<ArticleTag> ArticleTags { get; set; }

        // User Activity Tracking
        DbSet<UserActivity> UserActivities { get; set; }

        // Stripe Subscriptions
        DbSet<Subscription> Subscriptions { get; set; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}