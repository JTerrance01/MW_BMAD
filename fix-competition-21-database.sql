-- Fix Competition 21 Database Records
-- Execute these SQL statements to create missing submission records
-- Clean up existing voting data first
DELETE FROM "Round1Assignments"
WHERE "CompetitionId" = 21;
DELETE FROM "SubmissionGroups"
WHERE "CompetitionId" = 21;
-- Create missing submission records
INSERT INTO "Submissions" (
        "CompetitionId",
        "UserId",
        "MixTitle",
        "MixDescription",
        "AudioFilePath",
        "SubmissionDate",
        "IsDisqualified",
        "IsEligibleForRound1Voting",
        "AdvancedToRound2",
        "IsEligibleForRound2Voting"
    )
VALUES (
        21,
        '046f84dd-3cf0-4403-a034-e75f637fd942',
        'WLG_Tibi Galea Mix 1',
        'Auto-imported submission',
        '/uploads/submissions/21/046f84dd-3cf0-4403-a034-e75f637fd942/fa590e10-3b4d-4207-afbe-0b054171cc55-WLG_Tibi Galea .mp3',
        '2025-05-25T21:52:31.034Z',
        false,
        true,
        false,
        false
    ),
    (
        21,
        '1e2589f4-0db1-4294-ac5e-7057839c26d6',
        'WLG_Tibi Galea Mix 2',
        'Auto-imported submission',
        '/uploads/submissions/21/1e2589f4-0db1-4294-ac5e-7057839c26d6/5aec31be-b5d8-4614-bfae-8ad4810031c5-WLG_Tibi Galea .mp3',
        '2025-05-25T21:54:03.958Z',
        false,
        true,
        false,
        false
    ),
    (
        21,
        '46f30a81-dff1-4c3e-8e65-8b61e8b28590',
        'WLG_Tibi Galea Mix 3',
        'Auto-imported submission',
        '/uploads/submissions/21/46f30a81-dff1-4c3e-8e65-8b61e8b28590/ed9fc88b-09a1-4258-91cc-3007edd614d6-WLG_Tibi Galea .mp3',
        '2025-05-25T21:54:59.488Z',
        false,
        true,
        false,
        false
    ),
    (
        21,
        '46f663af-0df5-4180-8ded-835c9cabe48d',
        'WLG_Tibi Galea Mix 4',
        'Auto-imported submission',
        '/uploads/submissions/21/46f663af-0df5-4180-8ded-835c9cabe48d/8fd9f33c-bb46-445d-af96-f4866ec1e8f8-WLG_Tibi Galea .mp3',
        '2025-05-25T21:51:14.429Z',
        false,
        true,
        false,
        false
    ),
    (
        21,
        '5058709d-efec-4590-a3d2-7e40f47aceee',
        'WLG_Tibi Galea Mix 5',
        'Auto-imported submission',
        '/uploads/submissions/21/5058709d-efec-4590-a3d2-7e40f47aceee/36967f0e-ac31-4168-8fca-cb4c74d7c97c-WLG_Tibi Galea .mp3',
        '2025-05-25T21:56:55.489Z',
        false,
        true,
        false,
        false
    ),
    (
        21,
        '767f7a81-f448-4055-9436-e0da398aef29',
        'WLG_Tibi Galea Mix 6',
        'Auto-imported submission',
        '/uploads/submissions/21/767f7a81-f448-4055-9436-e0da398aef29/00cb42b7-533f-4670-982e-39ec0f16e205-WLG_Tibi Galea .mp3',
        '2025-05-26T00:51:31.793Z',
        false,
        true,
        false,
        false
    ),
    (
        21,
        '767f7a81-f448-4055-9436-e0da398aef29',
        'WLG_Tibi Galea Mix 7',
        'Auto-imported submission',
        '/uploads/submissions/21/767f7a81-f448-4055-9436-e0da398aef29/5f0fae54-5101-4e7a-9a22-df0f571e1f4b-WLG_Tibi Galea .mp3',
        '2025-05-25T21:45:05.998Z',
        false,
        true,
        false,
        false
    ),
    (
        21,
        'ba80b82f-dc22-48a1-ac97-9d18aabbce0c',
        'WLG_Tibi Galea Mix 8',
        'Auto-imported submission',
        '/uploads/submissions/21/ba80b82f-dc22-48a1-ac97-9d18aabbce0c/a3d52125-3b43-4476-a2f7-64c0064fea82-WLG_Tibi Galea .mp3',
        '2025-05-25T21:58:09.734Z',
        false,
        true,
        false,
        false
    ),
    (
        21,
        'c2812ec8-a982-455f-b0a5-1afc0bc2adaf',
        'WLG_Tibi Galea Mix 9',
        'Auto-imported submission',
        '/uploads/submissions/21/c2812ec8-a982-455f-b0a5-1afc0bc2adaf/8b6c9186-07c4-46c7-a7a7-d48a29bd12be-WLG_Tibi Galea .mp3',
        '2025-05-25T21:59:00.302Z',
        false,
        true,
        false,
        false
    ),
    (
        21,
        'caaaa3ec-ab36-4c8a-9880-22e44d54a431',
        'WLG_Tibi Galea Mix 10',
        'Auto-imported submission',
        '/uploads/submissions/21/caaaa3ec-ab36-4c8a-9880-22e44d54a431/76d4aa87-fd79-413d-8733-ac4a7c7d18f9-WLG_Tibi Galea .mp3',
        '2025-05-25T21:59:49.437Z',
        false,
        true,
        false,
        false
    );
-- Verify submissions were created
SELECT COUNT(*) as SubmissionCount
FROM "Submissions"
WHERE "CompetitionId" = 21;
-- Show the created submissions
SELECT "SubmissionId",
    "UserId",
    "MixTitle",
    "AudioFilePath"
FROM "Submissions"
WHERE "CompetitionId" = 21
ORDER BY "SubmissionId";
-- Fix Competition 21: Implement "Only Submitters Can Vote" Logic
-- Execute these SQL commands in your PostgreSQL database
-- Step 1: Check current state
SELECT c."CompetitionId",
    c."Title",
    c."Status",
    (
        SELECT COUNT(*)
        FROM "Submissions"
        WHERE "CompetitionId" = 21
            AND "IsDisqualified" = false
    ) as submission_count,
    (
        SELECT COUNT(DISTINCT "UserId")
        FROM "Submissions"
        WHERE "CompetitionId" = 21
            AND "IsDisqualified" = false
    ) as submitter_count,
    (
        SELECT COUNT(*)
        FROM "Round1Assignments"
        WHERE "CompetitionId" = 21
    ) as current_voter_count
FROM "Competitions" c
WHERE c."CompetitionId" = 21;
-- Step 2: Temporarily change competition status to VotingRound1Setup
UPDATE "Competitions"
SET "Status" = 10 -- VotingRound1Setup
WHERE "CompetitionId" = 21;
-- Step 3: Clear existing incorrect assignments (30 voters including non-submitters)
DELETE FROM "Round1Assignments"
WHERE "CompetitionId" = 21;
-- Step 4: Clear existing submission groups
DELETE FROM "SubmissionGroups"
WHERE "CompetitionId" = 21;
-- Step 5: Verify the cleanup
SELECT 'After Cleanup' as step,
    (
        SELECT COUNT(*)
        FROM "Submissions"
        WHERE "CompetitionId" = 21
            AND "IsDisqualified" = false
    ) as submissions,
    (
        SELECT COUNT(DISTINCT "UserId")
        FROM "Submissions"
        WHERE "CompetitionId" = 21
            AND "IsDisqualified" = false
    ) as submitters,
    (
        SELECT COUNT(*)
        FROM "Round1Assignments"
        WHERE "CompetitionId" = 21
    ) as voters_remaining,
    (
        SELECT COUNT(*)
        FROM "SubmissionGroups"
        WHERE "CompetitionId" = 21
    ) as groups_remaining;
-- Step 6: After executing this SQL, use the API to recreate groups:
-- POST /api/competitions/21/round1/create-groups
-- This will create 9 voters (only submitters) instead of 30
-- Step 7: Set competition status back to VotingRound1Open
UPDATE "Competitions"
SET "Status" = 11 -- VotingRound1Open
WHERE "CompetitionId" = 21;
-- Step 8: Final verification - should show 9 voters for 9 submissions
SELECT 'Final State' as step,
    (
        SELECT COUNT(*)
        FROM "Submissions"
        WHERE "CompetitionId" = 21
            AND "IsDisqualified" = false
    ) as submissions,
    (
        SELECT COUNT(DISTINCT "UserId")
        FROM "Submissions"
        WHERE "CompetitionId" = 21
            AND "IsDisqualified" = false
    ) as submitters,
    (
        SELECT COUNT(*)
        FROM "Round1Assignments"
        WHERE "CompetitionId" = 21
    ) as voters,
    (
        SELECT COUNT(*)
        FROM "SubmissionGroups"
        WHERE "CompetitionId" = 21
    ) as groups;
-- Step 9: Check voter distribution across groups
SELECT ra."AssignedGroupNumber" as group_number,
    COUNT(*) as voter_count
FROM "Round1Assignments" ra
WHERE ra."CompetitionId" = 21
GROUP BY ra."AssignedGroupNumber"
ORDER BY ra."AssignedGroupNumber";
-- Step 10: Verify no one votes on their own group (should all show 'OK')
SELECT ra."VoterId",
    ra."VoterGroupNumber",
    ra."AssignedGroupNumber",
    CASE
        WHEN ra."VoterGroupNumber" = ra."AssignedGroupNumber" THEN 'ERROR - Self Voting!'
        ELSE 'OK'
    END as status
FROM "Round1Assignments" ra
WHERE ra."CompetitionId" = 21
ORDER BY ra."VoterId";