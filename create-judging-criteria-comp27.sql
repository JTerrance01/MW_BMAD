-- Create JudgingCriterias for Competition 27 "Best of Me"
-- This will enable the Score Breakdown API to show detailed criteria breakdowns
INSERT INTO "JudgingCriterias" (
        "CompetitionId",
        "Name",
        "Description",
        "Weight",
        "MinScore",
        "MaxScore",
        "DisplayOrder",
        "IsActive"
    )
VALUES -- Technical Clarity (30%)
    (
        27,
        'Technical Clarity',
        'Audio quality, mixing precision, and technical execution',
        0.30,
        1,
        10,
        1,
        true
    ),
    -- Creative Balance (25%) 
    (
        27,
        'Creative Balance',
        'Artistic interpretation, creativity, and innovative approach',
        0.25,
        1,
        10,
        2,
        true
    ),
    -- Dynamic Range (20%)
    (
        27,
        'Dynamic Range',
        'Use of dynamics, contrast, and energy flow throughout the mix',
        0.20,
        1,
        10,
        3,
        true
    ),
    -- Stereo Imaging (25%)
    (
        27,
        'Stereo Imaging',
        'Spatial placement, width, and stereo field utilization',
        0.25,
        1,
        10,
        4,
        true
    );
-- Verify the insert
SELECT 'JudgingCriterias created for Competition 27:' as status;
SELECT "JudgingCriteriaId",
    "Name",
    "Weight",
    "MinScore",
    "MaxScore",
    "DisplayOrder"
FROM "JudgingCriterias"
WHERE "CompetitionId" = 27
ORDER BY "DisplayOrder";