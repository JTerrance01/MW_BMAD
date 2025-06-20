-- Fix VotingRound values in SubmissionJudgments table
-- This script updates NULL or missing VotingRound values to 1 for Competition 25
-- First, check the current state of VotingRound values
SELECT 'Current VotingRound Distribution' as Description,
    "VotingRound",
    COUNT(*) as Count
FROM "SubmissionJudgments"
WHERE "CompetitionId" = 25
GROUP BY "VotingRound"
ORDER BY "VotingRound";
-- Update NULL VotingRound values to 1 for Competition 25
UPDATE "SubmissionJudgments"
SET "VotingRound" = 1
WHERE "CompetitionId" = 25
    AND (
        "VotingRound" IS NULL
        OR "VotingRound" != 1
    );
-- Verify the update
SELECT 'After Update - VotingRound Distribution' as Description,
    "VotingRound",
    COUNT(*) as Count
FROM "SubmissionJudgments"
WHERE "CompetitionId" = 25
GROUP BY "VotingRound"
ORDER BY "VotingRound";
-- Show sample judgments to verify they have proper data
SELECT "SubmissionId",
    "JudgeId",
    "VotingRound",
    "IsCompleted",
    "OverallScore"
FROM "SubmissionJudgments"
WHERE "CompetitionId" = 25
LIMIT 10;