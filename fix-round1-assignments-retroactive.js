const axios = require('axios');

const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;

async function fixRound1AssignmentsRetroactive() {
  console.log('🔧 FIXING ROUND1 ASSIGNMENTS RETROACTIVELY');
  console.log('==========================================\n');

  try {
    // Step 1: Login as admin
    console.log('🔑 Step 1: Getting Admin Token');
    const loginResponse = await axios.post(
      `${API_BASE}/api/auth/login`,
      {
        email: 'admin@mixwarz.com',
        password: 'Admin123!'
      },
      {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    if (loginResponse.status !== 200 || !loginResponse.data.token) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Successfully logged in as admin');

    // Step 2: Check current voting stats
    console.log('\n📊 Step 2: Current Voting Stats (Before Fix)');
    const statsBeforeResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    const statsBefore = statsBeforeResponse.data;
    console.log(`   TotalVoters: ${statsBefore.totalVoters}`);
    console.log(`   VotersCompleted: ${statsBefore.votersCompleted}`);
    console.log(`   VotingCompletionPercentage: ${statsBefore.votingCompletionPercentage}%`);

    // Step 3: Create SQL script to fix Round1Assignments based on existing judgments
    console.log('\n🛠️ Step 3: SQL Script to Fix Round1Assignments');
    console.log('Execute this SQL script in your database to fix the Round1Assignments:');
    console.log('');
    console.log('-- Update Round1Assignments based on existing SubmissionJudgments');
    console.log('UPDATE "Round1Assignments"');
    console.log('SET "HasVoted" = true, "VotingCompletedDate" = NOW()');
    console.log('WHERE "CompetitionId" = 21');
    console.log('  AND "HasVoted" = false');
    console.log('  AND "VoterId" IN (');
    console.log('    SELECT DISTINCT "JudgeId"');
    console.log('    FROM "SubmissionJudgments"');
    console.log('    WHERE "CompetitionId" = 21');
    console.log('      AND "VotingRound" = 1');
    console.log('      AND "IsCompleted" = true');
    console.log('  );');
    console.log('');
    console.log('-- Check which voters will be affected:');
    console.log('SELECT ra."VoterId", COUNT(sj."JudgeId") as judgment_count');
    console.log('FROM "Round1Assignments" ra');
    console.log('LEFT JOIN "SubmissionJudgments" sj ON ra."VoterId" = sj."JudgeId" AND sj."CompetitionId" = 21 AND sj."VotingRound" = 1');
    console.log('WHERE ra."CompetitionId" = 21 AND ra."HasVoted" = false');
    console.log('GROUP BY ra."VoterId"');
    console.log('HAVING COUNT(sj."JudgeId") > 0;');

    // Step 4: Verification queries
    console.log('\n📋 Step 4: Verification Queries');
    console.log('After running the UPDATE, verify with these queries:');
    console.log('');
    console.log('-- Count voters with HasVoted=true after fix:');
    console.log('SELECT "HasVoted", COUNT(*) as count');
    console.log('FROM "Round1Assignments"');
    console.log('WHERE "CompetitionId" = 21');
    console.log('GROUP BY "HasVoted";');
    console.log('');
    console.log('-- Show voters who completed judgments:');
    console.log('SELECT ra."VoterId", ra."HasVoted", ra."VotingCompletedDate", COUNT(sj."JudgeId") as judgments');
    console.log('FROM "Round1Assignments" ra');
    console.log('LEFT JOIN "SubmissionJudgments" sj ON ra."VoterId" = sj."JudgeId" AND sj."CompetitionId" = 21 AND sj."VotingRound" = 1');
    console.log('WHERE ra."CompetitionId" = 21');
    console.log('GROUP BY ra."VoterId", ra."HasVoted", ra."VotingCompletedDate"');
    console.log('ORDER BY judgments DESC;');

    // Step 5: Instructions for manual execution
    console.log('\n🚀 Step 5: Manual Execution Instructions');
    console.log('1. Copy the UPDATE SQL statement above');
    console.log('2. Connect to your PostgreSQL database');
    console.log('3. Execute the UPDATE statement');
    console.log('4. Run the verification queries to confirm the fix');
    console.log('5. Re-run this script to see the updated voting stats');

    // Step 6: Show expected results
    console.log('\n💡 Expected Results After Fix:');
    console.log('Based on your report of 8 completed voters:');
    console.log('   - VotersCompleted should change from 0 to 8');
    console.log('   - VotingCompletionPercentage should change from 0% to ~27%');
    console.log('   - Admin interface should show "Voters: 8/30" instead of "Voters: 0/30"');

    // Step 7: Create a test script to verify after manual fix
    console.log('\n🧪 Step 7: After running the SQL, use this command to verify:');
    console.log('node debug-voting-completed-count.js');

  } catch (error) {
    console.log('❌ Fix script failed');
    console.log(`Error: ${error.response?.status || 'Network Error'}`);
    console.log(error.response?.data || error.message);
  }
}

// Create a second function to test the fix after SQL execution
async function testAfterFix() {
  console.log('✅ TESTING AFTER SQL FIX');
  console.log('========================\n');

  try {
    const loginResponse = await axios.post(
      `${API_BASE}/api/auth/login`,
      {
        email: 'admin@mixwarz.com',
        password: 'Admin123!'
      },
      {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    if (loginResponse.status !== 200 || !loginResponse.data.token) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.token;

    // Get updated voting stats
    const statsResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    const stats = statsResponse.data;
    console.log('📊 Updated Voting Stats:');
    console.log(`   TotalVoters: ${stats.totalVoters}`);
    console.log(`   VotersCompleted: ${stats.votersCompleted}`);
    console.log(`   VotingCompletionPercentage: ${Math.round(stats.votingCompletionPercentage)}%`);

    if (stats.votersCompleted > 0) {
      console.log('\n🎉 SUCCESS! The fix worked!');
      console.log(`   ✅ Round1Assignments table has been updated`);
      console.log(`   ✅ Voting stats now show correct completion count`);
      console.log(`   ✅ Admin interface should display correct "Voters: ${stats.votersCompleted}/30"`);
    } else {
      console.log('\n❌ Fix may not have worked');
      console.log('   Check if the SQL UPDATE statement was executed correctly');
    }

  } catch (error) {
    console.log('❌ Test failed');
    console.log(`Error: ${error.response?.status || 'Network Error'}`);
    console.log(error.response?.data || error.message);
  }
}

// Check command line arguments to determine which function to run
const args = process.argv.slice(2);
if (args.includes('--test')) {
  testAfterFix().catch(console.error);
} else {
  fixRound1AssignmentsRetroactive().catch(console.error);
  console.log('\n🔄 To test after running the SQL fix, use: node fix-round1-assignments-retroactive.js --test');
} 