// VOTING SETUP SCRIPT - PART 1
// Paste this first, then paste part 2

const getStatusName = (status) => {
    const statusMap = {
        0: "Upcoming", 1: "OpenForSubmissions", 2: "InJudging",
        10: "VotingRound1Setup", 11: "VotingRound1Open", 12: "VotingRound1Tallying",
        20: "VotingRound2Setup", 21: "VotingRound2Open", 22: "VotingRound2Tallying",
        25: "RequiresManualWinnerSelection", 30: "Completed"
    };
    return statusMap[status] || "Unknown";
};

const checkCompetitions = async () => {
    try {
        const response = await fetch('/api/v1/admin/competitions');
        const data = await response.json();
        console.log('=== ALL COMPETITIONS STATUS ===');
        data.forEach(comp => {
            const statusName = getStatusName(comp.status);
            console.log(`ID: ${comp.competitionId} | Title: "${comp.title}" | Status: ${comp.status} (${statusName}) | Submissions: ${comp.submissionCount || 0}`);
        });
        const readyCompetitions = data.filter(comp => 
            (comp.submissionCount && comp.submissionCount > 0) && 
            (comp.status === 1 || comp.status === 2 || comp.status === 10)
        );
        if (readyCompetitions.length === 0) {
            console.log('❌ No competitions found with submissions ready for voting setup');
        } else {
            console.log('\n=== COMPETITIONS READY FOR VOTING SETUP ===');
            readyCompetitions.forEach(comp => {
                console.log(`✅ ID: ${comp.competitionId} - "${comp.title}" (${comp.submissionCount} submissions)`);
            });
        }
        return { allCompetitions: data, readyCompetitions };
    } catch (error) {
        console.error('Error fetching competitions:', error);
    }
};

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

console.log('✅ PART 1 LOADED - Now paste Part 2');

// Script to fix Competition 21 from InJudging to proper voting status
// Run this to transition your test competition to the new voting system

const axios = require('axios');

// Configuration
const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21; // "Where Lovers go" competition
const TOKEN = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with your actual admin token

async function fixCompetitionVoting() {
  try {
    console.log('🔧 Starting competition voting fix...');
    
    // Step 1: Change status from InJudging (2) to VotingRound1Setup (10)
    console.log('📝 Step 1: Updating competition status to VotingRound1Setup...');
    
    const statusResponse = await axios.put(
      `${API_BASE}/api/v1/admin/competitions/${COMPETITION_ID}/status`,
      { newStatus: "VotingRound1Setup" },
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );
    
    console.log('✅ Status updated successfully');
    
    // Step 2: Create voting groups
    console.log('📝 Step 2: Creating voting groups...');
    
    const groupsResponse = await axios.post(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/create-groups`,
      { targetGroupSize: 20 },
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );
    
    console.log('✅ Voting groups created:', groupsResponse.data.message);
    
    // Step 3: Open voting (VotingRound1Open)
    console.log('📝 Step 3: Opening voting for users...');
    
    const openResponse = await axios.put(
      `${API_BASE}/api/v1/admin/competitions/${COMPETITION_ID}/status`,
      { newStatus: "VotingRound1Open" },
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );
    
    console.log('✅ Voting is now open!');
    
    // Step 4: Verify the setup
    console.log('📝 Step 4: Verifying voting setup...');
    
    const statsResponse = await axios.get(
      `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`,
      {
        headers: { 'Authorization': `Bearer ${TOKEN}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );
    
    console.log('📊 Voting Statistics:');
    console.log(`   Groups Created: ${statsResponse.data.GroupCount}`);
    console.log(`   Total Voters: ${statsResponse.data.TotalVoters}`);
    console.log(`   Voting Completion: ${statsResponse.data.VotingCompletionPercentage}%`);
    
    console.log('\n🎉 SUCCESS! Competition is now properly set up for voting!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Users can now see anonymous tracks to judge');
    console.log('   2. Monitor voting progress via Admin Panel');
    console.log('   3. Tally votes when ready to advance to Round 2');
    
  } catch (error) {
    console.error('❌ Error fixing competition voting:', error.response?.data || error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Make sure you have a valid admin token');
    console.log('   2. Check if the API is running on https://localhost:7001');
    console.log('   3. Verify the competition ID is correct');
  }
}

// Instructions for getting admin token
console.log('🔐 To get your admin token:');
console.log('   1. Login to the admin panel');
console.log('   2. Open browser developer tools');
console.log('   3. Go to Application/Storage > Local Storage');
console.log('   4. Copy the "token" value');
console.log('   5. Replace YOUR_ADMIN_TOKEN_HERE above');
console.log('\n📄 Then run: node voting-setup-part1.js\n');

// Uncomment the line below after setting your token
// fixCompetitionVoting(); 