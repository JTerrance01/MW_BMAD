const axios = require('axios');

const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;

async function debugVotingCompletedCount() {
  console.log('🔍 DEBUGGING VOTING COMPLETED COUNT ISSUE');
  console.log('=========================================\n');

  try {
    // Step 1: Login as admin to get fresh token
    console.log('🔑 Step 1: Getting Fresh Admin Token');
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

    // Step 2: Get current voting stats via API
    console.log('\n📊 Step 2: Current Voting Stats via API');
    const statsResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    const stats = statsResponse.data;
    console.log('Current API Response:');
    console.log(`   TotalVoters: ${stats.totalVoters}`);
    console.log(`   VotersCompleted: ${stats.votersCompleted}`);
    console.log(`   VotingCompletionPercentage: ${stats.votingCompletionPercentage}%`);
    console.log(`   GroupCount: ${stats.groupCount}`);

    // Step 3: Check for actual votes in the system
    console.log('\n🗳️ Step 3: Checking for SubmissionVotes Records');
    
    // Get all non-voters to see who hasn't voted
    const nonVotersResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/non-voters`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );

    console.log(`Non-voters found: ${nonVotersResponse.data.length}`);
    if (nonVotersResponse.data.length > 0) {
      console.log('Sample non-voters:');
      nonVotersResponse.data.slice(0, 3).forEach(nv => {
        console.log(`   - ${nv.voterUsername} (Group ${nv.voterGroupNumber} → ${nv.assignedGroupNumber})`);
      });
    }

    // Calculate voters who HAVE voted
    const totalVoters = stats.totalVoters;
    const nonVoters = nonVotersResponse.data.length;
    const calculatedVotersCompleted = totalVoters - nonVoters;

    console.log('\n🔍 Step 4: Calculated vs Reported Voting Status');
    console.log(`   Total Voters (API): ${totalVoters}`);
    console.log(`   Non-Voters (API): ${nonVoters}`);
    console.log(`   Should Have Voted: ${calculatedVotersCompleted}`);
    console.log(`   API Reports Completed: ${stats.votersCompleted}`);

    if (calculatedVotersCompleted !== stats.votersCompleted) {
      console.log('\n❌ MISMATCH DETECTED!');
      console.log(`   Expected VotersCompleted: ${calculatedVotersCompleted}`);
      console.log(`   Actual VotersCompleted: ${stats.votersCompleted}`);
      console.log('\n🔍 Possible Issues:');
      console.log('   1. HasVoted flag not being set in Round1Assignment records');
      console.log('   2. Database transaction issues during vote submission');
      console.log('   3. Query logic mismatch in voting-stats endpoint');
      console.log('   4. Caching or state management issues');
    } else {
      console.log('\n✅ Voting counts match expected values');
    }

    // Step 5: Test individual group details to get more granular data
    console.log('\n📈 Step 5: Checking Individual Group Details');
    for (let groupNumber = 1; groupNumber <= stats.groupCount; groupNumber++) {
      try {
        const groupResponse = await axios.get(
          `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/group-details/${groupNumber}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
          }
        );

        const group = groupResponse.data;
        console.log(`   Group ${groupNumber}:`);
        console.log(`     Submissions: ${group.submissionsCount}`);
        console.log(`     Voters: ${group.votersCount}`);
        console.log(`     Voters Completed: ${group.votersCompletedCount}`);
        console.log(`     Completion %: ${Math.round(group.votingCompletionPercentage)}%`);
      } catch (error) {
        console.log(`   Group ${groupNumber}: Error retrieving details`);
      }
    }

    // Step 6: Direct database analysis suggestion
    console.log('\n🔧 Step 6: Database Analysis Needed');
    console.log('To further debug, run these SQL queries:');
    console.log('');
    console.log('-- Check Round1Assignment HasVoted flags:');
    console.log(`SELECT VoterId, VoterGroupNumber, AssignedGroupNumber, HasVoted, VotingCompletedDate`);
    console.log(`FROM Round1Assignments WHERE CompetitionId = ${COMPETITION_ID};`);
    console.log('');
    console.log('-- Check for actual SubmissionVotes:');
    console.log(`SELECT COUNT(*) as VoteCount, VoterId`);
    console.log(`FROM SubmissionVotes WHERE CompetitionId = ${COMPETITION_ID} AND VotingRound = 1`);
    console.log(`GROUP BY VoterId;`);
    console.log('');
    console.log('-- Cross-check HasVoted vs actual votes:');
    console.log(`SELECT r.VoterId, r.HasVoted, COUNT(sv.VoterId) as ActualVotes`);
    console.log(`FROM Round1Assignments r`);
    console.log(`LEFT JOIN SubmissionVotes sv ON r.VoterId = sv.VoterId AND sv.CompetitionId = ${COMPETITION_ID} AND sv.VotingRound = 1`);
    console.log(`WHERE r.CompetitionId = ${COMPETITION_ID}`);
    console.log(`GROUP BY r.VoterId, r.HasVoted`);
    console.log(`ORDER BY ActualVotes DESC;`);

    // Step 7: Potential fix recommendations
    if (calculatedVotersCompleted !== stats.votersCompleted) {
      console.log('\n🔧 Potential Fixes to Investigate:');
      console.log('1. Check if ProcessVoterSubmissionAsync is actually updating HasVoted flags');
      console.log('2. Verify Round1AssignmentRepository.UpdateAsync is saving to database');
      console.log('3. Check for database transaction rollback issues');
      console.log('4. Ensure voting submissions are using the correct API endpoints');
      console.log('5. Verify no caching is interfering with data updates');
    }

  } catch (error) {
    console.log('❌ Debug script failed');
    console.log(`Error: ${error.response?.status || 'Network Error'}`);
    console.log(error.response?.data || error.message);
  }
}

debugVotingCompletedCount().catch(console.error); 