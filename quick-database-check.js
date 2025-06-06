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

async function quickDatabaseCheck() {
    console.log('⚡ QUICK DATABASE CHECK');
    console.log('======================');
    console.log();

    try {
        const competitionResponse = await makeRequest('GET', `/api/competitions/${COMPETITION_ID}`);
        
        if (competitionResponse.status === 200) {
            const comp = competitionResponse.data;
            console.log(`📊 Competition: ${comp.title}`);
            console.log(`📊 Status: ${comp.status}`);
            console.log(`📊 Submissions Count: ${comp.submissionsCount}`);
            console.log();
            
            if (comp.submissionsCount === 0) {
                console.log('❌ STILL BROKEN: Database records not created yet');
                console.log();
                console.log('📝 TO FIX:');
                console.log('1. Open your database management tool (pgAdmin, DBeaver, etc.)');
                console.log('2. Connect to your MixWarz database');
                console.log('3. Execute the SQL statements from fix-competition-21-database.sql');
                console.log('4. Run this script again to verify');
                console.log();
                console.log('💡 Or use command line:');
                console.log('   psql -d your_database_name -f fix-competition-21-database.sql');
                
            } else if (comp.submissionsCount >= 10) {
                console.log('✅ SUCCESS: Database records created!');
                console.log(`✅ Found ${comp.submissionsCount} submissions`);
                console.log();
                console.log('🔄 NEXT STEPS:');
                console.log('1. Run: node verify-voting-fix.js');
                console.log('2. Test the frontend voting interface');
                console.log('3. VotingRound1Card should now show submissions to vote on');
                
            } else {
                console.log(`⚠️ PARTIAL: Found ${comp.submissionsCount} submissions (expected 10)`);
                console.log('Some records may have been created but not all');
            }
        } else {
            console.log(`❌ API Error: ${competitionResponse.status}`);
        }

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

// Run the check
quickDatabaseCheck(); 