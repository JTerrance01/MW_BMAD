using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;

namespace MixWarz.Domain.Interfaces
{
    public interface ICompetitionRepository
    {
        Task<Competition> GetByIdAsync(int id);
        Task<IEnumerable<Competition>> GetAllAsync(int page = 1, int pageSize = 10);
        Task<IEnumerable<Competition>> GetByStatusAsync(CompetitionStatus status, int page = 1, int pageSize = 10);
        Task<IEnumerable<Competition>> GetByOrganizerIdAsync(string organizerId, int page = 1, int pageSize = 10);
        Task<int> CreateAsync(Competition competition);
        Task UpdateAsync(Competition competition);
        Task<bool> ExistsAsync(int id);
        Task<int> GetTotalCountAsync();
        Task<int> GetCountByStatusAsync(CompetitionStatus status);

        // Admin-specific methods
        Task<(IEnumerable<Competition> Competitions, int TotalCount)> GetCompetitionsForAdminAsync(
            string organizerId,
            CompetitionStatus? status,
            string searchTerm,
            DateTime? startDateFrom,
            DateTime? startDateTo,
            int page = 1,
            int pageSize = 10,
            CancellationToken cancellationToken = default);

        Task<(IEnumerable<Competition> Competitions, int TotalCount)> GetCompetitionsForAdminAsync(
            string organizerId,
            List<CompetitionStatus>? statuses,
            string searchTerm,
            DateTime? startDateFrom,
            DateTime? startDateTo,
            int page = 1,
            int pageSize = 10,
            CancellationToken cancellationToken = default);

        Task UpdateCompetitionStatusAsync(int competitionId, CompetitionStatus newStatus, CancellationToken cancellationToken = default);
        Task DeleteAsync(int competitionId);
    }
}