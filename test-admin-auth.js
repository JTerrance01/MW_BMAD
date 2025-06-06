const axios = require('axios');

const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;

async function testAdminAuth() {
  console.log('🔐 TESTING ADMIN AUTHORIZATION ISSUE');
  console.log('====================================\n');

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

    console.log('📋 Login Response Status:', loginResponse.status);
    console.log('📋 Login Response Data:');
    console.log(JSON.stringify(loginResponse.data, null, 2));

    if (loginResponse.status === 200 && loginResponse.data.token) {
      const token = loginResponse.data.token;
      const userData = loginResponse.data.user || loginResponse.data;
      
      console.log('✅ Successfully logged in as admin');
      console.log(`   User ID: ${userData.id || userData.userId || 'N/A'}`);
      console.log(`   Email: ${userData.email || 'N/A'}`);
      console.log(`   Roles: ${userData.roles?.join(', ') || userData.role || 'N/A'}`);

      // Step 2: Test the voting stats endpoint with fresh token
      console.log('\n📊 Step 2: Testing Voting Stats with Fresh Token');
      try {
        const statsResponse = await axios.get(
          `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
          }
        );

        console.log('✅ Voting Stats API Success!');
        console.log('📋 Response Data:');
        console.log(JSON.stringify(statsResponse.data, null, 2));

        const stats = statsResponse.data;
        console.log('\n🔍 Key Values:');
        console.log(`   Groups Created: ${stats.GroupCount || 0}`);
        console.log(`   Total Voters: ${stats.TotalVoters || 0}`);
        console.log(`   Voters Completed: ${stats.VotersCompleted || 0}`);

        // Check if we're getting the expected data
        if (stats.GroupCount === 0 || stats.TotalVoters === 0) {
          console.log('\n❌ ISSUE CONFIRMED: API authorized but returns 0 values');
          console.log('🔍 This confirms the problem is in the repository queries, not authorization');
          
          // Test other endpoints to narrow down the issue
          console.log('\n🔧 Step 2.1: Testing Other Round1 Endpoints');
          
          try {
            const groupsResponse = await axios.get(
              `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/groups`,
              {
                headers: { Authorization: `Bearer ${token}` },
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
              }
            );
            console.log(`✅ Groups endpoint: Found ${groupsResponse.data.length} submission groups`);
            if (groupsResponse.data.length > 0) {
              console.log(`   Sample: Group ${groupsResponse.data[0].GroupNumber}, Submission ${groupsResponse.data[0].SubmissionId}`);
            }
          } catch (groupsError) {
            console.log(`❌ Groups endpoint failed: ${groupsError.response?.status}`);
          }

          try {
            const nonVotersResponse = await axios.get(
              `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/non-voters`,
              {
                headers: { Authorization: `Bearer ${token}` },
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
              }
            );
            console.log(`✅ Non-voters endpoint: Found ${nonVotersResponse.data.length} non-voters`);
            if (nonVotersResponse.data.length > 0) {
              console.log(`   Sample: ${nonVotersResponse.data[0].VoterUsername} (${nonVotersResponse.data[0].VoterId})`);
            }
          } catch (nonVotersError) {
            console.log(`❌ Non-voters endpoint failed: ${nonVotersError.response?.status}`);
          }
          
        } else {
          console.log('\n✅ Data looks correct!');
        }

      } catch (statsError) {
        console.log(`❌ Voting Stats API failed: ${statsError.response?.status || 'Network Error'}`);
        if (statsError.response?.status === 403) {
          console.log('🔍 Authorization successful but access forbidden - check organizer logic');
        } else if (statsError.response?.status === 401) {
          console.log('🔍 Still getting 401 - token/role issue');
        }
        console.log(`   Error: ${JSON.stringify(statsError.response?.data || statsError.message, null, 2)}`);
      }

      // Step 3: Test competition details to verify organizer information
      console.log('\n🏆 Step 3: Testing Competition Details');
      try {
        const compResponse = await axios.get(
          `${API_BASE}/api/competitions/${COMPETITION_ID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
          }
        );

        const comp = compResponse.data;
        console.log('✅ Competition Details:');
        console.log(`   Title: ${comp.title}`);
        console.log(`   Status: ${comp.status}`);
        console.log(`   Organizer ID: ${comp.organizerUserId}`);
        console.log(`   Current User ID: ${userData.id || userData.userId}`);
        
        if (comp.organizerUserId === (userData.id || userData.userId)) {
          console.log('✅ Current user IS the organizer');
        } else {
          console.log('⚠️ Current user is NOT the organizer (but should have Admin access)');
        }

      } catch (compError) {
        console.log(`❌ Competition details failed: ${compError.response?.status}`);
        console.log(`   Error: ${JSON.stringify(compError.response?.data || compError.message, null, 2)}`);
      }

    } else {
      console.log('❌ Login failed or no token returned');
      console.log('📋 Full response:');
      console.log(JSON.stringify(loginResponse.data, null, 2));
    }

  } catch (loginError) {
    console.log('❌ Login request failed');
    console.log(`Status: ${loginError.response?.status || 'Network Error'}`);
    console.log(`Error: ${JSON.stringify(loginError.response?.data || loginError.message, null, 2)}`);
  }
}

testAdminAuth().catch(console.error); 