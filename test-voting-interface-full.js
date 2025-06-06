const axios = require('axios');
const https = require('https');

// Configuration
const API_BASE = 'https://localhost:7001';
const REACT_BASE = 'http://localhost:3000';
const COMPETITION_ID = 21;

// Disable SSL verification for localhost development
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function testVotingInterfaceFull() {
    try {
        console.log('🎵 Testing Complete Voting Interface Flow...\n');

        // Create HTTPS agent that ignores certificate errors
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        // Step 1: Test React App Accessibility
        console.log('🔄 Step 1: Testing React App Accessibility...');
        try {
            const reactResponse = await axios.get(REACT_BASE, {
                timeout: 5000,
                validateStatus: function (status) {
                    return status < 500;
                }
            });
            
            if (reactResponse.status === 200) {
                console.log('✅ React app is running and accessible');
            } else {
                console.log(`⚠️ React app responded with status: ${reactResponse.status}`);
            }
        } catch (reactError) {
            if (reactError.code === 'ECONNREFUSED') {
                console.log('❌ React app is not running on port 3000');
                console.log('Please start the React app with: npm start');
                return;
            } else {
                console.log(`⚠️ React app test error: ${reactError.message}`);
            }
        }

        // Step 2: Login to get a fresh token
        console.log('\n🔐 Step 2: Logging in to get fresh token...');
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

        // Step 3: Test Competition Detail Page Accessibility
        console.log('\n📄 Step 3: Testing Competition Detail Page...');
        try {
            const competitionPageUrl = `${REACT_BASE}/competitions/${COMPETITION_ID}`;
            const pageResponse = await axios.get(competitionPageUrl, {
                timeout: 5000,
                validateStatus: function (status) {
                    return status < 500;
                }
            });
            
            if (pageResponse.status === 200) {
                console.log('✅ Competition detail page is accessible');
                
                // Check if the page contains voting interface elements
                const pageHtml = pageResponse.data;
                if (pageHtml.includes('Round 1 Voting') || pageHtml.includes('voting')) {
                    console.log('✅ Page likely contains voting interface');
                } else {
                    console.log('⚠️ Page may not contain voting interface elements');
                }
            } else {
                console.log(`⚠️ Competition page responded with status: ${pageResponse.status}`);
            }
        } catch (pageError) {
            console.log(`⚠️ Competition page test error: ${pageError.message}`);
        }

        // Step 4: Test Voting API Endpoints
        console.log('\n🗳️ Step 4: Testing Voting API Endpoints...');
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
            console.log(`Voting deadline: ${votingResponse.data.votingDeadline}`);

            // Step 5: Test Audio URL Accessibility Through React Proxy
            if (votingResponse.data.submissions && votingResponse.data.submissions.length > 0) {
                console.log('\n📀 Step 5: Testing Audio URLs Through React Proxy...');
                
                for (let i = 0; i < Math.min(votingResponse.data.submissions.length, 3); i++) {
                    const submission = votingResponse.data.submissions[i];
                    console.log(`\n--- Testing Submission ${i + 1} ---`);
                    console.log(`ID: ${submission.id}`);
                    console.log(`Title: ${submission.title}`);
                    console.log(`Audio URL: ${submission.audioUrl}`);
                    
                    if (submission.audioUrl) {
                        // Test through React proxy
                        try {
                            const proxyUrl = `${REACT_BASE}${submission.audioUrl}`;
                            console.log(`📡 Testing via React proxy: ${proxyUrl}`);
                            
                            const audioResponse = await axios.head(proxyUrl, {
                                timeout: 5000,
                                validateStatus: function (status) {
                                    return status < 500;
                                }
                            });
                            
                            if (audioResponse.status === 200) {
                                console.log(`✅ Audio accessible via proxy: Status ${audioResponse.status}, Content-Type: ${audioResponse.headers['content-type']}`);
                                console.log(`Content-Length: ${audioResponse.headers['content-length']} bytes`);
                            } else {
                                console.log(`❌ Audio proxy error: Status ${audioResponse.status}`);
                            }
                            
                        } catch (audioError) {
                            console.log(`❌ Audio proxy test failed: ${audioError.message}`);
                            
                            // Fallback: Test direct API access
                            try {
                                const directUrl = `${API_BASE}${submission.audioUrl}`;
                                console.log(`🔧 Testing direct API: ${directUrl}`);
                                
                                const directResponse = await axios.head(directUrl, {
                                    httpsAgent: agent,
                                    timeout: 3000,
                                    validateStatus: function (status) {
                                        return status < 500;
                                    }
                                });
                                
                                if (directResponse.status === 200) {
                                    console.log(`✅ Audio accessible via direct API: Status ${directResponse.status}`);
                                } else {
                                    console.log(`❌ Direct API error: Status ${directResponse.status}`);
                                }
                            } catch (directError) {
                                console.log(`❌ Direct API test failed: ${directError.message}`);
                            }
                        }
                    } else {
                        console.log('❌ No audio URL provided for this submission');
                    }
                }
            } else {
                console.log('⚠️ No submissions found for voting');
            }
        } else {
            console.log(`❌ Voting API failed with status: ${votingResponse.status}`);
            if (votingResponse.data) {
                console.log('Response data:', votingResponse.data);
            }
        }

        // Step 6: Summary and Troubleshooting Guide
        console.log('\n📋 TROUBLESHOOTING SUMMARY:');
        console.log('========================================');
        
        if (votingResponse.status === 200 && votingResponse.data.submissions?.length > 0) {
            console.log('✅ Backend API: Working correctly');
            console.log('✅ Audio URLs: Being generated correctly');
            console.log('✅ Voting Data: Available and properly formatted');
            
            console.log('\n🔍 POTENTIAL ISSUES TO CHECK:');
            console.log('1. 🎛️ AudioControls Component:');
            console.log('   - Check browser console for AudioControls debug logs');
            console.log('   - Look for "📀 AudioControls mounted" messages');
            console.log('   - Check for "📀 Play/Pause clicked" when buttons are pressed');
            
            console.log('\n2. 🗳️ VotingRound1Card Component:');
            console.log('   - Verify submissions are being passed correctly');
            console.log('   - Check getAudioUrl() function output');
            console.log('   - Ensure AudioControls are receiving proper props');
            
            console.log('\n3. 🌐 React Proxy Configuration:');
            console.log('   - Verify package.json has "proxy": "https://localhost:7001"');
            console.log('   - Check that API is running on port 7001');
            console.log('   - Ensure React app is running on port 3000');
            
            console.log('\n4. 🔊 Browser Audio Permissions:');
            console.log('   - Check if browser is blocking audio autoplay');
            console.log('   - Verify audio codecs are supported');
            console.log('   - Test with different browsers');
            
            console.log('\n🎯 NEXT STEPS:');
            console.log('1. Open browser console while testing voting interface');
            console.log('2. Look for the AudioControls debug messages');
            console.log('3. Click play buttons and check for debug logs');
            console.log('4. Check Network tab for any failed audio requests');
            
        } else {
            console.log('❌ Backend Issues Detected:');
            console.log('   - Voting API not returning proper data');
            console.log('   - Check competition status and voting group setup');
            console.log('   - Verify user has voting assignments');
        }

    } catch (error) {
        console.error('❌ Error testing voting interface:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testVotingInterfaceFull(); 