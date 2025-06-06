using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MixWarz.Infrastructure.Persistence.Repositories
{
    public class SongCreatorPickRepository : ISongCreatorPickRepository
    {
        private readonly AppDbContext _context;

        public SongCreatorPickRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<SongCreatorPick> GetByIdAsync(int id)
        {
            return await _context.SongCreatorPicks
                .Include(scp => scp.Competition)
                .Include(scp => scp.Submission)
                .FirstOrDefaultAsync(scp => scp.PickId == id);
        }

        public async Task<SongCreatorPick> GetByCompetitionAndRankAsync(int competitionId, int rank)
        {
            return await _context.SongCreatorPicks
                .Include(scp => scp.Submission)
                .FirstOrDefaultAsync(scp => scp.CompetitionId == competitionId && scp.Rank == rank);
        }

        public async Task<IEnumerable<SongCreatorPick>> GetByCompetitionIdAsync(int competitionId)
        {
            return await _context.SongCreatorPicks
                .Include(scp => scp.Submission)
                .ThenInclude(s => s.User)
                .Where(scp => scp.CompetitionId == competitionId)
                .OrderBy(scp => scp.Rank)
                .ToListAsync();
        }

        public async Task<int> CreateAsync(SongCreatorPick pick)
        {
            await _context.SongCreatorPicks.AddAsync(pick);
            await _context.SaveChangesAsync();
            return pick.PickId;
        }

        public async Task UpdateAsync(SongCreatorPick pick)
        {
            _context.SongCreatorPicks.Update(pick);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var pick = await _context.SongCreatorPicks.FindAsync(id);
            if (pick == null)
            {
                return false;
            }

            _context.SongCreatorPicks.Remove(pick);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.SongCreatorPicks.AnyAsync(scp => scp.PickId == id);
        }

        public async Task<bool> ExistsByCompetitionAndRankAsync(int competitionId, int rank)
        {
            return await _context.SongCreatorPicks
                .AnyAsync(scp => scp.CompetitionId == competitionId && scp.Rank == rank);
        }

        public async Task<int> GetCountByCompetitionIdAsync(int competitionId)
        {
            return await _context.SongCreatorPicks
                .CountAsync(scp => scp.CompetitionId == competitionId);
        }

        public async Task<bool> ExistsForCompetitionAsync(int competitionId)
        {
            return await _context.SongCreatorPicks
                .AnyAsync(scp => scp.CompetitionId == competitionId);
        }

        public async Task<int> DeleteByCompetitionIdAsync(int competitionId)
        {
            var picks = await _context.SongCreatorPicks
                .Where(scp => scp.CompetitionId == competitionId)
                .ToListAsync();

            _context.SongCreatorPicks.RemoveRange(picks);
            await _context.SaveChangesAsync();
            return picks.Count;
        }

        // Alias for backward compatibility
        public async Task ClearPicksForCompetitionAsync(int competitionId)
        {
            await DeleteByCompetitionIdAsync(competitionId);
        }
    }
}