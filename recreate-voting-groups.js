const https = require('https');

// Configuration
const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;

// Disable SSL verification for localhost development
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Helper to make HTTPS requests
function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 7001,
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

async function recreateVotingGroups() {
    console.log('🗳️  RE-CREATING VOTING GROUPS FOR COMPETITION 21');
    console.log('================================================');
    console.log();

    try {
        // Step 1: Check competition status after database fix
        console.log('1️⃣ CHECKING COMPETITION STATUS AFTER DATABASE FIX');
        console.log('──────────────────────────────────────────────────');
        
        const competitionResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}`);
        if (competitionResponse.status === 200) {
            const comp = competitionResponse.data;
            console.log(`   📊 Title: ${comp.title}`);
            console.log(`   📊 Status: ${comp.status}`);
            console.log(`   📊 Submissions Count: ${comp.submissionsCount}`);
            
            if (comp.submissionsCount === 0) {
                console.log('   ❌ CRITICAL: Still showing 0 submissions!');
                console.log('   📝 Make sure you ran all the SQL INSERT statements first');
                return;
            } else {
                console.log(`   ✅ SUCCESS: Now showing ${comp.submissionsCount} submissions!`);
            }
        } else {
            console.log(`   ❌ Failed to get competition: ${competitionResponse.status}`);
            return;
        }

        // Step 2: Re-create voting groups
        console.log('\n2️⃣ RE-CREATING VOTING GROUPS');
        console.log('────────────────────────────');
        
        const createGroupsResponse = await makeRequest('POST', `/api/competitions/${COMPETITION_ID}/round1/create-groups`, {
            targetGroupSize: 20
        });
        
        if (createGroupsResponse.status === 200) {
            console.log('   ✅ Voting groups created successfully!');
            console.log(`   📊 Response: ${JSON.stringify(createGroupsResponse.data, null, 2)}`);
        } else if (createGroupsResponse.status === 401) {
            console.log('   ⚠️ Authentication required for group creation');
            console.log('   📝 This endpoint requires admin authentication');
        } else {
            console.log(`   ❌ Failed to create groups: ${createGroupsResponse.status}`);
            console.log(`   📝 Response: ${JSON.stringify(createGroupsResponse.data, null, 2)}`);
        }

        // Step 3: Check voting statistics
        console.log('\n3️⃣ CHECKING VOTING STATISTICS');
        console.log('─────────────────────────────');
        
        const statsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
        
        if (statsResponse.status === 200) {
            const stats = statsResponse.data;
            console.log('   ✅ Voting statistics available!');
            console.log(`   📊 Total Groups: ${stats.totalGroups}`);
            console.log(`   📊 Total Voters: ${stats.totalVoters}`);
            console.log(`   📊 Voters Who Voted: ${stats.votersWhoVoted}`);
            console.log(`   📊 Voting Completion: ${stats.votingCompletionPercentage}%`);
        } else if (statsResponse.status === 401) {
            console.log('   ⚠️ Authentication required for voting stats');
        } else {
            console.log(`   ❌ Failed to get voting stats: ${statsResponse.status}`);
        }

        // Step 4: Test voting assignments
        console.log('\n4️⃣ TESTING VOTING ASSIGNMENTS');
        console.log('─────────────────────────────');
        
        const assignmentsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/voting/round1/assignments`);
        
        if (assignmentsResponse.status === 401) {
            console.log('   ⚠️ Authentication required for voting assignments (expected)');
            console.log('   📝 This means the endpoint exists and is properly secured');
        } else if (assignmentsResponse.status === 200) {
            const assignments = assignmentsResponse.data;
            console.log('   ✅ Voting assignments endpoint accessible!');
            console.log(`   📊 Submissions assigned: ${assignments.submissions?.length || 0}`);
            
            if (assignments.submissions?.length > 0) {
                console.log('   🎉 SUCCESS: Users should now see submissions to vote on!');
            }
        } else {
            console.log(`   ❌ Unexpected response: ${assignmentsResponse.status}`);
        }

        console.log('\n🎉 VOTING GROUPS RECREATION COMPLETE');
        console.log('═══════════════════════════════════');
        
        console.log('\n📋 FINAL VERIFICATION STEPS:');
        console.log('1. Log in as admin user in the frontend');
        console.log('2. Navigate to Competition 21');
        console.log('3. Check if VotingRound1Card shows anonymous MP3 players');
        console.log('4. Verify you can listen to and vote on assigned submissions');
        
        console.log('\n✅ If everything worked correctly:');
        console.log('   • Competition should show 10 submissions');
        console.log('   • Voting groups should be created');
        console.log('   • Users should see anonymous tracks to vote on');
        console.log('   • No more "No voting assignments available" error');

    } catch (error) {
        console.error(`\n❌ Error during voting groups recreation: ${error.message}`);
    }
}

// Run the recreation
recreateVotingGroups(); 