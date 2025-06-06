const axios = require('axios');

const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;

async function verifyVotingStatsFix() {
  console.log('✅ VERIFYING VOTING STATS FIX');
  console.log('=============================\n');

  try {
    // Login as admin
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

    if (loginResponse.status === 200 && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('✅ Successfully logged in as admin');

      // Test the voting stats endpoint
      const statsResponse = await axios.get(
        `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
          httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
        }
      );

      console.log('✅ Voting Stats API Response:');
      console.log(JSON.stringify(statsResponse.data, null, 2));

      const stats = statsResponse.data;

      // Simulate what the frontend does now (with corrected property names)
      console.log('\n🎯 Frontend Display Values (Fixed):');
      console.log(`   Groups Created: ${stats.groupCount || 0}`);
      console.log(`   Total Voters: ${stats.totalVoters || 0}`);
      console.log(`   Voters Completed: ${stats.votersCompleted || 0}`);
      console.log(`   Completion %: ${Math.round(stats.votingCompletionPercentage || 0)}%`);

      // Verify the fix worked
      if (stats.groupCount > 0 && stats.totalVoters > 0) {
        console.log('\n🎉 SUCCESS: Property name fix worked!');
        console.log('   ✅ Groups Created shows correct value (not 0)');
        console.log('   ✅ Total Voters shows correct value (not 0)');
        console.log('   ✅ Frontend will now display correct voting progress');
        
        // Show group stats if available
        if (stats.groupStats && stats.groupStats.length > 0) {
          console.log('\n📊 Group Statistics:');
          stats.groupStats.forEach((group) => {
            console.log(`   Group ${group.groupNumber}: ${group.totalSubmissions} submissions, ${group.submissionsWithVotes} with votes`);
          });
        }
      } else {
        console.log('\n❌ Issue still exists - values are still 0');
        console.log('   This indicates a different problem beyond property naming');
      }

      // Test the conditions that trigger different UI states
      console.log('\n🔧 Frontend UI State Analysis:');
      const isSetupIncomplete = (stats.groupCount === 0 || stats.totalVoters === 0);
      const showWarning = isSetupIncomplete && true; // Assume VotingRound1Open status
      
      console.log(`   Setup Incomplete Warning: ${showWarning ? 'SHOWN' : 'HIDDEN'}`);
      console.log(`   Create Groups Button: ${stats.groupCount === 0 ? 'SHOWN' : 'HIDDEN'}`);
      console.log(`   Voting Active Alert: ${stats.groupCount > 0 ? 'SHOWN' : 'HIDDEN'}`);
      
      if (!showWarning) {
        console.log('   🎉 UI will show "Voting Active" state with proper statistics');
      } else {
        console.log('   ⚠️ UI will still show warning state');
      }

    } else {
      console.log('❌ Login failed');
    }

  } catch (error) {
    console.log('❌ Test failed');
    console.log(`Error: ${error.response?.status || 'Network Error'}`);
    console.log(error.response?.data || error.message);
  }
}

verifyVotingStatsFix().catch(console.error); 