const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test Round 2 audio file paths
async function debugRound2AudioPaths() {
    console.log('🔍 DEBUG: Round 2 Audio File Paths Analysis');
    console.log('=' .repeat(60));

    const competitionId = 21;
    const baseUrl = 'https://localhost:7001';
    
    // Test admin token (replace with valid admin token)
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5ODc2NTQzMi0xMjM0LTU2NzgtOTAxMi0zNDU2NzEyMzQ1NjciLCJlbWFpbCI6ImFkbWluQG1peHdhcnouY29tIiwicm9sZSI6IkFkbWluIiwibmJmIjoxNzMzMzg2NTk4LCJleHAiOjE3MzMzOTAxOTgsImlhdCI6MTczMzM4NjU5OCwiaXNzIjoiTWl4V2FyeiIsImF1ZCI6Ik1peFdhcnoifQ.Y5TR9J7ZfhTzKGDG6MfGnbTKKJXqGbSE7cXfb6gqK1w';

    try {
        // 1. Test Round 2 submissions endpoint
        console.log('\\n📡 Testing Round 2 submissions endpoint...');
        const response = await axios.get(
            `${baseUrl}/api/competitions/${competitionId}/voting/round2/submissions`,
            {
                headers: { Authorization: `Bearer ${adminToken}` },
                httpsAgent: new (require('https')).Agent({ rejectUnauthorized: false })
            }
        );

        console.log(`✅ Response Status: ${response.status}`);
        console.log(`📊 Number of submissions: ${response.data.submissions?.length || 0}`);

        if (response.data.submissions && response.data.submissions.length > 0) {
            console.log('\\n🎵 Submission Audio URLs:');
            console.log('-'.repeat(40));
            
            response.data.submissions.forEach((submission, index) => {
                console.log(`${index + 1}. Submission ID: ${submission.id}`);
                console.log(`   Title: ${submission.title}`);
                console.log(`   Audio URL: ${submission.audioUrl}`);
                console.log('');
            });

            // 2. Test actual file existence
            console.log('\\n📁 Checking file system...');
            console.log('-'.repeat(40));
            
            // Check the AppData/uploads directory structure
            const baseDir = path.join(process.cwd(), 'src', 'MixWarz.API', 'AppData', 'uploads');
            console.log(`Base uploads directory: ${baseDir}`);
            
            if (fs.existsSync(baseDir)) {
                console.log('✅ Base uploads directory exists');
                
                // Check submissions subdirectory
                const submissionsDir = path.join(baseDir, 'submissions');
                if (fs.existsSync(submissionsDir)) {
                    console.log('✅ Submissions directory exists');
                    
                    // Check competition subdirectory
                    const competitionDir = path.join(submissionsDir, competitionId.toString());
                    if (fs.existsSync(competitionDir)) {
                        console.log(`✅ Competition ${competitionId} directory exists`);
                        
                        // List all user directories
                        const userDirs = fs.readdirSync(competitionDir, { withFileTypes: true })
                            .filter(dirent => dirent.isDirectory())
                            .map(dirent => dirent.name);
                        
                        console.log(`📂 User directories found: ${userDirs.length}`);
                        userDirs.forEach(userDir => {
                            const userPath = path.join(competitionDir, userDir);
                            const files = fs.readdirSync(userPath);
                            console.log(`   User ${userDir}: ${files.length} files`);
                            files.forEach(file => {
                                console.log(`     - ${file}`);
                            });
                        });
                    } else {
                        console.log(`❌ Competition ${competitionId} directory does not exist`);
                    }
                } else {
                    console.log('❌ Submissions directory does not exist');
                }
            } else {
                console.log('❌ Base uploads directory does not exist');
            }

            // 3. Test audio URL accessibility
            console.log('\\n🌐 Testing audio URL accessibility...');
            console.log('-'.repeat(40));
            
            for (let i = 0; i < Math.min(3, response.data.submissions.length); i++) {
                const submission = response.data.submissions[i];
                console.log(`Testing submission ${submission.id}: ${submission.audioUrl}`);
                
                try {
                    const audioResponse = await axios.head(
                        `${baseUrl}${submission.audioUrl}`,
                        {
                            headers: { Authorization: `Bearer ${adminToken}` },
                            httpsAgent: new (require('https')).Agent({ rejectUnauthorized: false }),
                            timeout: 5000
                        }
                    );
                    console.log(`   ✅ Audio file accessible (${audioResponse.status})`);
                } catch (error) {
                    console.log(`   ❌ Audio file not accessible: ${error.response?.status || error.message}`);
                }
            }

        } else {
            console.log('❌ No submissions found for Round 2');
        }

        // 4. Compare database vs file system
        console.log('\\n💾 Database vs File System Comparison');
        console.log('-'.repeat(40));
        console.log('Expected path format: AppData/uploads/submissions/{competitionId}/{userId}/{file}');
        console.log('URL format from API: /uploads/submissions/{competitionId}/{userId}/{file}');
        
        if (response.data.submissions && response.data.submissions.length > 0) {
            response.data.submissions.forEach((submission, index) => {
                const urlPath = submission.audioUrl;
                console.log(`\\nSubmission ${submission.id}:`);
                console.log(`  API URL: ${urlPath}`);
                
                // Convert URL to file system path
                if (urlPath.startsWith('/uploads/')) {
                    const relativePath = urlPath.substring('/uploads/'.length);
                    const fullPath = path.join(process.cwd(), 'src', 'MixWarz.API', 'AppData', 'uploads', relativePath);
                    console.log(`  File Path: ${fullPath}`);
                    console.log(`  File Exists: ${fs.existsSync(fullPath) ? '✅ YES' : '❌ NO'}`);
                }
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.log('💡 Note: You may need to update the admin token in this script');
        }
    }
}

// Run the debug script
debugRound2AudioPaths().catch(console.error); 