using MixWarz.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MixWarz.Domain.Interfaces
{
    public interface ISubmissionGroupRepository
    {
        Task<SubmissionGroup> GetByIdAsync(int id);

        Task<SubmissionGroup> GetByCompetitionAndSubmissionAsync(int competitionId, int submissionId);

        Task<IEnumerable<SubmissionGroup>> GetByCompetitionIdAsync(int competitionId);

        Task<IEnumerable<SubmissionGroup>> GetByCompetitionAndGroupAsync(int competitionId, int groupNumber);

        Task<IEnumerable<SubmissionGroup>> GetTopSubmissionsPerGroupAsync(int competitionId, int count);

        Task<IEnumerable<SubmissionGroup>> GetAdvancingSubmissionsAsync(int competitionId);

        Task<int> CreateAsync(SubmissionGroup submissionGroup);

        Task<int> CreateManyAsync(IEnumerable<SubmissionGroup> submissionGroups);

        Task UpdateAsync(SubmissionGroup submissionGroup);

        Task UpdateScoresAsync(int competitionId, int submissionId, int totalPoints, int firstPlaceVotes, int secondPlaceVotes, int thirdPlaceVotes);

        Task<bool> ExistsAsync(int id);

        Task<bool> ExistsByCompetitionAndSubmissionAsync(int competitionId, int submissionId);

        Task<int> GetCountByCompetitionIdAsync(int competitionId);

        Task<int> GetGroupCountByCompetitionIdAsync(int competitionId);

        Task<int> GetSubmissionCountInGroupAsync(int competitionId, int groupNumber);

        Task<bool> DeleteAsync(int id);
    }
}