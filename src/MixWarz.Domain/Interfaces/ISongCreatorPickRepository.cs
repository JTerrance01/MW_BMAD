using MixWarz.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MixWarz.Domain.Interfaces
{
    public interface ISongCreatorPickRepository
    {
        /// <summary>
        /// Creates a new song creator pick entry
        /// </summary>
        /// <param name="pick">The song creator pick to create</param>
        /// <returns>The ID of the created pick</returns>
        Task<int> CreateAsync(SongCreatorPick pick);

        /// <summary>
        /// Gets all picks for a specific competition
        /// </summary>
        /// <param name="competitionId">The competition ID</param>
        /// <returns>Collection of song creator picks</returns>
        Task<IEnumerable<SongCreatorPick>> GetByCompetitionIdAsync(int competitionId);

        /// <summary>
        /// Checks if song creator picks exist for a competition
        /// </summary>
        /// <param name="competitionId">The competition ID</param>
        /// <returns>True if picks exist</returns>
        Task<bool> ExistsForCompetitionAsync(int competitionId);

        /// <summary>
        /// Deletes all song creator picks for a competition
        /// </summary>
        /// <param name="competitionId">The competition ID</param>
        /// <returns>Number of picks deleted</returns>
        Task<int> DeleteByCompetitionIdAsync(int competitionId);
    }
}