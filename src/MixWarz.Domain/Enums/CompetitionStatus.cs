namespace MixWarz.Domain.Enums
{
    public enum CompetitionStatus
    {
        Upcoming = 0,
        OpenForSubmissions = 1,

        // New voting round statuses - Round 1
        VotingRound1Setup = 10,
        VotingRound1Open = 11,
        VotingRound1Tallying = 12,

        // New voting round statuses - Round 2
        VotingRound2Setup = 20,
        VotingRound2Open = 21,
        VotingRound2Tallying = 22,

        // Status for manual winner selection in case of true tie
        RequiresManualWinnerSelection = 25,

        // Final states
        Completed = 30,
        Archived = 40,
        Disqualified = 50,

        // Legacy status (kept for backward compatibility)
        InJudging = 2,
        Closed = 3,
        Cancelled = 4
    }
}