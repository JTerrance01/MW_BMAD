using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Infrastructure.Persistence.Repositories
{
    public class SubmissionVoteRepository : ISubmissionVoteRepository
    {
        private readonly AppDbContext _context;

        public SubmissionVoteRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<SubmissionVote> GetByIdAsync(int id)
        {
            return await _context.SubmissionVotes
                .Include(sv => sv.Submission)
                .Include(sv => sv.Voter)
                .FirstOrDefaultAsync(sv => sv.SubmissionVoteId == id);
        }

        public async Task<IEnumerable<SubmissionVote>> GetByCompetitionIdAsync(
            int competitionId,
            int votingRound,
            int page = 1,
            int pageSize = 50)
        {
            return await _context.SubmissionVotes
                .Include(sv => sv.Submission)
                .Include(sv => sv.Voter)
                .Where(sv => sv.CompetitionId == competitionId && sv.VotingRound == votingRound)
                .OrderBy(sv => sv.Submission.SubmissionId)
                .ThenBy(sv => sv.VoteTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<SubmissionVote>> GetBySubmissionIdAsync(
            int submissionId,
            int votingRound,
            int page = 1,
            int pageSize = 50)
        {
            return await _context.SubmissionVotes
                .Include(sv => sv.Voter)
                .Where(sv => sv.SubmissionId == submissionId && sv.VotingRound == votingRound)
                .OrderBy(sv => sv.VoteTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<SubmissionVote>> GetByVoterIdAsync(
            string voterId,
            int competitionId,
            int votingRound)
        {
            return await _context.SubmissionVotes
                .Include(sv => sv.Submission)
                .Where(sv => sv.VoterId == voterId &&
                       sv.CompetitionId == competitionId &&
                       sv.VotingRound == votingRound)
                .OrderBy(sv => sv.Rank)
                .ToListAsync();
        }

        public async Task<IEnumerable<SubmissionVote>> GetAllVotesByVoterForCompetitionAsync(
            string voterId,
            int competitionId)
        {
            return await _context.SubmissionVotes
                .Include(sv => sv.Submission)
                .Where(sv => sv.VoterId == voterId && sv.CompetitionId == competitionId)
                .OrderBy(sv => sv.VotingRound)
                .ThenBy(sv => sv.Rank)
                .ToListAsync();
        }

        public async Task<bool> HasVoterSubmittedAllVotesAsync(
            string voterId,
            int competitionId,
            int votingRound,
            int requiredVoteCount)
        {
            var voteCount = await _context.SubmissionVotes
                .CountAsync(sv => sv.VoterId == voterId &&
                           sv.CompetitionId == competitionId &&
                           sv.VotingRound == votingRound);

            return voteCount >= requiredVoteCount;
        }

        public async Task<int> GetVoteCountByVoterForCompetitionAsync(
            string voterId,
            int competitionId,
            int votingRound)
        {
            return await _context.SubmissionVotes
                .CountAsync(sv => sv.VoterId == voterId &&
                           sv.CompetitionId == competitionId &&
                           sv.VotingRound == votingRound);
        }

        public async Task<int> CreateAsync(SubmissionVote vote)
        {
            await _context.SubmissionVotes.AddAsync(vote);
            await _context.SaveChangesAsync();
            return vote.SubmissionVoteId;
        }

        public async Task UpdateAsync(SubmissionVote vote)
        {
            _context.SubmissionVotes.Update(vote);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var vote = await _context.SubmissionVotes.FindAsync(id);
            if (vote == null)
            {
                return false;
            }

            _context.SubmissionVotes.Remove(vote);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.SubmissionVotes.AnyAsync(sv => sv.SubmissionVoteId == id);
        }

        public async Task<int> GetTotalPointsForSubmissionAsync(int submissionId, int votingRound)
        {
            return await _context.SubmissionVotes
                .Where(sv => sv.SubmissionId == submissionId && sv.VotingRound == votingRound)
                .SumAsync(sv => sv.Points);
        }

        public async Task<Dictionary<int, int>> GetPointSummaryForCompetitionAsync(
            int competitionId,
            int votingRound)
        {
            var points = await _context.SubmissionVotes
                .Where(sv => sv.CompetitionId == competitionId && sv.VotingRound == votingRound)
                .GroupBy(sv => sv.SubmissionId)
                .Select(g => new { SubmissionId = g.Key, TotalPoints = g.Sum(sv => sv.Points) })
                .ToDictionaryAsync(x => x.SubmissionId, x => x.TotalPoints);

            return points;
        }

        public async Task<bool> HasVotesForCompetitionAsync(int competitionId, int votingRound)
        {
            return await _context.SubmissionVotes
                .AnyAsync(sv => sv.CompetitionId == competitionId && sv.VotingRound == votingRound);
        }
    }
}