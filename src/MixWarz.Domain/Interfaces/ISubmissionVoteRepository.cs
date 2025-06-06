using System.Collections.Generic;
using System.Threading.Tasks;
using MixWarz.Domain.Entities;

namespace MixWarz.Domain.Interfaces
{
    public interface ISubmissionVoteRepository
    {
        Task<SubmissionVote> GetByIdAsync(int id);

        Task<IEnumerable<SubmissionVote>> GetByCompetitionIdAsync(
            int competitionId,
            int votingRound,
            int page = 1,
            int pageSize = 50);

        Task<IEnumerable<SubmissionVote>> GetBySubmissionIdAsync(
            int submissionId,
            int votingRound,
            int page = 1,
            int pageSize = 50);

        Task<IEnumerable<SubmissionVote>> GetByVoterIdAsync(
            string voterId,
            int competitionId,
            int votingRound);

        Task<IEnumerable<SubmissionVote>> GetAllVotesByVoterForCompetitionAsync(
            string voterId,
            int competitionId);

        Task<bool> HasVoterSubmittedAllVotesAsync(
            string voterId,
            int competitionId,
            int votingRound,
            int requiredVoteCount);

        Task<int> GetVoteCountByVoterForCompetitionAsync(
            string voterId,
            int competitionId,
            int votingRound);

        Task<int> CreateAsync(SubmissionVote vote);

        Task UpdateAsync(SubmissionVote vote);

        Task<bool> DeleteAsync(int id);

        Task<bool> ExistsAsync(int id);

        Task<int> GetTotalPointsForSubmissionAsync(int submissionId, int votingRound);

        Task<Dictionary<int, int>> GetPointSummaryForCompetitionAsync(
            int competitionId,
            int votingRound);

        Task<bool> HasVotesForCompetitionAsync(int competitionId, int votingRound);
    }
}