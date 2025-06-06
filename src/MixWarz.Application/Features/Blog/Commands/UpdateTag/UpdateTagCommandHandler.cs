using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Blog.DTOs;

namespace MixWarz.Application.Features.Blog.Commands.UpdateTag
{
    public class UpdateTagCommandHandler : IRequestHandler<UpdateTagCommand, UpdateTagResponse>
    {
        private readonly IBlogService _blogService;

        public UpdateTagCommandHandler(IBlogService blogService)
        {
            _blogService = blogService;
        }

        public async Task<UpdateTagResponse> Handle(UpdateTagCommand request, CancellationToken cancellationToken)
        {
            // Check if tag exists
            var tagExists = await _blogService.TagExistsAsync(request.Id);

            if (!tagExists)
            {
                return new UpdateTagResponse
                {
                    Success = false,
                    Message = $"Tag with ID {request.Id} not found",
                    Tag = null
                };
            }

            // Update the tag
            var updatedTag = await _blogService.UpdateTagAsync(
                request.Id,
                request.Name,
                request.Slug.ToLower()
            );

            if (updatedTag == null)
            {
                return new UpdateTagResponse
                {
                    Success = false,
                    Message = "Failed to update tag",
                    Tag = null
                };
            }

            // Map domain entity to DTO
            var tagDto = new BlogTagDto
            {
                Id = updatedTag.BlogTagId,
                Name = updatedTag.Name,
                Slug = updatedTag.Slug
            };

            return new UpdateTagResponse
            {
                Success = true,
                Message = "Tag updated successfully",
                Tag = tagDto
            };
        }
    }
}