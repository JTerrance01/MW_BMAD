using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;

namespace MixWarz.Domain.Interfaces
{
    public interface ISubmissionRepository
    {
        Task<Submission> GetByIdAsync(int id);
        Task<IEnumerable<Submission>> GetByCompetitionIdAsync(int competitionId, int page = 1, int pageSize = 10);
        Task<IEnumerable<Submission>> GetByUserIdAsync(string userId, int page = 1, int pageSize = 10);
        Task<IEnumerable<Submission>> GetByCompetitionIdAndStatusAsync(int competitionId, SubmissionStatus status, int page = 1, int pageSize = 10);
        Task<IEnumerable<Submission>> GetByCompetitionIdAndUserIdAsync(int competitionId, string userId);
        Task<int> CreateAsync(Submission submission);
        Task UpdateAsync(Submission submission);
        Task DeleteAsync(Submission submission);
        Task<bool> ExistsAsync(int id);
        Task<bool> ExistsByCompetitionAndUserAsync(int competitionId, string userId);
        Task<int> GetCountByCompetitionIdAsync(int competitionId);
        Task<int> GetCountByUserIdAsync(string userId);

        // Admin-specific methods
        Task<int> GetSubmissionCountForCompetitionAsync(int competitionId, CancellationToken cancellationToken = default);
    }
}