using System.Collections.Generic;

namespace MixWarz.Application.Features.UserProfile.Commands.UpdateProfilePicture
{
    public class UpdateProfilePictureResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string ProfilePictureUrl { get; set; }
        public Dictionary<string, string[]> ValidationErrors { get; set; }
    }
}