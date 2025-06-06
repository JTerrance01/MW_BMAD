using MediatR;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace MixWarz.Application.Features.UserProfile.Commands.UpdateProfilePicture
{
    public class UpdateProfilePictureCommand : IRequest<UpdateProfilePictureResponse>
    {
        [Required(ErrorMessage = "User ID is required.")]
        public string UserId { get; set; }

        [Required(ErrorMessage = "A profile picture file is required.")]
        public IFormFile ProfilePicture { get; set; }
    }
}