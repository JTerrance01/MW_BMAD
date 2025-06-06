using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MixWarz.Application.Common.Interfaces;

namespace MixWarz.Application.Features.Blog.Commands.DeleteArticle
{
    public class DeleteArticleCommandHandler : IRequestHandler<DeleteArticleCommand, DeleteArticleResponse>
    {
        private readonly IBlogService _blogService;

        public DeleteArticleCommandHandler(IBlogService blogService)
        {
            _blogService = blogService;
        }

        public async Task<DeleteArticleResponse> Handle(DeleteArticleCommand request, CancellationToken cancellationToken)
        {
            // Check if article exists
            var articleExists = await _blogService.ArticleExistsAsync(request.Id);

            if (!articleExists)
            {
                return new DeleteArticleResponse
                {
                    Success = false,
                    Message = $"Article with ID {request.Id} not found"
                };
            }

            // Delete the article
            var isDeleted = await _blogService.DeleteArticleAsync(request.Id);

            if (!isDeleted)
            {
                return new DeleteArticleResponse
                {
                    Success = false,
                    Message = "Failed to delete article"
                };
            }

            return new DeleteArticleResponse
            {
                Success = true,
                Message = "Article deleted successfully"
            };
        }
    }
}