
namespace MixWarz.Application.Features.Admin.Queries.GetCompetitionsList
{
    /// <summary>
    /// View model for the competition list response for admin view
    /// </summary>
    public class CompetitionsListVm
    {
        /// <summary>
        /// List of competitions matching the query parameters
        /// </summary>
        public List<CompetitionDto> Competitions { get; set; } = new List<CompetitionDto>();
        
        /// <summary>
        /// Total number of competitions matching the search criteria (before pagination)
        /// </summary>
        public int TotalCount { get; set; }
        
        /// <summary>
        /// Current page number
        /// </summary>
        public int Page { get; set; }
        
        /// <summary>
        /// Number of competitions per page
        /// </summary>
        public int PageSize { get; set; }
        
        /// <summary>
        /// Total number of pages
        /// </summary>
        public int TotalPages => (TotalCount + PageSize - 1) / PageSize;
    }
} 