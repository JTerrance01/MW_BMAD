const axios = require('axios');

async function testCompletionDateFix() {
  console.log('🗓️ Testing Competition Completion Date Fix...\n');
  
  try {
    // Test 1: Check Competition 21 current state
    console.log('📍 Step 1: Checking Competition 21 current state...');
    const competitionResponse = await axios.get('http://localhost:3000/competitions/21/results');
    
    if (competitionResponse.status === 200) {
      console.log('✅ Competition results page accessible');
      
      // Check if completion date is displayed
      const pageContent = competitionResponse.data;
      if (pageContent.includes('Competition completed on')) {
        console.log('✅ Completion date is displayed on results page');
      } else {
        console.log('❌ Completion date not found on results page');
      }
    }
    
    // Test 2: Check backend API for completion date
    console.log('\n📍 Step 2: Checking backend API for completion date...');
    const apiResponse = await axios.get('https://localhost:7001/api/competitions/21/results');
    
    if (apiResponse.data && apiResponse.data.completedDate) {
      console.log('✅ Backend API returns completedDate:', apiResponse.data.completedDate);
    } else {
      console.log('❌ Backend API does not return completedDate');
      console.log('Response data:', JSON.stringify(apiResponse.data, null, 2));
    }
    
    // Test 3: Check database for CompletedDate field
    console.log('\n📍 Step 3: Database schema verification...');
    console.log('ℹ️ Manual verification needed:');
    console.log('   - Check if Competitions table has CompletedDate column');
    console.log('   - Run: SELECT "CompetitionId", "Title", "Status", "CompletedDate" FROM "Competitions" WHERE "CompetitionId" = 21;');
    
    // Test 4: Simulate Round 2 tallying (if competition is in correct state)
    console.log('\n📍 Step 4: Testing Round 2 tallying completion date setting...');
    console.log('ℹ️ This would require:');
    console.log('   1. Competition 21 to be in VotingRound2Tallying status');
    console.log('   2. Admin authentication token');
    console.log('   3. POST to /api/competitions/21/round2/tally-votes');
    console.log('   4. Verify CompletedDate is set when status changes to Completed');
    
    console.log('\n🎯 Expected Behavior:');
    console.log('   ✅ When Round 2 tallying completes:');
    console.log('      - Competition.Status = Completed');
    console.log('      - Competition.CompletedDate = DateTime.UtcNow');
    console.log('      - Results page shows actual completion date');
    console.log('   ✅ When manual winner selection:');
    console.log('      - Same completion date behavior');
    console.log('   ✅ Frontend displays:');
    console.log('      - "Competition completed on [actual completion date]"');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Test the completion date functionality
testCompletionDateFix(); 