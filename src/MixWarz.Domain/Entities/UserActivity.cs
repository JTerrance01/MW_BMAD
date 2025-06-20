using System;
using MixWarz.Domain.Enums;

namespace MixWarz.Domain.Entities
{
    public class UserActivity
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public User User { get; set; } = null!;
        public ActivityType Type { get; set; }
        public string Description { get; set; } = string.Empty;
        public string RelatedEntityType { get; set; } = string.Empty; // "Competition", "Product", "Blog", etc.
        public int? RelatedEntityId { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string IPAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
    }
}