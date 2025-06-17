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

            return await query
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

            return await query.CountAsync();
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

            // Get total count before pagination
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply pagination and retrieve data
            var competitions = await query
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (competitions, totalCount);
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

            // Apply filters
            if (!string.IsNullOrWhiteSpace(organizerId))
            {
                query = query.Where(c => c.OrganizerUserId == organizerId);
            }

            if (statuses != null && statuses.Any())
            {
                query = query.Where(c => statuses.Contains(c.Status));
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

            // Get total count before pagination
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply pagination and retrieve data
            var competitions = await query
                .OrderByDescending(c => c.CreationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (competitions, totalCount);
        }

        public async Task UpdateCompetitionStatusAsync(
            int competitionId,
            CompetitionStatus newStatus,
            CancellationToken cancellationToken = default)
        {
            try
            {
                Console.WriteLine($"Updating competition {competitionId} status to {newStatus}");

                // Find the competition directly with tracking enabled
                var competition = await _context.Competitions
                    .FirstOrDefaultAsync(c => c.CompetitionId == competitionId, cancellationToken);

                if (competition == null)
                {
                    throw new KeyNotFoundException($"Competition with ID {competitionId} not found");
                }

                // Log the current status before change
                Console.WriteLine($"Competition {competitionId} current status: {competition.Status}, changing to: {newStatus}");

                // Update status directly on the tracked entity
                competition.Status = newStatus;

                // Save the changes and get the number of rows affected
                var rowsAffected = await _context.SaveChangesAsync(cancellationToken);
                Console.WriteLine($"Competition status update complete. Rows affected: {rowsAffected}");

                if (rowsAffected == 0)
                {
                    Console.WriteLine("WARNING: SaveChangesAsync returned 0 rows affected!");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR updating competition status: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw; // Re-throw to ensure the error is properly handled
            }
        }

        public async Task DeleteAsync(int competitionId)
        {
            var competition = await _context.Competitions.FindAsync(competitionId);
            if (competition != null)
            {
                _context.Competitions.Remove(competition);
                await _context.SaveChangesAsync();
            }
        }
    }
}