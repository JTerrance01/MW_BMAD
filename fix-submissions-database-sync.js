const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;
const SUBMISSIONS_DIR = 'src/MixWarz.API/AppData/uploads/submissions/21';

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

function scanSubmissionsDirectory() {
    console.log('📁 SCANNING SUBMISSIONS DIRECTORY');
    console.log('─────────────────────────────────');
    
    const submissions = [];
    
    try {
        if (!fs.existsSync(SUBMISSIONS_DIR)) {
            console.log(`   ❌ Directory not found: ${SUBMISSIONS_DIR}`);
            return submissions;
        }

        const userDirs = fs.readdirSync(SUBMISSIONS_DIR);
        console.log(`   📊 Found ${userDirs.length} user directories`);

        for (const userId of userDirs) {
            const userDir = path.join(SUBMISSIONS_DIR, userId);
            
            if (fs.statSync(userDir).isDirectory()) {
                const files = fs.readdirSync(userDir);
                const mp3Files = files.filter(f => f.toLowerCase().endsWith('.mp3'));
                
                console.log(`   👤 User ${userId}: ${mp3Files.length} MP3 files`);
                
                for (const fileName of mp3Files) {
                    const filePath = path.join(userDir, fileName);
                    const stats = fs.statSync(filePath);
                    
                    // Extract submission info from filename
                    // Format appears to be: {guid}-{title}.mp3
                    const parts = fileName.split('-');
                    const submissionGuid = parts[0];
                    const title = parts.slice(1).join('-').replace('.mp3', '').trim();
                    
                    submissions.push({
                        userId: userId,
                        fileName: fileName,
                        filePath: `/uploads/submissions/${COMPETITION_ID}/${userId}/${fileName}`,
                        title: title || `Submission by ${userId.substring(0, 8)}`,
                        submissionGuid: submissionGuid,
                        fileSize: stats.size,
                        createdDate: stats.birthtime
                    });
                    
                    console.log(`      📄 ${fileName} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
                }
            }
        }
        
        console.log(`   ✅ Total submissions found: ${submissions.length}`);
        return submissions;
        
    } catch (error) {
        console.error(`   ❌ Error scanning directory: ${error.message}`);
        return submissions;
    }
}

async function fixSubmissionsAndVoting() {
    console.log('🔧 FIXING SUBMISSIONS DATABASE SYNC AND VOTING');
    console.log('===============================================');
    console.log(`Competition ID: ${COMPETITION_ID}`);
    console.log(`Submissions Directory: ${SUBMISSIONS_DIR}`);
    console.log();

    try {
        // Step 1: Scan the submissions directory
        const fileSubmissions = scanSubmissionsDirectory();
        
        if (fileSubmissions.length === 0) {
            console.log('❌ No submission files found - cannot proceed');
            return;
        }

        // Step 2: Check current competition state
        console.log('\n📊 CHECKING CURRENT COMPETITION STATE');
        console.log('────────────────────────────────────');
        
        const competitionResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}`);
        if (competitionResponse.status !== 200) {
            console.log(`❌ Failed to get competition: ${competitionResponse.status}`);
            return;
        }
        
        const competition = competitionResponse.data;
        console.log(`   📊 Title: ${competition.title}`);
        console.log(`   📊 Status: ${competition.status}`);
        console.log(`   📊 Current Submissions Count: ${competition.submissionsCount}`);

        // Step 3: Create missing submission records
        console.log('\n💾 CREATING MISSING SUBMISSION RECORDS');
        console.log('─────────────────────────────────────');
        
        console.log('   ⚠️  NOTE: This step requires direct database access or API endpoints');
        console.log('   📝 We need to create submission records for these files:');
        console.log();
        
        for (let i = 0; i < fileSubmissions.length; i++) {
            const sub = fileSubmissions[i];
            console.log(`   ${i + 1}. User: ${sub.userId.substring(0, 8)}...`);
            console.log(`      Title: "${sub.title}"`);
            console.log(`      File: ${sub.fileName}`);
            console.log(`      Path: ${sub.filePath}`);
            console.log(`      Size: ${(sub.fileSize / 1024 / 1024).toFixed(1)}MB`);
            console.log();
        }

        // Step 4: Provide SQL statements to create submissions
        console.log('🔧 MANUAL DATABASE FIX REQUIRED');
        console.log('───────────────────────────────');
        console.log('Run these SQL statements to create the missing submissions:');
        console.log();
        
        for (let i = 0; i < fileSubmissions.length; i++) {
            const sub = fileSubmissions[i];
            const submissionId = i + 1; // Simple incrementing ID
            
            console.log(`-- Submission ${submissionId}`);
            console.log(`INSERT INTO "Submissions" (`);
            console.log(`    "CompetitionId", "UserId", "MixTitle", "MixDescription",`);
            console.log(`    "AudioFilePath", "SubmissionDate", "IsDisqualified", "IsEligibleForRound1Voting",`);
            console.log(`    "AdvancedToRound2", "IsEligibleForRound2Voting"`);
            console.log(`) VALUES (`);
            console.log(`    ${COMPETITION_ID}, '${sub.userId}', '${sub.title.replace(/'/g, "''")}', 'Auto-imported submission',`);
            console.log(`    '${sub.filePath}', '${sub.createdDate.toISOString()}', false, true,`);
            console.log(`    false, false`);
            console.log(`);`);
            console.log();
        }

        // Step 5: After manual DB fix, re-create voting groups
        console.log('🗳️  AFTER DATABASE FIX - RE-CREATE VOTING GROUPS');
        console.log('─────────────────────────────────────────────');
        console.log('After running the SQL statements above, execute:');
        console.log();
        console.log('1. Clear existing voting assignments:');
        console.log(`   DELETE FROM "Round1Assignments" WHERE "CompetitionId" = ${COMPETITION_ID};`);
        console.log(`   DELETE FROM "SubmissionGroups" WHERE "CompetitionId" = ${COMPETITION_ID};`);
        console.log();
        console.log('2. Re-create voting groups via API:');
        console.log(`   POST ${API_BASE}/api/competitions/${COMPETITION_ID}/round1/create-groups`);
        console.log('   Body: { "targetGroupSize": 20 }');
        console.log();
        console.log('3. Verify the fix:');
        console.log(`   GET ${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`);

        // Step 6: Test voting assignments after fix
        console.log('\n✅ VERIFICATION STEPS');
        console.log('─────────────────────');
        console.log('After completing the manual database fix:');
        console.log();
        console.log('1. Check competition submissions count:');
        console.log(`   GET ${API_BASE}/api/competitions/${COMPETITION_ID}`);
        console.log('   → Should show submissionsCount: 9');
        console.log();
        console.log('2. Test voting assignments:');
        console.log(`   GET ${API_BASE}/api/competitions/${COMPETITION_ID}/voting/round1/assignments`);
        console.log('   → Should return submissions for admin to vote on');
        console.log();
        console.log('3. Check voting statistics:');
        console.log(`   GET ${API_BASE}/api/competitions/${COMPETITION_ID}/round1/voting-stats`);
        console.log('   → Should show voters assigned to groups');

        console.log('\n🎉 COMPREHENSIVE FIX PLAN COMPLETE');
        console.log('═══════════════════════════════════');
        console.log('Summary:');
        console.log(`• Found ${fileSubmissions.length} submission files in filesystem`);
        console.log('• Provided SQL to create missing database records');
        console.log('• Outlined steps to re-create voting groups');
        console.log('• Included verification steps');
        console.log();
        console.log('Execute the SQL statements above, then re-run voting group creation!');

    } catch (error) {
        console.error(`\n❌ Error during fix process: ${error.message}`);
    }
}

// Run the fix
fixSubmissionsAndVoting(); 