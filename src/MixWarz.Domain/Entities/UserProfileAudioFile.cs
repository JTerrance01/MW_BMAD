using System;

namespace MixWarz.Domain.Entities
{
    public class UserProfileAudioFile
    {
        public int UserProfileAudioFileId { get; set; }
        public string UserId { get; set; }
        public string AudioFileUrl { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime UploadedAt { get; set; }
        
        // Navigation property
        public virtual User User { get; set; }
    }
} 