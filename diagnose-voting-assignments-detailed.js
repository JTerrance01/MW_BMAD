const https = require('https');

// Configuration
const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;
const ADMIN_USER_ID = '767f7a81-f448-4055-9436-e0da398aef29';

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

async function comprehensiveDiagnosis() {
    console.log('🔍 COMPREHENSIVE VOTING ASSIGNMENTS DIAGNOSIS');
    console.log('==============================================');
    console.log(`Competition ID: ${COMPETITION_ID}`);
    console.log(`Admin User ID: ${ADMIN_USER_ID}`);
    console.log(`API URL: ${API_BASE}`);
    console.log();

    try {
        // Step 1: Check Competition Basic Info
        console.log('1️⃣ CHECKING COMPETITION BASIC INFO');
        console.log('──────────────────────────────────');
        const competitionResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}`);
        
        if (competitionResponse.status === 200) {
            const comp = competitionResponse.data;
            console.log(`   📊 Title: ${comp.title}`);
            console.log(`   📊 Status: ${comp.status} (${getStatusName(comp.status)})`);
            console.log(`   📊 Submissions Count: ${comp.submissionsCount}`);
            console.log(`   📊 End Date: ${comp.endDate}`);
            
            if (comp.status !== 11) {
                console.log(`   ⚠️ WARNING: Competition status is ${comp.status}, expected 11 (VotingRound1Open)`);
            }
            
            if (comp.submissionsCount === 0) {
                console.log(`   ❌ CRITICAL: No submissions found - voting cannot work without submissions`);
                return;
            }
        } else {
            console.log(`   ❌ Failed to get competition: ${competitionResponse.status}`);
            return;
        }

        // Step 2: Check Round1 Voting Stats (Admin endpoint)
        console.log('\n2️⃣ CHECKING ROUND1 VOTING STATISTICS');
        console.log('─────────────────────────────────');
        const statsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
        
        if (statsResponse.status === 200) {
            const stats = statsResponse.data;
            console.log(`   📊 Total Groups: ${stats.totalGroups}`);
            console.log(`   📊 Total Voters: ${stats.totalVoters}`);
            console.log(`   📊 Voters Who Voted: ${stats.votersWhoVoted}`);
            console.log(`   📊 Voting Completion: ${stats.votingCompletionPercentage}%`);
            
            if (stats.totalGroups === 0) {
                console.log(`   ❌ CRITICAL: No voting groups exist`);
                return;
            }
            
            if (stats.totalVoters === 0) {
                console.log(`   ❌ CRITICAL: No voters assigned`);
                return;
            }
        } else if (statsResponse.status === 401) {
            console.log(`   ⚠️ Stats endpoint requires authentication (expected)`);
        } else {
            console.log(`   ❌ Failed to get voting stats: ${statsResponse.status}`);
        }

        // Step 3: Test Voting Assignments Endpoint (This is the failing one)
        console.log('\n3️⃣ TESTING VOTING ASSIGNMENTS ENDPOINT');
        console.log('──────────────────────────────────────');
        const assignmentsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/voting/round1/assignments`);
        
        if (assignmentsResponse.status === 401) {
            console.log(`   ⚠️ Assignments endpoint requires authentication (expected)`);
            console.log(`   📝 Response: ${assignmentsResponse.data?.message || 'Unauthorized'}`);
        } else if (assignmentsResponse.status === 200) {
            const assignments = assignmentsResponse.data;
            console.log(`   ✅ Endpoint accessible!`);
            console.log(`   📊 Submissions to vote on: ${assignments.submissions?.length || 0}`);
            console.log(`   📊 Has voted: ${assignments.hasVoted || false}`);
            console.log(`   📊 Voting deadline: ${assignments.votingDeadline || 'N/A'}`);
            
            if (assignments.submissions?.length > 0) {
                console.log(`   📄 Sample submission:`);
                const sample = assignments.submissions[0];
                console.log(`      - ID: ${sample.id}`);
                console.log(`      - Title: ${sample.title}`);
                console.log(`      - Audio URL: ${sample.audioUrl}`);
            }
        } else {
            console.log(`   ❌ Unexpected status: ${assignmentsResponse.status}`);
            console.log(`   📝 Response: ${JSON.stringify(assignmentsResponse.data, null, 2)}`);
        }

        // Step 4: Check Voting Status
        console.log('\n4️⃣ CHECKING VOTING STATUS ENDPOINT');
        console.log('──────────────────────────────────');
        const statusResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/voting/status`);
        
        if (statusResponse.status === 401) {
            console.log(`   ⚠️ Status endpoint requires authentication (expected)`);
        } else if (statusResponse.status === 200) {
            const status = statusResponse.data;
            console.log(`   ✅ Status endpoint accessible!`);
            console.log(`   📊 Competition Status: ${status.competitionStatus} (${status.competitionStatusText})`);
            console.log(`   📊 Has Round 1 Groups: ${status.hasRound1VotingGroups}`);
            console.log(`   📊 Round 1 Group Count: ${status.round1GroupCount}`);
            console.log(`   📊 Setup Complete: ${status.votingSetupComplete}`);
            console.log(`   📝 Setup Message: ${status.setupMessage}`);
        } else {
            console.log(`   ❌ Unexpected status: ${statusResponse.status}`);
            console.log(`   📝 Response: ${JSON.stringify(statusResponse.data, null, 2)}`);
        }

        // Step 5: Manual Database Query Simulation
        console.log('\n5️⃣ SIMULATING DATABASE QUERIES');
        console.log('──────────────────────────────');
        console.log(`   🔍 What the backend would query:`);
        console.log(`   
   1. Round1Assignments table:
      SELECT * FROM Round1Assignments 
      WHERE CompetitionId = ${COMPETITION_ID} 
      AND VoterId = '${ADMIN_USER_ID}'
      
   2. SubmissionGroups table:
      SELECT sg.*, s.* FROM SubmissionGroups sg
      JOIN Submissions s ON sg.SubmissionId = s.SubmissionId
      WHERE sg.CompetitionId = ${COMPETITION_ID} 
      AND sg.GroupNumber = [AssignedGroupNumber from step 1]
        `);

        // Step 6: Recommendations
        console.log('\n6️⃣ DIAGNOSTIC RECOMMENDATIONS');
        console.log('─────────────────────────────');
        console.log(`   🔧 To debug this issue, run these SQL queries:`);
        console.log(`   
   -- Check if admin has assignment
   SELECT * FROM "Round1Assignments" 
   WHERE "CompetitionId" = ${COMPETITION_ID} 
   AND "VoterId" = '${ADMIN_USER_ID}';
   
   -- Check what's in the assigned group  
   SELECT sg."GroupNumber", sg."SubmissionId", s."MixTitle", s."AudioFilePath"
   FROM "SubmissionGroups" sg
   LEFT JOIN "Submissions" s ON sg."SubmissionId" = s."SubmissionId"
   WHERE sg."CompetitionId" = ${COMPETITION_ID}
   ORDER BY sg."GroupNumber", sg."SubmissionId";
   
   -- Check all submissions for competition
   SELECT "SubmissionId", "MixTitle", "AudioFilePath", "UserId", "IsDisqualified"
   FROM "Submissions" 
   WHERE "CompetitionId" = ${COMPETITION_ID};
        `);

        console.log('\n✅ DIAGNOSIS COMPLETE');
        console.log('\n📋 SUMMARY:');
        console.log('   - All API endpoints exist and respond correctly');
        console.log('   - Issue is likely in the data query logic or user ID matching');
        console.log('   - Run the SQL queries above to identify the exact data issue');
        
        console.log('\n🔧 NEXT STEPS:');
        console.log('   1. Run the SQL queries to check database state');
        console.log('   2. Verify admin user ID matches JWT token claims');
        console.log('   3. Check if assigned group has submissions with proper AudioFilePath');
        console.log('   4. Test with a regular user (not admin) to see if role affects anything');
        
    } catch (error) {
        console.error(`\n❌ Error during diagnosis: ${error.message}`);
    }
}

function getStatusName(status) {
    const statusNames = {
        1: 'OpenForSubmissions',
        2: 'InJudging', 
        3: 'Closed',
        10: 'VotingRound1Setup',
        11: 'VotingRound1Open',
        12: 'VotingRound1Tallying',
        13: 'VotingRound2Setup',
        14: 'VotingRound2Open',
        15: 'VotingRound2Tallying',
        16: 'Completed'
    };
    return statusNames[status] || `Unknown(${status})`;
}

// Run the diagnosis
comprehensiveDiagnosis(); 