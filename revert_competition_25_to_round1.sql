-- Script to revert Competition ID 25 back to Round1Voting for re-tallying
-- This script only updates the Submissions table as requested
-- Reset Round1 and Round2 related fields for all submissions in Competition 25
UPDATE "Submissions"
SET -- Reset Round1 scoring
    "Round1Score" = NULL,
    -- Reset Round2 advancement flags
    "AdvancedToRound2" = false,
    "IsEligibleForRound2Voting" = false,
    -- Reset Round2 and final scores
    "Round2Score" = NULL,
    "FinalScore" = NULL,
    "FinalRank" = NULL,
    -- Update timestamp
    "UpdatedDate" = CURRENT_TIMESTAMP
WHERE "CompetitionId" = 25;
-- Verify the update
SELECT "SubmissionId",
    "MixTitle",
    "UserId",
    "Round1Score",
    "AdvancedToRound2",
    "IsEligibleForRound2Voting",
    "IsDisqualified",
    "UpdatedDate"
FROM "Submissions"
WHERE "CompetitionId" = 25
ORDER BY "SubmissionId";
-- Show statistics
SELECT COUNT(*) as "TotalSubmissions",
    COUNT(
        CASE
            WHEN "IsDisqualified" = true THEN 1
        END
    ) as "DisqualifiedSubmissions",
    COUNT(
        CASE
            WHEN "Round1Score" IS NULL THEN 1
        END
    ) as "NullScores",
    COUNT(
        CASE
            WHEN "AdvancedToRound2" = true THEN 1
        END
    ) as "AdvancedToRound2"
FROM "Submissions"
WHERE "CompetitionId" = 25;