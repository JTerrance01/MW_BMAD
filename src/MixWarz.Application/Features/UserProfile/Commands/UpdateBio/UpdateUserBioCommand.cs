using MediatR;

namespace MixWarz.Application.Features.UserProfile.Commands.UpdateBio
{
    public class UpdateUserBioCommand : IRequest<UpdateUserBioResponse>
    {
        public string UserId { get; set; } = string.Empty;
        public string? Bio { get; set; }
    }
} 