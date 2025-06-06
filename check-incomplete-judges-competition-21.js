const { Client } = require('pg');

async function checkIncompleteJudges() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'MixWarz',
        user: 'postgres',
        password: 'Ready2go!'
    });

    try {
        await client.connect();
        console.log('🔌 Connected to database');

        // Step 1: Get all Round 1 assignments for competition 21
        const assignmentsQuery = `
            SELECT 
                ra."VoterId",
                ra."AssignedGroupNumber",
                ra."HasVoted",
                ra."VotingCompletedDate"
            FROM "Round1Assignments" ra
            WHERE ra."CompetitionId" = 21
            ORDER BY ra."AssignedGroupNumber", ra."VoterId"
        `;

        const assignmentsResult = await client.query(assignmentsQuery);
        console.log(`\n📊 Total judges assigned to Competition 21: ${assignmentsResult.rows.length}`);

        if (assignmentsResult.rows.length === 0) {
            console.log('❌ No judges found for competition 21');
            return;
        }

        // Step 2: For each judge, check if they completed all judgments in their assigned group
        let incompleteJudges = [];
        let completeJudges = [];

        for (const assignment of assignmentsResult.rows) {
            const { VoterId, AssignedGroupNumber, HasVoted } = assignment;

            // Get all eligible submissions in the judge's assigned group
            const submissionsQuery = `
                SELECT sg."SubmissionId"
                FROM "SubmissionGroups" sg
                JOIN "Submissions" s ON sg."SubmissionId" = s."SubmissionId"
                WHERE sg."CompetitionId" = 21 
                AND sg."GroupNumber" = $1
                AND s."IsDisqualified" = false
                AND s."IsEligibleForRound1Voting" = true
            `;

            const submissionsResult = await client.query(submissionsQuery, [AssignedGroupNumber]);
            const totalSubmissions = submissionsResult.rows.length;

            // Get completed judgments by this judge
            const judgmentsQuery = `
                SELECT COUNT(*) as completed_count
                FROM "SubmissionJudgments" sj
                WHERE sj."JudgeId" = $1
                AND sj."CompetitionId" = 21
                AND sj."VotingRound" = 1
                AND sj."IsCompleted" = true
                AND sj."OverallScore" IS NOT NULL
                AND sj."SubmissionId" IN (
                    SELECT sg."SubmissionId"
                    FROM "SubmissionGroups" sg
                    JOIN "Submissions" s ON sg."SubmissionId" = s."SubmissionId"
                    WHERE sg."CompetitionId" = 21 
                    AND sg."GroupNumber" = $2
                    AND s."IsDisqualified" = false
                    AND s."IsEligibleForRound1Voting" = true
                )
            `;

            const judgmentsResult = await client.query(judgmentsQuery, [VoterId, AssignedGroupNumber]);
            const completedJudgments = parseInt(judgmentsResult.rows[0].completed_count);

            const isComplete = completedJudgments === totalSubmissions;

            console.log(`\n👤 Judge ${VoterId}:`);
            console.log(`   📍 Assigned Group: ${AssignedGroupNumber}`);
            console.log(`   📊 Total Submissions in Group: ${totalSubmissions}`);
            console.log(`   ✅ Completed Judgments: ${completedJudgments}`);
            console.log(`   🎯 HasVoted Flag: ${HasVoted}`);
            console.log(`   📝 Status: ${isComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);

            if (isComplete) {
                completeJudges.push({
                    judgeId: VoterId,
                    group: AssignedGroupNumber,
                    completed: completedJudgments,
                    total: totalSubmissions
                });
            } else {
                incompleteJudges.push({
                    judgeId: VoterId,
                    group: AssignedGroupNumber,
                    completed: completedJudgments,
                    total: totalSubmissions,
                    remaining: totalSubmissions - completedJudgments
                });
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📈 COMPETITION 21 ROUND 1 JUDGMENT COMPLETION SUMMARY');
        console.log('='.repeat(60));
        console.log(`🎯 Total Judges Assigned: ${assignmentsResult.rows.length}`);
        console.log(`✅ Judges who completed ALL judgments: ${completeJudges.length}`);
        console.log(`❌ Judges who did NOT complete judgments: ${incompleteJudges.length}`);
        console.log(`📊 Completion Rate: ${((completeJudges.length / assignmentsResult.rows.length) * 100).toFixed(1)}%`);

        if (incompleteJudges.length > 0) {
            console.log('\n❌ INCOMPLETE JUDGES DETAILS:');
            incompleteJudges.forEach((judge, index) => {
                console.log(`   ${index + 1}. Judge ${judge.judgeId} (Group ${judge.group}): ${judge.completed}/${judge.total} completed (${judge.remaining} remaining)`);
            });
        }

        if (completeJudges.length > 0) {
            console.log('\n✅ COMPLETE JUDGES:');
            completeJudges.forEach((judge, index) => {
                console.log(`   ${index + 1}. Judge ${judge.judgeId} (Group ${judge.group}): ${judge.completed}/${judge.total} completed`);
            });
        }

    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

checkIncompleteJudges(); 