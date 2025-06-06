const axios = require('axios');

const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21; // Competition ID from the image

// Test admin credentials - replace with actual admin token
const ADMIN_TOKEN = 'your-admin-token-here';

async function testVotingStatsAPI() {
  console.log('🔍 DIAGNOSING VOTING STATS API ISSUE');
  console.log('=====================================\n');

  try {
    // Step 1: Test the voting stats endpoint
    console.log('📊 Step 1: Testing Voting Stats API');
    console.log(`GET ${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
    
    const response = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      }
    );

    console.log('✅ API Response Status:', response.status);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const stats = response.data;
    console.log('\n📈 Parsed Stats:');
    console.log(`   Groups Created: ${stats.GroupCount || 0}`);
    console.log(`   Total Voters: ${stats.TotalVoters || 0}`);
    console.log(`   Voters Completed: ${stats.VotersCompleted || 0}`);
    console.log(`   Voting Completion: ${Math.round(stats.VotingCompletionPercentage || 0)}%`);

    // Step 2: Check competition status
    console.log('\n🏆 Step 2: Checking Competition Status');
    const competitionResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      }
    );

    const competition = competitionResponse.data;
    console.log(`   Competition: ${competition.title}`);
    console.log(`   Status: ${competition.status} (${competition.status === 11 ? 'VotingRound1Open' : 'Other'})`);
    console.log(`   Submissions: ${competition.submissionCount || 0}`);

    // Step 3: Analyze the issue
    console.log('\n🔍 Step 3: Issue Analysis');
    if (stats.GroupCount === 0) {
      console.log('❌ Problem: No voting groups created');
      console.log('   Solution: Run group creation process');
    }
    
    if (stats.TotalVoters === 0) {
      console.log('❌ Problem: No voter assignments found');
      console.log('   Solution: Verify Round1Assignments table has data');
    }

    if (stats.GroupCount > 0 && stats.TotalVoters > 0) {
      console.log('✅ Data exists but may not be displaying correctly in frontend');
      console.log('   Check: Frontend API URL and data parsing');
    }

  } catch (error) {
    console.error('❌ Error testing voting stats API:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
      
      if (error.response.status === 401) {
        console.error('   🔑 Authentication issue - update ADMIN_TOKEN in script');
      } else if (error.response.status === 404) {
        console.error('   🔍 API endpoint not found - check URL and controller');
      } else if (error.response.status === 403) {
        console.error('   🚫 Authorization issue - user may not have admin/organizer role');
      }
    } else {
      console.error(`   Network Error: ${error.message}`);
      console.error('   🌐 Check if API server is running on https://localhost:7001');
    }
  }
}

// Additional function to test frontend URL format
async function testFrontendURLFormat() {
  console.log('\n🌐 Testing Frontend URL Format');
  console.log('==============================');
  
  // This mimics what the frontend does
  const frontendURL = `https://localhost:7001/api/competitions/${COMPETITION_ID}/round1/voting-stats`;
  console.log(`Frontend calls: ${frontendURL}`);
  
  // Check if this matches our backend route
  console.log('Backend expects: /api/competitions/{competitionId}/round1/voting-stats');
  console.log('✅ URL format matches');
}

// Instructions for getting admin token
function showTokenInstructions() {
  console.log('\n🔑 HOW TO GET ADMIN TOKEN:');
  console.log('==========================');
  console.log('1. Open browser dev tools (F12)');
  console.log('2. Go to Application/Storage > Local Storage');
  console.log('3. Look for "token" key');
  console.log('4. Copy the token value');
  console.log('5. Replace ADMIN_TOKEN in this script');
  console.log('6. Run: node test-voting-stats-issue.js');
}

// Run the tests
if (ADMIN_TOKEN === 'your-admin-token-here') {
  showTokenInstructions();
} else {
  testVotingStatsAPI();
  testFrontendURLFormat();
} 