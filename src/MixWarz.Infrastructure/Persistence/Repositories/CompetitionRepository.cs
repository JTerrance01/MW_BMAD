using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Infrastructure.Persistence.Repositories
{
    public class CompetitionRepository : ICompetitionRepository
    {
        private readonly AppDbContext _context;

        public CompetitionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Competition> GetByIdAsync(int id)
        {
            return await _context.Competitions
                .Include(c => c.Organizer)
                .FirstOrDefaultAsync(c => c.CompetitionId == id);
        }

        public async Task<IEnumerable<Competition>> GetAllAsync(int page = 1, int pageSize = 10)
        {
            return await _context.Competitions
                .Include(c => c.Organizer)
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        // Optimized method for list displays that don't need full entity data
        public async Task<IEnumerable<object>> GetAllSummaryAsync(int page = 1, int pageSize = 10)
        {
            return await _context.Competitions
                .Select(c => new
                {
                    c.CompetitionId,
                    c.Title,
                    c.Status,
                    c.Genre,
                    c.StartDate,
                    c.EndDate,
                    c.CreationDate,
                    OrganizerName = c.Organizer.UserName,
                    SubmissionCount = c.Submissions.Count()
                })
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<Competition>> GetByStatusAsync(CompetitionStatus status, int page = 1, int pageSize = 10)
        {
            return await _context.Competitions
                .Include(c => c.Organizer)
                .Where(c => c.Status == status)
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        // Optimized version for status queries
        public async Task<IEnumerable<object>> GetByStatusSummaryAsync(CompetitionStatus status, int page = 1, int pageSize = 10)
        {
            return await _context.Competitions
                .Where(c => c.Status == status)
                .Select(c => new
                {
                    c.CompetitionId,
                    c.Title,
                    c.Status,
                    c.Genre,
                    c.StartDate,
                    c.EndDate,
                    c.CreationDate,
                    OrganizerName = c.Organizer.UserName,
                    SubmissionCount = c.Submissions.Count()
                })
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<Competition>> GetByOrganizerIdAsync(string organizerId, int page = 1, int pageSize = 10)
        {
            return await _context.Competitions
                .Include(c => c.Organizer)
                .Where(c => c.OrganizerUserId == organizerId)
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> CreateAsync(Competition competition)
        {
            await _context.Competitions.AddAsync(competition);
            await _context.SaveChangesAsync();
            return competition.CompetitionId;
        }

        public async Task UpdateAsync(Competition competition)
        {
            _context.Competitions.Update(competition);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Competitions.AnyAsync(c => c.CompetitionId == id);
        }

        public async Task<int> GetTotalCountAsync()
        {
            return await _context.Competitions.CountAsync();
        }

        public async Task<int> GetCountByStatusAsync(CompetitionStatus status)
        {
            return await _context.Competitions.CountAsync(c => c.Status == status);
        }

        public async Task<IEnumerable<Competition>> GetFilteredAsync(
            CompetitionStatus? status = null,
            Genre? genre = null,
            string? searchTerm = null,
            int page = 1,
            int pageSize = 10)
        {
            var query = _context.Competitions
                .Include(c => c.Organizer)
                .AsQueryable();

            query = ApplyFilters(query, status, genre, searchTerm);

            return await query
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        // Optimized filtered query with projection
        public async Task<IEnumerable<object>> GetFilteredSummaryAsync(
            CompetitionStatus? status = null,
            Genre? genre = null,
            string? searchTerm = null,
            int page = 1,
            int pageSize = 10)
        {
            var query = _context.Competitions.AsQueryable();

            query = ApplyFilters(query, status, genre, searchTerm);

            return await query
                .Select(c => new
                {
                    c.CompetitionId,
                    c.Title,
                    c.Status,
                    c.Genre,
                    c.StartDate,
                    c.EndDate,
                    c.CreationDate,
                    OrganizerName = c.Organizer.UserName,
                    SubmissionCount = c.Submissions.Count()
                })
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> GetFilteredCountAsync(
            CompetitionStatus? status = null,
            Genre? genre = null,
            string? searchTerm = null)
        {
            var query = _context.Competitions.AsQueryable();

            query = ApplyFilters(query, status, genre, searchTerm);

            return await query.CountAsync();
        }

        // Helper method to apply common filters
        private IQueryable<Competition> ApplyFilters(
            IQueryable<Competition> query,
            CompetitionStatus? status,
            Genre? genre,
            string? searchTerm)
        {
            // Apply status filter
            if (status.HasValue)
            {
                query = query.Where(c => c.Status == status.Value);
            }

            // Apply genre filter
            if (genre.HasValue)
            {
                query = query.Where(c => c.Genre == genre.Value);
            }

            // Apply search term filter
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(c =>
                    c.Title.ToLower().Contains(searchTerm) ||
                    c.Description.ToLower().Contains(searchTerm) ||
                    c.SongCreator.ToLower().Contains(searchTerm));
            }

            return query;
        }

        public async Task<(IEnumerable<Competition> Competitions, int TotalCount)> GetCompetitionsForAdminAsync(
            string organizerId,
            CompetitionStatus? status,
            string searchTerm,
            DateTime? startDateFrom,
            DateTime? startDateTo,
            int page = 1,
            int pageSize = 10,
            CancellationToken cancellationToken = default)
        {
            // Start with all competitions
            var query = _context.Competitions
                .Include(c => c.Organizer)
                .AsQueryable();

            query = ApplyAdminFilters(query, organizerId, status, searchTerm, startDateFrom, startDateTo);

            // Get total count and data in parallel for better performance
            var totalCountTask = query.CountAsync(cancellationToken);
            var competitionsTask = query
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            await Task.WhenAll(totalCountTask, competitionsTask);

            return (await competitionsTask, await totalCountTask);
        }

        public async Task<(IEnumerable<Competition> Competitions, int TotalCount)> GetCompetitionsForAdminAsync(
            string organizerId,
            List<CompetitionStatus>? statuses,
            string searchTerm,
            DateTime? startDateFrom,
            DateTime? startDateTo,
            int page = 1,
            int pageSize = 10,
            CancellationToken cancellationToken = default)
        {
            // Start with all competitions
            var query = _context.Competitions
                .Include(c => c.Organizer)
                .AsQueryable();

            query = ApplyAdminFilters(query, organizerId, null, searchTerm, startDateFrom, startDateTo);

            if (statuses != null && statuses.Any())
            {
                query = query.Where(c => statuses.Contains(c.Status));
            }

            // Get total count and data in parallel for better performance
            var totalCountTask = query.CountAsync(cancellationToken);
            var competitionsTask = query
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            await Task.WhenAll(totalCountTask, competitionsTask);

            return (await competitionsTask, await totalCountTask);
        }

        // Optimized version for admin summary (without loading full entities)
        public async Task<(IEnumerable<object> Competitions, int TotalCount)> GetCompetitionsForAdminSummaryAsync(
            string organizerId,
            List<CompetitionStatus>? statuses,
            string searchTerm,
            DateTime? startDateFrom,
            DateTime? startDateTo,
            int page = 1,
            int pageSize = 10,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Competitions.AsQueryable();

            query = ApplyAdminFilters(query, organizerId, null, searchTerm, startDateFrom, startDateTo);

            if (statuses != null && statuses.Any())
            {
                query = query.Where(c => statuses.Contains(c.Status));
            }

            // Get total count and data in parallel
            var totalCountTask = query.CountAsync(cancellationToken);
            var competitionsTask = query
                .Select(c => new
                {
                    c.CompetitionId,
                    c.Title,
                    c.Status,
                    c.Genre,
                    c.StartDate,
                    c.EndDate,
                    c.CreationDate,
                    OrganizerName = c.Organizer.UserName,
                    SubmissionCount = c.Submissions.Count()
                })
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            await Task.WhenAll(totalCountTask, competitionsTask);

            return (await competitionsTask, await totalCountTask);
        }

        // Helper method for admin filters
        private IQueryable<Competition> ApplyAdminFilters(
            IQueryable<Competition> query,
            string organizerId,
            CompetitionStatus? status,
            string searchTerm,
            DateTime? startDateFrom,
            DateTime? startDateTo)
        {
            // Apply filters
            if (!string.IsNullOrWhiteSpace(organizerId))
            {
                query = query.Where(c => c.OrganizerUserId == organizerId);
            }

            if (status.HasValue)
            {
                query = query.Where(c => c.Status == status.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(c =>
                    c.Title.ToLower().Contains(searchTerm) ||
                    c.Description.ToLower().Contains(searchTerm));
            }

            if (startDateFrom.HasValue)
            {
                query = query.Where(c => c.StartDate >= startDateFrom.Value);
            }

            if (startDateTo.HasValue)
            {
                query = query.Where(c => c.StartDate <= startDateTo.Value);
            }

            return query;
        }

        public async Task UpdateCompetitionStatusAsync(
            int competitionId,
            CompetitionStatus newStatus,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Use ExecuteUpdateAsync for better performance (EF Core 7+)
                var rowsAffected = await _context.Competitions
                    .Where(c => c.CompetitionId == competitionId)
                    .ExecuteUpdateAsync(c => c.SetProperty(p => p.Status, newStatus), cancellationToken);

                if (rowsAffected == 0)
                {
                    throw new KeyNotFoundException($"Competition with ID {competitionId} not found");
                }
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Error updating competition status: {ex.Message}", ex);
            }
        }

        public async Task DeleteAsync(int competitionId)
        {
            // Use ExecuteDeleteAsync for better performance (EF Core 7+)
            var rowsAffected = await _context.Competitions
                .Where(c => c.CompetitionId == competitionId)
                .ExecuteDeleteAsync();

            if (rowsAffected == 0)
            {
                throw new KeyNotFoundException($"Competition with ID {competitionId} not found");
            }
        }

        // New method for getting competitions with submission counts efficiently
        public async Task<IEnumerable<object>> GetCompetitionsWithStatsAsync(
            CompetitionStatus? status = null,
            int page = 1,
            int pageSize = 10)
        {
            var query = _context.Competitions.AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(c => c.Status == status.Value);
            }

            return await query
                .Select(c => new
                {
                    c.CompetitionId,
                    c.Title,
                    c.Status,
                    c.Genre,
                    c.StartDate,
                    c.EndDate,
                    c.CreationDate,
                    OrganizerName = c.Organizer.UserName,
                    SubmissionCount = c.Submissions.Count(),
                    VoteCount = c.Submissions.SelectMany(s => s.Votes).Count(),
                    ParticipantCount = c.Submissions.Select(s => s.UserId).Distinct().Count()
                })
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
    }
}