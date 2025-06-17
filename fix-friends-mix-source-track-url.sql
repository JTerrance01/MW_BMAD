-- Fix Friends Mix Competition Source Track URL
-- This script fixes the double URL encoding issue in the SourceTrackUrl
-- First, let's see the current state of competitions with problematic URLs
SELECT "CompetitionId",
    "Title",
    "SourceTrackUrl",
    LENGTH("SourceTrackUrl") as url_length
FROM public."Competitions"
WHERE "SourceTrackUrl" LIKE '%localhost%'
    OR "SourceTrackUrl" LIKE '%https%3A%';
-- Update the Friends Mix competition to use the proper relative URL format
-- Based on the screenshot, the Friends Mix should point to the Crystal Bearth track
UPDATE public."Competitions"
SET "SourceTrackUrl" = '/uploads/competition-source-tracks/5df19a4b-062a-4116-b3a7-144493e5ceb7-FRIENDS%20by%20Crystal%20Bearth.mp3'
WHERE "Title" LIKE '%Friends%'
    OR "Title" LIKE '%Crystal%'
    OR "Title" LIKE '%Bearth%';
-- Alternative: If we need to fix any competition with double-encoded URLs,
-- we can extract the proper filename from the malformed URL
UPDATE public."Competitions"
SET "SourceTrackUrl" = CASE
        WHEN "SourceTrackUrl" LIKE '%uploads/competition-source-tracks/%' THEN '/uploads/competition-source-tracks/' || SUBSTRING(
            "SourceTrackUrl"
            FROM '.*/competition-source-tracks/(.*)$'
        )
        ELSE "SourceTrackUrl"
    END
WHERE "SourceTrackUrl" LIKE '%localhost%'
    OR "SourceTrackUrl" LIKE '%https%3A%';
-- Verify the changes
SELECT "CompetitionId",
    "Title",
    "SourceTrackUrl"
FROM public."Competitions"
WHERE "SourceTrackUrl" IS NOT NULL
ORDER BY "CompetitionId";