const axios = require('axios');
const https = require('https');

// Fix for self-signed certificate
const agent = new https.Agent({
    rejectUnauthorized: false
});

async function testRefactoredTallying() {
    console.log('🧪 TESTING REFACTORED ROUND1 TALLYING');
    console.log('=====================================');

    const baseUrl = 'https://localhost:7001';
    const competitionId = 21;
    
    // Configure axios to ignore self-signed certificate
    const axiosConfig = {
        httpsAgent: agent
    };
    
    try {
        // Step 1: Get admin token (assuming admin credentials)
        console.log('\n🔐 Step 1: Getting admin authentication token...');
        
        const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
            email: 'admin@mixwarz.com',
            password: 'AdminPassword123!'
        }, axiosConfig);

        const token = loginResponse.data.token;
        console.log('✅ Admin token obtained');

        // Step 2: Call the refactored tallying endpoint
        console.log('\n📊 Step 2: Calling refactored Round1 tallying endpoint...');
        
        const tallyResponse = await axios.post(
            `${baseUrl}/api/competitions/${competitionId}/round1/tally-votes`,
            {},
            {
                ...axiosConfig,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Tallying completed successfully!');
        console.log('📈 Tallying Result:', tallyResponse.data);

        // Step 3: Verify the results
        console.log('\n🔍 Step 3: Verifying tallying results...');
        
        await verifyTallyingResults(token, baseUrl, competitionId, axiosConfig);
        
    } catch (error) {
        console.error('❌ Error during testing:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('💡 Try checking admin credentials or API authentication');
        } else if (error.response?.status === 404) {
            console.log('💡 Check if the API is running on https://localhost:7001');
        } else if (error.response?.status === 500) {
            console.log('💡 Check server logs for detailed error information');
            console.log('Error details:', error.response?.data);
        }
    }
}

async function verifyTallyingResults(token, baseUrl, competitionId, axiosConfig) {
    try {
        // Verify competition status changed
        console.log('🏆 Checking competition status...');
        const statusResponse = await axios.get(
            `${baseUrl}/api/v1/admin/competitions?competitionId=${competitionId}`,
            {
                ...axiosConfig,
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        const competition = statusResponse.data.competitions[0];
        console.log(`Competition Status: ${competition.status}`);
        
        if (competition.status === 'VotingRound2Setup') {
            console.log('✅ Competition status correctly updated to VotingRound2Setup');
        } else {
            console.log(`⚠️ Expected VotingRound2Setup, got ${competition.status}`);
        }

        // Get detailed submission results
        console.log('\n📋 Checking submission results...');
        const submissionsResponse = await axios.get(
            `${baseUrl}/api/competitions/${competitionId}/submissions`,
            {
                ...axiosConfig,
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        console.log('\n📊 FINAL SUBMISSION RESULTS:');
        console.log('============================');
        
        const submissions = submissionsResponse.data;
        let advancedCount = 0;
        let disqualifiedCount = 0;
        let scoreCount = 0;
        let nullScoreCount = 0;

        submissions.forEach(submission => {
            console.log(`\n🎵 ${submission.mixTitle}:`);
            console.log(`   Round1Score: ${submission.round1Score !== null ? submission.round1Score : 'NULL'}`);
            console.log(`   AdvancedToR2: ${submission.advancedToRound2}`);
            console.log(`   IsDisqualified: ${submission.isDisqualified || false}`);
            
            if (submission.advancedToRound2) advancedCount++;
            if (submission.isDisqualified) disqualifiedCount++;
            if (submission.round1Score !== null) scoreCount++;
            else nullScoreCount++;
        });

        console.log('\n📈 SUMMARY STATISTICS:');
        console.log(`   Total Submissions: ${submissions.length}`);
        console.log(`   Advanced to Round2: ${advancedCount}`);
        console.log(`   Disqualified: ${disqualifiedCount}`);
        console.log(`   With Round1Score: ${scoreCount}`);
        console.log(`   With NULL Round1Score: ${nullScoreCount}`);

        // Validation checks
        console.log('\n✅ VALIDATION RESULTS:');
        
        if (nullScoreCount === 0) {
            console.log('✅ SUCCESS: All submissions have Round1Score values (no NULL values)');
        } else {
            console.log(`❌ ISSUE: ${nullScoreCount} submissions still have NULL Round1Score values`);
        }

        if (disqualifiedCount > 0) {
            console.log(`✅ SUCCESS: ${disqualifiedCount} submissions properly disqualified`);
        } else {
            console.log('⚠️ NOTE: No submissions were disqualified (check if this is expected)');
        }

        if (advancedCount > 0) {
            console.log(`✅ SUCCESS: ${advancedCount} submissions advanced to Round2`);
        } else {
            console.log('❌ ISSUE: No submissions advanced to Round2');
        }

    } catch (error) {
        console.error('❌ Error verifying results:', error.response?.data || error.message);
    }
}

// Run the test
testRefactoredTallying(); 