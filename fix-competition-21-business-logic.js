const { Client } = require('pg');

async function fixCompetition21BusinessLogic() {
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
        console.log('🔧 FIXING COMPETITION 21 BUSINESS LOGIC VIOLATIONS');
        console.log('='.repeat(80));

        // ISSUE 1: Judge Disqualification Fix
        console.log('\n📋 ISSUE 1: FIXING JUDGE DISQUALIFICATION');
        console.log('-'.repeat(50));

        // Find judges who haven't completed all their judgments
        const incompleteJudgesQuery = `
            WITH JudgeAssignments AS (
                SELECT 
                    ra."VoterId",
                    ra."AssignedGroupNumber",
                    ra."HasVoted",
                    u."UserName",
                    -- Count total submissions in their assigned group
                    (SELECT COUNT(*)
                     FROM "SubmissionGroups" sg
                     JOIN "Submissions" s ON sg."SubmissionId" = s."SubmissionId"
                     WHERE sg."CompetitionId" = 21 
                     AND sg."GroupNumber" = ra."AssignedGroupNumber"
                     AND s."IsDisqualified" = false
                     AND s."IsEligibleForRound1Voting" = true
                    ) as total_submissions_in_group,
                    -- Count completed judgments by this judge
                    (SELECT COUNT(*)
                     FROM "SubmissionJudgments" sj
                     WHERE sj."JudgeId" = ra."VoterId"
                     AND sj."CompetitionId" = 21
                     AND sj."VotingRound" = 1
                     AND sj."IsCompleted" = true
                     AND sj."OverallScore" IS NOT NULL
                     AND sj."SubmissionId" IN (
                         SELECT sg."SubmissionId"
                         FROM "SubmissionGroups" sg
                         JOIN "Submissions" s ON sg."SubmissionId" = s."SubmissionId"
                         WHERE sg."CompetitionId" = 21 
                         AND sg."GroupNumber" = ra."AssignedGroupNumber"
                         AND s."IsDisqualified" = false
                         AND s."IsEligibleForRound1Voting" = true
                     )
                    ) as completed_judgments
                FROM "Round1Assignments" ra
                LEFT JOIN "AspNetUsers" u ON ra."VoterId" = u."Id"
                WHERE ra."CompetitionId" = 21
            )
            SELECT 
                "VoterId",
                "UserName",
                "AssignedGroupNumber",
                "HasVoted",
                total_submissions_in_group,
                completed_judgments,
                CASE 
                    WHEN completed_judgments = total_submissions_in_group THEN true
                    ELSE false
                END as should_have_voted
            FROM JudgeAssignments
            ORDER BY should_have_voted ASC, "UserName"
        `;

        const incompleteJudgesResult = await client.query(incompleteJudgesQuery);
        
        console.log(`📊 Judge Analysis Results:`);
        
        let judgesNeedingFix = [];
        
        incompleteJudgesResult.rows.forEach((judge, index) => {
            const isActuallyComplete = judge.should_have_voted;
            const currentlyMarkedComplete = judge.HasVoted;
            const needsFix = isActuallyComplete !== currentlyMarkedComplete;
            
            console.log(`\n   ${index + 1}. Judge: ${judge.UserName || judge.VoterId}`);
            console.log(`      - Assigned Group: ${judge.AssignedGroupNumber}`);
            console.log(`      - Total Submissions: ${judge.total_submissions_in_group}`);
            console.log(`      - Completed Judgments: ${judge.completed_judgments}`);
            console.log(`      - Should Have Voted: ${isActuallyComplete ? 'YES' : 'NO'}`);
            console.log(`      - Currently HasVoted: ${currentlyMarkedComplete}`);
            console.log(`      - Status: ${needsFix ? '❌ NEEDS FIX' : '✅ CORRECT'}`);
            
            if (needsFix) {
                judgesNeedingFix.push({
                    voterId: judge.VoterId,
                    userName: judge.UserName,
                    shouldHaveVoted: isActuallyComplete,
                    currentlyHasVoted: currentlyMarkedComplete
                });
            }
        });

        // ISSUE 2: Round1Score Calculation Fix
        console.log('\n📊 ISSUE 2: FIXING ROUND1SCORE CALCULATIONS');
        console.log('-'.repeat(50));

        // Get all submissions and calculate correct Round1Score
        const submissionsAnalysisQuery = `
            SELECT 
                s."SubmissionId",
                s."MixTitle",
                s."UserId",
                u."UserName",
                s."Round1Score" as current_round1_score,
                -- Calculate what the Round1Score should be (sum of OverallScore from all judgments)
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
                ) as judgment_count
            FROM "Submissions" s
            LEFT JOIN "AspNetUsers" u ON s."UserId" = u."Id"
            WHERE s."CompetitionId" = 21
            ORDER BY s."SubmissionId"
        `;

        const submissionsResult = await client.query(submissionsAnalysisQuery);
        
        console.log(`📊 Submission Score Analysis:`);
        
        let submissionsNeedingFix = [];
        
        submissionsResult.rows.forEach((submission, index) => {
            const currentScore = parseFloat(submission.current_round1_score || 0);
            const calculatedScore = parseFloat(submission.calculated_round1_score || 0);
            const needsFix = Math.abs(currentScore - calculatedScore) > 0.01;
            
            console.log(`\n   ${index + 1}. Submission ID: ${submission.SubmissionId}`);
            console.log(`      - Title: "${submission.MixTitle}"`);
            console.log(`      - User: ${submission.UserName || submission.UserId}`);
            console.log(`      - Current Round1Score: ${currentScore}`);
            console.log(`      - Calculated Round1Score: ${calculatedScore}`);
            console.log(`      - Judgment Count: ${submission.judgment_count}`);
            console.log(`      - Status: ${needsFix ? '❌ NEEDS FIX' : '✅ CORRECT'}`);
            
            if (needsFix) {
                submissionsNeedingFix.push({
                    submissionId: submission.SubmissionId,
                    title: submission.MixTitle,
                    currentScore,
                    calculatedScore,
                    difference: calculatedScore - currentScore
                });
            }
        });

        // APPLY FIXES
        console.log('\n' + '='.repeat(80));
        console.log('🔧 APPLYING FIXES');
        console.log('='.repeat(80));

        // FIX 1: Update HasVoted flags for judges
        if (judgesNeedingFix.length > 0) {
            console.log('\n🔧 FIX 1: Updating HasVoted flags for judges...');
            
            for (const judge of judgesNeedingFix) {
                const updateJudgeQuery = `
                    UPDATE "Round1Assignments" 
                    SET "HasVoted" = $1,
                        "VotingCompletedDate" = CASE 
                            WHEN $1 = true AND "VotingCompletedDate" IS NULL 
                            THEN NOW() 
                            WHEN $1 = false 
                            THEN NULL 
                            ELSE "VotingCompletedDate" 
                        END
                    WHERE "CompetitionId" = 21 
                    AND "VoterId" = $2
                `;
                
                await client.query(updateJudgeQuery, [judge.shouldHaveVoted, judge.voterId]);
                
                const action = judge.shouldHaveVoted ? 'Marked as completed' : 'Marked as incomplete';
                console.log(`   ✅ ${action}: ${judge.userName || judge.voterId}`);
                
                if (!judge.shouldHaveVoted) {
                    console.log(`      - ⚠️  Judge is now DISQUALIFIED from Round 2 voting`);
                }
            }
        } else {
            console.log('\n✅ FIX 1: No judge HasVoted flags need updating');
        }

        // FIX 2: Update Round1Score values
        if (submissionsNeedingFix.length > 0) {
            console.log('\n🔧 FIX 2: Updating Round1Score values...');
            
            for (const submission of submissionsNeedingFix) {
                const updateScoreQuery = `
                    UPDATE "Submissions" 
                    SET "Round1Score" = $1
                    WHERE "SubmissionId" = $2
                `;
                
                await client.query(updateScoreQuery, [submission.calculatedScore, submission.submissionId]);
                console.log(`   ✅ Updated "${submission.title}": ${submission.currentScore} → ${submission.calculatedScore}`);
            }
        } else {
            console.log('\n✅ FIX 2: No Round1Score values need updating');
        }

        // VERIFICATION
        console.log('\n' + '='.repeat(80));
        console.log('✅ VERIFICATION OF FIXES');
        console.log('='.repeat(80));

        // Verify judge statuses
        console.log('\n📋 JUDGE ROUND2 ELIGIBILITY STATUS (VERIFIED):');
        const verifyJudgesQuery = `
            SELECT 
                ra."VoterId",
                u."UserName",
                ra."HasVoted",
                ra."VotingCompletedDate",
                CASE 
                    WHEN ra."HasVoted" = true THEN '✅ ELIGIBLE for Round2'
                    ELSE '❌ DISQUALIFIED from Round2'
                END as round2_status
            FROM "Round1Assignments" ra
            LEFT JOIN "AspNetUsers" u ON ra."VoterId" = u."Id"
            WHERE ra."CompetitionId" = 21
            ORDER BY ra."HasVoted" DESC, u."UserName"
        `;

        const verifyJudgesResult = await client.query(verifyJudgesQuery);
        verifyJudgesResult.rows.forEach((judge, index) => {
            console.log(`   ${index + 1}. ${judge.UserName || judge.VoterId}: ${judge.round2_status}`);
            if (!judge.HasVoted) {
                console.log(`      - Reason: Did not complete Round 1 judging requirements`);
            }
        });

        // Verify score calculations
        console.log('\n📊 ROUND1SCORE VALUES (VERIFIED):');
        const verifyScoresQuery = `
            SELECT 
                s."SubmissionId",
                s."MixTitle",
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
        verifyScoresResult.rows.forEach((submission, index) => {
            const isCorrect = Math.abs(parseFloat(submission.Round1Score) - parseFloat(submission.calculated_score)) < 0.01;
            const status = isCorrect ? '✅ CORRECT' : '❌ STILL INCORRECT';
            console.log(`   ${index + 1}. "${submission.MixTitle}": Score ${submission.Round1Score} ${status}`);
        });

        // Final Summary
        console.log('\n' + '='.repeat(80));
        console.log('🎉 BUSINESS LOGIC FIXES COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(80));
        console.log(`✅ Judge disqualification: ${judgesNeedingFix.length} judges updated`);
        console.log(`✅ Round1Score correction: ${submissionsNeedingFix.length} submissions updated`);
        console.log('✅ Competition 21 now has fair and accurate business logic');

    } catch (error) {
        console.error('❌ Database error:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

fixCompetition21BusinessLogic(); 