const axios = require('axios');
const https = require('https');

async function testDirectAudioUrl() {
    try {
        console.log('🔍 Testing direct audio URL access...\n');

        // Create HTTPS agent that ignores certificate errors
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        // Test the exact URL from our previous test
        const testUrl = 'https://localhost:7001/uploads/submissions/21/46f30a81-dff1-4c3e-8e65-8b61e8b28590/ed9fc88b-09a1-4258-91cc-3007edd614d6-WLG_Tibi%20Galea%20.mp3';
        
        console.log(`📡 Testing URL: ${testUrl}`);
        
        const response = await axios.head(testUrl, {
            httpsAgent: agent,
            timeout: 5000,
            validateStatus: function (status) {
                return status < 500;
            }
        });
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`Content-Type: ${response.headers['content-type']}`);
        console.log(`Content-Length: ${response.headers['content-length']}`);

        // Also test with a GET request to see if there's any difference
        console.log('\n🔍 Testing with GET request...');
        const getResponse = await axios.get(testUrl, {
            httpsAgent: agent,
            timeout: 5000,
            responseType: 'stream',
            validateStatus: function (status) {
                return status < 500;
            }
        });
        
        console.log(`✅ GET Status: ${getResponse.status}`);
        console.log(`GET Content-Type: ${getResponse.headers['content-type']}`);
        console.log(`GET Content-Length: ${getResponse.headers['content-length']}`);
        
        // Check if the response is actually audio data
        if (getResponse.status === 200) {
            let dataReceived = 0;
            getResponse.data.on('data', (chunk) => {
                dataReceived += chunk.length;
            });
            
            getResponse.data.on('end', () => {
                console.log(`✅ Successfully received ${dataReceived} bytes of audio data`);
            });
            
            // Wait a bit to receive some data
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
        console.error('❌ Error testing direct audio URL:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
    }
}

// Run the test
testDirectAudioUrl(); 