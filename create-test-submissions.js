const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function createTestSubmissions() {
    console.log('🎵 Creating Test Submissions for Competition 21');
    console.log('===============================================\n');

    try {
        // First, let's check the competition status
        console.log('1️⃣ Checking Competition 21...');
        const competitionResponse = await fetch(`${API_BASE}/competitions/21`);
        
        if (!competitionResponse.ok) {
            throw new Error(`Failed to fetch competition: ${competitionResponse.status}`);
        }
        
        const competition = await competitionResponse.json();
        console.log(`   Competition: ${competition.title}`);
        console.log(`   Status: ${competition.status}`);
        console.log(`   Current Submissions: ${competition.submissionsCount}\n`);

        // If competition is in voting status, we need to reset it to accept submissions
        if (competition.status === 'VotingRound1Open' || competition.status === 'VotingRound1Setup') {
            console.log('2️⃣ Resetting competition to accept submissions...');
            
            const resetResponse = await fetch(`${API_BASE}/v1/admin/competitions/21/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'OpenForSubmissions' // Status 1
                })
            });

            if (!resetResponse.ok) {
                console.log(`   ⚠️ Could not reset competition status: ${resetResponse.status}`);
                console.log('   Continuing with current status...');
            } else {
                console.log('   ✅ Competition reset to OpenForSubmissions');
            }
        }

        // Create test submissions using the API
        console.log('\n3️⃣ Creating test submissions...');
        
        const testSubmissions = [
            {
                title: "Midnight Groove",
                artistName: "beatmaker42",
                userId: "user-1", // This should match seeded user IDs
                audioFileUrl: "https://localhost:7001/uploads/submissions/test-track-1.mp3"
            },
            {
                title: "Synth Dreams",
                artistName: "synth_queen",
                userId: "user-2",
                audioFileUrl: "https://localhost:7001/uploads/submissions/test-track-2.mp3"
            },
            {
                title: "Bass Drop Revolution",
                artistName: "bass_addict",
                userId: "user-3",
                audioFileUrl: "https://localhost:7001/uploads/submissions/test-track-3.mp3"
            },
            {
                title: "Electronic Fusion",
                artistName: "edm_producer",
                userId: "user-4",
                audioFileUrl: "https://localhost:7001/uploads/submissions/test-track-4.mp3"
            },
            {
                title: "Vinyl Vibes",
                artistName: "vinyl_junkie",
                userId: "user-5",
                audioFileUrl: "https://localhost:7001/uploads/submissions/test-track-5.mp3"
            },
            {
                title: "Loop Master",
                artistName: "loop_queen",
                userId: "user-6",
                audioFileUrl: "https://localhost:7001/uploads/submissions/test-track-6.mp3"
            },
            {
                title: "Orchestral Electronic",
                artistName: "master_composer",
                userId: "user-7",
                audioFileUrl: "https://localhost:7001/uploads/submissions/test-track-7.mp3"
            },
            {
                title: "Sound Sculpture",
                artistName: "sound_sculptor",
                userId: "user-8",
                audioFileUrl: "https://localhost:7001/uploads/submissions/test-track-8.mp3"
            },
            {
                title: "Drum Machine Magic",
                artistName: "drum_machine",
                userId: "user-9",
                audioFileUrl: "https://localhost:7001/uploads/submissions/test-track-9.mp3"
            }
        ];

        // Note: Since we don't have actual authentication tokens, we'll create submissions directly in the database
        // This is a simplified approach for testing purposes
        
        console.log('   📝 Note: Creating submissions directly via database...');
        console.log('   (In production, this would use authenticated API calls)\n');

        // Instead of API calls, let's create a SQL script to insert the submissions
        const sqlStatements = testSubmissions.map((submission, index) => {
            const submissionId = 100 + index; // Start from ID 100 to avoid conflicts
            return `
INSERT INTO "Submissions" (
    "SubmissionId", "CompetitionId", "UserId", "Title", "ArtistName", 
    "AudioFileUrl", "SubmissionDate", "IsDisqualified", "IsEligibleForRound1Voting"
) VALUES (
    ${submissionId}, 21, '${submission.userId}', '${submission.title}', '${submission.artistName}',
    '${submission.audioFileUrl}', '${new Date().toISOString()}', false, true
);`;
        }).join('\n');

        console.log('4️⃣ SQL statements to create test submissions:');
        console.log('   Copy and execute these in your database:\n');
        console.log(sqlStatements);

        console.log('\n5️⃣ After running the SQL statements:');
        console.log('   1. Update competition status to VotingRound1Setup');
        console.log('   2. Use the admin interface to create voting groups');
        console.log('   3. Test the voting assignments');

        console.log('\n🎯 Quick setup commands:');
        console.log('   1. Execute the SQL above');
        console.log('   2. PUT /api/v1/admin/competitions/21/status with {"status": "VotingRound1Setup"}');
        console.log('   3. POST /api/competitions/21/round1/create-groups');
        console.log('   4. Test GET /api/competitions/21/voting/round1/assignments?userId=user-1');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the script
createTestSubmissions(); 