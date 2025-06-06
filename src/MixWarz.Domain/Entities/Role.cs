using Microsoft.AspNetCore.Identity;

namespace MixWarz.Domain.Entities
{
    public class Role : IdentityRole
    {
        // Additional properties beyond what IdentityRole provides can be added here
        public string? Description { get; set; }
    }
} 