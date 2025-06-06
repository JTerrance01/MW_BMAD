using MediatR;
using MixWarz.Application.Features.Blog.DTOs;
using System.ComponentModel.DataAnnotations;

namespace MixWarz.Application.Features.Blog.Commands.CreateCategory
{
    public class CreateCategoryCommand : IRequest<CreateCategoryResponse>
    {
        [Required]
        public string Name { get; set; }
        
        public string Slug { get; set; }
    }
    
    public class CreateCategoryResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public BlogCategoryDto Category { get; set; }
    }
} 