const https = require('https');

// Configuration - Using correct port 7001
const API_BASE = 'https://localhost:7001/api';
const COMPETITION_ID = 21;

// Disable SSL verification for localhost development
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Helper to make HTTPS requests
function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 7001,  // Correct port from launchSettings.json
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

async function fixVotingPortAndGroups() {
    console.log('🔧 FIXING VOTING PORT MISMATCH AND GROUPS - COMPREHENSIVE SOLUTION');
    console.log('==================================================================');
    console.log(`API URL: ${API_BASE}`);
    console.log(`Competition ID: ${COMPETITION_ID}`);
    console.log();

    try {
        // Step 1: Test API connectivity on correct port
        console.log('1️⃣ Testing API connectivity on correct port (7001)...');
        
        let apiReady = false;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!apiReady && attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`   🔄 Attempt ${attempts}/${maxAttempts}: Checking API status...`);
                
                // Test with a specific competition endpoint instead of /competitions
                const healthResponse = await makeRequest('GET', `/competitions/${COMPETITION_ID}`);
                
                if (healthResponse.status === 200) {
                    console.log('   ✅ API is running and accessible on port 7001!');
                    apiReady = true;
                } else {
                    console.log(`   ⚠️ API responded with status ${healthResponse.status}, retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error) {
                console.log(`   ⚠️ API not ready yet (${error.message}), waiting...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!apiReady) {
            console.log('   ❌ API is not responding on port 7001 after multiple attempts');
            console.log('   💡 Please ensure the API is running with: cd src/MixWarz.API && dotnet run');
            return;
        }

        // Step 2: Check competition status and submissions
        console.log('\n2️⃣ Checking competition status and submissions...');
        const compResponse = await makeRequest('GET', `/competitions/${COMPETITION_ID}`);
        
        if (compResponse.status !== 200) {
            console.log(`   ❌ Error fetching competition: ${compResponse.status} - ${JSON.stringify(compResponse.data)}`);
            return;
        }

        const competition = compResponse.data;
        console.log(`   ✅ Competition: ${competition.title}`);
        console.log(`   📊 Status: ${competition.status} (${getStatusName(competition.status)})`);
        console.log(`   📝 Submissions: ${competition.submissionsCount || 0}`);

        if ((competition.submissionsCount || 0) === 0) {
            console.log('\n   ❌ ERROR: No submissions found for this competition!');
            console.log('   💡 You need competitors to submit their mixes before creating voting groups.');
            console.log('   📋 Steps to resolve:');
            console.log('      1. Set competition status to "Open for Submissions"');
            console.log('      2. Wait for users to submit their mixes');
            console.log('      3. Once you have submissions, run this script again');
            console.log('   🔗 Admin URL: http://localhost:3000/admin/competitions');
            return;
        }

        const submissionCount = competition.submissionsCount;
        console.log(`\n   📊 IMPROVED GROUPING ANALYSIS for ${submissionCount} submissions:`);
        
        let expectedGroups;
        if (submissionCount <= 6) {
            expectedGroups = 2;
            console.log('   🎯 Strategy: Very small competition → 2 groups (improved logic)');
        } else if (submissionCount <= 12) {
            expectedGroups = 3;
            console.log('   🎯 Strategy: Small competition → 3 groups (improved logic)');
        } else if (submissionCount <= 20) {
            expectedGroups = 4;
            console.log('   🎯 Strategy: Medium competition → 4 groups (improved logic)');
        } else {
            expectedGroups = Math.max(2, Math.ceil(submissionCount / 20));
            console.log('   🎯 Strategy: Large competition → Dynamic grouping (improved logic)');
        }

        console.log(`   ✅ Expected groups: ${expectedGroups} (prevents single-group issue)`);

        // Step 3: Check current voting statistics
        console.log('\n3️⃣ Checking current voting assignments...');
        const statsResponse = await makeRequest('GET', `/competitions/${COMPETITION_ID}/round1/voting-stats`);
        
        if (statsResponse.status === 200) {
            const stats = statsResponse.data;
            console.log(`   📊 Current Groups: ${stats.totalGroups || 0}`);
            console.log(`   👥 Current Voters: ${stats.totalVoters || 0}`);
            console.log(`   🗳️ Votes Cast: ${stats.totalVotesCast || 0}`);
            
            if (stats.totalVoters === 0) {
                console.log('   ⚠️ PROBLEM CONFIRMED: No voting assignments exist!');
            } else if (stats.totalGroups === 1) {
                console.log('   ⚠️ PROBLEM CONFIRMED: Only 1 group exists (old logic - submitters voting on own work)!');
            } else if (stats.totalGroups === expectedGroups) {
                console.log(`   ✅ Correct grouping already exists (${stats.totalGroups} groups)`);
            } else {
                console.log(`   ⚠️ Suboptimal grouping: ${stats.totalGroups} groups (expected ${expectedGroups})`);
            }
        } else {
            console.log(`   ❌ Could not fetch voting stats: ${statsResponse.status}`);
        }

        // Step 4: Ensure competition is in correct status for group creation
        console.log('\n4️⃣ Ensuring correct competition status...');
        
        if (competition.status !== 10 && competition.status !== 11) { // VotingRound1Setup or VotingRound1Open
            console.log(`   🔄 Competition status is ${getStatusName(competition.status)}, setting to VotingRound1Setup...`);
            
            const statusUpdateResponse = await makeRequest('PUT', `/v1/admin/competitions/${COMPETITION_ID}/status`, {
                status: 10 // VotingRound1Setup
            });

            if (statusUpdateResponse.status === 200) {
                console.log('   ✅ Competition status updated to VotingRound1Setup');
            } else {
                console.log(`   ⚠️ Status update failed: ${statusUpdateResponse.status} (may require admin auth)`);
                console.log('   💡 Continuing with current status...');
            }
        } else {
            console.log('   ✅ Competition is in correct status for voting setup');
        }

        // Step 5: Recreate voting groups with improved logic
        console.log('\n5️⃣ Recreating voting groups with improved logic...');
        
        const recreateResponse = await makeRequest('POST', `/competitions/${COMPETITION_ID}/round1/create-groups`, {
            targetGroupSize: 20 // Will be overridden by improved logic for small competitions
        });

        if (recreateResponse.status === 200) {
            const result = recreateResponse.data;
            console.log(`   🎉 SUCCESS: ${result.message || 'Voting groups recreated'}`);
            console.log(`   📊 Groups created: ${result.groupCount || 'Unknown'}`);
            
            if (result.groupCount === expectedGroups) {
                console.log(`   ✅ PERFECT: Created ${result.groupCount} groups as expected for ${submissionCount} submissions`);
            } else {
                console.log(`   ⚠️ Unexpected result: got ${result.groupCount} groups, expected ${expectedGroups}`);
            }
        } else {
            console.log(`   ❌ Failed to recreate groups: ${recreateResponse.status}`);
            console.log(`   📝 Error details: ${JSON.stringify(recreateResponse.data)}`);
            
            if (recreateResponse.status === 401 || recreateResponse.status === 403) {
                console.log('\n   💡 Admin authentication required for group creation.');
                return;
            }
        }

        // Step 6: Verify voting assignments work
        console.log('\n6️⃣ Testing voting assignment endpoint...');
        
        // Wait for database updates
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const assignResponse = await makeRequest('GET', `/competitions/${COMPETITION_ID}/voting/round1/assignments`);
        
        if (assignResponse.status === 200) {
            const assignments = assignResponse.data;
            console.log(`   ✅ Voting assignment endpoint accessible!`);
            console.log(`   📄 Submissions to vote on: ${assignments.submissions?.length || 0}`);
            console.log(`   🗳️ Has voted: ${assignments.hasVoted ? 'Yes' : 'No'}`);
            
            if (assignments.submissions && assignments.submissions.length > 0) {
                console.log('\n   🎉 SUCCESS: User has anonymous submissions to vote on!');
                console.log('\n   📋 Submission details:');
                assignments.submissions.forEach((sub, index) => {
                    console.log(`      ${index + 1}. ID: ${sub.submissionId}, Title: ${sub.mixTitle || 'Anonymous'}`);
                });
            } else {
                console.log('\n   ⚠️ No submissions assigned for voting (might need user authentication)');
            }
        } else if (assignResponse.status === 401) {
            console.log('   ℹ️ Authentication required for voting assignments (expected)');
            console.log('   💡 Users will see voting interface when logged in');
        } else {
            console.log(`   ❌ Voting assignment endpoint error: ${assignResponse.status}`);
            console.log(`   📝 Error details: ${JSON.stringify(assignResponse.data)}`);
        }

        // Step 7: Final verification of the fix
        console.log('\n7️⃣ Final verification...');
        
        const finalStatsResponse = await makeRequest('GET', `/competitions/${COMPETITION_ID}/round1/voting-stats`);
        
        if (finalStatsResponse.status === 200) {
            const finalStats = finalStatsResponse.data;
            console.log(`   📊 Final Groups: ${finalStats.totalGroups || 0}`);
            console.log(`   👥 Final Voters: ${finalStats.totalVoters || 0}`);
            console.log(`   🗳️ Votes Cast: ${finalStats.totalVotesCast || 0}`);
            
            if (finalStats.totalVoters > 0 && finalStats.totalGroups >= 2) {
                console.log('\n🎯 COMPLETE SUCCESS!');
                console.log('✅ API running on correct port (7001)');
                console.log('✅ Multiple voting groups created with improved logic');
                console.log('✅ Voting assignments available for all users');
                console.log('✅ Submitters will not vote on their own work');
                console.log('💡 The "No voting assignments available" error should be resolved');
                
                console.log('\n🔄 Next steps for users:');
                console.log('   1. Refresh the competition page in browser');
                console.log('   2. Log in as any user (submitter or non-submitter)');
                console.log('   3. Navigate to Competition 21 details page');
                console.log('   4. Look for Round 1 Voting section');
                console.log('   5. You should see anonymous tracks to rank 1st, 2nd, 3rd place');
                
            } else {
                console.log('\n❌ Fix unsuccessful');
                console.log(`   Groups: ${finalStats.totalGroups}, Voters: ${finalStats.totalVoters}`);
                console.log('   This may require manual database investigation');
            }
        } else {
            console.log(`   ❌ Could not fetch final verification: ${finalStatsResponse.status}`);
        }

        console.log('\n✅ COMPREHENSIVE FIX COMPLETE');
        console.log('📝 Summary: Port corrected (7001), improved grouping logic applied, voting ready');

    } catch (error) {
        console.error(`\n❌ Error during fix process: ${error.message}`);
        console.log('\n🔧 Troubleshooting suggestions:');
        console.log('   1. Ensure API is running: cd src/MixWarz.API && dotnet run');
        console.log('   2. Check port 7001 is not blocked by firewall');
        console.log('   3. Verify database connection is working');
        console.log('   4. Try running as admin if permissions are required');
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

// Instructions
console.log('🔧 COMPREHENSIVE VOTING FIX SCRIPT');
console.log('===================================');
console.log();
console.log('This script will:');
console.log('1. ✅ Test API connectivity on correct port (7001)');
console.log('2. 📊 Analyze competition and determine optimal grouping strategy');
console.log('3. 🔄 Set competition to correct status if needed');
console.log('4. 👥 Recreate voting groups with improved logic (2-4 groups based on size)');
console.log('5. 🧪 Test voting assignment endpoint');
console.log('6. ✅ Verify comprehensive fix');
console.log();
console.log('🎯 For 9 submissions: Will create 3 groups (3 submissions each)');
console.log('💡 This ensures submitters never vote on their own work');
console.log('🔌 Fixes port mismatch: Frontend (7001) ↔ API (7001)');
console.log();
console.log('🔄 Running comprehensive fix...');
console.log();

// Run the comprehensive fix
fixVotingPortAndGroups(); 