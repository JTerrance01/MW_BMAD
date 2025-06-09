namespace MixWarz.Application.Features.Submissions.Queries.GetSubmissionScoreBreakdown
{
    public class GetSubmissionScoreBreakdownResponse
    {
        public int SubmissionId { get; set; }
        public string MixTitle { get; set; } = string.Empty;
        public string CompetitionTitle { get; set; } = string.Empty;
        public decimal FinalScore { get; set; }
        public int Ranking { get; set; }
        public List<CriteriaScoreBreakdown> CriteriaBreakdowns { get; set; } = new();
        public int TotalJudges { get; set; }
        public bool IsCompleted { get; set; }
    }

    public class CriteriaScoreBreakdown
    {
        public int CriteriaId { get; set; }
        public string CriteriaName { get; set; } = string.Empty;
        public string? CriteriaDescription { get; set; }
        public decimal Weight { get; set; }
        public int MinScore { get; set; }
        public int MaxScore { get; set; }
        public decimal AverageScore { get; set; }
        public decimal WeightedScore { get; set; }
        public List<string> JudgesComments { get; set; } = new();
        public int DisplayOrder { get; set; }
    }
}