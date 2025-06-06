using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MixWarz.Infrastructure.Persistence.Repositories
{
    public class Round1AssignmentRepository : IRound1AssignmentRepository
    {
        private readonly AppDbContext _context;

        public Round1AssignmentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Round1Assignment> GetByIdAsync(int id)
        {
            return await _context.Round1Assignments
                .Include(r => r.Competition)
                .Include(r => r.Voter)
                .FirstOrDefaultAsync(r => r.Round1AssignmentId == id);
        }

        public async Task<Round1Assignment> GetByCompetitionAndVoterAsync(int competitionId, string voterId)
        {
            return await _context.Round1Assignments
                .Include(r => r.Competition)
                .Include(r => r.Voter)
                .FirstOrDefaultAsync(r => r.CompetitionId == competitionId && r.VoterId == voterId);
        }

        public async Task<IEnumerable<Round1Assignment>> GetByCompetitionIdAsync(int competitionId)
        {
            return await _context.Round1Assignments
                .Include(r => r.Voter)
                .Where(r => r.CompetitionId == competitionId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Round1Assignment>> GetByCompetitionAndGroupAsync(int competitionId, int assignedGroupNumber)
        {
            return await _context.Round1Assignments
                .Include(r => r.Voter)
                .Where(r => r.CompetitionId == competitionId && r.AssignedGroupNumber == assignedGroupNumber)
                .ToListAsync();
        }

        public async Task<IEnumerable<Round1Assignment>> GetNonVotersAsync(int competitionId)
        {
            return await _context.Round1Assignments
                .Include(r => r.Voter)
                .Where(r => r.CompetitionId == competitionId && !r.HasVoted)
                .ToListAsync();
        }

        public async Task<bool> HasVoterSubmittedAsync(int competitionId, string voterId)
        {
            var assignment = await _context.Round1Assignments
                .Where(r => r.CompetitionId == competitionId && r.VoterId == voterId)
                .FirstOrDefaultAsync();

            return assignment != null && assignment.HasVoted;
        }

        public async Task<int> CreateAsync(Round1Assignment assignment)
        {
            await _context.Round1Assignments.AddAsync(assignment);
            await _context.SaveChangesAsync();
            return assignment.Round1AssignmentId;
        }

        public async Task<int> CreateManyAsync(IEnumerable<Round1Assignment> assignments)
        {
            await _context.Round1Assignments.AddRangeAsync(assignments);
            return await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Round1Assignment assignment)
        {
            _context.Round1Assignments.Update(assignment);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateVotingStatusAsync(int competitionId, string voterId, bool hasVoted)
        {
            var assignment = await _context.Round1Assignments
                .FirstOrDefaultAsync(r => r.CompetitionId == competitionId && r.VoterId == voterId);

            if (assignment != null)
            {
                assignment.HasVoted = hasVoted;
                if (hasVoted)
                {
                    assignment.VotingCompletedDate = DateTimeOffset.UtcNow;
                }

                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Round1Assignments.AnyAsync(r => r.Round1AssignmentId == id);
        }

        public async Task<bool> ExistsByCompetitionAndVoterAsync(int competitionId, string voterId)
        {
            return await _context.Round1Assignments
                .AnyAsync(r => r.CompetitionId == competitionId && r.VoterId == voterId);
        }

        public async Task<int> GetCountByCompetitionIdAsync(int competitionId)
        {
            return await _context.Round1Assignments
                .CountAsync(r => r.CompetitionId == competitionId);
        }

        public async Task<int> GetVoterCountByCompetitionIdAsync(int competitionId)
        {
            return await _context.Round1Assignments
                .Where(r => r.CompetitionId == competitionId)
                .Select(r => r.VoterId)
                .Distinct()
                .CountAsync();
        }

        public async Task<int> GetGroupCountByCompetitionIdAsync(int competitionId)
        {
            return await _context.Round1Assignments
                .Where(r => r.CompetitionId == competitionId)
                .Select(r => r.AssignedGroupNumber)
                .Distinct()
                .CountAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var assignment = await _context.Round1Assignments.FindAsync(id);
            if (assignment == null)
            {
                return false;
            }

            _context.Round1Assignments.Remove(assignment);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}