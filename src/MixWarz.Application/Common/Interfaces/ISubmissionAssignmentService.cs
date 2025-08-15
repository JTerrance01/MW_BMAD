namespace MixWarz.Application.Common.Interfaces
{
    /// <summary>
    /// Service interface for handling submission assignments in the Hybrid Fair-Play Tournament
    /// </summary>
    public interface ISubmissionAssignmentService
    {
        /// <summary>
        /// Creates judging assignments for all competitors in a competition
        /// Each competitor gets assigned a configurable number of random submissions (excluding their own)
        /// </summary>
        /// <param name="competitionId">The ID of the competition to create assignments for</param>
        /// <param name="assignmentsPerJudge">Number of submissions to assign to each judge (defaults to 3)</param>
        /// <returns>Number of assignments created</returns>
        Task<int> CreateAssignments(int competitionId, int assignmentsPerJudge = 3);
    }
}
