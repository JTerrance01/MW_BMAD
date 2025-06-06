using System;

namespace MixWarz.Domain.Entities
{
    public class UserProfileGalleryImage
    {
        public int UserProfileGalleryImageId { get; set; }
        public string UserId { get; set; }
        public string ImageUrl { get; set; }
        public DateTime UploadedAt { get; set; }
        
        // Navigation property
        public virtual User User { get; set; }
    }
} 