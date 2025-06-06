using MixWarz.Application.Features.Blog.DTOs;

namespace MixWarz.Application.Features.Blog.Commands.UpdateTag
{
    public class UpdateTagResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public BlogTagDto Tag { get; set; }
    }
}