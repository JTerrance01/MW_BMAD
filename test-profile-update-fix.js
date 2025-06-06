const axios = require('axios');
const https = require('https');

// Bypass SSL certificate verification for testing
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const API_BASE_URL = 'https://localhost:7001';

// Test data
const testProfileData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com'
};

const testPasswordData = {
    currentPassword: 'OldPassword123!',
    newPassword: 'NewPassword123!',
    confirmPassword: 'NewPassword123!'
};

const testNotificationData = {
    emailNotifications: true,
    competitionUpdates: true,
    marketingEmails: false,
    orderUpdates: true
};

async function testProfileUpdateEndpoints() {
    console.log('🔧 Testing Profile Update Endpoints Fix');
    console.log('=====================================\n');

    // Note: These tests will return 401 (Unauthorized) since we don't have a valid token
    // But we're testing for 405 (Method Not Allowed) vs other status codes
    // 401 means the endpoint exists and accepts the HTTP method
    // 405 means the endpoint doesn't accept the HTTP method (the original problem)

    const endpoints = [
        {
            name: 'Bio Update',
            method: 'PUT',
            url: `${API_BASE_URL}/api/UserProfile/bio`,
            data: { bio: 'Test bio update' }
        },
        {
            name: 'General Profile Update',
            method: 'PUT', 
            url: `${API_BASE_URL}/api/UserProfile`,
            data: testProfileData
        },
        {
            name: 'Password Change',
            method: 'PUT',
            url: `${API_BASE_URL}/api/UserProfile/password`,
            data: testPasswordData
        },
        {
            name: 'Notification Preferences',
            method: 'PUT',
            url: `${API_BASE_URL}/api/UserProfile/notifications`,
            data: testNotificationData
        }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint.name}...`);
            console.log(`${endpoint.method} ${endpoint.url}`);
            
            const response = await axios({
                method: endpoint.method,
                url: endpoint.url,
                data: endpoint.data,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer fake-token-for-testing'
                },
                httpsAgent: httpsAgent,
                timeout: 5000,
                validateStatus: () => true // Don't throw on any status code
            });

            console.log(`Status: ${response.status} ${response.statusText}`);
            
            if (response.status === 405) {
                console.log('❌ STILL GETTING 405 - Method Not Allowed');
                console.log('   This means the endpoint doesn\'t accept PUT method');
            } else if (response.status === 401) {
                console.log('✅ FIXED - Getting 401 Unauthorized (expected without valid token)');
                console.log('   This means the endpoint exists and accepts PUT method');
            } else if (response.status === 400) {
                console.log('✅ FIXED - Getting 400 Bad Request (endpoint exists)');
                console.log('   This means the endpoint exists and accepts PUT method');
            } else {
                console.log(`ℹ️  Got status ${response.status} - endpoint exists and accepts PUT`);
            }
            
            if (response.data) {
                console.log('Response:', JSON.stringify(response.data, null, 2));
            }
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('❌ Connection refused - API server not running');
            } else if (error.response) {
                console.log(`Status: ${error.response.status} ${error.response.statusText}`);
                if (error.response.status === 405) {
                    console.log('❌ STILL GETTING 405 - Method Not Allowed');
                } else {
                    console.log('✅ FIXED - Not getting 405 error');
                }
            } else {
                console.log('❌ Error:', error.message);
            }
        }
        
        console.log(''); // Empty line for readability
    }

    console.log('🎯 Summary:');
    console.log('- If you see 401 (Unauthorized) or 400 (Bad Request): ✅ FIXED');
    console.log('- If you see 405 (Method Not Allowed): ❌ Still broken');
    console.log('- If you see connection errors: API server not running');
    console.log('\nNote: 401/400 are expected since we\'re not sending valid auth tokens');
    console.log('The important thing is that we\'re NOT getting 405 errors anymore.');
}

// Run the test
testProfileUpdateEndpoints().catch(console.error); 