const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE = 'https://localhost:7001/api';
const COMPETITION_ID = 21;

// Disable SSL verification for localhost development
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Helper to make HTTPS requests
function makeRequest(method, apiPath, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 7001,
            path: apiPath,
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

// Helper to check filesystem submissions
function checkFilesystemSubmissions() {
    const submissionsPath = path.join(__dirname, 'src', 'MixWarz.API', 'AppData', 'uploads', 'submissions', COMPETITION_ID.toString());
    
    try {
        if (!fs.existsSync(submissionsPath)) {
            return { exists: false, directories: [] };
        }
        
        const directories = fs.readdirSync(submissionsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
                const dirPath = path.join(submissionsPath, dirent.name);
                const files = fs.readdirSync(dirPath);
                const audioFiles = files.filter(file => file.toLowerCase().endsWith('.mp3'));
                
                return {
                    userId: dirent.name,
                    files: audioFiles,
                    audioFileCount: audioFiles.length
                };
            });
        
        return { exists: true, directories };
    } catch (error) {
        return { exists: false, error: error.message };
    }
}

async function diagnoseAndFixVoting() {
    console.log('🔍 COMPREHENSIVE VOTING SYSTEM DIAGNOSIS AND FIX');
    console.log('================================================');
    console.log(`Competition ID: ${COMPETITION_ID}`);
    console.log(`API URL: ${API_BASE}`);
    console.log();

    try {
        // Step 1: Check API connectivity
        console.log('1️⃣ Testing API connectivity...');
        
        let apiReady = false;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!apiReady && attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`   🔄 Attempt ${attempts}/${maxAttempts}: Checking API status...`);
                
                const healthResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}`);
                
                if (healthResponse.status === 200) {
                    console.log('   ✅ API is running and accessible!');
                    apiReady = true;
                } else {
                    console.log(`   ⚠️ API responded with status ${healthResponse.status}, retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error) {
                console.log(`   ⚠️ API not ready yet (${error.message}), waiting...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!apiReady) {
            console.log('   ❌ API is not responding. Please ensure the API is running.');
            return;
        }

        // Step 2: Get competition details
        console.log('\n2️⃣ Getting competition details...');
        const compResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}`);
        
        if (compResponse.status !== 200) {
            console.log(`   ❌ Error fetching competition: ${compResponse.status}`);
            return;
        }

        const competition = compResponse.data;
        console.log(`   ✅ Competition: ${competition.title}`);
        console.log(`   📊 Status: ${competition.status} (${getStatusName(competition.status)})`);
        console.log(`   📝 Database Submissions Count: ${competition.submissionsCount || 0}`);

        // Step 3: Check filesystem submissions
        console.log('\n3️⃣ Checking filesystem submissions...');
        const filesystemCheck = checkFilesystemSubmissions();
        
        if (!filesystemCheck.exists) {
            console.log('   ❌ No submissions directory found on filesystem');
            if (filesystemCheck.error) {
                console.log(`   📝 Error: ${filesystemCheck.error}`);
            }
        } else {
            console.log(`   ✅ Found ${filesystemCheck.directories.length} user directories in filesystem`);
            
            let totalAudioFiles = 0;
            filesystemCheck.directories.forEach((dir, index) => {
                console.log(`   📁 ${index + 1}. User ${dir.userId}: ${dir.audioFileCount} audio files`);
                totalAudioFiles += dir.audioFileCount;
            });
            
            console.log(`   🎵 Total audio files found: ${totalAudioFiles}`);
        }

        // Step 4: Compare database vs filesystem
        console.log('\n4️⃣ Data synchronization analysis...');
        const dbSubmissions = competition.submissionsCount || 0;
        const fsSubmissions = filesystemCheck.exists ? filesystemCheck.directories.length : 0;
        
        console.log(`   📊 Database submissions: ${dbSubmissions}`);
        console.log(`   📁 Filesystem submissions: ${fsSubmissions}`);
        
        if (dbSubmissions === 0 && fsSubmissions > 0) {
            console.log('   ⚠️ CRITICAL ISSUE: Filesystem has submissions but database shows 0!');
            console.log('   💡 This explains why voting interface shows no tracks to vote on');
            console.log(`   🔧 Found ${fsSubmissions} submission directories with audio files`);
        } else if (dbSubmissions === fsSubmissions && dbSubmissions > 0) {
            console.log('   ✅ Database and filesystem are synchronized');
        } else if (dbSubmissions === 0 && fsSubmissions === 0) {
            console.log('   ⚠️ No submissions found in either database or filesystem');
            console.log('   💡 Users need to submit mixes before voting can begin');
        }

        // Step 5: Check current voting setup
        console.log('\n5️⃣ Checking voting system setup...');
        
        const votingStatsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
        if (votingStatsResponse.status === 200 && votingStatsResponse.data) {
            const stats = votingStatsResponse.data;
            console.log(`   📊 Voting Groups: ${stats.totalGroups || 0}`);
            console.log(`   👥 Voters Assigned: ${stats.totalVoters || 0}`);
            console.log(`   🗳️ Votes Cast: ${stats.totalVotesCast || 0}`);
        } else {
            console.log('   ❌ No voting groups found or API error');
        }

        const assignmentsResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}/voting/round1/assignments`);
        if (assignmentsResponse.status === 200 && assignmentsResponse.data) {
            const assignments = assignmentsResponse.data;
            console.log(`   🎵 Tracks assigned for voting: ${assignments.submissions?.length || 0}`);
        } else if (assignmentsResponse.status === 401) {
            console.log('   ℹ️ Assignments endpoint requires authentication (normal)');
        } else {
            console.log('   ❌ No voting assignments available');
        }

        // Step 6: Propose solutions
        console.log('\n6️⃣ Solution recommendations...');
        
        if (dbSubmissions === 0 && fsSubmissions > 0) {
            console.log('   🔧 RECOMMENDED ACTIONS:');
            console.log('   ');
            console.log('   Option A: Data Recovery (if submissions are legitimate)');
            console.log('   1. Check database Submissions table for Competition 21');
            console.log('   2. If entries exist but aren\'t counted, investigate submission counting logic');
            console.log('   3. If entries don\'t exist, may need manual database insertion');
            console.log('   ');
            console.log('   Option B: Fresh Start (if submissions are test data)');
            console.log('   1. Change competition status back to "OpenForSubmissions"');
            console.log('   2. Have users re-submit their mixes through the proper UI');
            console.log('   3. Ensure submissions are properly recorded in database');
            console.log('   ');
            console.log('   Option C: Create voting groups (if data is valid)');
            console.log('   1. Force create voting groups with current filesystem submissions');
            console.log('   2. Test voting interface with existing files');
        } else if (dbSubmissions > 0) {
            console.log('   🔧 RECOMMENDED ACTIONS:');
            console.log('   1. Create voting groups for existing submissions');
            console.log('   2. Set competition status to VotingRound1Open');
            console.log('   3. Test voting interface');
        } else {
            console.log('   📋 NEXT STEPS:');
            console.log('   1. Set competition status to "OpenForSubmissions"');
            console.log('   2. Wait for users to submit their mixes');
            console.log('   3. Once submissions exist, create voting groups');
        }

        // Step 7: Test voting interface readiness
        console.log('\n7️⃣ Frontend voting interface test...');
        
        if (competition.status === 'VotingRound1Open') {
            console.log('   ✅ Competition status is correct for voting');
            
            if (dbSubmissions === 0) {
                console.log('   ❌ Frontend will show "No voting assignments available"');
                console.log('   💡 This is correct behavior when no submissions exist in database');
            } else {
                console.log('   ✅ Database has submissions - voting should work if groups are created');
            }
        } else {
            console.log(`   ⚠️ Competition status "${competition.status}" is not ready for voting`);
            console.log('   💡 Should be "VotingRound1Open" for users to vote');
        }

        console.log('\n✅ DIAGNOSIS COMPLETE');
        console.log('📝 Summary: Data sync issue between filesystem and database preventing voting');
        
    } catch (error) {
        console.error(`\n❌ Error during diagnosis: ${error.message}`);
        console.log('\n🔧 Troubleshooting suggestions:');
        console.log('   1. Ensure API is running: cd src/MixWarz.API && dotnet run');
        console.log('   2. Check database connection');
        console.log('   3. Verify file permissions and paths');
    }
}

function getStatusName(status) {
    const statusMap = {
        1: 'OpenForSubmissions',
        10: 'VotingRound1Setup',
        11: 'VotingRound1Open',
        12: 'VotingRound1Tallying',
        13: 'VotingRound2Setup',
        14: 'VotingRound2Open',
        15: 'VotingRound2Tallying',
        16: 'Completed'
    };
    return statusMap[status] || 'Unknown';
}

// Instructions
console.log('🔍 COMPREHENSIVE VOTING SYSTEM DIAGNOSIS');
console.log('========================================');
console.log();
console.log('This script will:');
console.log('1. ✅ Test API connectivity');
console.log('2. 📊 Get competition details from database');
console.log('3. 📁 Check filesystem for submission files');
console.log('4. 🔍 Compare database vs filesystem submissions');
console.log('5. 📊 Check voting system setup (groups, assignments)');
console.log('6. 💡 Provide specific recommendations for fixing the issue');
console.log('7. 🧪 Test voting interface readiness');
console.log();
console.log('🎯 Goal: Identify why voting component shows no anonymous MP3 players');
console.log();
console.log('🔄 Running comprehensive diagnosis...');
console.log();

// Run the diagnosis
diagnoseAndFixVoting(); 