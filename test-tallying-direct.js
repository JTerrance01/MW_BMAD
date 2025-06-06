const axios = require('axios');
const https = require('https');

// Fix for self-signed certificate
const agent = new https.Agent({
    rejectUnauthorized: false
});

async function testTallyingDirect() {
    console.log('🧪 TESTING TALLYING ENDPOINT DIRECTLY');
    console.log('====================================');

    const baseUrl = 'https://localhost:7001';
    const competitionId = 21;
    
    // Configure axios to ignore self-signed certificate
    const axiosConfig = {
        httpsAgent: agent
    };
    
    try {
        // Step 1: Try to authenticate with admin user
        console.log('\n🔐 Step 1: Getting admin authentication token...');
        
        // Try the standard admin password
        let loginResponse;
        try {
            loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
                email: 'admin@mixwarz.com',
                password: 'Password123!'  // Common default password
            }, axiosConfig);
        } catch (err) {
            // Try alternative password
            console.log('First password failed, trying alternative...');
            loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
                email: 'admin@mixwarz.com', 
                password: 'Admin123!'
            }, axiosConfig);
        }

        const token = loginResponse.data.token;
        console.log('✅ Admin token obtained');

        // Step 2: Call the tallying endpoint
        console.log('\n📊 Step 2: Calling Round1 tallying endpoint...');
        
        // Try the most likely endpoint path
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
        console.log('📈 Advanced submissions count:', tallyResponse.data);

        // Step 3: Check the results with database query
        console.log('\n🔍 Step 3: Checking results directly from database...');
        await checkResultsFromDatabase();
        
    } catch (error) {
        console.error('❌ Error during testing:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('💡 Authentication failed - will check database directly');
            await checkResultsFromDatabase();
        } else if (error.response?.status === 404) {
            console.log('💡 Endpoint not found - will check database directly'); 
            await checkResultsFromDatabase();
        } else if (error.response?.status === 500) {
            console.log('💡 Server error - checking database for current state');
            console.log('Error details:', error.response?.data);
            await checkResultsFromDatabase();
        }
    }
}

async function checkResultsFromDatabase() {
    const { Client } = require('pg');
    
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'MixWarz',
        user: 'postgres',
        password: 'Ready2go!'
    });

    try {
        await client.connect();
        console.log('🔗 Connected to database');

        // Check competition status
        console.log('\n🏆 Competition status:');
        const statusResult = await client.query(`
            SELECT "CompetitionId", "Title", "Status" 
            FROM "Competitions" 
            WHERE "CompetitionId" = 21
        `);
        
        if (statusResult.rows.length > 0) {
            const comp = statusResult.rows[0];
            console.log(`   ${comp.Title}: Status = ${comp.Status}`);
        }

        // Check submission results
        console.log('\n📊 SUBMISSION RESULTS:');
        const submissionsResult = await client.query(`
            SELECT 
                "SubmissionId",
                "MixTitle",
                "Round1Score",
                "AdvancedToRound2",
                "IsEligibleForRound2Voting",
                "IsDisqualified"
            FROM "Submissions" 
            WHERE "CompetitionId" = 21
            ORDER BY "MixTitle"
        `);

        let advancedCount = 0;
        let disqualifiedCount = 0;
        let scoreCount = 0;
        let nullScoreCount = 0;

        submissionsResult.rows.forEach(submission => {
            console.log(`\n🎵 ${submission.MixTitle}:`);
            console.log(`   Round1Score: ${submission.Round1Score !== null ? submission.Round1Score : 'NULL'}`);
            console.log(`   AdvancedToR2: ${submission.AdvancedToRound2}`);
            console.log(`   IsDisqualified: ${submission.IsDisqualified || false}`);
            
            if (submission.AdvancedToRound2) advancedCount++;
            if (submission.IsDisqualified) disqualifiedCount++;
            if (submission.Round1Score !== null) scoreCount++;
            else nullScoreCount++;
        });

        console.log('\n📈 SUMMARY STATISTICS:');
        console.log(`   Total Submissions: ${submissionsResult.rows.length}`);
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
        console.error('❌ Database error:', error);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Run the test
testTallyingDirect(); 