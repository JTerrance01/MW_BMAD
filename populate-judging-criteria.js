const { Client } = require('pg');

async function populateJudgingCriteria() {
    // Database connection
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'mixwarz_dev',
        user: 'postgres',
        password: 'postgres'
    });

    try {
        await client.connect();
        console.log('🔗 Connected to database');

        // Check if JudgingCriteria already exist
        const existingCriteria = await client.query('SELECT COUNT(*) FROM "JudgingCriterias"');
        if (parseInt(existingCriteria.rows[0].count) > 0) {
            console.log('✅ JudgingCriteria already exist, skipping...');
            return;
        }

        // Get competition ID (preferably 21, or the first available)
        const competitionQuery = await client.query('SELECT "CompetitionId" FROM "Competitions" ORDER BY "CompetitionId" LIMIT 1');
        
        if (competitionQuery.rows.length === 0) {
            console.log('❌ No competitions found. Please create a competition first.');
            return;
        }

        const competitionId = competitionQuery.rows[0].CompetitionId;
        console.log(`📋 Using competition ID: ${competitionId}`);

        // Insert JudgingCriteria
        const criteriaInserts = [
            [1, competitionId, 'Technical Clarity', 'Overall mix clarity, frequency balance, technical execution', 1, 1, 10, 0.3, 1, false, null],
            [2, competitionId, 'Creative Balance', 'Creative use of effects, spatial placement, artistic vision', 1, 1, 10, 0.25, 2, false, null],
            [3, competitionId, 'Dynamic Range', 'Use of dynamics, compression, overall punch', 2, 1, 5, 0.2, 3, false, null],
            [4, competitionId, 'Stereo Imaging', 'Width, depth, stereo field utilization', 3, 1, 4, 0.25, 4, false, '["Poor","Fair","Good","Excellent"]']
        ];

        for (const [id, compId, name, description, scoringType, minScore, maxScore, weight, displayOrder, isCommentRequired, scoringOptions] of criteriaInserts) {
            await client.query(`
                INSERT INTO "JudgingCriterias" 
                ("Id", "CompetitionId", "Name", "Description", "ScoringType", "MinScore", "MaxScore", "Weight", "DisplayOrder", "IsCommentRequired", "ScoringOptions", "CreatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            `, [id, compId, name, description, scoringType, minScore, maxScore, weight, displayOrder, isCommentRequired, scoringOptions]);
            
            console.log(`✅ Created criteria: ${name}`);
        }

        console.log('🎉 Successfully created all JudgingCriteria records!');

        // Verify the inserts
        const verifyQuery = await client.query('SELECT "Id", "Name", "CompetitionId" FROM "JudgingCriterias" ORDER BY "Id"');
        console.log('\n📊 Verification:');
        verifyQuery.rows.forEach(row => {
            console.log(`   ID ${row.Id}: ${row.Name} (Competition ${row.CompetitionId})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Run the script
populateJudgingCriteria().catch(console.error); 