using MixWarz.Domain.Entities;
using System.Threading.Tasks;

namespace MixWarz.Domain.Interfaces
{
    public interface IRound1AssignmentService
    {
        /// <summary>
        /// Creates randomized groups of submissions for Round 1 voting and assigns voters to groups
        /// </summary>
        /// <param name="competitionId">The competition ID</param>
        /// <param name="targetGroupSize">Target number of submissions per group (15-30 recommended)</param>
        /// <returns>Number of groups created</returns>
        Task<int> CreateGroupsAndAssignVotersAsync(int competitionId, int targetGroupSize = 20);

        /// <summary>
        /// Gets the submission group assigned to a voter for Round 1
        /// </summary>
        /// <param name="competitionId">The competition ID</param>
        /// <param name="voterId">The voter's user ID</param>
        /// <returns>List of submissions in the assigned group</returns>
        Task<IEnumerable<Submission>> GetAssignedSubmissionsForVoterAsync(int competitionId, string voterId);

        /// <summary>
        /// Processes the submission of Round 1 votes for a voter
        /// </summary>
        /// <param name="competitionId">The competition ID</param>
        /// <param name="voterId">The voter's user ID</param>
        /// <param name="firstPlaceSubmissionId">Submission ID ranked as 1st place</param>
        /// <param name="secondPlaceSubmissionId">Submission ID ranked as 2nd place</param>
        /// <param name="thirdPlaceSubmissionId">Submission ID ranked as 3rd place</param>
        /// <returns>True if votes were successfully processed</returns>
        Task<bool> ProcessVoterSubmissionAsync(int competitionId, string voterId,
            int firstPlaceSubmissionId, int secondPlaceSubmissionId, int thirdPlaceSubmissionId);

        /// <summary>
        /// UNIFIED APPROACH: Tallies votes for Round 1 and determines which submissions advance to Round 2
        /// Now handles both traditional votes AND auto-generated votes from judgment criteria scoring
        /// </summary>
        /// <param name="competitionId">The competition ID</param>
        /// <returns>Number of submissions that advanced to Round 2</returns>
        Task<int> TallyVotesAndDetermineAdvancementAsync(int competitionId);

        /// <summary>
        /// Identifies and disqualifies participants who did not vote in Round 1
        /// </summary>
        /// <param name="competitionId">The competition ID</param>
        /// <returns>Number of submissions disqualified</returns>
        Task<int> DisqualifyNonVotersAsync(int competitionId);
    }
}