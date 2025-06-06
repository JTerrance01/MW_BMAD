using System;
using MixWarz.Domain.Enums;

namespace MixWarz.Domain.Entities
{
    public class UserActivity
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public User User { get; set; }
        public ActivityType Type { get; set; }
        public string Description { get; set; }
        public string RelatedEntityType { get; set; } // "Competition", "Product", "Blog", etc.
        public int? RelatedEntityId { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string IPAddress { get; set; }
        public string UserAgent { get; set; }
    }
} 