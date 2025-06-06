const axios = require('axios');

const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;

async function completeVotingFix() {
  console.log('🔧 COMPLETE VOTING ELIGIBILITY FIX FOR COMPETITION 21');
  console.log('====================================================\n');

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
    console.log(`   TotalVoters: ${statsBefore.totalVoters} (should be 9 for 9 submissions)`);
    console.log(`   GroupCount: ${statsBefore.groupCount}`);
    console.log(`   VotersCompleted: ${statsBefore.votersCompleted}`);

    // Step 3: Change competition status to VotingRound1Setup to allow group recreation
    console.log('\n🔄 Step 3: Temporarily Setting Competition to VotingRound1Setup');
    const statusSetupResponse = await axios.put(
      `${API_BASE}/api/v1/admin/competitions/${COMPETITION_ID}/status`,
      { status: 10 }, // VotingRound1Setup
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    if (statusSetupResponse.status === 200) {
      console.log('✅ Competition status set to VotingRound1Setup');
    } else {
      console.log('⚠️ Warning: Could not change status via API');
    }

    // Step 4: Clear existing assignments and recreate with new logic
    console.log('\n🔧 Step 4: Recreating Voting Groups with New Logic');
    
    try {
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

      console.log('✅ Groups recreated successfully!');
      console.log('Response:', createGroupsResponse.data);
    } catch (error) {
      console.log('❌ Group creation failed:', error.response?.data || error.message);
      console.log('\nManual SQL execution required. Please run:');
      console.log('DELETE FROM "Round1Assignments" WHERE "CompetitionId" = 21;');
      console.log('DELETE FROM "SubmissionGroups" WHERE "CompetitionId" = 21;');
      console.log('Then retry this script.');
      return;
    }

    // Step 5: Set competition status back to VotingRound1Open
    console.log('\n🔄 Step 5: Setting Competition Back to VotingRound1Open');
    const statusOpenResponse = await axios.put(
      `${API_BASE}/api/v1/admin/competitions/${COMPETITION_ID}/status`,
      { status: 11 }, // VotingRound1Open
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    if (statusOpenResponse.status === 200) {
      console.log('✅ Competition status restored to VotingRound1Open');
    }

    // Step 6: Check new stats
    console.log('\n📊 Step 6: New Voting Stats (After Fix)');
    const statsAfterResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    const statsAfter = statsAfterResponse.data;
    console.log(`   TotalVoters: ${statsAfter.totalVoters} (should now be 9)`);
    console.log(`   GroupCount: ${statsAfter.groupCount}`);
    console.log(`   VotersCompleted: ${statsAfter.votersCompleted}`);
    console.log(`   VotingCompletionPercentage: ${Math.round(statsAfter.votingCompletionPercentage)}%`);

    // Step 7: Verify the fix worked
    console.log('\n🎉 RESULTS:');
    if (statsAfter.totalVoters === 9) {
      console.log('✅ SUCCESS! Voters now equals submissions (9 voters for 9 submissions)');
      console.log('✅ Only submitters can now vote');
      console.log('✅ Admin interface will show correct counts');
    } else {
      console.log(`❌ ISSUE: Expected 9 voters, got ${statsAfter.totalVoters}`);
      console.log('   Manual database intervention may be required');
    }

    // Step 8: Show group distribution
    console.log('\n📈 Group Distribution:');
    if (statsAfter.groupStats && statsAfter.groupStats.length > 0) {
      statsAfter.groupStats.forEach((group, index) => {
        console.log(`   Group ${index + 1}: ${group.submissionsCount} submissions, ${group.votersCount} voters`);
      });
    } else {
      console.log('   Group stats not available in API response');
    }

    console.log('\n🔄 Please refresh the admin interface to see the updated voter counts.');

  } catch (error) {
    console.log('❌ Complete fix failed');
    console.log(`Error: ${error.response?.status || 'Network Error'}`);
    console.log(error.response?.data || error.message);
  }
}

completeVotingFix().catch(console.error); 