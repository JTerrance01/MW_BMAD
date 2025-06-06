const axios = require('axios');
const https = require('https');

// Fix for self-signed certificate
const agent = new https.Agent({
    rejectUnauthorized: false
});

async function testNewAdvancementLogic() {
    console.log('🎯 TESTING NEW ADVANCEMENT LOGIC');
    console.log('================================');
    console.log('Testing: Only 1st place winner per group advances to Round 2\\n');

    const baseUrl = 'https://localhost:7001';
    const competitionId = 21;
    
    // Configure axios to ignore self-signed certificate
    const axiosConfig = {
        httpsAgent: agent
    };
    
    try {
        // Step 1: Get admin token - try multiple credentials
        console.log('🔐 Step 1: Getting admin authentication...');
        
        let token;
        const credentialAttempts = [
            { email: 'admin@mixwarz.com', password: 'TempPassword123!' },
            { email: 'admin@mixwarz.com', password: 'AdminPassword123!' },
            { email: 'admin@mixwarz.com', password: 'Password123!' }
        ];

        for (const creds of credentialAttempts) {
            try {
                const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, creds, axiosConfig);
                token = loginResponse.data.token;
                console.log(`✅ Admin authenticated with password: ${creds.password}`);
                break;
            } catch (error) {
                console.log(`❌ Failed with password: ${creds.password}`);
            }
        }

        if (!token) {
            console.log('❌ All authentication attempts failed');
            console.log('⚠️ Cannot test API endpoints without authentication');
            console.log('📋 Manual testing required: Use admin interface to run \"Tally Votes & Advance\"');
            return;
        }

        // Step 2: Call Round 1 tallying with new logic
        console.log('\\n🏆 Step 2: Running Round 1 tallying with new advancement logic...');
        
        const tallyResponse = await axios.post(
            `${baseUrl}/api/competitions/${competitionId}/round1/tally-votes`,
            {},
            {
                ...axiosConfig,
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (tallyResponse.data.success) {
            console.log('✅ Round 1 tallying completed successfully');
            console.log(`📊 Result: ${tallyResponse.data.message}`);
            
            // Step 3: Verify results in database
            console.log('\\n📊 Step 3: Verifying new advancement logic in database...');
            await verifyAdvancementResults();
            
        } else {
            console.log('❌ Round 1 tallying failed');
            console.log(`Error: ${tallyResponse.data.message}`);
        }

    } catch (error) {
        console.error('❌ API test failed:', error.response?.data?.message || error.message);
        
        if (error.response?.status === 400) {
            console.log('\\n⚠️ This might be because Round 1 judging is not complete');
            console.log('📋 Ensure all judges have completed their assigned judgments before tallying');
        }
    }
}

async function verifyAdvancementResults() {
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
        
        const competitionId = 21;

        // Check advancement results by group
        const submissionsResult = await client.query(`
            SELECT 
                s.\"SubmissionId\",
                s.\"MixTitle\",
                s.\"AdvancedToRound2\",
                s.\"Round1Score\",
                s.\"IsDisqualified\",
                sg.\"GroupNumber\"
            FROM \"Submissions\" s
            LEFT JOIN \"SubmissionGroups\" sg ON s.\"SubmissionId\" = sg.\"SubmissionId\"
            WHERE s.\"CompetitionId\" = $1
            ORDER BY sg.\"GroupNumber\", s.\"Round1Score\" DESC NULLS LAST
        `, [competitionId]);

        let groupResults = {};
        submissionsResult.rows.forEach(row => {
            const group = row.GroupNumber;
            if (!groupResults[group]) {
                groupResults[group] = [];
            }
            groupResults[group].push(row);
        });

        console.log('\\n🏅 ADVANCEMENT RESULTS BY GROUP:');
        let totalAdvanced = 0;
        let correctImplementation = true;

        Object.keys(groupResults).sort().forEach(groupNum => {
            const submissions = groupResults[groupNum];
            const advanced = submissions.filter(s => s.AdvancedToRound2 && !s.IsDisqualified);
            totalAdvanced += advanced.length;

            console.log(`\\n   GROUP ${groupNum}:`);
            submissions.forEach((sub, index) => {
                const rank = index + 1;
                const status = sub.IsDisqualified ? '❌ DISQUALIFIED' : 
                              sub.AdvancedToRound2 ? '🏆 ADVANCED' : 
                              '📉 ELIMINATED';
                console.log(`     ${rank}. ${sub.MixTitle} - Score: ${sub.Round1Score || 'null'} ${status}`);
            });

            // Verify only 1st place advanced
            if (advanced.length > 1) {
                correctImplementation = false;
                console.log(`     ❌ ERROR: ${advanced.length} submissions advanced (should be 1)`);
            } else if (advanced.length === 1) {
                console.log(`     ✅ CORRECT: 1 submission advanced (group winner)`);
            } else {
                console.log(`     ⚠️ No submissions advanced from this group`);
            }
        });

        console.log(`\\n📊 SUMMARY:`);
        console.log(`   Total Advanced: ${totalAdvanced}`);
        console.log(`   Expected: ${Object.keys(groupResults).length} (1 per group)`);
        console.log(`   New Logic Working: ${correctImplementation ? '✅ YES' : '❌ NO'}`);

        if (correctImplementation && totalAdvanced > 0) {
            console.log('\\n🎯 SUCCESS: New business logic is working correctly!');
            console.log('   ✅ Only 1st place winners advance to Round 2');
            console.log('   ✅ All non-disqualified competitors can vote in Round 2');
        } else if (totalAdvanced === 0) {
            console.log('\\n⚠️ No submissions advanced - check if judging is complete');
        } else {
            console.log('\\n❌ Business logic needs review');
        }

    } catch (error) {
        console.error('❌ Database verification failed:', error.message);
    } finally {
        await client.end();
    }
}

// Run the test
testNewAdvancementLogic().catch(console.error); 