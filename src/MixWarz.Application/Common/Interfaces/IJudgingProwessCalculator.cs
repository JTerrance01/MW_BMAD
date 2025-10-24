namespace MixWarz.Application.Common.Interfaces
{
    /// <summary>
    /// Service interface for calculating judging prowess scores for competitors
    /// </summary>
    public interface IJudgingProwessCalculator
    {
        /// <summary>
        /// Calculates and updates judging prowess scores for all judges who participated in a competition
        /// Based on how close their scores were to final averages and how many "Helpful" ratings they received
        /// </summary>
        /// <param name="competitionId">The ID of the competition to calculate prowess for</param>
        /// <returns>Dictionary of judge user IDs and their calculated prowess scores</returns>
        Task<Dictionary<string, decimal>> CalculateAndUpdateJudgingProwess(int competitionId);

        /// <summary>
        /// Calculates judging prowess score for a specific judge in a competition
        /// </summary>
        /// <param name="competitionId">The ID of the competition</param>
        /// <param name="judgeId">The ID of the judge</param>
        /// <returns>The calculated prowess score</returns>
        Task<decimal> CalculateJudgeProwessScore(int competitionId, string judgeId);

        /// <summary>
        /// Gets prowess calculation details for a judge (for debugging/transparency)
        /// </summary>
        /// <param name="competitionId">The ID of the competition</param>
        /// <param name="judgeId">The ID of the judge</param>
        /// <returns>Detailed breakdown of prowess calculation</returns>
        Task<JudgingProwessDetails> GetProwessCalculationDetails(int competitionId, string judgeId);
    }

    /// <summary>
    /// Detailed breakdown of judging prowess calculation
    /// </summary>
    public class JudgingProwessDetails
    {
        public string JudgeId { get; set; } = string.Empty;
        public int CompetitionId { get; set; }
        public int TotalJudgements { get; set; }
        public decimal AverageScoreAccuracy { get; set; }
        public int HelpfulFeedbackCount { get; set; }
        public int TotalFeedbackRatings { get; set; }
        public decimal HelpfulnessRatio { get; set; }
        public decimal AccuracyScore { get; set; }
        public decimal HelpfulnessScore { get; set; }
        public decimal FinalProwessScore { get; set; }
        public List<JudgementAccuracyDetail> JudgementDetails { get; set; } = new();
    }

    /// <summary>
    /// Details of individual judgement accuracy
    /// </summary>
    public class JudgementAccuracyDetail
    {
        public int SubmissionId { get; set; }
        public int JudgeScore { get; set; }
        public decimal FinalAverageScore { get; set; }
        public decimal AccuracyDifference { get; set; }
        public bool HasFeedbackRating { get; set; }
        public bool? WasRatedHelpful { get; set; }
    }
}
