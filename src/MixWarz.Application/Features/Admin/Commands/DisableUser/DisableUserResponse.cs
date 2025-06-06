namespace MixWarz.Application.Features.Admin.Commands.DisableUser
{
    /// <summary>
    /// Response for the DisableUserCommand
    /// </summary>
    public class DisableUserResponse
    {
        public string UserId { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; }
        public bool IsDisabled { get; set; } // Current disabled status after operation
    }
}