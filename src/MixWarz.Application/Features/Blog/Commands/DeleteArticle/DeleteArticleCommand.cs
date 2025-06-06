using MediatR;

namespace MixWarz.Application.Features.Blog.Commands.DeleteArticle
{
    public class DeleteArticleCommand : IRequest<DeleteArticleResponse>
    {
        public int Id { get; set; }
    }
}