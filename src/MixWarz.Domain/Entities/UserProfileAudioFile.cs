using System;

namespace MixWarz.Domain.Entities
{
    public class UserProfileAudioFile
    {
        public int UserProfileAudioFileId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string AudioFileUrl { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }

        // Navigation property
        public virtual User User { get; set; } = null!;
    }
}