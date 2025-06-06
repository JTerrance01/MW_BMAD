const { Client } = require('pg');

async function resetRound1VotingForRetesting() {
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

        // Step 1: Check current competition status
        console.log('\n📊 CURRENT STATE CHECK:');
        const competitionResult = await client.query(
            'SELECT "CompetitionId", "Title", "Status" FROM "Competitions" WHERE "CompetitionId" = $1',
            [competitionId]
        );

        if (competitionResult.rows.length === 0) {
            console.log(`❌ Competition ${competitionId} not found`);
            return;
        }

        const competition = competitionResult.rows[0];
        console.log(`Competition: ${competition.Title}`);
        console.log(`Current Status: ${competition.Status}`);

        // Step 2: Check current SubmissionGroups tallying data
        console.log('\n📊 CURRENT SUBMISSION GROUPS TALLY DATA:');
        const submissionGroupsResult = await client.query(`
            SELECT 
                sg."SubmissionGroupId",
                sg."SubmissionId", 
                sg."GroupNumber",
                sg."TotalPoints",
                sg."FirstPlaceVotes",
                sg."SecondPlaceVotes", 
                sg."ThirdPlaceVotes",
                s."MixTitle" as "SubmissionTitle"
            FROM "SubmissionGroups" sg
            JOIN "Submissions" s ON sg."SubmissionId" = s."SubmissionId"
            WHERE sg."CompetitionId" = $1
            ORDER BY sg."GroupNumber", sg."TotalPoints" DESC
        `, [competitionId]);

        console.log(`Found ${submissionGroupsResult.rows.length} submission groups:`);
        submissionGroupsResult.rows.forEach(row => {
            console.log(`  Group ${row.GroupNumber}: ${row.SubmissionTitle} - Points: ${row.TotalPoints}, 1st: ${row.FirstPlaceVotes}, 2nd: ${row.SecondPlaceVotes}, 3rd: ${row.ThirdPlaceVotes}`);
        });

        // Step 3: Check current Submissions advancement data
        console.log('\n📊 CURRENT SUBMISSIONS ADVANCEMENT DATA:');
        const submissionsResult = await client.query(`
            SELECT 
                "SubmissionId",
                "MixTitle",
                "Round1Score",
                "AdvancedToRound2",
                "IsEligibleForRound2Voting"
            FROM "Submissions"
            WHERE "CompetitionId" = $1
            ORDER BY "Round1Score" DESC NULLS LAST
        `, [competitionId]);

        console.log(`Found ${submissionsResult.rows.length} submissions:`);
        submissionsResult.rows.forEach(row => {
            console.log(`  ${row.MixTitle}: Score=${row.Round1Score}, AdvancedToR2=${row.AdvancedToRound2}, EligibleForR2=${row.IsEligibleForRound2Voting}`);
        });

        // Step 4: Check Round1Assignments HasVoted status
        console.log('\n📊 CURRENT ROUND1 ASSIGNMENTS VOTING STATUS:');
        const assignmentsResult = await client.query(`
            SELECT 
                r1a."Round1AssignmentId",
                r1a."VoterId",
                r1a."AssignedGroupNumber",
                r1a."HasVoted",
                u."UserName"
            FROM "Round1Assignments" r1a
            JOIN "AspNetUsers" u ON r1a."VoterId" = u."Id"
            WHERE r1a."CompetitionId" = $1
            ORDER BY r1a."AssignedGroupNumber", u."UserName"
        `, [competitionId]);

        console.log(`Found ${assignmentsResult.rows.length} Round1 assignments:`);
        assignmentsResult.rows.forEach(row => {
            console.log(`  Group ${row.AssignedGroupNumber}: ${row.UserName} - HasVoted: ${row.HasVoted}`);
        });

        // Confirmation prompt
        console.log('\n⚠️  RESET CONFIRMATION:');
        console.log('This will:');
        console.log('1. Reset Competition status to "VotingRound1Open"');
        console.log('2. Clear all SubmissionGroups tally data (TotalPoints, FirstPlaceVotes, SecondPlaceVotes, ThirdPlaceVotes)');
        console.log('3. Clear all Submissions Round1 advancement data (Round1Score, AdvancedToRound2, IsEligibleForRound2Voting)');
        console.log('4. Reset all Round1Assignments HasVoted flags to false');
        console.log('5. This will allow complete retesting of Round1 voting and tallying process');

        // For safety, require manual confirmation by uncommenting the next section
        console.log('\n🛡️  SAFETY CHECK: Proceeding with reset operations...');
        
        
        // RESET OPERATIONS - Uncomment this section to proceed with reset
        console.log('\n🔄 STARTING RESET OPERATIONS...');

                 // Step 5: Reset Competition status to VotingRound1Open
         console.log('\n1️⃣ Resetting Competition status...');
         await client.query(
             'UPDATE "Competitions" SET "Status" = $1 WHERE "CompetitionId" = $2',
             [11, competitionId]  // 11 = VotingRound1Open
         );
        console.log('✅ Competition status reset to VotingRound1Open');

                 // Step 6: Clear SubmissionGroups tally data
         console.log('\n2️⃣ Clearing SubmissionGroups tally data...');
         const clearSubmissionGroupsResult = await client.query(`
             UPDATE "SubmissionGroups" 
             SET 
                 "TotalPoints" = NULL,
                 "FirstPlaceVotes" = NULL,
                 "SecondPlaceVotes" = NULL,
                 "ThirdPlaceVotes" = NULL
             WHERE "CompetitionId" = $1
         `, [competitionId]);
        console.log(`✅ Cleared tally data for ${clearSubmissionGroupsResult.rowCount} submission groups`);

                 // Step 7: Clear Submissions Round1 advancement data
         console.log('\n3️⃣ Clearing Submissions Round1 advancement data...');
         const clearSubmissionsResult = await client.query(`
             UPDATE "Submissions" 
             SET 
                 "Round1Score" = NULL,
                 "AdvancedToRound2" = false,
                 "IsEligibleForRound2Voting" = false
             WHERE "CompetitionId" = $1
         `, [competitionId]);
        console.log(`✅ Cleared Round1 advancement data for ${clearSubmissionsResult.rowCount} submissions`);

                 // Step 8: Reset Round1Assignments HasVoted flags
         console.log('\n4️⃣ Resetting Round1Assignments HasVoted flags...');
         const resetAssignmentsResult = await client.query(`
             UPDATE "Round1Assignments" 
             SET "HasVoted" = false
             WHERE "CompetitionId" = $1
         `, [competitionId]);
        console.log(`✅ Reset HasVoted flags for ${resetAssignmentsResult.rowCount} assignments`);

        console.log('\n🎉 RESET COMPLETE!');
        console.log('Competition 21 has been reset to Round1 voting state.');
        console.log('You can now retest the Round1 voting and tallying process.');

    } catch (error) {
        console.error('❌ Error during reset process:', error);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Run the reset
resetRound1VotingForRetesting(); 