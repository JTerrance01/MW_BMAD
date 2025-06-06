using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Blog.DTOs;

namespace MixWarz.Application.Features.Blog.Commands.UpdateCategory
{
    public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, UpdateCategoryResponse>
    {
        private readonly IBlogService _blogService;

        public UpdateCategoryCommandHandler(IBlogService blogService)
        {
            _blogService = blogService;
        }

        public async Task<UpdateCategoryResponse> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
        {
            // Check if category exists
            var categoryExists = await _blogService.CategoryExistsAsync(request.Id);

            if (!categoryExists)
            {
                return new UpdateCategoryResponse
                {
                    Success = false,
                    Message = $"Category with ID {request.Id} not found",
                    Category = null
                };
            }

            // Update the category
            var updatedCategory = await _blogService.UpdateCategoryAsync(
                request.Id,
                request.Name,
                request.Slug.ToLower()
            );

            if (updatedCategory == null)
            {
                return new UpdateCategoryResponse
                {
                    Success = false,
                    Message = "Failed to update category",
                    Category = null
                };
            }

            // Map domain entity to DTO
            var categoryDto = new BlogCategoryDto
            {
                Id = updatedCategory.BlogCategoryId,
                Name = updatedCategory.Name,
                Slug = updatedCategory.Slug
            };

            return new UpdateCategoryResponse
            {
                Success = true,
                Message = "Category updated successfully",
                Category = categoryDto
            };
        }
    }
}