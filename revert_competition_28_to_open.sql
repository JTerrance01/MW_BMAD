-- ============================================================================
-- Competition 28 Revert to "Open for Submissions" - Manual PostgreSQL Script
-- ============================================================================
-- This script reverts competition 28 to "Open for Submissions" status (1)
-- and removes all Round 1 voting/judgment data.
-- 
-- Run this script manually in PostgreSQL (psql, pgAdmin, etc.)
-- ============================================================================
-- Start transaction for safety
BEGIN;
-- Show current status before changes
SELECT 'BEFORE CHANGES' as info,
    "CompetitionId",
    "Title",
    "Status",
    CASE
        WHEN "Status" = 0 THEN 'Upcoming'
        WHEN "Status" = 1 THEN 'OpenForSubmissions'
        WHEN "Status" = 2 THEN 'InJudging (Legacy)'
        WHEN "Status" = 3 THEN 'Closed (Legacy)'
        WHEN "Status" = 10 THEN 'VotingRound1Setup'
        WHEN "Status" = 11 THEN 'VotingRound1Open'
        WHEN "Status" = 12 THEN 'VotingRound1Tallying'
        WHEN "Status" = 20 THEN 'VotingRound2Setup'
        WHEN "Status" = 21 THEN 'VotingRound2Open'
        WHEN "Status" = 22 THEN 'VotingRound2Tallying'
        WHEN "Status" = 25 THEN 'RequiresManualWinnerSelection'
        WHEN "Status" = 30 THEN 'Completed'
        WHEN "Status" = 40 THEN 'Archived'
        WHEN "Status" = 50 THEN 'Disqualified'
        ELSE 'Unknown Status'
    END as status_name
FROM "Competitions"
WHERE "CompetitionId" = 28;
-- Show current Round 1 data before cleanup
SELECT 'BEFORE CLEANUP - Round 1 Data Counts' as info;
SELECT 'SubmissionVotes' as table_name,
    COUNT(*) as count
FROM "SubmissionVotes"
WHERE "CompetitionId" = 28
    AND "VotingRound" = 1
UNION ALL
SELECT 'SubmissionJudgments' as table_name,
    COUNT(*) as count
FROM "SubmissionJudgments"
WHERE "CompetitionId" = 28
    AND "VotingRound" = 1
UNION ALL
SELECT 'CriteriaScores' as table_name,
    COUNT(*) as count
FROM "CriteriaScores" cs
    INNER JOIN "SubmissionJudgments" sj ON cs."SubmissionJudgmentId" = sj."SubmissionJudgmentId"
WHERE sj."CompetitionId" = 28
    AND sj."VotingRound" = 1;
-- Show current submission scoring fields before reset
SELECT 'BEFORE RESET - Submission Scoring Fields' as info,
    COUNT(*) as total_submissions,
    COUNT("Round1Score") as submissions_with_round1_score,
    COUNT("Round2Score") as submissions_with_round2_score,
    COUNT("FinalScore") as submissions_with_final_score,
    SUM(
        CASE
            WHEN "IsEligibleForRound2Voting" = true THEN 1
            ELSE 0
        END
    ) as eligible_for_round2,
    SUM(
        CASE
            WHEN "AdvancedToRound2" = true THEN 1
            ELSE 0
        END
    ) as advanced_to_round2,
    SUM(
        CASE
            WHEN "IsWinner" = true THEN 1
            ELSE 0
        END
    ) as winners
FROM "Submissions"
WHERE "CompetitionId" = 28;
-- ============================================================================
-- CLEANUP OPERATIONS
-- ============================================================================
-- Step 1: Delete CriteriaScores for Round 1 (must be first due to foreign keys)
DELETE FROM "CriteriaScores"
WHERE "SubmissionJudgmentId" IN (
        SELECT "SubmissionJudgmentId"
        FROM "SubmissionJudgments"
        WHERE "CompetitionId" = 28
            AND "VotingRound" = 1
    );
-- Step 2: Delete SubmissionJudgments for Round 1
DELETE FROM "SubmissionJudgments"
WHERE "CompetitionId" = 28
    AND "VotingRound" = 1;
-- Step 3: Delete SubmissionVotes for Round 1
DELETE FROM "SubmissionVotes"
WHERE "CompetitionId" = 28
    AND "VotingRound" = 1;
-- Step 4: Reset submission scoring fields to initial state
UPDATE "Submissions"
SET "Round1Score" = NULL,
    "Round2Score" = NULL,
    "FinalScore" = NULL,
    "FinalRank" = NULL,
    "IsEligibleForRound2Voting" = false,
    "AdvancedToRound2" = false,
    "IsWinner" = false
WHERE "CompetitionId" = 28;
-- Step 5: Update competition status to "Open for Submissions" (1)
UPDATE "Competitions"
SET "Status" = 1
WHERE "CompetitionId" = 28;
-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Show updated status after changes
SELECT 'AFTER CHANGES' as info,
    "CompetitionId",
    "Title",
    "Status",
    CASE
        WHEN "Status" = 0 THEN 'Upcoming'
        WHEN "Status" = 1 THEN 'OpenForSubmissions'
        WHEN "Status" = 2 THEN 'InJudging (Legacy)'
        WHEN "Status" = 3 THEN 'Closed (Legacy)'
        WHEN "Status" = 10 THEN 'VotingRound1Setup'
        WHEN "Status" = 11 THEN 'VotingRound1Open'
        WHEN "Status" = 12 THEN 'VotingRound1Tallying'
        WHEN "Status" = 20 THEN 'VotingRound2Setup'
        WHEN "Status" = 21 THEN 'VotingRound2Open'
        WHEN "Status" = 22 THEN 'VotingRound2Tallying'
        WHEN "Status" = 25 THEN 'RequiresManualWinnerSelection'
        WHEN "Status" = 30 THEN 'Completed'
        WHEN "Status" = 40 THEN 'Archived'
        WHEN "Status" = 50 THEN 'Disqualified'
        ELSE 'Unknown Status'
    END as status_name,
    "CreationDate"
FROM "Competitions"
WHERE "CompetitionId" = 28;
-- Verify Round 1 data is cleaned up
SELECT 'AFTER CLEANUP - Round 1 Data Counts' as info;
SELECT 'SubmissionVotes' as table_name,
    COUNT(*) as count
FROM "SubmissionVotes"
WHERE "CompetitionId" = 28
    AND "VotingRound" = 1
UNION ALL
SELECT 'SubmissionJudgments' as table_name,
    COUNT(*) as count
FROM "SubmissionJudgments"
WHERE "CompetitionId" = 28
    AND "VotingRound" = 1
UNION ALL
SELECT 'CriteriaScores' as table_name,
    COUNT(*) as count
FROM "CriteriaScores" cs
    INNER JOIN "SubmissionJudgments" sj ON cs."SubmissionJudgmentId" = sj."SubmissionJudgmentId"
WHERE sj."CompetitionId" = 28
    AND sj."VotingRound" = 1;
-- Show remaining submissions (these should be preserved)
SELECT 'Competition 28 Submissions (preserved)' as info,
    COUNT(*) as total_submissions
FROM "Submissions"
WHERE "CompetitionId" = 28;
-- Verify submission scoring fields are reset
SELECT 'AFTER RESET - Submission Scoring Fields' as info,
    COUNT(*) as total_submissions,
    COUNT("Round1Score") as submissions_with_round1_score,
    COUNT("Round2Score") as submissions_with_round2_score,
    COUNT("FinalScore") as submissions_with_final_score,
    SUM(
        CASE
            WHEN "IsEligibleForRound2Voting" = true THEN 1
            ELSE 0
        END
    ) as eligible_for_round2,
    SUM(
        CASE
            WHEN "AdvancedToRound2" = true THEN 1
            ELSE 0
        END
    ) as advanced_to_round2,
    SUM(
        CASE
            WHEN "IsWinner" = true THEN 1
            ELSE 0
        END
    ) as winners
FROM "Submissions"
WHERE "CompetitionId" = 28;
-- ============================================================================
-- COMMIT OR ROLLBACK
-- ============================================================================
-- Uncomment ONE of the following lines:
-- COMMIT;    -- Uncomment this line to save the changes
-- ROLLBACK;  -- Uncomment this line to cancel the changes
-- ============================================================================
-- MANUAL EXECUTION INSTRUCTIONS:
-- ============================================================================
-- 1. Connect to your PostgreSQL database using psql, pgAdmin, or similar
-- 2. Run this entire script
-- 3. Review the output to ensure everything looks correct
-- 4. Uncomment either COMMIT or ROLLBACK at the end
-- 5. Execute the final command to either save or cancel the changes
-- ============================================================================