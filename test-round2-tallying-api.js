const axios = require('axios');

async function testRound2TallyingAPI() {
  try {
    console.log('🎯 TESTING ENHANCED ROUND 2 TALLYING API');
    console.log('=========================================\n');

    // Competition details
    const competitionId = 21;
    const apiUrl = `https://localhost:7001/api/competitions/${competitionId}/round2/tally-votes`;

    // Admin authentication token (replace with actual admin token)
    // You'll need to get this from the browser's localStorage or admin login response
    console.log('⚠️  NOTE: You need to provide an admin authentication token');
    console.log('   - Login as admin in the browser');
    console.log('   - Get the token from localStorage.getItem("token")');
    console.log('   - Replace the token variable below\n');

    // Example token - replace with actual admin token
    const token = 'YOUR_ADMIN_TOKEN_HERE';

    if (token === 'YOUR_ADMIN_TOKEN_HERE') {
      console.log('❌ Please update the token variable with an actual admin token');
      console.log('   Steps to get token:');
      console.log('   1. Open browser and login as admin');
      console.log('   2. Open Developer Tools (F12)');
      console.log('   3. Go to Console tab');
      console.log('   4. Type: localStorage.getItem("token")');
      console.log('   5. Copy the token value and replace it in this script');
      return;
    }

    console.log('📞 Calling Round 2 tallying API endpoint...');
    console.log(`   URL: ${apiUrl}`);
    console.log(`   Competition ID: ${competitionId}`);
    console.log();

    // Make the API call
    const response = await axios.post(
      apiUrl,
      {}, // Empty body
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Allow self-signed certificates for local development
        httpsAgent: new (require('https')).Agent({
          rejectUnauthorized: false
        })
      }
    );

    console.log('✅ API call successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log();

    // Analyze the response
    if (response.data.success) {
      if (response.data.requiresManualSelection) {
        console.log('⚖️  Result: TIE DETECTED - Manual selection required');
        console.log(`   Message: ${response.data.message}`);
        console.log('   This means the enhanced tie-breaking logic found an unresolvable tie');
      } else {
        console.log('🏆 Result: WINNER DETERMINED');
        console.log(`   Message: ${response.data.message}`);
        console.log('   This means the enhanced tie-breaking logic successfully determined a winner');
      }
    } else {
      console.log('❌ API returned error');
      console.log(`   Message: ${response.data.message}`);
    }

  } catch (error) {
    console.error('❌ API call failed:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
      
      // Common error scenarios
      switch (error.response.status) {
        case 401:
          console.log('\n💡 Solution: The admin token is invalid or expired');
          console.log('   - Get a fresh token by logging in as admin');
          break;
        case 400:
          console.log('\n💡 Solution: Competition may not be in VotingRound2Tallying status');
          console.log('   - Run the test setup script first: node test-enhanced-tie-breaking.js');
          break;
        case 404:
          console.log('\n💡 Solution: Competition or endpoint not found');
          console.log('   - Check that competition 21 exists');
          console.log('   - Verify the API endpoint URL');
          break;
        case 500:
          console.log('\n💡 Solution: Server error - check API logs');
          console.log('   - Look for detailed error messages in the API console');
          break;
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution: API server is not running');
      console.log('   - Start the API with: dotnet run --project src/MixWarz.API');
    } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      console.log('\n💡 Solution: SSL certificate issue (normal for localhost)');
      console.log('   - This script includes httpsAgent to handle self-signed certificates');
    }
  }
}

// Instructions for getting admin token
console.log('📋 INSTRUCTIONS:');
console.log('================');
console.log('1. Start the API server: dotnet run --project src/MixWarz.API');
console.log('2. Open browser and navigate to admin interface');
console.log('3. Login as admin user');
console.log('4. Open Developer Tools (F12) and go to Console');
console.log('5. Run: localStorage.getItem("token")');
console.log('6. Copy the token and replace "YOUR_ADMIN_TOKEN_HERE" in this script');
console.log('7. Run this script again');
console.log();

// Run the test
testRound2TallyingAPI(); 