const https = require('https');

// Configuration
const API_BASE = 'https://localhost:7141/api';
const COMPETITION_ID = 21;

// Disable SSL verification for localhost development
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

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
                ...headers
            },
            rejectUnauthorized: false
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

async function fixVotingAssignments() {
    console.log('🔧 FIXING VOTING ASSIGNMENTS FOR COMPETITION 21');
    console.log('===============================================');
    console.log();

    try {
        // Step 1: Check current competition status
        console.log('1️⃣ Checking competition status...');
        const compResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}`);
        
        if (compResponse.status !== 200) {
            console.log(`   ❌ Error: ${compResponse.status} - ${JSON.stringify(compResponse.data)}`);
            return;
        }

        const competition = compResponse.data;
        console.log(`   ✅ Competition: ${competition.title}`);
        console.log(`   📊 Status: ${competition.status} (${getStatusName(competition.status)})`);
        console.log(`   📝 Submissions: ${competition.submissionCount || 0}`);

        if (competition.submissionCount === 0) {
            console.log('\n   ❌ ERROR: No submissions found for this competition!');
            console.log('   💡 You need submissions before creating voting groups.');
            return;
        }

        // Step 2: Check current voting statistics
        console.log('\n2️⃣ Checking current voting assignments...');
        const statsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
        
        if (statsResponse.status === 200) {
            const stats = statsResponse.data;
            console.log(`   📊 Current Groups: ${stats.totalGroups || 0}`);
            console.log(`   👥 Current Voters: ${stats.totalVoters || 0}`);
            console.log(`   🗳️ Votes Cast: ${stats.totalVotesCast || 0}`);
            
            if (stats.totalVoters === 0) {
                console.log('   ⚠️ PROBLEM CONFIRMED: No voting assignments exist!');
            }
        } else {
            console.log(`   ❌ Could not fetch voting stats: ${statsResponse.status}`);
        }

        // Step 3: Re-create voting groups with ALL users logic
        console.log('\n3️⃣ Re-creating voting groups with ALL-users logic...');
        
        const recreateResponse = await makeRequest('POST', `/api/competitions/${COMPETITION_ID}/round1/create-groups`, {
            targetGroupSize: 20
        });

        if (recreateResponse.status === 200) {
            const result = recreateResponse.data;
            console.log(`   🎉 SUCCESS: ${result.message || 'Voting groups recreated'}`);
            console.log(`   📊 Groups created: ${result.groupCount || 'Unknown'}`);
        } else {
            console.log(`   ❌ Failed to recreate groups: ${recreateResponse.status}`);
            console.log(`   📝 Error: ${JSON.stringify(recreateResponse.data)}`);
            
            if (recreateResponse.status === 401 || recreateResponse.status === 403) {
                console.log('\n   💡 This requires admin authentication. Try:');
                console.log('   1. Log in to the admin interface');
                console.log('   2. Open browser dev tools (F12)');
                console.log('   3. Go to Application > Local Storage');
                console.log('   4. Copy the "token" value');
                console.log('   5. Run this script with admin token');
                return;
            }
        }

        // Step 4: Verify the fix worked
        console.log('\n4️⃣ Verifying fix...');
        
        // Wait a moment for database updates
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const verifyStatsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
        
        if (verifyStatsResponse.status === 200) {
            const newStats = verifyStatsResponse.data;
            console.log(`   📊 New Groups: ${newStats.totalGroups || 0}`);
            console.log(`   👥 New Voters: ${newStats.totalVoters || 0}`);
            console.log(`   🗳️ Votes Cast: ${newStats.totalVotesCast || 0}`);
            
            if (newStats.totalVoters > 0) {
                console.log('\n🎉 FIX SUCCESSFUL!');
                console.log('✅ Voting assignments are now available for all users');
                console.log('💡 The "No voting assignments available" error should be resolved');
                
                console.log('\n🔄 Next steps:');
                console.log('   1. Refresh the competition page in your browser');
                console.log('   2. Look for Round 1 Voting section');
                console.log('   3. You should now see anonymous tracks to vote on');
                console.log('   4. All registered users should be able to vote, not just submitters');
                
            } else {
                console.log('\n❌ Fix unsuccessful - no voters still assigned');
                console.log('   This may require manual investigation');
            }
        } else {
            console.log(`   ❌ Could not verify fix: ${verifyStatsResponse.status}`);
        }

        console.log('\n✅ VOTING ASSIGNMENT FIX COMPLETE');

    } catch (error) {
        console.error(`\n❌ Error during fix process: ${error.message}`);
        console.log('\n🔧 Troubleshooting suggestions:');
        console.log('   1. Ensure the API is running on https://localhost:7141');
        console.log('   2. Check that Competition 21 has submissions');
        console.log('   3. Try running as an admin user if permissions are required');
        console.log('   4. Verify the database connection is working');
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

// Instructions for running with admin token
console.log('🚀 VOTING ASSIGNMENT FIX SCRIPT');
console.log('================================');
console.log();
console.log('This script will fix the "No voting assignments available" error by');
console.log('re-creating voting groups with the updated ALL-users logic.');
console.log();
console.log('📝 To run with admin authentication:');
console.log('   1. Log in to the admin interface at localhost:3000/admin');
console.log('   2. Open browser dev tools (F12)');
console.log('   3. Go to Application > Local Storage > localhost:3000');
console.log('   4. Copy the "token" value');
console.log('   5. Modify this script to include the token in headers');
console.log();
console.log('🔄 Running fix now...');
console.log();

// Run the fix
fixVotingAssignments(); 