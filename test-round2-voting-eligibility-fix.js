const { Client } = require('pg');

async function testRound2VotingEligibilityFix() {
    console.log('🧪 TESTING ROUND 2 VOTING ELIGIBILITY FIX');
    console.log('=========================================');
    console.log('Expected: ALL non-disqualified submissions should have IsEligibleForRound2Voting = true\\n');

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

        // First, check current state before re-running tallying
        console.log('\\n📊 CURRENT STATE (before re-running tallying):');
        await checkVotingEligibilityState(client, competitionId);

        console.log('\\n🔄 The tallying logic has been updated. Please run "Tally Votes & Advance" from admin interface to test the fix.');
        console.log('\\n📋 AFTER RUNNING TALLYING, EXPECTED RESULTS:');
        console.log('   ✅ ALL non-disqualified submissions should have IsEligibleForRound2Voting = true');
        console.log('   ✅ Only 1st place winners should have AdvancedToRound2 = true');
        console.log('   ✅ All eligible submissions can participate in Round 2 voting');

        // Provide instructions for manual testing
        console.log('\\n🎯 MANUAL TESTING STEPS:');
        console.log('1. Open admin interface → Competitions → Competition 21');
        console.log('2. Click "Tally Votes & Advance" button');
        console.log('3. Run this script again to verify results');
        console.log('4. Check that Round 2 voting interface allows all eligible users to vote');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await client.end();
    }
}

async function checkVotingEligibilityState(client, competitionId) {
    // Check submissions voting eligibility
    const submissionsResult = await client.query(`
        SELECT 
            s.\"SubmissionId\",
            s.\"MixTitle\",
            s.\"AdvancedToRound2\",
            s.\"IsEligibleForRound2Voting\",
            s.\"Round1Score\",
            s.\"IsDisqualified\",
            sg.\"GroupNumber\"
        FROM \"Submissions\" s
        LEFT JOIN \"SubmissionGroups\" sg ON s.\"SubmissionId\" = sg.\"SubmissionId\"
        WHERE s.\"CompetitionId\" = $1
        ORDER BY sg.\"GroupNumber\", s.\"Round1Score\" DESC NULLS LAST
    `, [competitionId]);

    console.log('\\n📋 SUBMISSIONS VOTING ELIGIBILITY:');
    
    let groupData = {};
    let eligibilityStats = {
        total: 0,
        disqualified: 0,
        eligibleForRound2Voting: 0,
        advancedToRound2: 0
    };

    submissionsResult.rows.forEach(row => {
        const group = row.GroupNumber;
        if (!groupData[group]) {
            groupData[group] = [];
        }
        groupData[group].push(row);

        eligibilityStats.total++;
        if (row.IsDisqualified) eligibilityStats.disqualified++;
        if (row.IsEligibleForRound2Voting) eligibilityStats.eligibleForRound2Voting++;
        if (row.AdvancedToRound2) eligibilityStats.advancedToRound2++;
    });

    Object.keys(groupData).sort().forEach(groupNum => {
        console.log(`\\n   GROUP ${groupNum}:`);
        groupData[groupNum].forEach((sub, index) => {
            const rank = index + 1;
            const advanceStatus = sub.AdvancedToRound2 ? '🏆 ADVANCED' : '📉 ELIMINATED';
            const voteEligible = sub.IsEligibleForRound2Voting ? '✅ CAN VOTE' : '❌ CANNOT VOTE';
            const disqStatus = sub.IsDisqualified ? '❌ DISQUALIFIED' : '✅ ELIGIBLE';
            
            console.log(`     ${rank}. ${sub.MixTitle} - Score: ${sub.Round1Score || 'null'}`);
            console.log(`        ${disqStatus} | ${advanceStatus} | Round2 Voting: ${voteEligible}`);
        });
    });

    console.log('\\n📊 SUMMARY:');
    console.log(`   Total Submissions: ${eligibilityStats.total}`);
    console.log(`   Disqualified: ${eligibilityStats.disqualified}`);
    console.log(`   Eligible for Round 2 Voting: ${eligibilityStats.eligibleForRound2Voting}`);
    console.log(`   Advanced to Round 2: ${eligibilityStats.advancedToRound2}`);

    console.log('\\n✅ BUSINESS LOGIC VERIFICATION:');
    
    const expectedEligible = eligibilityStats.total - eligibilityStats.disqualified;
    const correctEligibility = eligibilityStats.eligibleForRound2Voting === expectedEligible;
    const correctAdvancement = eligibilityStats.advancedToRound2 <= Object.keys(groupData).length;

    console.log(`   Expected Round 2 voters: ${expectedEligible} (all non-disqualified)`);
    console.log(`   Actual Round 2 voters: ${eligibilityStats.eligibleForRound2Voting}`);
    console.log(`   Round 2 voting eligibility correct: ${correctEligibility ? '✅ YES' : '❌ NO'}`);
    console.log(`   Round 2 advancement correct: ${correctAdvancement ? '✅ YES' : '❌ NO'}`);

    if (correctEligibility && correctAdvancement) {
        console.log('\\n🎯 SUCCESS: Business logic is working correctly!');
    } else if (!correctEligibility) {
        console.log('\\n⚠️ ISSUE: Round 2 voting eligibility needs to be fixed');
        console.log('   All non-disqualified submissions should be eligible for Round 2 voting');
    }
}

// Export for reuse
module.exports = { checkVotingEligibilityState };

// Run the test
if (require.main === module) {
    testRound2VotingEligibilityFix().catch(console.error);
} 