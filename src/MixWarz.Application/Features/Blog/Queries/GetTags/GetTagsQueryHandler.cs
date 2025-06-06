using MediatR;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Application.Features.Blog.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.Blog.Queries.GetTags
{
    public class GetTagsQueryHandler : IRequestHandler<GetTagsQuery, GetTagsResponse>
    {
        private readonly IBlogService _blogService;
        
        public GetTagsQueryHandler(IBlogService blogService)
        {
            _blogService = blogService;
        }
        
        public async Task<GetTagsResponse> Handle(GetTagsQuery request, CancellationToken cancellationToken)
        {
            var tags = await _blogService.GetAllTagsAsync();
            
            var tagDtos = tags.Select(t => new BlogTagDto
            {
                Id = t.BlogTagId,
                Name = t.Name,
                Slug = t.Slug
            });
            
            return new GetTagsResponse
            {
                Success = true,
                Message = "Tags retrieved successfully",
                Tags = tagDtos
            };
        }
    }
} 