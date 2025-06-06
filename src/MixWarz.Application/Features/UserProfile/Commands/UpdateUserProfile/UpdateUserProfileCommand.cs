using MediatR;

namespace MixWarz.Application.Features.UserProfile.Commands.UpdateUserProfile
{
    public class UpdateUserProfileCommand : IRequest<UpdateUserProfileResponse>
    {
        public string UserId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class UpdateUserProfileResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
    }
}