// VOTING ASSIGNMENT DEBUGGING AND FIX SCRIPT
// Run this in browser console on the competition detail page to diagnose and fix voting issues

const COMPETITION_ID = 21; // "Where Lovers go" competition

// Helper function to get admin token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Helper function to get current user ID
const getCurrentUserId = () => {
    const token = getAuthToken();
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.userId || payload.nameid;
    } catch (error) {
        console.error('Error parsing token:', error);
        return null;
    }
};

// Debug function 1: Check competition status and submissions
const checkCompetitionStatus = async (competitionId) => {
    try {
        console.log(`🔍 STEP 1: Checking competition ${competitionId} status...`);
        
        const response = await fetch(`/api/competitions/${competitionId}`);
        const competition = await response.json();
        
        console.log(`📊 Competition Status: ${competition.status} (${competition.statusText || 'Unknown'})`);
        console.log(`📥 Total Submissions: ${competition.numberOfSubmissions || 0}`);
        console.log(`🗓️ Created: ${competition.createdAt}`);
        console.log(`⏰ Submission Deadline: ${competition.submissionDeadline}`);
        
        return competition;
    } catch (error) {
        console.error('❌ Error checking competition status:', error);
        return null;
    }
};

// Debug function 2: Check user's voting assignments
const checkUserVotingAssignments = async (competitionId) => {
    try {
        console.log(`\n🔍 STEP 2: Checking user voting assignments...`);
        
        const userId = getCurrentUserId();
        console.log(`👤 Current User ID: ${userId}`);
        
        if (!userId) {
            console.log('❌ No user ID found - user may not be properly authenticated');
            return null;
        }
        
        const token = getAuthToken();
        const response = await fetch(`/api/competitions/${competitionId}/voting/round1/assignments`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const assignments = await response.json();
            console.log(`✅ Assignment API Response:`, assignments);
            console.log(`📝 Assigned Submissions: ${assignments.submissions?.length || 0}`);
            console.log(`🗳️ Has Voted: ${assignments.hasVoted ? 'Yes' : 'No'}`);
            console.log(`⏰ Voting Deadline: ${assignments.votingDeadline}`);
            
            if (assignments.submissions && assignments.submissions.length > 0) {
                console.log('📄 Assigned Submissions:');
                assignments.submissions.forEach((sub, index) => {
                    console.log(`   ${index + 1}. ID: ${sub.submissionId} - "${sub.mixTitle}" by ${sub.userName}`);
                });
            }
            
            return assignments;
        } else {
            const error = await response.json();
            console.log(`❌ Assignment API Error (${response.status}):`, error);
            return null;
        }
    } catch (error) {
        console.error('❌ Error checking user voting assignments:', error);
        return null;
    }
};

// Debug function 3: Check voting status endpoint
const checkVotingStatus = async (competitionId) => {
    try {
        console.log(`\n🔍 STEP 3: Checking voting status...`);
        
        const token = getAuthToken();
        const response = await fetch(`/api/competitions/${competitionId}/voting/status`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const status = await response.json();
            console.log(`✅ Voting Status:`, status);
            console.log(`🏆 Competition Status: ${status.competitionStatus} - ${status.competitionStatusText}`);
            console.log(`👥 Has Round 1 Groups: ${status.hasRound1VotingGroups ? 'Yes' : 'No'}`);
            console.log(`🔢 Round 1 Group Count: ${status.round1GroupCount}`);
            console.log(`✔️ Setup Complete: ${status.votingSetupComplete ? 'Yes' : 'No'}`);
            console.log(`💬 Setup Message: ${status.setupMessage}`);
            
            return status;
        } else {
            const error = await response.json();
            console.log(`❌ Voting Status Error (${response.status}):`, error);
            return null;
        }
    } catch (error) {
        console.error('❌ Error checking voting status:', error);
        return null;
    }
};

// Fix function 1: Recreate voting groups and assignments
const recreateVotingAssignments = async (competitionId) => {
    try {
        console.log(`\n🔧 FIXING: Recreating voting groups and assignments...`);
        
        const token = getAuthToken();
        
        // First, create/recreate voting groups
        console.log('📝 Step 1: Creating voting groups...');
        const groupsResponse = await fetch(`/api/competitions/${competitionId}/round1/create-groups`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetGroupSize: 20 })
        });
        
        if (groupsResponse.ok) {
            const groupsResult = await groupsResponse.json();
            console.log(`✅ Groups created: ${groupsResult.message}`);
        } else {
            const groupsError = await groupsResponse.json();
            console.log(`❌ Failed to create groups: ${groupsError.message}`);
            return false;
        }
        
        // Wait a moment for the database to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify the fix worked
        console.log('🔍 Verifying fix...');
        const verifyAssignments = await checkUserVotingAssignments(competitionId);
        
        if (verifyAssignments && verifyAssignments.submissions && verifyAssignments.submissions.length > 0) {
            console.log('🎉 SUCCESS! Voting assignments are now available.');
            return true;
        } else {
            console.log('❌ Fix unsuccessful - assignments still empty.');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error recreating voting assignments:', error);
        return false;
    }
};

// Fix function 2: Force refresh the frontend voting state
const refreshVotingState = () => {
    console.log('\n🔄 Refreshing frontend voting state...');
    
    // Dispatch actions to clear and reload voting state
    if (window.store) {
        // Clear voting state
        window.store.dispatch({ type: 'voting/resetVotingState' });
        
        // Wait a moment then reload
        setTimeout(() => {
            window.store.dispatch({
                type: 'voting/fetchRound1VotingAssignments',
                payload: COMPETITION_ID
            });
            console.log('✅ Frontend state refreshed');
        }, 500);
    } else {
        console.log('⚠️ Redux store not accessible, try refreshing the page');
    }
};

// Main diagnostic and fix function
const diagnoseAndFixVotingIssue = async (competitionId = COMPETITION_ID) => {
    console.log('🚀 VOTING ASSIGNMENT DIAGNOSTIC AND FIX TOOL');
    console.log('=' .repeat(60));
    console.log(`🎯 Target Competition: ${competitionId}`);
    console.log(`👤 Current User: ${getCurrentUserId() || 'Not found'}`);
    console.log(`🔑 Auth Token: ${getAuthToken() ? 'Present' : 'Missing'}`);
    
    // Step 1: Check competition
    const competition = await checkCompetitionStatus(competitionId);
    if (!competition) {
        console.log('❌ ABORT: Cannot proceed without competition data');
        return;
    }
    
    // Step 2: Check current assignments
    const assignments = await checkUserVotingAssignments(competitionId);
    
    // Step 3: Check voting status
    const votingStatus = await checkVotingStatus(competitionId);
    
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('=' .repeat(40));
    
    const hasAssignments = assignments && assignments.submissions && assignments.submissions.length > 0;
    const hasGroups = votingStatus && votingStatus.hasRound1VotingGroups;
    const isCorrectStatus = competition.status === 11; // VotingRound1Open
    
    console.log(`✔️ Competition Found: ${competition ? 'Yes' : 'No'}`);
    console.log(`✔️ Correct Status (VotingRound1Open): ${isCorrectStatus ? 'Yes' : 'No'}`);
    console.log(`✔️ Has Voting Groups: ${hasGroups ? 'Yes' : 'No'}`);
    console.log(`✔️ User Has Assignments: ${hasAssignments ? 'Yes' : 'No'}`);
    
    if (hasAssignments) {
        console.log('\n🎉 DIAGNOSIS: Voting assignments are working correctly!');
        console.log('💡 If you\'re still seeing "No voting assignments available", try refreshing the page.');
        return;
    }
    
    console.log('\n🔧 DIAGNOSIS: Voting assignments missing - attempting fix...');
    
    if (!isCorrectStatus) {
        console.log('⚠️ Competition status issue - may need admin intervention');
    }
    
    if (!hasGroups || !hasAssignments) {
        console.log('🛠️ Attempting to recreate voting assignments...');
        const fixSuccess = await recreateVotingAssignments(competitionId);
        
        if (fixSuccess) {
            console.log('\n🎉 FIX SUCCESSFUL!');
            console.log('📝 Next steps:');
            console.log('   1. Refresh the competition page');
            console.log('   2. Look for the Round 1 Voting section');
            console.log('   3. You should now see anonymous submissions to vote on');
            
            // Also refresh frontend state
            refreshVotingState();
        } else {
            console.log('\n❌ FIX UNSUCCESSFUL');
            console.log('🔍 Possible issues:');
            console.log('   1. User permissions - ensure you\'re logged in as a participant');
            console.log('   2. Competition status - may need admin to set correct status');
            console.log('   3. Database constraints - may need admin intervention');
            console.log('   4. No eligible submissions for voting groups');
        }
    }
    
    console.log('\n📞 If issues persist, contact admin with this diagnostic output.');
};

// Quick fix function
const quickFix = async (competitionId = COMPETITION_ID) => {
    console.log('⚡ QUICK FIX: Recreating voting assignments...');
    const success = await recreateVotingAssignments(competitionId);
    if (success) {
        refreshVotingState();
        console.log('✅ Quick fix completed - refresh the page to see results');
    } else {
        console.log('❌ Quick fix failed - run full diagnosis: diagnoseAndFixVotingIssue()');
    }
};

// Export functions for manual use
window.votingDebug = {
    diagnoseAndFixVotingIssue,
    quickFix,
    checkCompetitionStatus,
    checkUserVotingAssignments,
    checkVotingStatus,
    recreateVotingAssignments,
    refreshVotingState
};

console.log(`
🎯 VOTING ASSIGNMENT DEBUG TOOL LOADED

Quick Commands:
- diagnoseAndFixVotingIssue()     // Full diagnostic and auto-fix
- quickFix()                      // Just try to recreate assignments
- checkUserVotingAssignments(21)  // Check your current assignments

Manual Commands:
- votingDebug.checkCompetitionStatus(21)
- votingDebug.checkVotingStatus(21)
- votingDebug.recreateVotingAssignments(21)

📝 Start with: diagnoseAndFixVotingIssue()
`);

// Auto-run the diagnosis if competition page is loaded
if (window.location.pathname.includes('/competitions/')) {
    console.log('\n🔄 Auto-running diagnosis in 2 seconds...');
    setTimeout(() => {
        diagnoseAndFixVotingIssue();
    }, 2000);
}

// Debug script to check voting assignments
const apiUrl = 'https://localhost:7141/api';

// Check competition status and voting data
async function debugVotingAssignments() {
    const competitionId = 21; // From the screenshot URL
    
    console.log('🔍 DEBUGGING VOTING ASSIGNMENTS');
    console.log('================================');
    
    try {
        // 1. Check competition status
        console.log('\n1. Competition Status:');
        const compResponse = await fetch(`${apiUrl}/competitions/${competitionId}`);
        if (compResponse.ok) {
            const competition = await compResponse.json();
            console.log(`   Competition: ${competition.title}`);
            console.log(`   Status: ${competition.status} (${getStatusName(competition.status)})`);
            console.log(`   Submissions: ${competition.submissionCount || 'Unknown'}`);
        } else {
            console.log(`   ❌ Error fetching competition: ${compResponse.status}`);
        }
        
        // 2. Check voting groups
        console.log('\n2. Voting Groups:');
        const groupsResponse = await fetch(`${apiUrl}/competitions/${competitionId}/round1/voting-stats`);
        if (groupsResponse.ok) {
            const stats = await groupsResponse.json();
            console.log(`   Total Groups: ${stats.totalGroups || 0}`);
            console.log(`   Total Voters: ${stats.totalVoters || 0}`);
            console.log(`   Votes Cast: ${stats.totalVotesCast || 0}`);
            console.log(`   Voting Complete: ${stats.votingComplete || false}`);
        } else {
            console.log(`   ❌ Error fetching voting stats: ${groupsResponse.status}`);
        }
        
        // 3. Try to get voting assignments (this will likely fail)
        console.log('\n3. Voting Assignments Test:');
        const assignmentsResponse = await fetch(`${apiUrl}/competitions/${competitionId}/voting/round1/assignments`, {
            headers: {
                'Authorization': 'Bearer fake-token-for-testing'
            }
        });
        
        if (assignmentsResponse.ok) {
            const assignments = await assignmentsResponse.json();
            console.log(`   ✅ Assignments retrieved: ${assignments.submissions?.length || 0} submissions`);
        } else {
            console.log(`   ❌ Assignments failed: ${assignmentsResponse.status}`);
            if (assignmentsResponse.status === 401) {
                console.log('   📝 Need authentication - this is expected');
            }
        }
        
        // 4. Check admin endpoints for more data
        console.log('\n4. Admin Data Check:');
        try {
            const adminStatsResponse = await fetch(`${apiUrl}/v1/admin/competitions/monitoring`);
            if (adminStatsResponse.ok) {
                const adminStats = await adminStatsResponse.json();
                const comp21 = adminStats.find(c => c.competitionId === competitionId);
                if (comp21) {
                    console.log(`   Admin View - Submissions: ${comp21.submissionCount}`);
                    console.log(`   Admin View - Status: ${comp21.status}`);
                }
            }
        } catch (e) {
            console.log('   ⚠️ Admin endpoints not accessible (expected)');
        }
        
    } catch (error) {
        console.log(`❌ Debug failed: ${error.message}`);
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

debugVotingAssignments(); 