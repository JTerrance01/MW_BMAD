const { Client } = require('pg');

async function investigateTallyingIssues() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'MixWarz',
        user: 'postgres',
        password: 'Ready2go!'
    });

    try {
        await client.connect();
        console.log('🔗 Connected to database');

        const competitionId = 21;

        // Check incomplete judges and their submissions
        console.log('\n📊 INCOMPLETE JUDGES ANALYSIS:');
        const incompleteJudgesResult = await client.query(`
            SELECT 
                r1a."VoterId",
                r1a."AssignedGroupNumber",
                r1a."HasVoted",
                u."UserName",
                s."SubmissionId",
                s."MixTitle",
                s."Round1Score",
                s."AdvancedToRound2",
                s."IsDisqualified"
            FROM "Round1Assignments" r1a
            JOIN "AspNetUsers" u ON r1a."VoterId" = u."Id"
            LEFT JOIN "Submissions" s ON s."UserId" = r1a."VoterId" AND s."CompetitionId" = $1
            WHERE r1a."CompetitionId" = $1 AND r1a."HasVoted" = false
            ORDER BY r1a."AssignedGroupNumber", u."UserName"
        `, [competitionId]);

        if (incompleteJudgesResult.rows.length > 0) {
            console.log('Incomplete judges and their submissions:');
            incompleteJudgesResult.rows.forEach(row => {
                console.log(`  Judge: ${row.UserName} (Group ${row.AssignedGroupNumber})`);
                if (row.SubmissionId) {
                    console.log(`    Submission: ${row.MixTitle} (ID: ${row.SubmissionId})`);
                    console.log(`    Round1Score: ${row.Round1Score || 'NULL'}`);
                    console.log(`    AdvancedToR2: ${row.AdvancedToRound2}`);
                    console.log(`    IsDisqualified: ${row.IsDisqualified}`);
                } else {
                    console.log(`    No submission found for this judge`);
                }
            });
        } else {
            console.log('No incomplete judges found');
        }

        // Check submissions with null Round1Scores
        console.log('\n📊 SUBMISSIONS WITH NULL ROUND1SCORES:');
        const nullScoresResult = await client.query(`
            SELECT 
                s."SubmissionId",
                s."MixTitle",
                s."UserId",
                s."Round1Score",
                s."AdvancedToRound2",
                s."IsDisqualified",
                u."UserName"
            FROM "Submissions" s
            JOIN "AspNetUsers" u ON s."UserId" = u."Id"
            WHERE s."CompetitionId" = $1 AND s."Round1Score" IS NULL
            ORDER BY s."SubmissionId"
        `, [competitionId]);

        if (nullScoresResult.rows.length > 0) {
            console.log('Submissions with NULL Round1Score:');
            nullScoresResult.rows.forEach(row => {
                console.log(`  ${row.MixTitle} by ${row.UserName}`);
                console.log(`    SubmissionId: ${row.SubmissionId}`);
                console.log(`    Round1Score: ${row.Round1Score || 'NULL'}`);
                console.log(`    AdvancedToR2: ${row.AdvancedToRound2}`);
                console.log(`    IsDisqualified: ${row.IsDisqualified}`);
            });
        } else {
            console.log('All submissions have Round1Score values');
        }

        // Check judgment coverage for each submission
        console.log('\n📊 JUDGMENT COVERAGE ANALYSIS:');
        const judgmentCoverageResult = await client.query(`
            SELECT 
                s."SubmissionId",
                s."MixTitle",
                s."Round1Score",
                COUNT(sj."SubmissionJudgmentId") as "JudgmentCount",
                AVG(sj."OverallScore") as "AverageScore",
                SUM(sj."OverallScore") as "TotalScore"
            FROM "Submissions" s
            LEFT JOIN "SubmissionJudgments" sj ON s."SubmissionId" = sj."SubmissionId" 
                AND sj."CompetitionId" = $1 
                AND sj."VotingRound" = 1 
                AND sj."IsCompleted" = true
                AND sj."OverallScore" IS NOT NULL
            WHERE s."CompetitionId" = $1
            GROUP BY s."SubmissionId", s."MixTitle", s."Round1Score"
            ORDER BY s."SubmissionId"
        `, [competitionId]);

        console.log('Judgment coverage per submission:');
        judgmentCoverageResult.rows.forEach(row => {
            console.log(`  ${row.MixTitle}:`);
            console.log(`    Judgments: ${row.JudgmentCount}`);
            console.log(`    Average Score: ${row.AverageScore ? parseFloat(row.AverageScore).toFixed(2) : 'N/A'}`);
            console.log(`    Total Score: ${row.TotalScore || 'N/A'}`);
            console.log(`    Current Round1Score: ${row.Round1Score || 'NULL'}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

investigateTallyingIssues(); 