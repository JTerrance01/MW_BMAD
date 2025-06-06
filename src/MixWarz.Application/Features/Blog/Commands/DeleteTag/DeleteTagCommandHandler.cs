using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MixWarz.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace MixWarz.Application.Features.Blog.Commands.DeleteTag
{
    public class DeleteTagCommandHandler : IRequestHandler<DeleteTagCommand, DeleteTagResponse>
    {
        private readonly IBlogService _blogService;
        private readonly ILogger<DeleteTagCommandHandler> _logger;

        public DeleteTagCommandHandler(IBlogService blogService, ILogger<DeleteTagCommandHandler> logger)
        {
            _blogService = blogService ?? throw new ArgumentNullException(nameof(blogService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<DeleteTagResponse> Handle(DeleteTagCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Attempting to delete tag with ID {TagId}", request.Id);

                // Check if tag exists
                var tagExists = await _blogService.TagExistsAsync(request.Id);

                if (!tagExists)
                {
                    _logger.LogWarning("Failed to delete tag - Tag with ID {TagId} not found", request.Id);
                    return new DeleteTagResponse
                    {
                        Success = false,
                        Message = $"Tag with ID {request.Id} not found"
                    };
                }

                // Delete the tag
                var isDeleted = await _blogService.DeleteTagAsync(request.Id);

                if (!isDeleted)
                {
                    _logger.LogWarning("Failed to delete tag with ID {TagId} - Operation returned false", request.Id);
                    return new DeleteTagResponse
                    {
                        Success = false,
                        Message = "Failed to delete tag - it may be in use or protected"
                    };
                }

                _logger.LogInformation("Successfully deleted tag with ID {TagId}", request.Id);
                return new DeleteTagResponse
                {
                    Success = true,
                    Message = "Tag deleted successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting tag with ID {TagId}", request.Id);
                return new DeleteTagResponse
                {
                    Success = false,
                    Message = $"An error occurred while deleting the tag: {ex.Message}"
                };
            }
        }
    }
}