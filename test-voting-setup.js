// Test script to help fix voting setup for competitions
// Run this in browser console on the admin page

// ========================================
// TESTING SETUP GUIDE FOR VOTING
// ========================================

// 1. Check competitions and their submission counts
const checkCompetitions = async () => {
    try {
        const response = await fetch('/api/v1/admin/competitions');
        const data = await response.json();
        
        console.log('=== ALL COMPETITIONS STATUS ===');
        
        data.forEach(comp => {
            const statusName = getStatusName(comp.status);
            console.log(`ID: ${comp.competitionId} | Title: "${comp.title}" | Status: ${comp.status} (${statusName}) | Submissions: ${comp.submissionCount || 0}`);
        });
        
        console.log('\n=== COMPETITIONS READY FOR VOTING SETUP ===');
        const readyCompetitions = data.filter(comp => 
            (comp.submissionCount && comp.submissionCount > 0) && 
            (comp.status === 1 || comp.status === 2 || comp.status === 10)
        );
        
        if (readyCompetitions.length === 0) {
            console.log('❌ No competitions found with submissions ready for voting setup');
            console.log('💡 You need competitions with status 1 (OpenForSubmissions) or 2 (InJudging) that have submissions');
        } else {
            readyCompetitions.forEach(comp => {
                console.log(`✅ ID: ${comp.competitionId} - "${comp.title}" (${comp.submissionCount} submissions)`);
            });
        }
        
        return { allCompetitions: data, readyCompetitions };
    } catch (error) {
        console.error('Error fetching competitions:', error);
    }
};

// Helper function to get status names
const getStatusName = (status) => {
    const statusMap = {
        0: "Upcoming",
        1: "OpenForSubmissions", 
        2: "InJudging",
        10: "VotingRound1Setup",
        11: "VotingRound1Open",
        12: "VotingRound1Tallying",
        20: "VotingRound2Setup",
        21: "VotingRound2Open",
        22: "VotingRound2Tallying",
        25: "RequiresManualWinnerSelection",
        30: "Completed"
    };
    return statusMap[status] || "Unknown";
};

// 2. Check if a competition has submissions
const checkSubmissions = async (competitionId) => {
    try {
        const response = await fetch(`/api/competitions/${competitionId}/submissions`);
        if (response.ok) {
            const submissions = await response.json();
            console.log(`Competition ${competitionId} has ${submissions.length} submissions:`);
            submissions.forEach((sub, index) => {
                console.log(`  ${index + 1}. "${sub.mixTitle}" by ${sub.userName}`);
            });
            return submissions;
        } else {
            console.log(`❌ Could not fetch submissions for competition ${competitionId}`);
            return [];
        }
    } catch (error) {
        console.error('Error checking submissions:', error);
        return [];
    }
};

// 3. Create voting groups for a specific competition
const createVotingGroups = async (competitionId) => {
    try {
        const response = await fetch(`/api/competitions/${competitionId}/round1/create-groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ targetGroupSize: 20 })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log(`✅ Voting groups created: ${result.message}`);
        } else {
            console.log(`❌ Failed to create voting groups: ${result.message}`);
        }
        
        return result;
    } catch (error) {
        console.error('Error creating voting groups:', error);
        return { success: false, message: error.message };
    }
};

// 4. Set competition status to VotingRound1Open
const setVotingStatus = async (competitionId) => {
    try {
        const response = await fetch(`/api/competitions/${competitionId}/round1/update-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ newStatus: 11 }) // VotingRound1Open
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log(`✅ Competition status updated: ${result.message}`);
        } else {
            console.log(`❌ Failed to update status: ${result.message}`);
        }
        
        return result;
    } catch (error) {
        console.error('Error updating competition status:', error);
        return { success: false, message: error.message };
    }
};

// 5. Check voting status and setup
const checkVotingStatus = async (competitionId) => {
    try {
        const response = await fetch(`/api/competitions/${competitionId}/voting/status`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`📊 Competition ${competitionId} Voting Status:`);
            console.log(`   Status: ${result.competitionStatus} (${getStatusName(result.competitionStatus)})`);
            console.log(`   Has Round 1 Groups: ${result.hasRound1VotingGroups ? '✅' : '❌'}`);
            console.log(`   Group Count: ${result.round1GroupCount}`);
            console.log(`   Setup Complete: ${result.votingSetupComplete ? '✅' : '❌'}`);
            console.log(`   Message: ${result.setupMessage}`);
            return result;
        } else {
            const error = await response.json();
            console.log(`❌ Error checking voting status: ${error.message}`);
            return null;
        }
    } catch (error) {
        console.error('Error checking voting status:', error);
        return null;
    }
};

// 6. Test if voting endpoints work
const testVotingEndpoints = async (competitionId) => {
    try {
        console.log(`🧪 Testing voting endpoints for competition ${competitionId}...`);
        
        const response = await fetch(`/api/competitions/${competitionId}/voting/round1/assignments`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Voting endpoint working! User has ${result.submissions.length} submissions to vote on`);
            console.log(`   Has already voted: ${result.hasVoted ? 'Yes' : 'No'}`);
            console.log(`   Voting deadline: ${result.votingDeadline}`);
            
            if (result.submissions.length > 0) {
                console.log('   Submissions to vote on:');
                result.submissions.forEach((sub, index) => {
                    console.log(`     ${index + 1}. Submission ID: ${sub.submissionId} (Anonymous)`);
                });
            }
            
            return result;
        } else {
            const error = await response.json();
            console.log(`❌ Voting endpoint failed: ${error.message}`);
            return null;
        }
    } catch (error) {
        console.error('Error testing voting endpoints:', error);
        return null;
    }
};

// 7. COMPLETE SETUP PROCESS FOR TESTING
const setupVotingForTesting = async (competitionId) => {
    console.log(`\n🚀 SETTING UP COMPETITION ${competitionId} FOR VOTING TESTING`);
    console.log('=' .repeat(60));
    
    // Step 1: Check if competition has submissions
    console.log('\n📋 Step 1: Checking submissions...');
    const submissions = await checkSubmissions(competitionId);
    
    if (submissions.length === 0) {
        console.log('❌ SETUP FAILED: Competition has no submissions!');
        console.log('💡 Add some test submissions first, then try again.');
        return false;
    }
    
    console.log(`✅ Found ${submissions.length} submissions - good to proceed!`);
    
    // Step 2: Create voting groups
    console.log('\n🏗️  Step 2: Creating voting groups...');
    const groupsResult = await createVotingGroups(competitionId);
    
    if (!groupsResult.success) {
        console.log('❌ SETUP FAILED: Could not create voting groups!');
        return false;
    }
    
    // Step 3: Set status to VotingRound1Open
    console.log('\n⚙️  Step 3: Setting status to VotingRound1Open...');
    const statusResult = await setVotingStatus(competitionId);
    
    if (!statusResult.success) {
        console.log('❌ SETUP FAILED: Could not update competition status!');
        return false;
    }
    
    // Step 4: Verify complete setup
    console.log('\n🔍 Step 4: Verifying voting setup...');
    const votingStatus = await checkVotingStatus(competitionId);
    
    if (!votingStatus || !votingStatus.votingSetupComplete) {
        console.log('❌ SETUP INCOMPLETE: Voting setup verification failed!');
        return false;
    }
    
    // Step 5: Test voting endpoints
    console.log('\n🧪 Step 5: Testing voting endpoints...');
    const votingTest = await testVotingEndpoints(competitionId);
    
    if (!votingTest) {
        console.log('❌ SETUP INCOMPLETE: Voting endpoints not working!');
        return false;
    }
    
    // Success!
    console.log('\n🎉 VOTING SETUP COMPLETE!');
    console.log('=' .repeat(60));
    console.log('✅ Competition is now in "Round 1 Voting in Progress" status');
    console.log('✅ Users will see anonymous submissions to judge');
    console.log('✅ Voting interface should appear on competition detail page');
    console.log('\n📍 Next steps for testing:');
    console.log('   1. Navigate to the competition detail page');
    console.log('   2. Look for "VotingRound1Card" component');
    console.log('   3. Verify anonymous submissions are displayed');
    console.log('   4. Test ranking (1st, 2nd, 3rd place) functionality');
    console.log('   5. Submit test votes');
    
    return true;
};

// 8. Quick status check for a competition
const quickCheck = async (competitionId) => {
    console.log(`\n🔍 QUICK STATUS CHECK - Competition ${competitionId}`);
    console.log('-' .repeat(50));
    
    const submissions = await checkSubmissions(competitionId);
    const votingStatus = await checkVotingStatus(competitionId);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Submissions: ${submissions.length}`);
    console.log(`   Status: ${votingStatus ? getStatusName(votingStatus.competitionStatus) : 'Unknown'}`);
    console.log(`   Ready for Voting: ${votingStatus?.votingSetupComplete ? '✅ Yes' : '❌ No'}`);
    
    if (votingStatus?.votingSetupComplete) {
        console.log('\n🎯 This competition is ready for voting testing!');
        await testVotingEndpoints(competitionId);
    }
};

// USAGE INSTRUCTIONS
console.log(`
🎯 VOTING TESTING SETUP GUIDE
==============================

1. CHECK ALL COMPETITIONS:
   await checkCompetitions();

2. QUICK CHECK A SPECIFIC COMPETITION:
   await quickCheck(COMPETITION_ID);

3. COMPLETE SETUP FOR TESTING (recommended):
   await setupVotingForTesting(COMPETITION_ID);

4. MANUAL STEPS (if needed):
   await checkSubmissions(COMPETITION_ID);
   await createVotingGroups(COMPETITION_ID);
   await setVotingStatus(COMPETITION_ID);
   await checkVotingStatus(COMPETITION_ID);
   await testVotingEndpoints(COMPETITION_ID);

📝 Example: await setupVotingForTesting(21);
`); 

// Replace 21 with your competition ID 

// 1. First, check what competitions you have:
fetch('/api/v1/admin/competitions').then(r=>r.json()).then(d=>console.log(d.map(c=>`ID:${c.competitionId} "${c.title}" Status:${c.status} Submissions:${c.submissionCount||0}`))) 

// Test script to recreate voting groups with the new logic
const https = require('https');

// Disable SSL verification for localhost development
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 7141,
            path: path,
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    data: responseData
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testVotingSetup() {
    const competitionId = 21;
    
    console.log('🧪 TESTING VOTING SETUP AND ASSIGNMENT SYSTEM');
    console.log('==============================================');
    console.log(`Competition ID: ${competitionId}`);
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ Authentication required. Please log in first.');
        return;
    }
    
    console.log('✅ User authenticated\n');
    
    try {
        // 1. Check competition status first
        console.log('📊 Step 1: Checking competition status...');
        const compResponse = await makeRequest(`/api/competitions/${competitionId}`);
        
        if (!compResponse.ok) {
            console.log(`❌ Failed to fetch competition: ${compResponse.status}`);
            return;
        }
        
        const competition = JSON.parse(compResponse.data);
        console.log(`   Title: ${competition.title}`);
        console.log(`   Status: ${competition.status} (${getStatusName(competition.status)})`);
        console.log(`   Submissions: ${competition.submissionCount || 'Unknown'}`);
        
        // 2. Check current voting assignments
        console.log('\n🔍 Step 2: Testing current voting assignments...');
        const assignResponse = await makeRequest(`/api/competitions/${competitionId}/voting/round1/assignments`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        let currentAssignments = null;
        if (assignResponse.ok) {
            currentAssignments = await assignResponse.json();
            console.log(`   ✅ Assignment endpoint accessible`);
            console.log(`   📄 Current assignments: ${currentAssignments.submissions?.length || 0} submissions`);
            console.log(`   🗳️ Has voted: ${currentAssignments.hasVoted ? 'Yes' : 'No'}`);
        } else {
            const error = await assignResponse.json();
            console.log(`   ❌ Assignment endpoint error: ${assignResponse.status}`);
            console.log(`   📝 Details: ${error.message || JSON.stringify(error)}`);
        }
        
        // 3. Check voting statistics
        console.log('\n📈 Step 3: Checking voting statistics...');
        const statsResponse = await makeRequest(`/api/competitions/${competitionId}/round1/voting-stats`);
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log(`   📊 Total Groups: ${stats.totalGroups || 0}`);
            console.log(`   👥 Total Voters: ${stats.totalVoters || 0}`);
            console.log(`   🗳️ Total Votes Cast: ${stats.totalVotesCast || 0}`);
            console.log(`   ✔️ Voting Complete: ${stats.votingComplete ? 'Yes' : 'No'}`);
            
            // Identify the problem
            if (stats.totalVoters === 0) {
                console.log('\n⚠️ PROBLEM IDENTIFIED: No voters assigned!');
                console.log('   This explains the "No voting assignments available" error.');
            } else if (!currentAssignments || currentAssignments.submissions?.length === 0) {
                console.log('\n⚠️ PROBLEM IDENTIFIED: User has no voting assignments!');
                console.log('   Voting groups exist but user is not assigned to any.');
            }
        } else {
            console.log(`   ❌ Stats endpoint error: ${statsResponse.status}`);
        }
        
        // 4. Attempt to fix the issue by recreating voting groups
        console.log('\n🔧 Step 4: Recreating voting groups and assignments...');
        console.log('   This will create assignments for ALL registered users...');
        
        const recreateResponse = await makeRequest(
            `/api/competitions/${competitionId}/round1/create-groups`,
            'POST',
            { targetGroupSize: 20 }
        );
        
        if (recreateResponse.status === 200) {
            const result = JSON.parse(recreateResponse.data);
            console.log(`   🎉 SUCCESS: ${result.message || 'Groups recreated successfully'}`);
            console.log(`   📊 Groups created: ${result.groupCount || 'Unknown'}`);
            console.log(`   💡 All registered users should now have voting assignments`);
        } else {
            const error = JSON.parse(recreateResponse.data);
            console.log(`   ❌ Recreation failed: ${recreateResponse.status}`);
            console.log(`   📝 Error: ${error.message || JSON.stringify(error)}`);
            
            if (recreateResponse.status === 403) {
                console.log('   💡 Admin permissions required for this operation');
            }
        }
        
        // 5. Verify the fix worked
        console.log('\n✅ Step 5: Verifying the fix...');
        
        // Wait a moment for database updates
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check assignments again
        const verifyResponse = await makeRequest(`/api/competitions/${competitionId}/voting/round1/assignments`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (verifyResponse.ok) {
            const newAssignments = await verifyResponse.json();
            console.log(`   📄 New assignments: ${newAssignments.submissions?.length || 0} submissions`);
            
            if (newAssignments.submissions && newAssignments.submissions.length > 0) {
                console.log('\n🎉 FIX SUCCESSFUL!');
                console.log('✅ User now has voting assignments available');
                console.log('💡 The "No voting assignments available" error should be resolved');
                console.log('\n🔄 Next steps:');
                console.log('   1. Refresh the competition page');
                console.log('   2. Look for Round 1 Voting section');
                console.log('   3. You should see anonymous tracks to vote on');
                
                // Show sample assignment
                console.log('\n📋 Sample voting assignment:');
                const sample = newAssignments.submissions[0];
                console.log(`   - Submission ID: ${sample.submissionId}`);
                console.log(`   - Mix Title: ${sample.mixTitle || 'Anonymous'}`);
                console.log(`   - Duration: ${sample.duration || 'Unknown'}`);
            } else {
                console.log('\n❌ Fix unsuccessful');
                console.log('   Assignments are still empty after recreation');
                console.log('   This may require backend investigation');
            }
        } else {
            console.log(`   ❌ Verification failed: ${verifyResponse.status}`);
        }
        
        // 6. Check updated statistics
        console.log('\n📊 Step 6: Final statistics check...');
        const finalStatsResponse = await makeRequest(`/api/competitions/${competitionId}/round1/voting-stats`);
        
        if (finalStatsResponse.ok) {
            const finalStats = await finalStatsResponse.json();
            console.log(`   👥 Total Voters: ${finalStats.totalVoters || 0}`);
            console.log(`   📊 Total Groups: ${finalStats.totalGroups || 0}`);
            console.log(`   🗳️ Votes Cast: ${finalStats.totalVotesCast || 0}`);
            
            if (finalStats.totalVoters > 0) {
                console.log('\n✅ Voting system is now operational!');
            }
        }
        
        console.log('\n🎯 TEST COMPLETE');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        console.log('\n🔧 Troubleshooting suggestions:');
        console.log('   1. Ensure you are logged in with proper permissions');
        console.log('   2. Check that the API is running and accessible');
        console.log('   3. Verify the competition has eligible submissions');
        console.log('   4. Try running as an admin user if permissions are an issue');
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

// Instructions for running
console.log('🚀 VOTING SETUP TEST LOADED');
console.log('');
console.log('To run the test:');
console.log('1. Make sure you are on the competition page (localhost:3000/competitions/21)');
console.log('2. Ensure you are logged in (check localStorage for token)');
console.log('3. Run: testVotingSetup()');
console.log('');
console.log('This test will:');
console.log('- Check current voting assignments');
console.log('- Identify why "No voting assignments available" appears');
console.log('- Recreate voting groups to include ALL users');
console.log('- Verify the fix worked');
console.log('');

// Auto-detect if we're on the right page
if (typeof window !== 'undefined' && window.location?.pathname?.includes('/competitions/21')) {
    console.log('✅ Competition 21 page detected');
    console.log('💡 Ready to run: testVotingSetup()');
} 