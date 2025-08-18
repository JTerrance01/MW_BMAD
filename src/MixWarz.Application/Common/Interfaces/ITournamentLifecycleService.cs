namespace MixWarz.Application.Common.Interfaces
{
    /// <summary>
    /// Service interface for managing the lifecycle of Hybrid Fair-Play Tournaments
    /// </summary>
    public interface ITournamentLifecycleService
    {
        /// <summary>
        /// Starts the universal judging phase for a competition
        /// This method invokes the assignment service to create judging assignments
        /// and transitions the competition to the judging phase
        /// </summary>
        /// <param name="competitionId">The ID of the competition to start judging for</param>
        /// <returns>Number of judging assignments created</returns>
        /// <exception cref="ArgumentException">Thrown when competition is not found</exception>
        /// <exception cref="InvalidOperationException">Thrown when competition is not in the correct state</exception>
        Task<int> StartUniversalJudging(int competitionId);

        /// <summary>
        /// Tallies the results of universal judging and determines which submissions advance
        /// This method calculates final scores, updates submission statuses, and advances
        /// the top performers to the next phase
        /// </summary>
        /// <param name="competitionId">The ID of the competition to tally results for</param>
        /// <param name="advancementCount">Number of submissions to advance (defaults to 3)</param>
        /// <returns>List of submission IDs that advanced to the next phase</returns>
        /// <exception cref="ArgumentException">Thrown when competition is not found</exception>
        /// <exception cref="InvalidOperationException">Thrown when competition is not in the correct state</exception>
        Task<IEnumerable<int>> TallyUniversalJudgingResults(int competitionId, int advancementCount = 3);

        /// <summary>
        /// Gets the current lifecycle phase information for a competition
        /// </summary>
        /// <param name="competitionId">The ID of the competition</param>
        /// <returns>Lifecycle status information</returns>
        Task<TournamentLifecycleStatus> GetLifecycleStatus(int competitionId);
    }

    /// <summary>
    /// Represents the current lifecycle status of a tournament
    /// </summary>
    public class TournamentLifecycleStatus
    {
        public int CompetitionId { get; set; }
        public string CompetitionTitle { get; set; } = string.Empty;
        public string CurrentPhase { get; set; } = string.Empty;
        public int TotalSubmissions { get; set; }
        public int JudgingAssignments { get; set; }
        public int CompletedJudgements { get; set; }
        public double JudgingProgress { get; set; }
        public bool CanStartJudging { get; set; }
        public bool CanTallyResults { get; set; }
        public DateTime? PhaseStartedAt { get; set; }
        public string NextPhase { get; set; } = string.Empty;
    }
}
