const axios = require('axios');

async function testResultsPageFix() {
  try {
    console.log('🧪 TESTING COMPETITION RESULTS PAGE FIX');
    console.log('========================================\n');

    const competitionId = 21;
    const baseUrl = 'https://localhost:7001/api';

    console.log('1️⃣ Testing Competition Results API Endpoint...');
    
    try {
      const resultsResponse = await axios.get(`${baseUrl}/competitions/${competitionId}/results`, {
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      console.log('✅ Results API Response Status:', resultsResponse.status);
      console.log('📊 Results Data Structure:');
      console.log('   - Competition ID:', resultsResponse.data.competitionId);
      console.log('   - Title:', resultsResponse.data.title);
      console.log('   - Status:', resultsResponse.data.status);
      console.log('   - Winners Count:', resultsResponse.data.winners?.length || 0);
      console.log('   - Results Count:', resultsResponse.data.results?.length || 0);
      console.log('   - Completed Date:', resultsResponse.data.completedDate);

      if (resultsResponse.data.winners && resultsResponse.data.winners.length > 0) {
        console.log('\n🏆 WINNERS:');
        resultsResponse.data.winners.forEach((winner, index) => {
          console.log(`   ${index + 1}. ${winner.title} by ${winner.userName}`);
          console.log(`      Score: ${winner.score}`);
          console.log(`      Audio URL: ${winner.audioUrl ? '✅ Available' : '❌ Missing'}`);
        });
      }

      if (resultsResponse.data.results && resultsResponse.data.results.length > 0) {
        console.log('\n📋 ALL RESULTS:');
        resultsResponse.data.results.forEach((result) => {
          console.log(`   Rank ${result.rank}: ${result.title} by ${result.userName} (Score: ${result.score})`);
        });
      }

    } catch (error) {
      console.log('❌ Results API Error:', error.response?.status, error.response?.statusText);
      console.log('   Error Details:', error.response?.data || error.message);
    }

    console.log('\n2️⃣ Testing Competition Detail API Endpoint...');
    
    try {
      const detailResponse = await axios.get(`${baseUrl}/competitions/${competitionId}`, {
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      console.log('✅ Detail API Response Status:', detailResponse.status);
      console.log('📊 Competition Details:');
      console.log('   - Competition ID:', detailResponse.data.competitionId);
      console.log('   - Title:', detailResponse.data.title);
      console.log('   - Status:', detailResponse.data.status);
      console.log('   - Has Winners Array:', !!detailResponse.data.winners);
      console.log('   - Has Results Array:', !!detailResponse.data.results);

    } catch (error) {
      console.log('❌ Detail API Error:', error.response?.status, error.response?.statusText);
    }

    console.log('\n3️⃣ Frontend Integration Notes:');
    console.log('   - CompetitionResultsPage should call fetchCompetitionResults()');
    console.log('   - Results data should come from competitionResults Redux state');
    console.log('   - Winners array should contain top 3 finalists');
    console.log('   - Audio URLs should be available for playback');
    console.log('   - Page should show 1st, 2nd, 3rd place winners prominently');

    console.log('\n✅ Test completed! Check the API responses above.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testResultsPageFix(); 