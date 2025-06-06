const axios = require('axios');

const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;

// Get admin token from browser localStorage
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NGU4ZGJkNy1kOWMzLTQ4NzAtYmMwMS0yMWZhMGI3OGIyMmEiLCJlbWFpbCI6ImFkbWluQG1peHdhcnouY29tIiwicm9sZSI6IkFkbWluIiwibmJmIjoxNzM1Mjc2MjE0LCJleHAiOjE3MzUzNjI2MTQsImlhdCI6MTczNTI3NjIxNCwiaXNzIjoiTWl4V2FyeiIsImF1ZCI6Ik1peHdhcnpDbGllbnQifQ.N17KqGbNOYZFXVd3LxKwCXc-3hEd3hzMJBmNzV_u_8Y';

async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { status: response.status, data: response.data };
  } catch (error) {
    return { 
      status: error.response?.status || 0, 
      data: error.response?.data || { message: error.message } 
    };
  }
}

async function debugVotingStatsIssue() {
  console.log('🔍 DEBUGGING VOTING STATS API ISSUE');
  console.log('===================================\n');

  // Step 1: Test the voting stats endpoint directly
  console.log('📊 Step 1: Testing Voting Stats API');
  console.log(`GET ${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
  
  const response = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
  
  if (response.status === 200) {
    console.log('✅ API Response Status: 200 OK');
    console.log('📋 Raw Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const stats = response.data;
    console.log('\n🔍 Parsed Values:');
    console.log(`   Groups Created: ${stats.GroupCount || 0}`);
    console.log(`   Total Voters: ${stats.TotalVoters || 0}`);
    console.log(`   Voters Completed: ${stats.VotersCompleted || 0}`);
    console.log(`   Completion %: ${Math.round(stats.VotingCompletionPercentage || 0)}%`);
    
    if (stats.GroupStats && stats.GroupStats.length > 0) {
      console.log('\n📈 Group Statistics:');
      stats.GroupStats.forEach((group, index) => {
        console.log(`   Group ${group.GroupNumber}: ${group.TotalSubmissions} submissions, ${group.SubmissionsWithVotes} with votes`);
      });
    } else {
      console.log('\n⚠️ No GroupStats returned');
    }
  } else {
    console.log(`❌ API Response Status: ${response.status}`);
    console.log(`Error: ${JSON.stringify(response.data, null, 2)}`);
  }

  // Step 2: Test individual repository endpoints to isolate the issue
  console.log('\n🔧 Step 2: Testing Individual Endpoints');
  
  // Test submission groups endpoint
  console.log('\n📁 Testing Groups Endpoint:');
  const groupsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/groups`);
  if (groupsResponse.status === 200) {
    console.log(`✅ Groups endpoint working - found ${groupsResponse.data.length} groups`);
    if (groupsResponse.data.length > 0) {
      console.log('   Sample group data:');
      console.log(`   Group ${groupsResponse.data[0].GroupNumber}: SubmissionId ${groupsResponse.data[0].SubmissionId}`);
    }
  } else {
    console.log(`❌ Groups endpoint failed: ${groupsResponse.status}`);
  }

  // Step 3: Check competition status
  console.log('\n🏆 Step 3: Competition Details');
  const competitionResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}`);
  if (competitionResponse.status === 200) {
    const comp = competitionResponse.data;
    console.log(`✅ Competition: ${comp.title}`);
    console.log(`   Status: ${comp.status} (${getStatusName(comp.status)})`);
    console.log(`   Submissions: ${comp.submissionCount || 0}`);
    console.log(`   Organizer: ${comp.organizerUserId}`);
  }

  // Step 4: Test database query logic with different approaches
  console.log('\n🗄️ Step 4: Testing Repository Logic');
  
  // Test non-voters endpoint (should show who hasn't voted)
  const nonVotersResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/non-voters`);
  if (nonVotersResponse.status === 200) {
    console.log(`✅ Non-voters endpoint: ${nonVotersResponse.data.length} non-voters found`);
    if (nonVotersResponse.data.length > 0) {
      console.log(`   Sample non-voter: ${nonVotersResponse.data[0].VoterUsername} (Group ${nonVotersResponse.data[0].VoterGroupNumber} → ${nonVotersResponse.data[0].AssignedGroupNumber})`);
    }
  } else {
    console.log(`❌ Non-voters endpoint failed: ${nonVotersResponse.status}`);
  }

  // Step 5: Compare with what we expect from database screenshots
  console.log('\n📸 Step 5: Expected vs Actual Data');
  console.log('Expected (from database screenshots):');
  console.log('   - Round1Assignments: Multiple records with VoterGroupNumber and AssignedGroupNumber');
  console.log('   - SubmissionGroups: 9 records with GroupNumbers 1, 2, 3');
  console.log('   - Expected Groups: 3');
  console.log('   - Expected Voters: 18+ (from screenshots)');
  
  if (response.status === 200) {
    const stats = response.data;
    console.log('\nActual (from API response):');
    console.log(`   - Groups: ${stats.GroupCount}`);
    console.log(`   - Voters: ${stats.TotalVoters}`);
    
    if (stats.GroupCount === 0 || stats.TotalVoters === 0) {
      console.log('\n❌ MISMATCH DETECTED: API returns 0 but database has data');
      console.log('🔍 Issue is likely in repository query logic or data mapping');
    } else {
      console.log('\n✅ Data matches expectations');
    }
  }
}

function getStatusName(statusNumber) {
  const statusMap = {
    1: 'OpenForSubmissions',
    10: 'VotingRound1Setup', 
    11: 'VotingRound1Open',
    12: 'VotingRound1Tallying',
    20: 'VotingRound2Setup',
    21: 'VotingRound2Open',
    22: 'VotingRound2Tallying',
    30: 'Completed'
  };
  return statusMap[statusNumber] || 'Unknown';
}

// Run the debug analysis
if (ADMIN_TOKEN === 'your-admin-token-here') {
  console.log('🔑 Please update ADMIN_TOKEN in the script');
} else {
  debugVotingStatsIssue().catch(console.error);
} 