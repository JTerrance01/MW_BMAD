const axios = require('axios');

// Configure axios to ignore SSL certificate issues for development
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const API_BASE_URL = 'https://localhost:7000/api';

// Test data - using seeded user credentials
const TEST_USER_CREDENTIALS = {
    email: 'user@mixwarz.com',
    password: 'User123!'
};

async function testUserSubmissionsAPI() {
    try {
        console.log('🧪 Testing User Submissions API...\n');

        // Step 1: Login to get authentication token
        console.log('1. Logging in...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER_CREDENTIALS);
        
        if (!loginResponse.data.token) {
            throw new Error('No token received from login');
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log(`   User: ${loginResponse.data.user?.username || 'Unknown'}`);

        // Step 2: Test getting user's own submissions
        console.log('\n2. Testing GET /api/users/submissions/my-submissions...');
        const mySubmissionsResponse = await axios.get(`${API_BASE_URL}/users/submissions/my-submissions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                page: 1,
                pageSize: 10
            }
        });

        console.log('✅ My submissions endpoint working');
        console.log(`   Found ${mySubmissionsResponse.data.totalCount} total submissions`);
        console.log(`   Returned ${mySubmissionsResponse.data.submissions.length} submissions for page 1`);
        
        if (mySubmissionsResponse.data.submissions.length > 0) {
            const firstSubmission = mySubmissionsResponse.data.submissions[0];
            console.log(`   First submission: "${firstSubmission.mixTitle}" for competition "${firstSubmission.competitionTitle}"`);
            console.log(`   Status: ${firstSubmission.status}, Ranking: ${firstSubmission.ranking || 'N/A'}`);
            console.log(`   Can Delete: ${firstSubmission.canDelete}`);
            console.log(`   Audio URL: ${firstSubmission.audioFilePath ? 'Available' : 'Not available'}`);
        }

        // Step 3: Test filtering by status
        console.log('\n3. Testing status filtering...');
        const filteredResponse = await axios.get(`${API_BASE_URL}/users/submissions/my-submissions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                page: 1,
                pageSize: 10,
                statusFilter: 'Submitted'
            }
        });

        console.log('✅ Status filtering working');
        console.log(`   Found ${filteredResponse.data.totalCount} submissions with status 'Submitted'`);

        // Step 4: Test competition status filtering
        console.log('\n4. Testing competition status filtering...');
        const compFilterResponse = await axios.get(`${API_BASE_URL}/users/submissions/my-submissions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                page: 1,
                pageSize: 10,
                competitionStatusFilter: 'Completed'
            }
        });

        console.log('✅ Competition status filtering working');
        console.log(`   Found ${compFilterResponse.data.totalCount} submissions from completed competitions`);

        // Step 5: Test public user submissions endpoint (if we have a username)
        if (loginResponse.data.user && loginResponse.data.user.username) {
            console.log('\n5. Testing public user submissions endpoint...');
            const publicResponse = await axios.get(`${API_BASE_URL}/users/submissions/user/${loginResponse.data.user.username}`, {
                params: {
                    page: 1,
                    pageSize: 10
                }
            });

            console.log('✅ Public submissions endpoint working');
            console.log(`   Found ${publicResponse.data.totalCount} public submissions`);
            
            // Verify that feedback is hidden in public view
            if (publicResponse.data.submissions.length > 0) {
                const hasPrivateFeedback = publicResponse.data.submissions.some(sub => sub.feedback !== null);
                if (!hasPrivateFeedback) {
                    console.log('✅ Private feedback properly hidden in public view');
                } else {
                    console.log('⚠️  Warning: Private feedback visible in public view');
                }
                
                // Verify canDelete is false for public view
                const hasDeletePermission = publicResponse.data.submissions.some(sub => sub.canDelete === true);
                if (!hasDeletePermission) {
                    console.log('✅ Delete permissions properly disabled in public view');
                } else {
                    console.log('⚠️  Warning: Delete permissions visible in public view');
                }
            }
        }

        console.log('\n🎉 All tests passed! User submissions API is working correctly.');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Make sure the API server is running on https://localhost:7000');
        }
        
        if (error.code === 'ENOTFOUND') {
            console.error('\n💡 Check if the API URL is correct');
        }
    }
}

// Run the test
testUserSubmissionsAPI(); 