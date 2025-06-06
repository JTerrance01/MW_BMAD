using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;


namespace MixWarz.Infrastructure.Persistence.Repositories
{
    public class SubmissionGroupRepository : ISubmissionGroupRepository
    {
        private readonly AppDbContext _context;

        public SubmissionGroupRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<SubmissionGroup> GetByIdAsync(int id)
        {
            return await _context.SubmissionGroups
                .Include(sg => sg.Competition)
                .Include(sg => sg.Submission)
                .FirstOrDefaultAsync(sg => sg.SubmissionGroupId == id);
        }

        public async Task<SubmissionGroup> GetByCompetitionAndSubmissionAsync(int competitionId, int submissionId)
        {
            return await _context.SubmissionGroups
                .Include(sg => sg.Submission)
                .FirstOrDefaultAsync(sg => sg.CompetitionId == competitionId && sg.SubmissionId == submissionId);
        }

        public async Task<IEnumerable<SubmissionGroup>> GetByCompetitionIdAsync(int competitionId)
        {
            return await _context.SubmissionGroups
                .Include(sg => sg.Submission)
                .ThenInclude(s => s.User)
                .Where(sg => sg.CompetitionId == competitionId)
                .ToListAsync();
        }

        public async Task<IEnumerable<SubmissionGroup>> GetByCompetitionAndGroupAsync(int competitionId, int groupNumber)
        {
            return await _context.SubmissionGroups
                .Include(sg => sg.Submission)
                .ThenInclude(s => s.User)
                .Where(sg => sg.CompetitionId == competitionId && sg.GroupNumber == groupNumber)
                .ToListAsync();
        }

        public async Task<IEnumerable<SubmissionGroup>> GetTopSubmissionsPerGroupAsync(int competitionId, int count)
        {
            var groups = await _context.SubmissionGroups
                .Where(sg => sg.CompetitionId == competitionId)
                .Select(sg => sg.GroupNumber)
                .Distinct()
                .ToListAsync();

            var result = new List<SubmissionGroup>();

            foreach (var groupNumber in groups)
            {
                var topInGroup = await _context.SubmissionGroups
                    .Include(sg => sg.Submission)
                    .ThenInclude(s => s.User)
                    .Where(sg => sg.CompetitionId == competitionId &&
                           sg.GroupNumber == groupNumber &&
                           sg.TotalPoints.HasValue &&
                           !sg.Submission.IsDisqualified)
                    .OrderByDescending(sg => sg.TotalPoints)
                    .ThenByDescending(sg => sg.FirstPlaceVotes)
                    .ThenByDescending(sg => sg.SecondPlaceVotes)
                    .ThenByDescending(sg => sg.ThirdPlaceVotes)
                    .Take(count)
                    .ToListAsync();

                result.AddRange(topInGroup);
            }

            return result;
        }

        public async Task<IEnumerable<SubmissionGroup>> GetAdvancingSubmissionsAsync(int competitionId)
        {
            // Get submissions where RankInGroup <= 2 (top 2 in each group)
            return await _context.SubmissionGroups
                .Include(sg => sg.Submission)
                .ThenInclude(s => s.User)
                .Where(sg => sg.CompetitionId == competitionId &&
                       sg.RankInGroup.HasValue &&
                       sg.RankInGroup <= 2 &&
                       !sg.Submission.IsDisqualified)
                .OrderBy(sg => sg.GroupNumber)
                .ThenBy(sg => sg.RankInGroup)
                .ToListAsync();
        }

        public async Task<int> CreateAsync(SubmissionGroup submissionGroup)
        {
            await _context.SubmissionGroups.AddAsync(submissionGroup);
            await _context.SaveChangesAsync();
            return submissionGroup.SubmissionGroupId;
        }

        public async Task<int> CreateManyAsync(IEnumerable<SubmissionGroup> submissionGroups)
        {
            await _context.SubmissionGroups.AddRangeAsync(submissionGroups);
            return await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(SubmissionGroup submissionGroup)
        {
            _context.SubmissionGroups.Update(submissionGroup);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateScoresAsync(int competitionId, int submissionId, int totalPoints, int firstPlaceVotes, int secondPlaceVotes, int thirdPlaceVotes)
        {
            var submissionGroup = await _context.SubmissionGroups
                .FirstOrDefaultAsync(sg => sg.CompetitionId == competitionId && sg.SubmissionId == submissionId);

            if (submissionGroup != null)
            {
                submissionGroup.TotalPoints = totalPoints;
                submissionGroup.FirstPlaceVotes = firstPlaceVotes;
                submissionGroup.SecondPlaceVotes = secondPlaceVotes;
                submissionGroup.ThirdPlaceVotes = thirdPlaceVotes;

                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.SubmissionGroups.AnyAsync(sg => sg.SubmissionGroupId == id);
        }

        public async Task<bool> ExistsByCompetitionAndSubmissionAsync(int competitionId, int submissionId)
        {
            return await _context.SubmissionGroups
                .AnyAsync(sg => sg.CompetitionId == competitionId && sg.SubmissionId == submissionId);
        }

        public async Task<int> GetCountByCompetitionIdAsync(int competitionId)
        {
            return await _context.SubmissionGroups.CountAsync(sg => sg.CompetitionId == competitionId);
        }

        public async Task<int> GetGroupCountByCompetitionIdAsync(int competitionId)
        {
            return await _context.SubmissionGroups
                .Where(sg => sg.CompetitionId == competitionId)
                .Select(sg => sg.GroupNumber)
                .Distinct()
                .CountAsync();
        }

        public async Task<int> GetSubmissionCountInGroupAsync(int competitionId, int groupNumber)
        {
            return await _context.SubmissionGroups
                .CountAsync(sg => sg.CompetitionId == competitionId && sg.GroupNumber == groupNumber);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var submissionGroup = await _context.SubmissionGroups.FindAsync(id);
            if (submissionGroup == null)
            {
                return false;
            }

            _context.SubmissionGroups.Remove(submissionGroup);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}