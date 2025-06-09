const axios = require('axios');

async function testRound2AudioPaths() {
    console.log('🎵 Testing Round 2 Audio Paths');
    console.log('=' .repeat(50));

    const baseUrl = 'https://localhost:7001';
    
    try {
        // 1. Login as admin to get fresh token
        console.log('🔐 Logging in as admin...');
        const loginResponse = await axios.post(
            `${baseUrl}/api/auth/login`,
            {
                email: "admin@mixwarz.com",
                password: "Admin123!"
            },
            {
                httpsAgent: new (require('https')).Agent({ rejectUnauthorized: false })
            }
        );

        const token = loginResponse.data.token;
        console.log('✅ Admin login successful');

        // 2. Test Round 2 submissions endpoint
        console.log('\\n📡 Fetching Round 2 submissions...');
        const submissionsResponse = await axios.get(
            `${baseUrl}/api/competitions/21/voting/round2/submissions`,
            {
                headers: { Authorization: `Bearer ${token}` },
                httpsAgent: new (require('https')).Agent({ rejectUnauthorized: false })
            }
        );

        console.log(`✅ Got ${submissionsResponse.data.submissions?.length || 0} submissions`);

        if (submissionsResponse.data.submissions && submissionsResponse.data.submissions.length > 0) {
            console.log('\\n🎵 Audio URLs returned by API:');
            console.log('-'.repeat(40));
            
            submissionsResponse.data.submissions.forEach((submission, index) => {
                console.log(`${index + 1}. Submission ${submission.id}:`);
                console.log(`   Title: ${submission.title}`);
                console.log(`   Audio URL: ${submission.audioUrl}`);
                console.log('');
            });

            // 3. Test first audio URL accessibility
            const firstSubmission = submissionsResponse.data.submissions[0];
            console.log(`\\n🌐 Testing audio URL accessibility...`);
            console.log(`Testing: ${baseUrl}${firstSubmission.audioUrl}`);
            
            try {
                const audioResponse = await axios.head(
                    `${baseUrl}${firstSubmission.audioUrl}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        httpsAgent: new (require('https')).Agent({ rejectUnauthorized: false }),
                        timeout: 10000
                    }
                );
                console.log(`✅ Audio file accessible (Status: ${audioResponse.status})`);
                console.log(`📁 Content-Type: ${audioResponse.headers['content-type'] || 'unknown'}`);
                console.log(`📊 Content-Length: ${audioResponse.headers['content-length'] || 'unknown'} bytes`);
            } catch (error) {
                console.log(`❌ Audio file not accessible:`);
                console.log(`   Status: ${error.response?.status || 'No response'}`);
                console.log(`   Message: ${error.response?.statusText || error.message}`);
                
                // Try to get more detailed error info
                if (error.response?.data) {
                    console.log(`   Response: ${JSON.stringify(error.response.data)}`);
                }
            }

            // 4. Test direct file system path
            console.log('\\n📁 Expected file system path:');
            const audioUrl = firstSubmission.audioUrl;
            if (audioUrl.startsWith('/uploads/')) {
                const relativePath = audioUrl.substring('/uploads/'.length);
                console.log(`   Relative path: ${relativePath}`);
                console.log(`   Expected full path: src/MixWarz.API/AppData/uploads/${relativePath}`);
            }

        } else {
            console.log('❌ No Round 2 submissions found');
            console.log('💡 Make sure Round 2 has been set up and has advanced submissions');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('💡 Authentication failed - check admin credentials');
        } else if (error.response?.status === 400) {
            console.log('💡 Bad request - check competition status and Round 2 setup');
        } else if (error.response?.status === 403) {
            console.log('💡 Forbidden - check user permissions for Round 2 voting');
        }
    }
}

testRound2AudioPaths().catch(console.error); 