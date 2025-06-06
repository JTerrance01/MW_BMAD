// VOTING SETUP SCRIPT - PART 2
// Paste this after Part 1

const setVotingStatus = async (competitionId) => {
    try {
        const response = await fetch(`/api/competitions/${competitionId}/round1/update-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ newStatus: 11 })
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

const checkVotingStatus = async (competitionId) => {
    try {
        const response = await fetch(`/api/competitions/${competitionId}/voting/status`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const result = await response.json();
            console.log(`📊 Competition ${competitionId} Voting Status:`);
            console.log(`   Status: ${result.competitionStatus} (${getStatusName(result.competitionStatus)})`);
            console.log(`   Has Round 1 Groups: ${result.hasRound1VotingGroups ? '✅' : '❌'}`);
            console.log(`   Setup Complete: ${result.votingSetupComplete ? '✅' : '❌'}`);
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

// QUICK SETUP FUNCTION
const setupVotingQuick = async (competitionId) => {
    console.log(`🚀 SETTING UP VOTING FOR COMPETITION ${competitionId}`);
    
    const groupsResult = await createVotingGroups(competitionId);
    if (!groupsResult.success) {
        console.log('❌ Failed to create voting groups');
        return false;
    }
    
    const statusResult = await setVotingStatus(competitionId);
    if (!statusResult.success) {
        console.log('❌ Failed to update status');
        return false;
    }
    
    const votingStatus = await checkVotingStatus(competitionId);
    if (votingStatus?.votingSetupComplete) {
        console.log('🎉 VOTING SETUP COMPLETE!');
        console.log('✅ Competition is now in "Round 1 Voting in Progress" status');
        return true;
    }
    
    return false;
};

console.log(`
🎯 VOTING SETUP READY!
======================

1. CHECK COMPETITIONS:
   await checkCompetitions();

2. SETUP VOTING (replace 21 with your competition ID):
   await setupVotingQuick(21);

✅ ALL FUNCTIONS LOADED!
`); 