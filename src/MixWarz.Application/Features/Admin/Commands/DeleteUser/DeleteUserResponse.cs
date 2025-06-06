namespace MixWarz.Application.Features.Admin.Commands.DeleteUser
{
    /// <summary>
    /// Response for the DeleteUserCommand
    /// </summary>
    public class DeleteUserResponse
    {
        /// <summary>
        /// Indicates whether the operation was successful
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// A message describing the result of the operation
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// The ID of the user that was deleted
        /// </summary>
        public string UserId { get; set; }
    }
}