const { Client } = require('pg');

async function investigateAndFixCompetition21() {
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

        console.log('\n' + '='.repeat(80));
        console.log('🔍 INVESTIGATING COMPETITION 21 BUSINESS LOGIC VIOLATIONS');
        console.log('='.repeat(80));

        // ISSUE 1: Judge Disqualification Analysis
        console.log('\n📋 ISSUE 1: JUDGE DISQUALIFICATION ANALYSIS');
        console.log('-'.repeat(50));

        // Get incomplete judges
        const incompleteJudgesQuery = `
            SELECT DISTINCT
                ra."VoterId" as judge_id,
                ra."AssignedGroupNumber" as assigned_group,
                ra."HasVoted",
                u."UserName" as username,
                -- Check if this judge is also a competitor
                CASE WHEN EXISTS (
                    SELECT 1 FROM "Submissions" s 
                    WHERE s."UserId" = ra."VoterId" 
                    AND s."CompetitionId" = 21
                ) THEN true ELSE false END as is_also_competitor,
                -- Check current Round2 eligibility
                ra."IsEligibleForRound2Voting"
            FROM "Round1Assignments" ra
            LEFT JOIN "AspNetUsers" u ON ra."VoterId" = u."Id"
            WHERE ra."CompetitionId" = 21
            AND (ra."HasVoted" = false OR ra."HasVoted" IS NULL)
        `;

        const incompleteJudgesResult = await client.query(incompleteJudgesQuery);
        
        console.log(`❌ Incomplete Judges Found: ${incompleteJudgesResult.rows.length}`);
        
        if (incompleteJudgesResult.rows.length > 0) {
            incompleteJudgesResult.rows.forEach((judge, index) => {
                console.log(`   ${index + 1}. Judge: ${judge.username || judge.judge_id}`);
                console.log(`      - Assigned Group: ${judge.assigned_group}`);
                console.log(`      - HasVoted: ${judge.HasVoted}`);
                console.log(`      - Is Also Competitor: ${judge.is_also_competitor}`);
                console.log(`      - Current Round2 Eligibility: ${judge.IsEligibleForRound2Voting}`);
                console.log(`      - ❌ BUSINESS RULE VIOLATION: Should be disqualified from Round2`);
            });
        }

        // ISSUE 2: Round1Score Calculation Analysis
        console.log('\n📊 ISSUE 2: ROUND1SCORE CALCULATION ANALYSIS');
        console.log('-'.repeat(50));

        // Get all submissions with their current Round1Score and calculated score
        const submissionsAnalysisQuery = `
            SELECT 
                s."SubmissionId",
                s."Title",
                s."UserId",
                u."UserName",
                s."Round1Score" as current_round1_score,
                -- Calculate what the Round1Score should be
                COALESCE(
                    (SELECT SUM(sj."OverallScore")
                     FROM "SubmissionJudgments" sj
                     WHERE sj."SubmissionId" = s."SubmissionId"
                     AND sj."CompetitionId" = 21
                     AND sj."VotingRound" = 1
                     AND sj."IsCompleted" = true
                     AND sj."OverallScore" IS NOT NULL), 0
                ) as calculated_round1_score,
                -- Count of judgments received
                (SELECT COUNT(*)
                 FROM "SubmissionJudgments" sj
                 WHERE sj."SubmissionId" = s."SubmissionId"
                 AND sj."CompetitionId" = 21
                 AND sj."VotingRound" = 1
                 AND sj."IsCompleted" = true
                 AND sj."OverallScore" IS NOT NULL
                ) as judgment_count,
                s."IsEligibleForRound1Voting",
                s."IsDisqualified"
            FROM "Submissions" s
            LEFT JOIN "AspNetUsers" u ON s."UserId" = u."Id"
            WHERE s."CompetitionId" = 21
            ORDER BY s."SubmissionId"
        `;

        const submissionsResult = await client.query(submissionsAnalysisQuery);
        
        console.log(`📋 Total Submissions in Competition 21: ${submissionsResult.rows.length}`);
        
        let incorrectScores = [];
        let zeroScores = [];
        
        submissionsResult.rows.forEach((submission, index) => {
            const currentScore = parseFloat(submission.current_round1_score || 0);
            const calculatedScore = parseFloat(submission.calculated_round1_score || 0);
            const isIncorrect = Math.abs(currentScore - calculatedScore) > 0.01;
            
            console.log(`\n   ${index + 1}. Submission ID: ${submission.SubmissionId}`);
            console.log(`      - Title: "${submission.Title}"`);
            console.log(`      - User: ${submission.UserName || submission.UserId}`);
            console.log(`      - Current Round1Score: ${currentScore}`);
            console.log(`      - Calculated Round1Score: ${calculatedScore}`);
            console.log(`      - Judgment Count: ${submission.judgment_count}`);
            console.log(`      - Status: ${isIncorrect ? '❌ INCORRECT' : '✅ CORRECT'}`);
            
            if (isIncorrect) {
                incorrectScores.push({
                    submissionId: submission.SubmissionId,
                    currentScore,
                    calculatedScore,
                    difference: calculatedScore - currentScore
                });
            }
            
            if (calculatedScore === 0 && submission.judgment_count === 0) {
                zeroScores.push(submission.SubmissionId);
            }
        });

        // SUMMARY
        console.log('\n' + '='.repeat(80));
        console.log('📈 ISSUES SUMMARY');
        console.log('='.repeat(80));
        console.log(`❌ Judges needing disqualification: ${incompleteJudgesResult.rows.length}`);
        console.log(`❌ Submissions with incorrect Round1Score: ${incorrectScores.length}`);
        console.log(`⚠️  Submissions with zero scores (no judgments): ${zeroScores.length}`);

        // FIX IMPLEMENTATION
        console.log('\n' + '='.repeat(80));
        console.log('🔧 IMPLEMENTING FIXES');
        console.log('='.repeat(80));

        // FIX 1: Disqualify incomplete judges from Round2 voting
        if (incompleteJudgesResult.rows.length > 0) {
            console.log('\n🔧 FIX 1: Disqualifying incomplete judges from Round2 voting...');
            
            for (const judge of incompleteJudgesResult.rows) {
                const updateQuery = `
                    UPDATE "Round1Assignments" 
                    SET "IsEligibleForRound2Voting" = false,
                        "DisqualificationReason" = 'Failed to complete Round 1 judging requirements'
                    WHERE "CompetitionId" = 21 
                    AND "VoterId" = $1
                `;
                
                await client.query(updateQuery, [judge.judge_id]);
                console.log(`   ✅ Disqualified judge: ${judge.username || judge.judge_id} from Round2 voting`);
                
                // If the judge is also a competitor, consider disqualifying their submission
                if (judge.is_also_competitor) {
                    console.log(`   ⚠️  Note: Judge ${judge.username || judge.judge_id} is also a competitor`);
                    console.log(`   🤔 Consider whether to disqualify their submission as well`);
                }
            }
        }

        // FIX 2: Recalculate all Round1Score values
        if (incorrectScores.length > 0) {
            console.log('\n🔧 FIX 2: Recalculating Round1Score for all submissions...');
            
            for (const scoreIssue of incorrectScores) {
                const updateScoreQuery = `
                    UPDATE "Submissions" 
                    SET "Round1Score" = $1
                    WHERE "SubmissionId" = $2
                `;
                
                await client.query(updateScoreQuery, [scoreIssue.calculatedScore, scoreIssue.submissionId]);
                console.log(`   ✅ Updated Submission ${scoreIssue.submissionId}: ${scoreIssue.currentScore} → ${scoreIssue.calculatedScore}`);
            }
        }

        // VERIFICATION
        console.log('\n' + '='.repeat(80));
        console.log('✅ VERIFICATION OF FIXES');
        console.log('='.repeat(80));

        // Verify judge disqualifications
        const verifyJudgesQuery = `
            SELECT 
                ra."VoterId",
                u."UserName",
                ra."HasVoted",
                ra."IsEligibleForRound2Voting",
                ra."DisqualificationReason"
            FROM "Round1Assignments" ra
            LEFT JOIN "AspNetUsers" u ON ra."VoterId" = u."Id"
            WHERE ra."CompetitionId" = 21
            ORDER BY ra."IsEligibleForRound2Voting" DESC, u."UserName"
        `;

        const verifyJudgesResult = await client.query(verifyJudgesQuery);
        console.log('\n📋 JUDGE ROUND2 ELIGIBILITY STATUS:');
        verifyJudgesResult.rows.forEach((judge, index) => {
            const status = judge.IsEligibleForRound2Voting ? '✅ ELIGIBLE' : '❌ DISQUALIFIED';
            console.log(`   ${index + 1}. ${judge.UserName || judge.VoterId}: ${status}`);
            if (!judge.IsEligibleForRound2Voting && judge.DisqualificationReason) {
                console.log(`      - Reason: ${judge.DisqualificationReason}`);
            }
        });

        // Verify score calculations
        const verifyScoresQuery = `
            SELECT 
                s."SubmissionId",
                s."Title",
                s."Round1Score",
                COALESCE(
                    (SELECT SUM(sj."OverallScore")
                     FROM "SubmissionJudgments" sj
                     WHERE sj."SubmissionId" = s."SubmissionId"
                     AND sj."CompetitionId" = 21
                     AND sj."VotingRound" = 1
                     AND sj."IsCompleted" = true
                     AND sj."OverallScore" IS NOT NULL), 0
                ) as calculated_score
            FROM "Submissions" s
            WHERE s."CompetitionId" = 21
            ORDER BY s."Round1Score" DESC
        `;

        const verifyScoresResult = await client.query(verifyScoresQuery);
        console.log('\n📊 ROUND1SCORE VERIFICATION:');
        verifyScoresResult.rows.forEach((submission, index) => {
            const isCorrect = Math.abs(parseFloat(submission.Round1Score) - parseFloat(submission.calculated_score)) < 0.01;
            const status = isCorrect ? '✅ CORRECT' : '❌ STILL INCORRECT';
            console.log(`   ${index + 1}. Submission ${submission.SubmissionId}: ${submission.Round1Score} ${status}`);
        });

        console.log('\n🎉 COMPETITION 21 BUSINESS LOGIC FIXES COMPLETED!');

    } catch (error) {
        console.error('❌ Database error:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

investigateAndFixCompetition21(); 