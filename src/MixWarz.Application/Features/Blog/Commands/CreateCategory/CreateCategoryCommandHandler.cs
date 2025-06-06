using MediatR;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Blog.DTOs;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.Blog.Commands.CreateCategory
{
    public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, CreateCategoryResponse>
    {
        private readonly IBlogService _blogService;
        
        public CreateCategoryCommandHandler(IBlogService blogService)
        {
            _blogService = blogService;
        }
        
        public async Task<CreateCategoryResponse> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
        {
            // Check if name is provided
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return new CreateCategoryResponse
                {
                    Success = false,
                    Message = "Category name is required"
                };
            }
            
            // Create the category
            var category = await _blogService.CreateCategoryAsync(request.Name, request.Slug);
            
            // Map to DTO
            var categoryDto = new BlogCategoryDto
            {
                Id = category.BlogCategoryId,
                Name = category.Name,
                Slug = category.Slug.ToLower()
            };
            
            return new CreateCategoryResponse
            {
                Success = true,
                Message = "Category created successfully",
                Category = categoryDto
            };
        }
    }
} 