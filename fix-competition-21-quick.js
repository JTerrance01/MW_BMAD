const axios = require('axios');

const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;

async function fixCompetition21Voters() {
  console.log('🔧 FIXING COMPETITION 21 VOTER COUNT');
  console.log('====================================\n');

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

    // Step 2: Check current voting stats (should show 30 voters)
    console.log('\n📊 Step 2: Current Voting Stats (Before Fix)');
    const statsBeforeResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    const statsBefore = statsBeforeResponse.data;
    console.log(`   Submissions: ${statsBefore.totalSubmissions || 'N/A'}`);
    console.log(`   TotalVoters: ${statsBefore.totalVoters} (should be 9 for 9 submissions)`);
    console.log(`   GroupCount: ${statsBefore.groupCount}`);
    console.log(`   VotersCompleted: ${statsBefore.votersCompleted}`);

    if (statsBefore.totalVoters === 9) {
      console.log('\n✅ ALREADY FIXED! Competition 21 already has 9 voters (correct count)');
      return;
    }

    // Step 3: Recreate voting groups using new "Only Submitters Can Vote" logic
    console.log('\n🔧 Step 3: Recreating Voting Groups with New Logic');
    
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
      if (error.response?.status === 400 && error.response?.data?.message?.includes('status')) {
        console.log('ℹ️ Competition status issue. Setting to VotingRound1Setup first...');
        
        // Set status to VotingRound1Setup
        await axios.put(
          `${API_BASE}/api/v1/admin/competitions/${COMPETITION_ID}/status`,
          { newStatus: 'VotingRound1Setup' },
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
          }
        );

        // Retry creating groups
        const retryResponse = await axios.post(
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

        console.log('✅ Groups created after status fix!');
        
        // Set status back to VotingRound1Open
        await axios.put(
          `${API_BASE}/api/v1/admin/competitions/${COMPETITION_ID}/status`,
          { newStatus: 'VotingRound1Open' },
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
          }
        );
        console.log('✅ Status restored to VotingRound1Open');
      } else {
        throw error;
      }
    }

    // Step 4: Check new voting stats (should show 9 voters)
    console.log('\n📊 Step 4: New Voting Stats (After Fix)');
    const statsAfterResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    const statsAfter = statsAfterResponse.data;
    console.log(`   Submissions: ${statsAfter.totalSubmissions || 'N/A'}`);
    console.log(`   TotalVoters: ${statsAfter.totalVoters} (should now be 9)`);
    console.log(`   GroupCount: ${statsAfter.groupCount}`);
    console.log(`   VotersCompleted: ${statsAfter.votersCompleted}`);
    console.log(`   VotingCompletionPercentage: ${Math.round(statsAfter.votingCompletionPercentage || 0)}%`);

    // Step 5: Verify the fix worked
    console.log('\n🎉 RESULTS:');
    if (statsAfter.totalVoters === 9) {
      console.log('✅ SUCCESS! Voters now equals submissions (9 voters for 9 submissions)');
      console.log('✅ Only submitters can now vote');
      console.log('✅ Admin interface will show "Voters: X/9" instead of "Voters: X/30"');
      console.log('✅ Business logic is now correct: only participants vote on competition they entered');
    } else {
      console.log(`❌ ISSUE: Expected 9 voters, got ${statsAfter.totalVoters}`);
      console.log('   Please run the SQL commands manually to clear old assignments');
    }

    console.log('\n🔄 Please refresh the admin interface to see the updated voter counts.');

  } catch (error) {
    console.log('❌ Fix failed');
    console.log(`Error: ${error.response?.status || 'Network Error'}`);
    console.log(error.response?.data || error.message);
  }
}

fixCompetition21Voters().catch(console.error); 