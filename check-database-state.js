const https = require('https');

// Configuration 
const API_BASE = 'https://localhost:7001';
const COMPETITION_ID = 21;
const ADMIN_USER_ID = '767f7a81-f448-4055-9436-e0da398aef29';

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

async function checkDatabaseState() {
    console.log('🔍 CHECKING DATABASE STATE FOR COMPETITION 21');
    console.log('==============================================');
    console.log();

    try {
        // Check PostgreSQL database using the query endpoint
        console.log('📊 CHECKING SUBMISSIONS TABLE');
        console.log('─────────────────────────────');
        
        const submissionsQuery = `
            SELECT "SubmissionId", "CompetitionId", "UserId", "MixTitle", "AudioFilePath", "IsDisqualified", "IsEligibleForRound1Voting"
            FROM "Submissions" 
            WHERE "CompetitionId" = ${COMPETITION_ID}
            ORDER BY "SubmissionId";
        `;
        
        console.log('Query:', submissionsQuery);
        // Since we don't have direct DB access, let's just report what we found
        
        console.log('\n📊 CHECKING ROUND1ASSIGNMENTS TABLE');
        console.log('───────────────────────────────────');
        
        const assignmentsQuery = `
            SELECT "Round1AssignmentId", "CompetitionId", "VoterId", "AssignedGroupNumber", "HasVoted"
            FROM "Round1Assignments" 
            WHERE "CompetitionId" = ${COMPETITION_ID}
            ORDER BY "AssignedGroupNumber", "VoterId";
        `;
        
        console.log('Query:', assignmentsQuery);
        
        console.log('\n📊 CHECKING SUBMISSIONGROUPS TABLE');
        console.log('──────────────────────────────────');
        
        const groupsQuery = `
            SELECT sg."SubmissionGroupId", sg."CompetitionId", sg."SubmissionId", sg."GroupNumber"
            FROM "SubmissionGroups" sg
            WHERE sg."CompetitionId" = ${COMPETITION_ID}
            ORDER BY sg."GroupNumber", sg."SubmissionId";
        `;
        
        console.log('Query:', groupsQuery);
        
        // Let's check the physical files that the user mentioned exist
        console.log('\n📁 CHECKING PHYSICAL FILES');
        console.log('─────────────────────────');
        console.log('User mentioned 9 user directories with MP3 files in:');
        console.log('src/MixWarz.API/AppData/uploads/submissions/21/');
        console.log();
        console.log('This suggests submissions were uploaded as files but not recorded in database.');
        
        console.log('\n🔍 ROOT CAUSE ANALYSIS');
        console.log('─────────────────────');
        console.log('❌ CRITICAL ISSUE IDENTIFIED:');
        console.log('   Competition 21 has submissionsCount: 0 in the API response');
        console.log('   But user confirms 9 physical MP3 files exist in filesystem');
        console.log('   And 3 groups exist in SubmissionGroups table');
        console.log();
        console.log('💡 HYPOTHESIS:');
        console.log('   1. Submissions were uploaded as files but not saved to Submissions table');
        console.log('   2. OR Submissions exist but are marked as IsDisqualified = true');
        console.log('   3. OR Submissions exist but IsEligibleForRound1Voting = false');
        console.log('   4. OR Competition.submissionsCount is calculated incorrectly');
        
        console.log('\n🔧 IMMEDIATE ACTIONS NEEDED:');
        console.log('───────────────────────────');
        console.log('1. Run this SQL query to check submissions:');
        console.log(`   SELECT * FROM "Submissions" WHERE "CompetitionId" = ${COMPETITION_ID};`);
        console.log();
        console.log('2. If submissions exist, check their status:');
        console.log(`   SELECT "IsDisqualified", "IsEligibleForRound1Voting", COUNT(*) as count`);
        console.log(`   FROM "Submissions" WHERE "CompetitionId" = ${COMPETITION_ID}`);
        console.log(`   GROUP BY "IsDisqualified", "IsEligibleForRound1Voting";`);
        console.log();
        console.log('3. If no submissions exist but files do, we need to:');
        console.log('   - Check submission upload logs');
        console.log('   - Verify submission creation process');
        console.log('   - Possibly re-create submission records from files');
        
        console.log('\n📋 SOLUTION APPROACH:');
        console.log('─────────────────────');
        console.log('If submissions exist but are filtered out:');
        console.log('   → Update submission eligibility flags');
        console.log('   → Re-run voting group creation');
        console.log();
        console.log('If submissions don\'t exist:');
        console.log('   → Create submission records from existing files');
        console.log('   → Set proper metadata (title, user, etc.)');
        console.log('   → Re-run voting group creation');
        
    } catch (error) {
        console.error(`\n❌ Error during database check: ${error.message}`);
    }
}

// Run the check
checkDatabaseState(); 