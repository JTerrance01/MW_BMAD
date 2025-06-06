using MixWarz.Application.Features.Blog.DTOs;

namespace MixWarz.Application.Features.Blog.Commands.UpdateCategory
{
    public class UpdateCategoryResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public BlogCategoryDto Category { get; set; }
    }
}