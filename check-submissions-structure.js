const { Client } = require('pg');

async function checkSubmissionsStructure() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'MixWarz',
        user: 'postgres',
        password: 'Ready2go!'
    });

    try {
        await client.connect();
        console.log('🔌 Connected to database');

        // Check Submissions table structure
        console.log('\n📋 SUBMISSIONS TABLE STRUCTURE:');
        const submissionsStructureQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'Submissions' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `;
        
        const submissionsStructureResult = await client.query(submissionsStructureQuery);
        submissionsStructureResult.rows.forEach((col, index) => {
            console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });

        // Sample data to see the actual column values
        console.log('\n📊 SAMPLE DATA FROM SUBMISSIONS:');
        const sampleDataQuery = `
            SELECT * FROM "Submissions" 
            WHERE "CompetitionId" = 21 
            LIMIT 3
        `;
        
        const sampleDataResult = await client.query(sampleDataQuery);
        if (sampleDataResult.rows.length > 0) {
            console.log('   Sample records:');
            sampleDataResult.rows.forEach((row, index) => {
                console.log(`   ${index + 1}. SubmissionId: ${row.SubmissionId}`);
                console.log(`      Full row:`, JSON.stringify(row, null, 2));
            });
        }

    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

checkSubmissionsStructure(); 