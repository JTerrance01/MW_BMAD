const axios = require('axios');

const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;

async function createTestVotes() {
  console.log('🧪 CREATING TEST VOTES FOR COMPETITION 21');
  console.log('=========================================\n');

  try {
    // Login as admin to get token
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

    // Get current voting assignments
    const nonVotersResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/non-voters`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    const nonVoters = nonVotersResponse.data;
    console.log(`Found ${nonVoters.length} non-voters. Will simulate 9 votes...`);

    // Get submissions in each group for voting
    const groupsResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/groups`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    const submissions = groupsResponse.data;
    console.log(`Found ${submissions.length} submissions across groups`);

    // Group submissions by group number
    const submissionsByGroup = {};
    submissions.forEach(sub => {
      if (!submissionsByGroup[sub.GroupNumber]) {
        submissionsByGroup[sub.GroupNumber] = [];
      }
      submissionsByGroup[sub.GroupNumber].push(sub.SubmissionId);
    });

    console.log('Submissions by group:', Object.keys(submissionsByGroup).map(group => 
      `Group ${group}: ${submissionsByGroup[group].length} submissions`
    ).join(', '));

    // Simulate voting for first 9 non-voters
    const votersToSimulate = nonVoters.slice(0, 9);
    let votesCreated = 0;

    for (const voter of votersToSimulate) {
      try {
        const assignedGroupSubmissions = submissionsByGroup[voter.assignedGroupNumber];
        
        if (!assignedGroupSubmissions || assignedGroupSubmissions.length < 3) {
          console.log(`⚠️ Skipping voter ${voter.voterUsername} - not enough submissions in assigned group ${voter.assignedGroupNumber}`);
          continue;
        }

        // Create test votes (1st, 2nd, 3rd place from available submissions)
        const [first, second, third] = assignedGroupSubmissions.slice(0, 3);
        
        // Simulate vote submission via API
        const voteData = {
          firstPlaceSubmissionId: first,
          secondPlaceSubmissionId: second,
          thirdPlaceSubmissionId: third
        };

        console.log(`📝 Simulating vote for ${voter.voterUsername} (Group ${voter.voterGroupNumber} → ${voter.assignedGroupNumber})`);
        console.log(`   Voting: 1st=${first}, 2nd=${second}, 3rd=${third}`);

        // Note: We would need to authenticate as the actual user to submit votes
        // For now, we'll just log what would happen
        console.log(`   ⚠️ Cannot actually submit vote - would need to authenticate as user ${voter.voterUsername}`);
        
        votesCreated++;
        
      } catch (error) {
        console.log(`❌ Failed to create vote for ${voter.voterUsername}: ${error.message}`);
      }
    }

    console.log(`\n📊 Simulation Complete:`);
    console.log(`   Attempted to simulate ${votesCreated} votes`);
    console.log(`   This would result in VotersCompleted: ${votesCreated}/30`);
    
    console.log('\n💡 Note:');
    console.log('   To actually create test votes, you would need to:');
    console.log('   1. Authenticate as individual users (not admin)');
    console.log('   2. Call the voting API endpoint for each user');
    console.log('   3. Or directly insert into database via SQL');

    // Show what the voting stats should look like after votes
    const statsResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    console.log('\n📈 Current Voting Stats (should still be 0 since no actual votes created):');
    const stats = statsResponse.data;
    console.log(`   TotalVoters: ${stats.totalVoters}`);
    console.log(`   VotersCompleted: ${stats.votersCompleted}`);
    console.log(`   VotingCompletionPercentage: ${stats.votingCompletionPercentage}%`);

  } catch (error) {
    console.log('❌ Test vote creation failed');
    console.log(`Error: ${error.response?.status || 'Network Error'}`);
    console.log(error.response?.data || error.message);
  }
}

createTestVotes().catch(console.error); 