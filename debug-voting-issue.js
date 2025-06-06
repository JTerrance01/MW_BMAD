// Debug script to check voting assignments issue
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

async function debugVotingIssue() {
    console.log('🔍 DEBUGGING VOTING ASSIGNMENT ISSUE - IMPROVED GROUPING');
    console.log('========================================================');
    console.log(`Competition ID: ${COMPETITION_ID}`);
    console.log();

    try {
        // Step 1: Check competition status and submission count
        console.log('1️⃣ Checking competition status and submissions...');
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
            console.log('\n   ❌ ERROR: No submissions found!');
            console.log('   💡 Need submissions before creating voting groups.');
            return;
        }

        const submissionCount = competition.submissionCount;
        console.log(`\n   📊 GROUPING ANALYSIS for ${submissionCount} submissions:`);
        
        // Analyze what grouping strategy will be used
        if (submissionCount <= 6) {
            console.log('   🎯 Strategy: Very small competition → 2 groups');
        } else if (submissionCount <= 12) {
            console.log('   🎯 Strategy: Small competition → 3 groups');
        } else if (submissionCount <= 20) {
            console.log('   🎯 Strategy: Medium competition → 4 groups');
        } else {
            console.log('   🎯 Strategy: Large competition → Dynamic grouping');
        }

        // Step 2: Check current voting statistics
        console.log('\n2️⃣ Checking current voting assignments...');
        const statsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
        
        if (statsResponse.status === 200) {
            const stats = statsResponse.data;
            console.log(`   📊 Current Groups: ${stats.totalGroups || 0}`);
            console.log(`   👥 Current Voters: ${stats.totalVoters || 0}`);
            console.log(`   🗳️ Votes Cast: ${stats.totalVotesCast || 0}`);
            console.log(`   ✔️ Voting Complete: ${stats.votingComplete || false}`);
            
            if (stats.totalVoters === 0) {
                console.log('   ⚠️ PROBLEM CONFIRMED: No voting assignments exist!');
            } else if (stats.totalGroups === 1) {
                console.log('   ⚠️ PROBLEM IDENTIFIED: Only 1 group exists (submitters voting on own work)!');
            } else {
                console.log(`   ✅ Multiple groups exist (${stats.totalGroups}), checking if assignments work...`);
            }
        } else {
            console.log(`   ❌ Could not fetch voting stats: ${statsResponse.status}`);
        }

        // Step 3: Test voting assignment endpoint directly
        console.log('\n3️⃣ Testing voting assignment endpoint...');
        const assignResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/voting/round1/assignments`);
        
        if (assignResponse.status === 200) {
            const assignments = assignResponse.data;
            console.log(`   ✅ Assignment endpoint accessible`);
            console.log(`   📄 Submissions to vote on: ${assignments.submissions?.length || 0}`);
            console.log(`   🗳️ Has voted: ${assignments.hasVoted ? 'Yes' : 'No'}`);
            
            if (assignments.submissions && assignments.submissions.length > 0) {
                console.log('   🎉 SUCCESS: User has voting assignments!');
                console.log('\n   📋 Submission details:');
                assignments.submissions.forEach((sub, index) => {
                    console.log(`      ${index + 1}. ID: ${sub.submissionId}, Title: ${sub.mixTitle || 'Anonymous'}`);
                });
                return; // Issue is resolved
            } else {
                console.log('   ❌ ISSUE: User has no submissions to vote on');
            }
        } else if (assignResponse.status === 401) {
            console.log('   ⚠️ Authentication required (user not logged in)');
            console.log('   💡 This might be normal - test from logged-in browser');
        } else {
            console.log(`   ❌ Assignment endpoint error: ${assignResponse.status}`);
            console.log(`   📝 Details: ${JSON.stringify(assignResponse.data)}`);
        }

        // Step 4: Re-create voting groups with improved logic
        console.log('\n4️⃣ Re-creating voting groups with improved logic...');
        
        const recreateResponse = await makeRequest('POST', `/api/competitions/${COMPETITION_ID}/round1/create-groups`, {
            targetGroupSize: 20 // This will be overridden by the new logic for small competitions
        });

        if (recreateResponse.status === 200) {
            const result = recreateResponse.data;
            console.log(`   🎉 SUCCESS: ${result.message || 'Voting groups recreated'}`);
            console.log(`   📊 Groups created: ${result.groupCount || 'Unknown'}`);
            
            // For 9 submissions, we expect 3 groups (small competition logic)
            const expectedGroups = submissionCount <= 6 ? 2 : submissionCount <= 12 ? 3 : 4;
            if (result.groupCount === expectedGroups) {
                console.log(`   ✅ Correct grouping: ${result.groupCount} groups as expected for ${submissionCount} submissions`);
            } else {
                console.log(`   ⚠️ Unexpected grouping: got ${result.groupCount} groups, expected ${expectedGroups}`);
            }
        } else {
            console.log(`   ❌ Failed to recreate groups: ${recreateResponse.status}`);
            console.log(`   📝 Error: ${JSON.stringify(recreateResponse.data)}`);
            
            if (recreateResponse.status === 401 || recreateResponse.status === 403) {
                console.log('\n   💡 Admin authentication required. Try:');
                console.log('   1. Log in to admin interface');
                console.log('   2. Get admin token from localStorage');
                console.log('   3. Run fix-voting-assignments-admin.js with token');
                return;
            }
        }

        // Step 5: Verify the fix worked
        console.log('\n5️⃣ Verifying improved fix...');
        
        // Wait for database updates
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const verifyStatsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
        
        if (verifyStatsResponse.status === 200) {
            const newStats = verifyStatsResponse.data;
            console.log(`   📊 New Groups: ${newStats.totalGroups || 0}`);
            console.log(`   👥 New Voters: ${newStats.totalVoters || 0}`);
            console.log(`   🗳️ Votes Cast: ${newStats.totalVotesCast || 0}`);
            
            if (newStats.totalVoters > 0 && newStats.totalGroups > 1) {
                console.log('\n🎉 FIX SUCCESSFUL!');
                console.log('✅ Multiple groups created with voter assignments');
                console.log('✅ Users should no longer vote on their own submissions');
                console.log('💡 The "No voting assignments available" error should be resolved');
                
                // Test the voting endpoint again
                console.log('\n6️⃣ Re-testing voting assignment endpoint...');
                const finalTestResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/voting/round1/assignments`);
                
                if (finalTestResponse.status === 200) {
                    const finalAssignments = finalTestResponse.data;
                    console.log(`   ✅ Final test successful!`);
                    console.log(`   📄 Submissions to vote on: ${finalAssignments.submissions?.length || 0}`);
                    
                    if (finalAssignments.submissions && finalAssignments.submissions.length > 0) {
                        console.log('\n🎯 COMPLETE SUCCESS!');
                        console.log('All systems working - users can now vote on anonymous tracks!');
                    }
                } else {
                    console.log(`   ⚠️ Final test inconclusive: ${finalTestResponse.status}`);
                    console.log('   📝 This might require user authentication to test properly');
                }
                
            } else {
                console.log('\n❌ Fix unsuccessful');
                console.log(`   Groups: ${newStats.totalGroups}, Voters: ${newStats.totalVoters}`);
                console.log('   This may require manual database investigation');
            }
        } else {
            console.log(`   ❌ Could not verify fix: ${verifyStatsResponse.status}`);
        }

        console.log('\n✅ DEBUGGING COMPLETE');
        console.log('\n🔄 Next steps:');
        console.log('   1. Refresh competition page in browser');
        console.log('   2. Log in as a user (who did or did not submit)');
        console.log('   3. Check if Round 1 Voting section shows anonymous tracks');
        console.log('   4. Verify users can rank submissions 1st, 2nd, 3rd place');

    } catch (error) {
        console.error(`\n❌ Error during debugging: ${error.message}`);
        console.log('\n🔧 Troubleshooting suggestions:');
        console.log('   1. Ensure API is running on https://localhost:7141');
        console.log('   2. Check database connectivity');
        console.log('   3. Verify competition has eligible submissions');
        console.log('   4. Try running as admin if permissions required');
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
console.log('🔍 VOTING ASSIGNMENT DEBUGGING SCRIPT');
console.log('=====================================');
console.log();
console.log('This script will:');
console.log('1. Analyze the current competition and submission count');
console.log('2. Determine the optimal grouping strategy for the competition size');
console.log('3. Test current voting assignments');
console.log('4. Re-create groups with improved logic (prevents single-group issue)');
console.log('5. Verify the fix resolved the "No voting assignments available" error');
console.log();
console.log('🎯 For 9 submissions: Will create 3 groups (3 submissions each)');
console.log('💡 This ensures submitters never vote on their own work');
console.log();
console.log('🔄 Running debug process...');
console.log();

// Run the debugging
debugVotingIssue(); 