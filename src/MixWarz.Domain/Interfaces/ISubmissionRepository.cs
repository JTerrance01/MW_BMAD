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

        // Judgment-specific methods
        /// <summary>
        /// Adds or updates a submission judgment and its associated criteria scores within a single transaction.
        /// </summary>
        /// <param name="judgment">The submission judgment entity to add or update.</param>
        /// <param name="scores">A collection of criteria scores associated with the judgment.</param>
        /// <param name="isUpdate">Indicates whether this is an update operation (removes existing criteria scores).</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        Task AddJudgmentWithScoresAsync(SubmissionJudgment judgment, IEnumerable<CriteriaScore> scores, bool isUpdate, CancellationToken cancellationToken);
    }
}