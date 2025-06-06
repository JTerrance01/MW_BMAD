using MediatR;

namespace MixWarz.Application.Features.Admin.Queries.GetStatistics
{
    public class GetAdminStatisticsQuery : IRequest<AdminStatisticsVm>
    {
        // No parameters needed - will fetch all statistics
    }
} 