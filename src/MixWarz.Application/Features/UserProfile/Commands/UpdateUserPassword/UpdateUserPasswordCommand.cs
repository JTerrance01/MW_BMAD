using MediatR;

namespace MixWarz.Application.Features.UserProfile.Commands.UpdateUserPassword
{
    public class UpdateUserPasswordCommand : IRequest<UpdateUserPasswordResponse>
    {
        public string UserId { get; set; } = string.Empty;
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class UpdateUserPasswordResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}