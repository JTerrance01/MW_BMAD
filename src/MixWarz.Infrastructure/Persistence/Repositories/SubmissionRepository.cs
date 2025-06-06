using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Infrastructure.Persistence.Repositories
{
    public class SubmissionRepository : ISubmissionRepository
    {
        private readonly AppDbContext _context;

        public SubmissionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Submission> GetByIdAsync(int id)
        {
            return await _context.Submissions
                .Include(s => s.Competition)
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.SubmissionId == id);
        }

        public async Task<IEnumerable<Submission>> GetByCompetitionIdAsync(int competitionId, int page = 1, int pageSize = 10)
        {
            return await _context.Submissions
                .Include(s => s.User)
                .Where(s => s.CompetitionId == competitionId)
                .OrderByDescending(s => s.SubmissionDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<Submission>> GetByUserIdAsync(string userId, int page = 1, int pageSize = 10)
        {
            return await _context.Submissions
                .Include(s => s.Competition)
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.SubmissionDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<Submission>> GetByCompetitionIdAndStatusAsync(int competitionId, SubmissionStatus status, int page = 1, int pageSize = 10)
        {
            return await _context.Submissions
                .Include(s => s.User)
                .Where(s => s.CompetitionId == competitionId && s.Status == status)
                .OrderByDescending(s => s.SubmissionDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> CreateAsync(Submission submission)
        {
            await _context.Submissions.AddAsync(submission);
            await _context.SaveChangesAsync();
            return submission.SubmissionId;
        }

        public async Task UpdateAsync(Submission submission)
        {
            _context.Submissions.Update(submission);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Submission submission)
        {
            _context.Submissions.Remove(submission);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Submissions.AnyAsync(s => s.SubmissionId == id);
        }

        public async Task<bool> ExistsByCompetitionAndUserAsync(int competitionId, string userId)
        {
            return await _context.Submissions.AnyAsync(s => s.CompetitionId == competitionId && s.UserId == userId);
        }

        public async Task<int> GetCountByCompetitionIdAsync(int competitionId)
        {
            return await _context.Submissions.CountAsync(s => s.CompetitionId == competitionId);
        }

        public async Task<int> GetCountByUserIdAsync(string userId)
        {
            return await _context.Submissions.CountAsync(s => s.UserId == userId);
        }

        public async Task<int> GetSubmissionCountForCompetitionAsync(int competitionId, CancellationToken cancellationToken = default)
        {
            return await _context.Submissions
                .Where(s => s.CompetitionId == competitionId)
                .CountAsync(cancellationToken);
        }

        public async Task<IEnumerable<Submission>> GetByCompetitionIdAndUserIdAsync(int competitionId, string userId)
        {
            return await _context.Submissions
                .Include(s => s.User)
                .Where(s => s.CompetitionId == competitionId && s.UserId == userId)
                .OrderByDescending(s => s.SubmissionDate)
                .ToListAsync();
        }
    }
}