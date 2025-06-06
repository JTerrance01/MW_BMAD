using System.ComponentModel.DataAnnotations;
using MediatR;

namespace MixWarz.Application.Features.Blog.Commands.UpdateCategory
{
    public class UpdateCategoryCommand : IRequest<UpdateCategoryResponse>
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string Slug { get; set; }
    }
}