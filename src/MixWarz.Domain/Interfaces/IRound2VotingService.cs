using MixWarz.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MixWarz.Domain.Interfaces
{
    /// <summary>
    /// Service interface for managing Round 2 voting in competitions
    /// </summary>
    public interface IRound2VotingService
    {
        /// <summary>
        /// Sets up Round 2 voting for a competition
        /// </summary>
        /// <param name="competitionId">Competition ID</param>
        /// <returns>Number of submissions eligible for Round 2</returns>
        Task<int> SetupRound2VotingAsync(int competitionId);

        /// <summary>
        /// Retrieves submissions that advanced to Round 2
        /// </summary>
        /// <param name="competitionId">Competition ID</param>
        /// <returns>List of submissions in Round 2</returns>
        Task<IEnumerable<Submission>> GetRound2SubmissionsAsync(int competitionId);

        /// <summary>
        /// Checks if a user is eligible to vote in Round 2
        /// </summary>
        /// <param name="competitionId">Competition ID</param>
        /// <param name="userId">User ID</param>
        /// <returns>True if the user can vote</returns>
        Task<bool> IsUserEligibleForRound2VotingAsync(int competitionId, string userId);

        /// <summary>
        /// Records a user's vote for Round 2
        /// </summary>
        /// <param name="competitionId">Competition ID</param>
        /// <param name="voterId">Voter's user ID</param>
        /// <param name="submissionId">Submission ID voted for</param>
        /// <returns>True if vote was recorded successfully</returns>
        Task<bool> RecordRound2VoteAsync(int competitionId, string voterId, int submissionId);

        /// <summary>
        /// Records picks from the Song Creator for Round 2
        /// </summary>
        /// <param name="competitionId">Competition ID</param>
        /// <param name="submissionIds">List of chosen submission IDs</param>
        /// <returns>Number of picks recorded</returns>
        Task<int> RecordSongCreatorPicksAsync(int competitionId, List<int> submissionIds);

        /// <summary>
        /// Tallies Round 2 votes to determine the winner
        /// </summary>
        /// <param name="competitionId">Competition ID</param>
        /// <returns>Tuple with winner submission ID and whether there's a tie</returns>
        Task<(int WinnerId, bool IsTie)> TallyRound2VotesAsync(int competitionId);

        /// <summary>
        /// Sets the winner of a competition
        /// </summary>
        /// <param name="competitionId">Competition ID</param>
        /// <param name="submissionId">Winning submission ID</param>
        /// <returns>True if successful</returns>
        Task<bool> SetCompetitionWinnerAsync(int competitionId, int submissionId);

        /// <summary>
        /// Gets the final competition results
        /// </summary>
        /// <param name="competitionId">Competition ID</param>
        /// <returns>Object containing competition results data</returns>
        Task<CompetitionResults> GetCompetitionResultsAsync(int competitionId);
    }

    public class CompetitionResults
    {
        public int CompetitionId { get; set; }
        public string CompetitionTitle { get; set; }
        public int? WinningSubmissionId { get; set; }
        public string WinnerName { get; set; }
        public string WinningMixTitle { get; set; }
        public int TotalVotes { get; set; }
        public List<SubmissionResult> Round2Results { get; set; } = new();
        public List<SongCreatorPick> SongCreatorPicks { get; set; } = new();
    }

    public class SubmissionResult
    {
        public int SubmissionId { get; set; }
        public string MixTitle { get; set; }
        public string SubmitterName { get; set; }
        public int VoteCount { get; set; }
        public bool IsWinner { get; set; }
    }
}