-- Verify Round 2 Final Rank Assignment
-- This script checks that all Round 2 competitors have FinalRank values after tallying
-- Check for any Round 2 competitors missing FinalRank
SELECT s.SubmissionId,
    s.MixTitle,
    s.UserId,
    u.UserName,
    s.AdvancedToRound2,
    s.Round1Score,
    s.Round2Score,
    s.FinalScore,
    s.FinalRank,
    s.IsWinner,
    s.IsDisqualified
FROM Submissions s
    JOIN Users u ON s.UserId = u.Id
WHERE s.CompetitionId = 25 -- Replace with your competition ID
    AND s.AdvancedToRound2 = true
    AND s.FinalRank IS NULL
ORDER BY s.SubmissionId;
-- Show complete ranking for the competition
SELECT s.FinalRank,
    s.SubmissionId,
    s.MixTitle,
    u.UserName,
    s.Round1Score,
    s.Round2Score,
    s.FinalScore,
    s.AdvancedToRound2,
    s.IsWinner,
    s.IsDisqualified,
    CASE
        WHEN s.IsWinner = true THEN 'WINNER'
        WHEN s.AdvancedToRound2 = true THEN 'Round 2 Competitor'
        WHEN s.IsDisqualified = true THEN 'Disqualified'
        ELSE 'Did not advance'
    END AS Status
FROM Submissions s
    JOIN Users u ON s.UserId = u.Id
WHERE s.CompetitionId = 25 -- Replace with your competition ID
ORDER BY s.FinalRank,
    s.SubmissionId;
-- Summary statistics
SELECT COUNT(*) AS TotalSubmissions,
    SUM(
        CASE
            WHEN AdvancedToRound2 = true THEN 1
            ELSE 0
        END
    ) AS Round2Competitors,
    SUM(
        CASE
            WHEN FinalRank IS NOT NULL THEN 1
            ELSE 0
        END
    ) AS SubmissionsWithRank,
    SUM(
        CASE
            WHEN AdvancedToRound2 = true
            AND FinalRank IS NULL THEN 1
            ELSE 0
        END
    ) AS Round2WithoutRank,
    SUM(
        CASE
            WHEN IsWinner = true THEN 1
            ELSE 0
        END
    ) AS Winners,
    SUM(
        CASE
            WHEN IsDisqualified = true THEN 1
            ELSE 0
        END
    ) AS Disqualified
FROM Submissions
WHERE CompetitionId = 25;
-- Replace with your competition ID
-- Check for duplicate ranks (there should be none)
SELECT FinalRank,
    COUNT(*) AS CountWithThisRank
FROM Submissions
WHERE CompetitionId = 25 -- Replace with your competition ID
    AND FinalRank IS NOT NULL
GROUP BY FinalRank
HAVING COUNT(*) > 1
ORDER BY FinalRank;