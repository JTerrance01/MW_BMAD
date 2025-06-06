using MediatR;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Admin.Queries.GetCompetitionsList
{
    /// <summary>
    /// Query to retrieve a list of all competitions for admin view
    /// </summary>
    public class GetCompetitionsListQuery : IRequest<CompetitionsListVm>
    {
        /// <summary>
        /// Optional organizer user ID to filter competitions by
        /// </summary>
        public string OrganizerId { get; set; }

        /// <summary>
        /// Optional competition status to filter by.
        /// Can be a single status or multiple statuses.
        /// </summary>
        public List<CompetitionStatus>? Statuses { get; set; }

        /// <summary>
        /// Legacy property for backward compatibility
        /// </summary>
        public CompetitionStatus? Status { get; set; }

        /// <summary>
        /// Optional search term to search in competition title or description
        /// </summary>
        public string SearchTerm { get; set; }

        /// <summary>
        /// Optional date range start
        /// </summary>
        public DateTime? StartDateFrom { get; set; }

        /// <summary>
        /// Optional date range end
        /// </summary>
        public DateTime? StartDateTo { get; set; }

        /// <summary>
        /// Page number (1-based) for pagination
        /// </summary>
        public int Page { get; set; } = 1;

        /// <summary>
        /// Number of competitions per page
        /// </summary>
        public int PageSize { get; set; } = 10;
    }
}