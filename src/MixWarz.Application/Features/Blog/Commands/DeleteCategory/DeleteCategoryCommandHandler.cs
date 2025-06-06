using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MixWarz.Application.Common.Interfaces;

namespace MixWarz.Application.Features.Blog.Commands.DeleteCategory
{
    public class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, DeleteCategoryResponse>
    {
        private readonly IBlogService _blogService;

        public DeleteCategoryCommandHandler(IBlogService blogService)
        {
            _blogService = blogService;
        }

        public async Task<DeleteCategoryResponse> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
        {
            // Check if category exists
            var categoryExists = await _blogService.CategoryExistsAsync(request.Id);

            if (!categoryExists)
            {
                return new DeleteCategoryResponse
                {
                    Success = false,
                    Message = $"Category with ID {request.Id} not found"
                };
            }

            // Delete the category
            var isDeleted = await _blogService.DeleteCategoryAsync(request.Id);

            if (!isDeleted)
            {
                return new DeleteCategoryResponse
                {
                    Success = false,
                    Message = "Failed to delete category"
                };
            }

            return new DeleteCategoryResponse
            {
                Success = true,
                Message = "Category deleted successfully"
            };
        }
    }
}