using System.ComponentModel.DataAnnotations;
using MediatR;

namespace MixWarz.Application.Features.Blog.Commands.UpdateTag
{
    public class UpdateTagCommand : IRequest<UpdateTagResponse>
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string Slug { get; set; }
    }
}