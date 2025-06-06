using MixWarz.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MixWarz.Domain.Interfaces
{
    public interface IRound1AssignmentRepository
    {
        Task<Round1Assignment> GetByIdAsync(int id);

        Task<Round1Assignment> GetByCompetitionAndVoterAsync(int competitionId, string voterId);

        Task<IEnumerable<Round1Assignment>> GetByCompetitionIdAsync(int competitionId);

        Task<IEnumerable<Round1Assignment>> GetByCompetitionAndGroupAsync(int competitionId, int assignedGroupNumber);

        Task<IEnumerable<Round1Assignment>> GetNonVotersAsync(int competitionId);

        Task<bool> HasVoterSubmittedAsync(int competitionId, string voterId);

        Task<int> CreateAsync(Round1Assignment assignment);

        Task<int> CreateManyAsync(IEnumerable<Round1Assignment> assignments);

        Task UpdateAsync(Round1Assignment assignment);

        Task UpdateVotingStatusAsync(int competitionId, string voterId, bool hasVoted);

        Task<bool> ExistsAsync(int id);

        Task<bool> ExistsByCompetitionAndVoterAsync(int competitionId, string voterId);

        Task<int> GetCountByCompetitionIdAsync(int competitionId);

        Task<int> GetVoterCountByCompetitionIdAsync(int competitionId);

        Task<int> GetGroupCountByCompetitionIdAsync(int competitionId);

        Task<bool> DeleteAsync(int id);
    }
}