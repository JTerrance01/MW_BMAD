const { Client } = require('pg');

async function checkAllColumns() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'MixWarz',
        user: 'postgres',
        password: 'Ready2go!'
    });

    try {
        await client.connect();
        console.log('🔗 Connected to database');

        const tables = ['Competitions', 'SubmissionGroups', 'Submissions', 'Round1Assignments'];

        for (const tableName of tables) {
            console.log(`\n📊 ${tableName.toUpperCase()} TABLE STRUCTURE:`);
            const structure = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);
            
            if (structure.rows.length > 0) {
                console.log(`${tableName} columns:`);
                structure.rows.forEach(row => {
                    console.log(`  - ${row.column_name} (${row.data_type})`);
                });
            } else {
                console.log(`No ${tableName} table found`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

checkAllColumns(); 