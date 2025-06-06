const axios = require('axios');
const https = require('https');

async function testProxyAudioAccess() {
    try {
        console.log('🔍 Testing audio access through React proxy...\n');

        // Create HTTPS agent that ignores certificate errors
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        // Test the relative URL through React proxy port (3000)
        const relativeUrl = '/uploads/submissions/21/46f30a81-dff1-4c3e-8e65-8b61e8b28590/ed9fc88b-09a1-4258-91cc-3007edd614d6-WLG_Tibi%20Galea%20.mp3';
        const proxyUrl = `http://localhost:3000${relativeUrl}`;
        
        console.log(`📡 Testing through React proxy: ${proxyUrl}`);
        
        const response = await axios.head(proxyUrl, {
            httpsAgent: agent,
            timeout: 5000,
            validateStatus: function (status) {
                return status < 500;
            }
        });
        
        console.log(`✅ Proxy Status: ${response.status}`);
        console.log(`Content-Type: ${response.headers['content-type']}`);
        console.log(`Content-Length: ${response.headers['content-length']}`);

        // Also test direct API access
        console.log('\n📡 Testing direct API access...');
        const directUrl = `https://localhost:7001${relativeUrl}`;
        
        const directResponse = await axios.head(directUrl, {
            httpsAgent: agent,
            timeout: 5000,
            validateStatus: function (status) {
                return status < 500;
            }
        });
        
        console.log(`✅ Direct API Status: ${directResponse.status}`);
        console.log(`Content-Type: ${directResponse.headers['content-type']}`);
        console.log(`Content-Length: ${directResponse.headers['content-length']}`);

    } catch (error) {
        console.error('❌ Error testing proxy audio access:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('   React app might not be running on port 3000');
        }
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response headers:', error.response.headers);
        }
    }
}

// Run the test
testProxyAudioAccess(); 