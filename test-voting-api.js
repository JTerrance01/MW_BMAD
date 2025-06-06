// Simple API test to check voting endpoints
const axios = require('axios');
const https = require('https');

// Configuration
const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;

// Disable SSL verification for localhost development
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Helper to make HTTPS requests
function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 7001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = responseData ? JSON.parse(responseData) : {};
                    resolve({ status: res.statusCode, data: parsedData, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData, headers: res.headers });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testVotingAPI() {
    try {
        console.log('🔍 Testing Round 1 Voting API Flow...\n');

        // Create HTTPS agent that ignores certificate errors
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        // Step 1: Login to get a fresh token
        console.log('🔐 Step 1: Logging in to get fresh token...');
        const loginResponse = await axios.post('https://localhost:7001/api/auth/login', {
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

        // Step 2: Get competition details
        console.log('\n📊 Step 2: Getting competition details...');
        const competitionId = 21;
        const competitionResponse = await axios.get(`https://localhost:7001/api/competitions/${competitionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            httpsAgent: agent,
            timeout: 10000
        });

        console.log(`Competition Status: ${competitionResponse.data.status}`);
        console.log(`Competition Title: ${competitionResponse.data.title}`);

        // Step 3: Test voting assignments endpoint
        console.log('\n🗳️ Step 3: Testing Round 1 voting assignments...');
        const votingResponse = await axios.get(`https://localhost:7001/api/competitions/${competitionId}/voting/round1/assignments`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            httpsAgent: agent,
            timeout: 10000,
            validateStatus: function (status) {
                return status < 500; // Accept any status code less than 500
            }
        });

        console.log(`Voting API Status: ${votingResponse.status}`);
        
        if (votingResponse.status === 200) {
            console.log('✅ Voting assignments retrieved successfully!');
            console.log(`Number of submissions: ${votingResponse.data.submissions?.length || 0}`);
            console.log(`Has voted: ${votingResponse.data.hasVoted}`);
            console.log(`Voting deadline: ${votingResponse.data.votingDeadline}`);

            // Step 4: Analyze audio URLs
            if (votingResponse.data.submissions && votingResponse.data.submissions.length > 0) {
                console.log('\n📀 Step 4: Analyzing audio URLs...');
                const submissions = votingResponse.data.submissions;
                for (let i = 0; i < Math.min(submissions.length, 3); i++) {
                    const submission = submissions[i];
                    console.log(`\n--- Submission ${i + 1} ---`);
                    console.log(`ID: ${submission.id}`);
                    console.log(`Title: ${submission.title}`);
                    console.log(`Audio URL: ${submission.audioUrl}`);
                    
                    // Test audio accessibility
                    try {
                        // Since the API now returns relative URLs, construct the full URL for testing
                        let testUrl;
                        if (submission.audioUrl.startsWith('/')) {
                            // It's a relative URL - construct full URL for testing
                            testUrl = `https://localhost:7001${submission.audioUrl}`;
                            console.log(`🔧 Testing constructed URL: ${testUrl}`);
                        } else {
                            // It's already a full URL
                            testUrl = submission.audioUrl;
                            console.log(`🔧 Testing direct URL: ${testUrl}`);
                        }
                        
                        const audioResponse = await axios.head(testUrl, {
                            httpsAgent: agent,
                            timeout: 3000,
                            validateStatus: function (status) {
                                return status < 500;
                            }
                        });
                        
                        console.log(`✅ Audio URL accessible: Status ${audioResponse.status}, Content-Type: ${audioResponse.headers['content-type']}`);
                        
                    } catch (audioError) {
                        console.log(`❌ Audio URL not accessible: ${audioError.message}`);
                    }
                }
            } else {
                console.log('❌ No submissions found in response');
            }
        } else {
            console.log(`❌ Voting assignments failed: ${votingResponse.status}`);
            console.log('Response:', JSON.stringify(votingResponse.data, null, 2));
        }

    } catch (error) {
        console.error('❌ Error testing voting API:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testVotingAPI(); 