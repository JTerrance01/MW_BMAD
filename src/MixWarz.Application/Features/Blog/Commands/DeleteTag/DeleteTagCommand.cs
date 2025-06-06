using MediatR;

namespace MixWarz.Application.Features.Blog.Commands.DeleteTag
{
    public class DeleteTagCommand : IRequest<DeleteTagResponse>
    {
        public int Id { get; set; }
    }
}