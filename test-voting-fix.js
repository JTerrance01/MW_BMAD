const https = require('https');

// Configuration
const API_BASE = 'https://localhost:7141/api';
const COMPETITION_ID = 21; // Competition from the URL in the screenshot

// Admin credentials (you'll need to get a real admin token)
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with actual admin token

// Helper to make HTTPS requests
function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 7141,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ADMIN_TOKEN ? `Bearer ${ADMIN_TOKEN}` : '',
                ...headers
            },
            rejectUnauthorized: false // For development SSL
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = responseData ? JSON.parse(responseData) : {};
                    resolve({ status: res.statusCode, data: parsedData, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData, headers: res.headers });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function debugVotingIssue() {
    console.log('🔍 DEBUGGING VOTING ASSIGNMENT ISSUE');
    console.log('=====================================');
    console.log(`Competition ID: ${COMPETITION_ID}`);
    console.log(`API Base: ${API_BASE}`);
    console.log('');

    try {
        // 1. Check competition status
        console.log('1️⃣ Checking competition status...');
        const compResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}`);
        
        if (compResponse.status === 200) {
            const comp = compResponse.data;
            console.log(`   ✅ Competition: ${comp.title}`);
            console.log(`   📊 Status: ${comp.status} (${getStatusName(comp.status)})`);
            console.log(`   📝 Submissions: ${comp.submissionCount || 0}`);
        } else {
            console.log(`   ❌ Error: ${compResponse.status} - ${JSON.stringify(compResponse.data)}`);
            return;
        }

        // 2. Check voting statistics
        console.log('\n2️⃣ Checking voting statistics...');
        const statsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
        
        if (statsResponse.status === 200) {
            const stats = statsResponse.data;
            console.log(`   ✅ Total Groups: ${stats.totalGroups || 0}`);
            console.log(`   👥 Total Voters: ${stats.totalVoters || 0}`);
            console.log(`   🗳️ Votes Cast: ${stats.totalVotesCast || 0}`);
            console.log(`   ✔️ Voting Complete: ${stats.votingComplete || false}`);
        } else {
            console.log(`   ❌ Error: ${statsResponse.status} - ${JSON.stringify(statsResponse.data)}`);
        }

        // 3. Try to recreate voting groups (this is the fix)
        console.log('\n3️⃣ Recreating voting groups and assignments...');
        const recreateResponse = await makeRequest('POST', `/api/competitions/${COMPETITION_ID}/round1/create-groups`, {
            targetGroupSize: 20
        });

        if (recreateResponse.status === 200) {
            const result = recreateResponse.data;
            console.log(`   �� SUCCESS: ${result.message || 'Voting groups recreated'}`);
            console.log(`   📊 Groups created: ${result.groupCount || 'Unknown'}`);
        } else {
            console.log(`   ❌ Failed to recreate groups: ${recreateResponse.status}`);
            console.log(`   📝 Error: ${JSON.stringify(recreateResponse.data)}`);
        }

        // 4. Verify the fix by checking voting assignments again
        console.log('\n4️⃣ Verifying fix - checking voting assignments...');
        
        // Since we don't have a user token, we'll check the statistics again
        const verifyResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
        
        if (verifyResponse.status === 200) {
            const stats = verifyResponse.data;
            console.log(`   ✅ Total Groups: ${stats.totalGroups || 0}`);
            console.log(`   👥 Total Voters: ${stats.totalVoters || 0}`);
            
            if (stats.totalVoters > 0) {
                console.log('\n🎉 SUCCESS! Voting assignments have been created.');
                console.log('Users should now be able to access the voting interface.');
            } else {
                console.log('\n❌ Issue persists - no voters assigned.');
            }
        }

        console.log('\n✅ DEBUGGING COMPLETE');
        console.log('📝 Next steps:');
        console.log('   1. Users should refresh the competition page');
        console.log('   2. Look for Round 1 Voting section');
        console.log('   3. Anonymous submissions should now be available for voting');

    } catch (error) {
        console.error(`❌ Error during debugging: ${error.message}`);
    }
}

function getStatusName(status) {
    const statusMap = {
        1: 'OpenForSubmissions',
        10: 'VotingRound1Setup',
        11: 'VotingRound1Open',
        12: 'VotingRound1Tallying',
        13: 'VotingRound2Setup',
        14: 'VotingRound2Open',
        15: 'VotingRound2Tallying',
        16: 'Completed'
    };
    return statusMap[status] || 'Unknown';
}

// Instructions for getting admin token
if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.log('⚠️ SETUP REQUIRED:');
    console.log('');
    console.log('To use this script, you need an admin token.');
    console.log('1. Log in to the admin interface');
    console.log('2. Open browser dev tools (F12)');
    console.log('3. Go to Application > Local Storage');
    console.log('4. Copy the "token" value');
    console.log('5. Replace YOUR_ADMIN_TOKEN_HERE in this script');
    console.log('6. Run: node test-voting-fix.js');
    console.log('');
} else {
    // Run the debugging
    debugVotingIssue();
} 