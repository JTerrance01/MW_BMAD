namespace MixWarz.Domain.Enums
{
    public enum SubscriptionStatus
    {
        Active = 1,
        Canceled = 2,
        PastDue = 3,
        Unpaid = 4,
        Incomplete = 5,
        IncompleteExpired = 6,
        Trialing = 7,
        Paused = 8
    }
}