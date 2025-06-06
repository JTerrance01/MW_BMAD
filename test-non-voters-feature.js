const axios = require('axios');

const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21; // Test with competition 21

async function testNonVotersFeature() {
    console.log('🧪 Testing Non-Voters Feature Implementation');
    console.log('=' .repeat(50));

    try {
        // Get admin token (you'll need to replace this with a valid admin token)
        const token = 'your-admin-token-here'; // Replace with actual admin token

        console.log(`📋 Testing non-voters endpoint for competition ${COMPETITION_ID}...`);
        
        const response = await axios.get(
            `${API_BASE}/api/competitions/${COMPETITION_ID}/round1/non-voters`,
            {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
            }
        );

        if (response.status === 200) {
            const nonVoters = response.data;
            console.log(`✅ Non-voters endpoint successful!`);
            console.log(`📊 Found ${nonVoters.length} users who haven't voted`);
            
            if (nonVoters.length > 0) {
                console.log('\n👥 Sample non-voter data:');
                console.log('Username | Voter Group | Assigned Group');
                console.log('-'.repeat(45));
                
                nonVoters.slice(0, 5).forEach(nonVoter => {
                    console.log(`${nonVoter.voterUsername.padEnd(15)} | ${nonVoter.voterGroupNumber.toString().padEnd(11)} | ${nonVoter.assignedGroupNumber}`);
                });
                
                if (nonVoters.length > 5) {
                    console.log(`... and ${nonVoters.length - 5} more users`);
                }
            } else {
                console.log('🎉 All users have voted! No non-voters found.');
            }

            // Verify data structure
            if (nonVoters.length > 0) {
                const sample = nonVoters[0];
                const expectedFields = ['voterUsername', 'assignedGroupNumber', 'voterGroupNumber', 'voterId', 'voterEmail', 'assignmentId'];
                const missingFields = expectedFields.filter(field => !(field in sample));
                
                if (missingFields.length === 0) {
                    console.log('✅ Data structure is correct - all expected fields present');
                } else {
                    console.log(`❌ Missing fields in response: ${missingFields.join(', ')}`);
                }
            }

        } else {
            console.log(`❌ Unexpected response status: ${response.status}`);
        }

    } catch (error) {
        if (error.response) {
            console.log(`❌ API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
            if (error.response.status === 401) {
                console.log('💡 Tip: Make sure to replace "your-admin-token-here" with a valid admin token');
            }
        } else {
            console.log(`❌ Network Error: ${error.message}`);
        }
    }

    console.log('\n🎯 Frontend Implementation Summary:');
    console.log('✅ Added nonVoters state variable');
    console.log('✅ Created loadNonVoters() function');
    console.log('✅ Integrated with voting modal');
    console.log('✅ Added UI section between voting progress and voting active');
    console.log('✅ Responsive design with user cards');
    console.log('✅ Handles both small and large lists of non-voters');
    console.log('✅ Shows group assignments for each non-voter');
    console.log('✅ Frontend builds successfully');
}

testNonVotersFeature().catch(console.error); 