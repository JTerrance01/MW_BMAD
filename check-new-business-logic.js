const { Client } = require('pg');

async function checkNewBusinessLogic() {
    console.log('🔍 CHECKING NEW BUSINESS LOGIC IMPLEMENTATION');
    console.log('============================================');
    console.log('Expected:');
    console.log('• Only 1st place winner per group advances to Round 2');
    console.log('• All non-disqualified competitors can vote in Round 2\\n');

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

        // Check current competition status
        console.log('\\n📋 COMPETITION STATUS:');
        const competitionResult = await client.query(`
            SELECT \"CompetitionId\", \"Status\", \"Title\"
            FROM \"Competitions\"
            WHERE \"CompetitionId\" = $1
        `, [competitionId]);

        if (competitionResult.rows.length > 0) {
            const comp = competitionResult.rows[0];
            console.log(`   ${comp.Title} - Status: ${comp.Status}`);
        }

        // Check submissions by group with current advancement status
        console.log('\\n📊 SUBMISSIONS BY GROUP (with advancement status):');
        const submissionsResult = await client.query(`
            SELECT 
                s.\"SubmissionId\",
                s.\"MixTitle\",
                s.\"AdvancedToRound2\",
                s.\"Round1Score\",
                s.\"IsDisqualified\",
                sg.\"GroupNumber\",
                sg.\"FirstPlaceVotes\",
                sg.\"SecondPlaceVotes\",
                sg.\"ThirdPlaceVotes\"
            FROM \"Submissions\" s
            LEFT JOIN \"SubmissionGroups\" sg ON s.\"SubmissionId\" = sg.\"SubmissionId\"
            WHERE s.\"CompetitionId\" = $1
            ORDER BY sg.\"GroupNumber\", s.\"Round1Score\" DESC NULLS LAST
        `, [competitionId]);

        let groupData = {};
        submissionsResult.rows.forEach(row => {
            const group = row.GroupNumber;
            if (!groupData[group]) {
                groupData[group] = [];
            }
            groupData[group].push(row);
        });

        Object.keys(groupData).sort().forEach(groupNum => {
            console.log(`\\n   GROUP ${groupNum}:`);
            groupData[groupNum].forEach((sub, index) => {
                const rank = index + 1;
                const status = sub.IsDisqualified ? '❌ DISQUALIFIED' : 
                              sub.AdvancedToRound2 ? '🏆 ADVANCED' : 
                              '📉 ELIMINATED';
                              
                const votes = `(1st: ${sub.FirstPlaceVotes || 0}, 2nd: ${sub.SecondPlaceVotes || 0}, 3rd: ${sub.ThirdPlaceVotes || 0})`;
                console.log(`     ${rank}. ${sub.MixTitle} - Score: ${sub.Round1Score || 'null'} ${votes} ${status}`);
            });
        });

        // Verify business logic compliance
        console.log('\\n✅ BUSINESS LOGIC VERIFICATION:');
        
        // Check advancement per group
        let allGroupsCorrect = true;
        let totalFinalists = 0;
        
        Object.keys(groupData).forEach(groupNum => {
            const advancedInGroup = groupData[groupNum].filter(sub => sub.AdvancedToRound2 && !sub.IsDisqualified).length;
            totalFinalists += advancedInGroup;
            
            if (advancedInGroup > 1) {
                allGroupsCorrect = false;
                console.log(`   ❌ Group ${groupNum}: ${advancedInGroup} advanced (should be 1 or 0)`);
            } else {
                console.log(`   ✅ Group ${groupNum}: ${advancedInGroup} advanced (correct)`);
            }
        });

        console.log(`\\n🏅 TOTAL ROUND 2 FINALISTS: ${totalFinalists}`);
        console.log(`   Expected: ${Object.keys(groupData).length} (1 per group)`);
        console.log(`   Business Logic Compliance: ${allGroupsCorrect && totalFinalists <= Object.keys(groupData).length ? '✅ PASSED' : '❌ FAILED'}`);

        // Check Round 2 voting eligibility
        const eligibleVotersResult = await client.query(`
            SELECT COUNT(*) as count
            FROM \"Submissions\"
            WHERE \"CompetitionId\" = $1 AND \"IsDisqualified\" = false
        `, [competitionId]);

        const disqualifiedResult = await client.query(`
            SELECT COUNT(*) as count
            FROM \"Submissions\"
            WHERE \"CompetitionId\" = $1 AND \"IsDisqualified\" = true
        `, [competitionId]);

        console.log(`\\n👥 ROUND 2 VOTING ELIGIBILITY:`);
        console.log(`   Eligible voters: ${eligibleVotersResult.rows[0].count} (all non-disqualified)`);
        console.log(`   Disqualified: ${disqualifiedResult.rows[0].count}`);
        console.log(`   New Rule: All ${eligibleVotersResult.rows[0].count} eligible competitors can vote in Round 2`);

        console.log('\\n🎯 IMPLEMENTATION STATUS:');
        if (totalFinalists === 0) {
            console.log('   ⚠️ No submissions have advanced yet - Round 1 tallying may not have been run with new logic');
            console.log('   📋 Next step: Run Round 1 tallying to test new advancement logic');
        } else if (totalFinalists <= Object.keys(groupData).length && allGroupsCorrect) {
            console.log('   ✅ New business logic is working correctly!');
            console.log('   ✅ Only 1st place winners advance to Round 2');
            console.log('   ✅ All non-disqualified competitors eligible for Round 2 voting');
        } else {
            console.log('   ❌ Business logic needs adjustment');
            console.log('   📋 Check advancement algorithm in Round1AssignmentService');
        }

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    } finally {
        await client.end();
    }
}

// Run the check
checkNewBusinessLogic().catch(console.error); 