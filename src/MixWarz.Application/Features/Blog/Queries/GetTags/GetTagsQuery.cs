using MediatR;
using MixWarz.Application.Features.Blog.DTOs;
using System.Collections.Generic;

namespace MixWarz.Application.Features.Blog.Queries.GetTags
{
    public class GetTagsQuery : IRequest<GetTagsResponse>
    {
    }
    
    public class GetTagsResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public IEnumerable<BlogTagDto> Tags { get; set; }
    }
} 