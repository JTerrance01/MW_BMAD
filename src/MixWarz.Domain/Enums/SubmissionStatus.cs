namespace MixWarz.Domain.Enums
{
    public enum SubmissionStatus
    {
        Submitted = 0,
        UnderReview = 1,
        Judged = 2,
        Disqualified = 3,
        // New statuses for Hybrid Fair-Play Tournament
        AwaitingJudging = 4,
        UniversalJudgingComplete = 5,
        AdvancedToFinals = 6,
        EliminatedInUniversalJudging = 7
    }
} 