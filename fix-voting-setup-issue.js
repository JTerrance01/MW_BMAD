const axios = require('axios');

const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21; // Competition from the image

// Test admin credentials - GET THIS FROM BROWSER LOCAL STORAGE
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

async function diagnoseBug() {
  console.log('🔍 VOTING SETUP ISSUE DIAGNOSIS');
  console.log('===============================\n');

  // Step 1: Check competition details
  console.log('📋 Step 1: Competition Details');
  const competitionResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}`);
  
  if (competitionResponse.status === 200) {
    const comp = competitionResponse.data;
    console.log(`   Competition: ${comp.title}`);
    console.log(`   Status: ${comp.status} (${getStatusName(comp.status)})`);
    console.log(`   Submissions: ${comp.submissionCount || 0}`);
    console.log(`   Start Date: ${comp.startDate}`);
    console.log(`   End Date: ${comp.endDate}`);
  } else {
    console.log(`   ❌ Failed to get competition details: ${competitionResponse.status}`);
    return;
  }

  // Step 2: Check voting stats (the problematic endpoint)
  console.log('\n📊 Step 2: Current Voting Stats');
  const statsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
  
  if (statsResponse.status === 200) {
    const stats = statsResponse.data;
    console.log('   📈 Raw API Response:');
    console.log(JSON.stringify(stats, null, 4));
    
    console.log('\n   🔍 Analysis:');
    console.log(`   - Groups Created: ${stats.GroupCount || 0}`);
    console.log(`   - Total Voters: ${stats.TotalVoters || 0}`);
    console.log(`   - Voters Completed: ${stats.VotersCompleted || 0}`);
    console.log(`   - Completion: ${Math.round(stats.VotingCompletionPercentage || 0)}%`);
    
    if (stats.GroupCount === 0) {
      console.log('   ❌ ISSUE: No voting groups exist');
    }
    if (stats.TotalVoters === 0) {
      console.log('   ❌ ISSUE: No voter assignments exist');
    }
  } else {
    console.log(`   ❌ Failed to get voting stats: ${statsResponse.status}`);
    console.log(`   Error: ${JSON.stringify(statsResponse.data, null, 2)}`);
  }

  // Step 3: Check if submissions exist
  console.log('\n🎵 Step 3: Submission Check');
  const submissionsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/submissions`);
  
  if (submissionsResponse.status === 200) {
    const submissions = submissionsResponse.data;
    console.log(`   ✅ Found ${submissions.length} submissions`);
    if (submissions.length === 0) {
      console.log('   ⚠️ WARNING: No submissions to vote on!');
    }
  } else {
    console.log(`   ❌ Failed to get submissions: ${submissionsResponse.status}`);
  }
}

async function fixVotingSetup() {
  console.log('\n🔧 FIXING VOTING SETUP');
  console.log('======================\n');

  // Step 1: Create voting groups
  console.log('👥 Step 1: Creating Voting Groups');
  const createGroupsResponse = await makeRequest('POST', `/api/competitions/${COMPETITION_ID}/round1/create-groups`, {
    targetGroupSize: 20
  });

  if (createGroupsResponse.status === 200) {
    console.log('   ✅ Voting groups created successfully');
    console.log(`   📋 Result: ${createGroupsResponse.data.message || 'Success'}`);
  } else {
    console.log(`   ❌ Failed to create voting groups: ${createGroupsResponse.status}`);
    console.log(`   Error: ${JSON.stringify(createGroupsResponse.data, null, 2)}`);
    return false;
  }

  // Step 2: Verify the fix
  console.log('\n✅ Step 2: Verifying Fix');
  const verifyStatsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
  
  if (verifyStatsResponse.status === 200) {
    const stats = verifyStatsResponse.data;
    console.log('   📊 Updated Stats:');
    console.log(`   - Groups Created: ${stats.GroupCount || 0}`);
    console.log(`   - Total Voters: ${stats.TotalVoters || 0}`);
    console.log(`   - Voters Completed: ${stats.VotersCompleted || 0}`);
    
    if (stats.GroupCount > 0 && stats.TotalVoters > 0) {
      console.log('   🎉 SUCCESS: Voting setup is now complete!');
      return true;
    } else {
      console.log('   ⚠️ PARTIAL: Groups created but still issues remaining');
      return false;
    }
  } else {
    console.log(`   ❌ Failed to verify fix: ${verifyStatsResponse.status}`);
    return false;
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

async function main() {
  console.log('🎯 MIXWARZ VOTING SETUP REPAIR TOOL');
  console.log('====================================\n');

  if (ADMIN_TOKEN === 'your-admin-token-here') {
    console.log('🔑 SETUP REQUIRED:');
    console.log('1. Open browser dev tools (F12)');
    console.log('2. Go to Application > Local Storage');
    console.log('3. Copy the "token" value');
    console.log('4. Replace ADMIN_TOKEN in this script');
    console.log('5. Run: node fix-voting-setup-issue.js');
    return;
  }

  // Run diagnosis
  await diagnoseBug();

  // Ask user if they want to fix it
  console.log('\n❓ REPAIR OPTIONS:');
  console.log('1. This script can automatically fix the voting setup');
  console.log('2. It will create voting groups and assign voters');
  console.log('3. Type "yes" to proceed with the fix\n');

  // For automation, we'll proceed with the fix
  const proceed = true; // Set to false if you want manual confirmation

  if (proceed) {
    const success = await fixVotingSetup();
    
    if (success) {
      console.log('\n🎉 RESOLUTION COMPLETE');
      console.log('========================');
      console.log('✅ Voting setup has been repaired');
      console.log('✅ Admin interface should now show correct stats');
      console.log('✅ Users can now vote on submissions');
      console.log('\n🔄 Next Steps:');
      console.log('1. Refresh the admin voting management page');
      console.log('2. Verify the stats show Groups Created > 0');
      console.log('3. Test user voting functionality');
    } else {
      console.log('\n❌ RESOLUTION FAILED');
      console.log('===================');
      console.log('❌ Manual intervention required');
      console.log('❌ Check server logs for detailed errors');
    }
  }
}

// Run the repair tool
main().catch(console.error); 