namespace MixWarz.Application.Features.UserProfile.Commands.UpdateBio
{
    public class UpdateUserBioResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Bio { get; set; }
    }
} 