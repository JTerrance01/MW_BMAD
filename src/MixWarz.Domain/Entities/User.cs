using Microsoft.AspNetCore.Identity;

namespace MixWarz.Domain.Entities
{
    public class User : IdentityUser
    {
        // Additional properties beyond what IdentityUser provides
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime? RegistrationDate { get; set; }
        public DateTime? LastLoginDate { get; set; }

        // Enhanced profile properties - Epic 5
        public string? ProfilePictureUrl { get; set; }
        public string? Bio { get; set; }

        // Stripe integration
        public string? StripeCustomerId { get; set; }

        // Hybrid Fair-Play Tournament feature
        /// <summary>
        /// Judging prowess score calculated based on how close the judge's scores are to final averages 
        /// and how many "Helpful" ratings their feedback received
        /// </summary>
        public decimal? JudgingProwessScore { get; set; }

        // Navigation properties
        public virtual ICollection<UserProfileGalleryImage> GalleryImages { get; set; }
        public virtual ICollection<UserProfileAudioFile> AudioFiles { get; set; }

        public User()
        {
            FirstName = string.Empty;
            LastName = string.Empty;
            GalleryImages = new HashSet<UserProfileGalleryImage>();
            AudioFiles = new HashSet<UserProfileAudioFile>();
        }
    }
}