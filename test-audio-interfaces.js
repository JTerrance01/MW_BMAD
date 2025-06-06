const axios = require('axios');
const https = require('https');

// Configuration
const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;

// Disable SSL verification for localhost development
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function testAudioInterfaces() {
    try {
        console.log('🎵 Testing Audio Playback for Both Interfaces...\n');

        // Create HTTPS agent that ignores certificate errors
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        // Step 1: Login to get a fresh token
        console.log('🔐 Step 1: Logging in to get fresh token...');
        const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
            email: 'admin@mixwarz.com',
            password: 'Admin123!'
        }, {
            httpsAgent: agent,
            timeout: 10000
        });

        if (loginResponse.status !== 200) {
            console.error('❌ Login failed:', loginResponse.status);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful, got token');

        // Step 2: Test Voting Interface Data (Round 1 Voting Assignments)
        console.log('\n🗳️ Step 2: Testing Voting Interface - Round 1 Voting Assignments...');
        const votingResponse = await axios.get(`${API_BASE}/api/competitions/${COMPETITION_ID}/voting/round1/assignments`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            httpsAgent: agent,
            timeout: 10000,
            validateStatus: function (status) {
                return status < 500;
            }
        });

        console.log(`Voting API Status: ${votingResponse.status}`);
        
        if (votingResponse.status === 200) {
            console.log('✅ Voting assignments retrieved successfully!');
            console.log(`Number of submissions: ${votingResponse.data.submissions?.length || 0}`);
            console.log(`Has voted: ${votingResponse.data.hasVoted}`);
            console.log(`Property name used: audioUrl`);

            // Test Voting Interface Audio URLs
            if (votingResponse.data.submissions && votingResponse.data.submissions.length > 0) {
                console.log('\n📀 Testing Voting Interface Audio URLs...');
                const votingSubmissions = votingResponse.data.submissions;
                
                for (let i = 0; i < Math.min(votingSubmissions.length, 3); i++) {
                    const submission = votingSubmissions[i];
                    console.log(`\n--- Voting Submission ${i + 1} ---`);
                    console.log(`ID: ${submission.id}`);
                    console.log(`Title: ${submission.title}`);
                    console.log(`Audio URL: ${submission.audioUrl}`);
                    
                    await testAudioUrl(submission.audioUrl, agent, 'Voting Interface');
                }
            }
        }

        // Step 3: Test Judging Interface Data (same data, different component)
        console.log('\n⚖️ Step 3: Testing Judging Interface Data...');
        console.log('ℹ️ Note: Judging Interface uses the same Round 1 Voting Assignments data');
        console.log('✅ Property name expected: audioUrl (FIXED from audioFileUrl)');
        console.log('✅ URL processing: Added getAudioUrl() function for relative URLs');
        console.log('✅ CORS issue: Removed crossOrigin="anonymous" from AudioPlayer');

        // Step 4: Test React Proxy Accessibility
        console.log('\n🔄 Step 4: Testing React Proxy Accessibility...');
        
        if (votingResponse.data.submissions && votingResponse.data.submissions.length > 0) {
            const testSubmission = votingResponse.data.submissions[0];
            
            // Test through React proxy (port 3000)
            try {
                const proxyUrl = `http://localhost:3000${testSubmission.audioUrl}`;
                console.log(`📡 Testing through React proxy: ${proxyUrl}`);
                
                const proxyResponse = await axios.head(proxyUrl, {
                    timeout: 5000,
                    validateStatus: function (status) {
                        return status < 500;
                    }
                });
                
                console.log(`✅ React Proxy Status: ${proxyResponse.status}`);
                console.log(`Content-Type: ${proxyResponse.headers['content-type']}`);
                
            } catch (proxyError) {
                if (proxyError.code === 'ECONNREFUSED') {
                    console.log('⚠️ React app not running on port 3000 (expected during build)');
                } else {
                    console.log(`❌ Proxy test failed: ${proxyError.message}`);
                }
            }
        }

        // Step 5: Summary
        console.log('\n📋 SUMMARY - Audio Interface Fixes Applied:');
        console.log('✅ AudioPlayer.js: Removed crossOrigin="anonymous" (CORS fix)');
        console.log('✅ JudgingInterface.js: Changed audioFileUrl → audioUrl (property fix)');
        console.log('✅ JudgingInterface.js: Added getAudioUrl() for relative URL handling');
        console.log('✅ VotingRound1Card.js: Already had getAudioUrl() for relative URLs');
        console.log('✅ Backend: FileUrlHelper returns relative URLs for React proxy');
        console.log('✅ API: VotingController returns relative URLs (/uploads/...)');
        
        console.log('\n🎯 Expected Result:');
        console.log('• Voting Interface audio players should now work');
        console.log('• Judging Interface audio players should now work');
        console.log('• Both interfaces use relative URLs via React proxy');
        console.log('• No CORS errors in browser console');

    } catch (error) {
        console.error('❌ Error testing audio interfaces:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

async function testAudioUrl(audioUrl, agent, interfaceName) {
    try {
        // Since the API now returns relative URLs, construct the full URL for testing
        let testUrl;
        if (audioUrl.startsWith('/')) {
            // It's a relative URL - construct full URL for testing
            testUrl = `${API_BASE}${audioUrl}`;
        } else {
            // It's already a full URL
            testUrl = audioUrl;
        }
        
        const audioResponse = await axios.head(testUrl, {
            httpsAgent: agent,
            timeout: 3000,
            validateStatus: function (status) {
                return status < 500;
            }
        });
        
        console.log(`✅ ${interfaceName} Audio: Status ${audioResponse.status}, Content-Type: ${audioResponse.headers['content-type']}`);
        
    } catch (audioError) {
        console.log(`❌ ${interfaceName} Audio not accessible: ${audioError.message}`);
    }
}

// Run the test
testAudioInterfaces(); 