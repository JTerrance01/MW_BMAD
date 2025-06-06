const axios = require('axios');

const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;

async function fixVotingEligibilityLogic() {
  console.log('🔧 FIXING VOTING ELIGIBILITY LOGIC FOR COMPETITION 21');
  console.log('=====================================================\n');

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

    // Step 2: Check current stats
    console.log('\n📊 Step 2: Current Voting Stats (Before Fix)');
    const statsBeforeResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    const statsBefore = statsBeforeResponse.data;
    console.log(`   TotalVoters: ${statsBefore.totalVoters} (should be equal to submissions)`);
    console.log(`   GroupCount: ${statsBefore.groupCount}`);
    console.log(`   TotalSubmissions: ${statsBefore.groupCount * 3} (estimated: 3 per group)`);

    // Step 3: Generate SQL to fix the voting assignments
    console.log('\n🛠️ Step 3: SQL to Fix Voting Eligibility Logic');
    console.log('Execute this SQL to implement "Only Submitters Can Vote" logic:');
    console.log('');
    
    console.log('-- STEP 1: Delete all current Round1Assignments for Competition 21');
    console.log('DELETE FROM "Round1Assignments" WHERE "CompetitionId" = 21;');
    console.log('');
    
    console.log('-- STEP 2: Delete all current SubmissionGroups for Competition 21');
    console.log('DELETE FROM "SubmissionGroups" WHERE "CompetitionId" = 21;');
    console.log('');
    
    console.log('-- STEP 3: Verify only submitters will vote (check submitter count)');
    console.log('SELECT COUNT(DISTINCT "UserId") as submitter_count,');
    console.log('       COUNT(*) as total_submissions');
    console.log('FROM "Submissions"');
    console.log('WHERE "CompetitionId" = 21 AND "IsDisqualified" = false;');
    console.log('');
    
    console.log('-- STEP 4: After SQL execution, re-create voting groups via API');
    console.log('-- (This will use the updated logic: only submitters vote)');

    // Step 4: Show the API call to re-create groups
    console.log('\n🚀 Step 4: Re-create Voting Groups with New Logic');
    console.log('After running the SQL above, call this API endpoint:');
    console.log('');
    console.log(`POST ${API_BASE}/api/competitions/${COMPETITION_ID}/round1/create-groups`);
    console.log('Authorization: Bearer <admin-token>');
    console.log('Content-Type: application/json');
    console.log('Body: { "targetGroupSize": 20 }');
    console.log('');
    console.log('OR use this command:');
    console.log(`curl -X POST "${API_BASE}/api/competitions/${COMPETITION_ID}/round1/create-groups" \\`);
    console.log(`     -H "Authorization: Bearer ${token}" \\`);
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"targetGroupSize": 20}\' \\');
    console.log('     -k');

    // Step 5: Expected results
    console.log('\n💡 Expected Results After Fix:');
    console.log('✅ Voters will equal the number of submissions (9 voters for 9 submissions)');
    console.log('✅ Only users who submitted will be able to vote');
    console.log('✅ Each voter will vote on groups other than their own submission');
    console.log('✅ Balanced distribution across groups');
    console.log('✅ Admin interface will show logical voter counts');

    // Step 6: Verification
    console.log('\n🔍 Step 6: Verification Queries');
    console.log('After re-creating groups, verify with:');
    console.log('');
    console.log('-- Check voter count equals submission count:');
    console.log('SELECT ');
    console.log('  (SELECT COUNT(DISTINCT "UserId") FROM "Submissions" WHERE "CompetitionId" = 21) as submitters,');
    console.log('  (SELECT COUNT(*) FROM "Round1Assignments" WHERE "CompetitionId" = 21) as voters;');
    console.log('');
    console.log('-- Check group distribution:');
    console.log('SELECT ra."AssignedGroupNumber", COUNT(*) as voter_count');
    console.log('FROM "Round1Assignments" ra');
    console.log('WHERE ra."CompetitionId" = 21');
    console.log('GROUP BY ra."AssignedGroupNumber"');
    console.log('ORDER BY ra."AssignedGroupNumber";');
    console.log('');
    console.log('-- Verify no one votes on their own group:');
    console.log('SELECT ra."VoterId", ra."VoterGroupNumber", ra."AssignedGroupNumber",');
    console.log('       CASE WHEN ra."VoterGroupNumber" = ra."AssignedGroupNumber" THEN \'ERROR\' ELSE \'OK\' END as status');
    console.log('FROM "Round1Assignments" ra');
    console.log('WHERE ra."CompetitionId" = 21;');

  } catch (error) {
    console.log('❌ Fix script failed');
    console.log(`Error: ${error.response?.status || 'Network Error'}`);
    console.log(error.response?.data || error.message);
  }
}

// Function to re-create groups via API
async function recreateGroupsViaAPI() {
  console.log('🔄 RE-CREATING VOTING GROUPS VIA API');
  console.log('====================================\n');

  try {
    // Login
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

    const token = loginResponse.data.token;

    // Re-create groups with new logic
    console.log('🔧 Calling create-groups API with updated logic...');
    const createGroupsResponse = await axios.post(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/create-groups`,
      { targetGroupSize: 20 },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    console.log('✅ Groups re-created successfully!');
    console.log('Response:', createGroupsResponse.data);

    // Check new stats
    const statsAfterResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    const statsAfter = statsAfterResponse.data;
    console.log('\n📊 New Voting Stats (After Fix):');
    console.log(`   TotalVoters: ${statsAfter.totalVoters} (should equal submissions count)`);
    console.log(`   GroupCount: ${statsAfter.groupCount}`);
    console.log(`   VotersCompleted: ${statsAfter.votersCompleted}`);

    // Check group distribution
    console.log('\n📈 Group Distribution:');
    for (let i = 1; i <= statsAfter.groupCount; i++) {
      try {
        const groupResponse = await axios.get(
          `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/group-details/${i}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
          }
        );
        const group = groupResponse.data;
        console.log(`   Group ${i}: ${group.submissionsCount} submissions, ${group.votersCount} voters`);
      } catch (e) {
        console.log(`   Group ${i}: Error retrieving details`);
      }
    }

  } catch (error) {
    console.log('❌ API recreation failed');
    console.log(`Error: ${error.response?.status || 'Network Error'}`);
    console.log(error.response?.data || error.message);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--recreate')) {
  recreateGroupsViaAPI().catch(console.error);
} else {
  fixVotingEligibilityLogic().catch(console.error);
  console.log('\n🔄 After running the SQL, use: node fix-voting-eligibility-logic.js --recreate');
} 