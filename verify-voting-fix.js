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

async function verifyVotingFix() {
    console.log('🔧 VERIFYING VOTING ASSIGNMENTS FIX');
    console.log('===================================');
    console.log(`Competition ID: ${COMPETITION_ID}`);
    console.log();

    try {
        // Step 1: Verify submissions count is now correct
        console.log('1️⃣ CHECKING SUBMISSIONS COUNT AFTER DATABASE FIX');
        console.log('─────────────────────────────────────────────────');
        
        const competitionResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}`);
        if (competitionResponse.status === 200) {
            const comp = competitionResponse.data;
            console.log(`   📊 Title: ${comp.title}`);
            console.log(`   📊 Status: ${comp.status}`);
            console.log(`   📊 Submissions Count: ${comp.submissionsCount}`);
            
            if (comp.submissionsCount === 0) {
                console.log('   ❌ STILL BROKEN: Submissions count is 0');
                console.log('   📝 Make sure you executed the SQL statements in fix-competition-21-database.sql');
                return;
            } else if (comp.submissionsCount >= 10) {
                console.log(`   ✅ SUCCESS: Now showing ${comp.submissionsCount} submissions!`);
            } else {
                console.log(`   ⚠️ PARTIAL: Showing ${comp.submissionsCount} submissions (expected 10)`);
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
            const result = createGroupsResponse.data;
            if (result.groupsCreated) {
                console.log(`   📊 Groups Created: ${result.groupsCreated}`);
            }
            if (result.assignmentsCreated) {
                console.log(`   📊 Assignments Created: ${result.assignmentsCreated}`);
            }
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
            
            if (stats.totalGroups > 0 && stats.totalVoters > 0) {
                console.log('   🎉 SUCCESS: Voting groups are properly set up!');
            }
        } else if (statsResponse.status === 401) {
            console.log('   ⚠️ Authentication required for voting stats');
        } else {
            console.log(`   ❌ Failed to get voting stats: ${statsResponse.status}`);
        }

        // Step 4: Test voting assignments endpoint (key test)
        console.log('\n4️⃣ TESTING VOTING ASSIGNMENTS ENDPOINT');
        console.log('──────────────────────────────────────');
        
        const assignmentsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/voting/round1/assignments`);
        
        if (assignmentsResponse.status === 401) {
            console.log('   ⚠️ Authentication required for voting assignments (expected)');
            console.log('   📝 This means the endpoint exists and is properly secured');
            console.log('   🔗 Frontend will be able to access this with proper authentication');
        } else if (assignmentsResponse.status === 200) {
            const assignments = assignmentsResponse.data;
            console.log('   ✅ Voting assignments endpoint accessible!');
            console.log(`   📊 Submissions assigned: ${assignments.submissions?.length || 0}`);
            
            if (assignments.submissions?.length > 0) {
                console.log('   🎉 SUCCESS: Users should now see submissions to vote on!');
                console.log('   📝 Sample submission:');
                const sample = assignments.submissions[0];
                console.log(`      - ID: ${sample.id}`);
                console.log(`      - Title: ${sample.title}`);
                console.log(`      - Audio URL: ${sample.audioUrl}`);
            }
        } else {
            console.log(`   ❌ Unexpected response: ${assignmentsResponse.status}`);
            console.log(`   📝 Response: ${JSON.stringify(assignmentsResponse.data, null, 2)}`);
        }

        // Step 5: Frontend verification guidance
        console.log('\n5️⃣ FRONTEND VERIFICATION STEPS');
        console.log('──────────────────────────────');
        console.log('   🌐 Open the frontend application');
        console.log('   🔐 Log in as the admin user (767f7a81-f448-4055-9436-e0da398aef29)');
        console.log('   📍 Navigate to Competition 21: "Where Lovers go"');
        console.log('   👀 Look for the VotingRound1Card component');
        console.log('   🎵 You should now see 3 anonymous MP3 players to vote on');
        console.log('   ❌ "No voting assignments available" error should be gone');

        console.log('\n🎉 VERIFICATION COMPLETE');
        console.log('═══════════════════════');
        console.log('Expected Results:');
        console.log('✅ Competition shows 10+ submissions');
        console.log('✅ Voting groups are created');
        console.log('✅ API endpoints respond correctly');
        console.log('✅ Frontend displays anonymous tracks for voting');

    } catch (error) {
        console.error(`\n❌ Error during verification: ${error.message}`);
    }
}

// Run the verification
verifyVotingFix(); 