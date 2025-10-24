using MixWarz.Application.Features.Judging.DTOs;
using MixWarz.Domain.Entities;

namespace MixWarz.Application.Common.Interfaces
{
    /// <summary>
    /// Service interface for handling judging operations in the Hybrid Fair-Play Tournament
    /// </summary>
    public interface IJudgingService
    {
        /// <summary>
        /// Submits a judgement for an assigned submission
        /// </summary>
        /// <param name="judgementDto">The judgement data including score and feedback</param>
        /// <returns>The created judgement</returns>
        /// <exception cref="InvalidOperationException">Thrown when the judge is not assigned to the submission</exception>
        /// <exception cref="ArgumentException">Thrown when the submission or judge doesn't exist</exception>
        Task<Judgement> SubmitJudgement(SubmitJudgementDto judgementDto);

        /// <summary>
        /// Rates the helpfulness of feedback received from a judge
        /// </summary>
        /// <param name="ratingDto">The feedback rating data</param>
        /// <returns>The created feedback rating</returns>
        /// <exception cref="InvalidOperationException">Thrown when the rater is not the submission owner or has already rated</exception>
        /// <exception cref="ArgumentException">Thrown when the judgement or rater doesn't exist</exception>
        Task<FeedbackRating> RateFeedback(RateFeedbackDto ratingDto);

        /// <summary>
        /// Gets all judgements assigned to a specific judge for a competition
        /// </summary>
        /// <param name="judgeId">The ID of the judge</param>
        /// <param name="competitionId">The ID of the competition</param>
        /// <returns>List of judgements assigned to the judge</returns>
        Task<IEnumerable<Judgement>> GetJudgeAssignments(string judgeId, int competitionId);

        /// <summary>
        /// Gets all judgements received for a specific submission
        /// </summary>
        /// <param name="submissionId">The ID of the submission</param>
        /// <returns>List of judgements for the submission</returns>
        Task<IEnumerable<Judgement>> GetSubmissionJudgements(int submissionId);
    }
}
