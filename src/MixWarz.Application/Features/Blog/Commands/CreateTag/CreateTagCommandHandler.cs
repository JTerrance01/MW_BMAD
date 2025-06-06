using MediatR;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Blog.DTOs;

namespace MixWarz.Application.Features.Blog.Commands.CreateTag
{
    public class CreateTagCommandHandler : IRequestHandler<CreateTagCommand, CreateTagResponse>
    {
        private readonly IBlogService _blogService;
        
        public CreateTagCommandHandler(IBlogService blogService)
        {
            _blogService = blogService;
        }
        
        public async Task<CreateTagResponse> Handle(CreateTagCommand request, CancellationToken cancellationToken)
        {
            // Check if name is provided
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return new CreateTagResponse
                {
                    Success = false,
                    Message = "Tag name is required"
                };
            }
            
            // Create the tag
            var tag = await _blogService.CreateTagAsync(request.Name, request.Slug);
            
            // Map to DTO
            var tagDto = new BlogTagDto
            {
                Id = tag.BlogTagId,
                Name = tag.Name,
                Slug = tag.Slug.ToLower()
            };
            
            return new CreateTagResponse
            {
                Success = true,
                Message = "Tag created successfully",
                Tag = tagDto
            };
        }
    }
} 