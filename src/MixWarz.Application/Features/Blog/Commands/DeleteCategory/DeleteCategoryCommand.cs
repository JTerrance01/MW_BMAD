using MediatR;

namespace MixWarz.Application.Features.Blog.Commands.DeleteCategory
{
    public class DeleteCategoryCommand : IRequest<DeleteCategoryResponse>
    {
        public int Id { get; set; }
    }
}