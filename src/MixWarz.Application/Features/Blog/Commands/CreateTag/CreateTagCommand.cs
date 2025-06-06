using MediatR;
using MixWarz.Application.Features.Blog.DTOs;
using System.ComponentModel.DataAnnotations;

namespace MixWarz.Application.Features.Blog.Commands.CreateTag
{
    public class CreateTagCommand : IRequest<CreateTagResponse>
    {
        [Required]
        public string Name { get; set; }
        
        public string Slug { get; set; }
    }
    
    public class CreateTagResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public BlogTagDto Tag { get; set; }
    }
} 