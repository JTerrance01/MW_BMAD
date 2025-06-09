const axios = require('axios');

async function testSpecificAudio() {
    console.log('🎵 Testing Specific Audio URL');
    console.log('=' .repeat(40));

    const baseUrl = 'https://localhost:7001';
    
    try {
        // Login first
        const loginResponse = await axios.post(
            `${baseUrl}/api/auth/login`,
            { email: "admin@mixwarz.com", password: "Admin123!" },
            { httpsAgent: new (require('https')).Agent({ rejectUnauthorized: false }) }
        );

        const token = loginResponse.data.token;
        console.log('✅ Logged in successfully');

        // Test the specific URL that was failing
        const testUrl = '/uploads/submissions/21/767f7a81-f448-4055-9436-e0da398aef29/00cb42b7-533f-4670-982e-39ec0f16e205-WLG_Tibi%20Galea%20.mp3';
        
        console.log(`\\n🔗 Testing URL: ${testUrl}`);
        console.log(`🔗 Full URL: ${baseUrl}${testUrl}`);

        try {
            const response = await axios.head(
                `${baseUrl}${testUrl}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    httpsAgent: new (require('https')).Agent({ rejectUnauthorized: false }),
                    timeout: 10000
                }
            );
            
            console.log(`✅ SUCCESS - Status: ${response.status}`);
            console.log(`📁 Content-Type: ${response.headers['content-type']}`);
            console.log(`📊 Content-Length: ${response.headers['content-length']} bytes`);
            
        } catch (error) {
            console.log(`❌ FAILED - Status: ${error.response?.status}`);
            console.log(`📝 Message: ${error.response?.statusText || error.message}`);
            
            if (error.response?.status === 404) {
                console.log('\\n🔍 File not found - checking file system...');
                
                // Check if file actually exists
                const fs = require('fs');
                const path = require('path');
                
                const relativePath = testUrl.substring('/uploads/'.length);
                const fullPath = path.join(process.cwd(), 'src', 'MixWarz.API', 'AppData', 'uploads', relativePath);
                
                console.log(`📂 Checking: ${fullPath}`);
                console.log(`📁 File exists: ${fs.existsSync(fullPath) ? '✅ YES' : '❌ NO'}`);
                
                if (!fs.existsSync(fullPath)) {
                    // Check with URL decoded path
                    const decodedPath = decodeURIComponent(relativePath);
                    const decodedFullPath = path.join(process.cwd(), 'src', 'MixWarz.API', 'AppData', 'uploads', decodedPath);
                    console.log(`📂 Checking decoded: ${decodedFullPath}`);
                    console.log(`📁 Decoded file exists: ${fs.existsSync(decodedFullPath) ? '✅ YES' : '❌ NO'}`);
                }
            }
        }

        // Also test without authentication to see if it's an auth issue
        console.log('\\n🔓 Testing without authentication...');
        try {
            const noAuthResponse = await axios.head(
                `${baseUrl}${testUrl}`,
                {
                    httpsAgent: new (require('https')).Agent({ rejectUnauthorized: false }),
                    timeout: 10000
                }
            );
            
            console.log(`✅ SUCCESS without auth - Status: ${noAuthResponse.status}`);
            
        } catch (error) {
            console.log(`❌ FAILED without auth - Status: ${error.response?.status}`);
            console.log(`📝 Message: ${error.response?.statusText || error.message}`);
        }

    } catch (error) {
        console.error('❌ Login Error:', error.response?.data || error.message);
    }
}

testSpecificAudio().catch(console.error); 