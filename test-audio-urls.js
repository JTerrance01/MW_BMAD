const axios = require('axios');
const https = require('https');

async function testAudioUrls() {
    try {
        console.log('🔍 Testing Round 1 voting assignments audio URLs...\n');

        const competitionId = 21;
        const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNzM3YzZkMS01MzY1LTQ1NzMtODk4Ni1kNGMwZjViNmM1OWMiLCJlbWFpbCI6ImFkbWluQG1peHdhcnouY29tIiwianRpIjoiMzEzZjE2NjYtYjc5Ni00YThhLTk0MjQtYTNjY2U3YzkwMTI4IiwidW5pcXVlX25hbWUiOiJhZG1pbiIsImlhdCI6MTczNDI3OTA4OSwiZXhwIjoxNzM0ODgzODg5LCJpc3MiOiJNaXhXYXJ6QVBJIiwiYXVkIjoiTWl4V2FyekNsaWVudCJ9.A_4t0GNpKKnr5RQEemzRH9R2dJnPaRJg1wFyaHkSwQg'; // Your valid token

        const apiUrl = `https://localhost:7001/api/competitions/${competitionId}/voting/round1/assignments`;
        
        console.log(`📡 Calling: ${apiUrl}`);
        
        // Create HTTPS agent that ignores certificate errors
        const agent = new https.Agent({
            rejectUnauthorized: false
        });
        
        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'MixWarz-AudioTest/1.0'
            },
            httpsAgent: agent,
            timeout: 10000,
            validateStatus: function (status) {
                return status < 500; // Accept any status code less than 500
            }
        });

        console.log(`✅ Status: ${response.status}`);
        
        if (response.status !== 200) {
            console.log(`⚠️ Non-200 status received: ${response.status}`);
            console.log(`Response:`, response.data);
            return;
        }
        
        console.log(`📊 Response data:`, JSON.stringify(response.data, null, 2));
        
        if (response.data.submissions && response.data.submissions.length > 0) {
            console.log('\n📀 Audio URL Analysis:');
            response.data.submissions.forEach((submission, index) => {
                console.log(`\n--- Submission ${index + 1} ---`);
                console.log(`ID: ${submission.id}`);
                console.log(`Title: ${submission.title}`);
                console.log(`Audio URL: ${submission.audioUrl}`);
                
                // Check if URL looks valid
                if (submission.audioUrl) {
                    if (submission.audioUrl.startsWith('http://') || submission.audioUrl.startsWith('https://')) {
                        console.log(`✅ URL appears to be valid`);
                        
                        // Test if the URL is accessible
                        console.log(`🔗 Testing URL accessibility...`);
                        testAudioUrlAccess(submission.audioUrl, agent);
                    } else {
                        console.log(`❌ URL appears to be a file path, not a valid URL: "${submission.audioUrl}"`);
                    }
                } else {
                    console.log(`❌ No audio URL provided`);
                }
            });
        } else {
            console.log('❌ No submissions found in response');
        }

    } catch (error) {
        console.error('❌ Error testing audio URLs:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('No response received. Check if API is running and accessible.');
        } else {
            console.error('Request setup error:', error.message);
        }
    }
}

async function testAudioUrlAccess(audioUrl, agent) {
    try {
        const headResponse = await axios.head(audioUrl, {
            httpsAgent: agent,
            timeout: 5000,
            validateStatus: function (status) {
                return status < 500;
            }
        });
        
        if (headResponse.status === 200) {
            console.log(`✅ Audio URL is accessible (Status: ${headResponse.status})`);
            console.log(`   Content-Type: ${headResponse.headers['content-type'] || 'unknown'}`);
            console.log(`   Content-Length: ${headResponse.headers['content-length'] || 'unknown'}`);
        } else {
            console.log(`❌ Audio URL returned status: ${headResponse.status}`);
        }
    } catch (error) {
        console.log(`❌ Audio URL is not accessible: ${error.message}`);
    }
}

// Run the test
testAudioUrls(); 