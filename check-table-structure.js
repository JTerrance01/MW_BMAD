const { Client } = require('pg');

async function checkTableStructure() {
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

        // Check table names
        console.log('\n📊 CHECKING TABLE NAMES:');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%ompetition%' OR table_name LIKE '%ubmission%' OR table_name LIKE '%ound1%'
            ORDER BY table_name
        `);
        
        console.log('Tables found:');
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        // Check Competitions table structure
        console.log('\n📊 COMPETITIONS TABLE STRUCTURE:');
        const competitionsStructure = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Competitions' OR table_name = 'competitions'
            ORDER BY ordinal_position
        `);
        
        if (competitionsStructure.rows.length > 0) {
            console.log('Competitions columns:');
            competitionsStructure.rows.forEach(row => {
                console.log(`  - ${row.column_name} (${row.data_type})`);
            });
        } else {
            console.log('No Competitions table found');
        }

        // Try a simple select to see what works
        console.log('\n📊 TESTING SIMPLE QUERIES:');
        
        try {
            const testResult = await client.query('SELECT * FROM "Competitions" LIMIT 1');
            console.log('✅ "Competitions" with quotes works');
            console.log('Columns:', Object.keys(testResult.rows[0] || {}));
        } catch (error) {
            console.log('❌ "Competitions" with quotes failed:', error.message);
        }

        try {
            const testResult2 = await client.query('SELECT * FROM Competitions LIMIT 1');
            console.log('✅ Competitions without quotes works');
            console.log('Columns:', Object.keys(testResult2.rows[0] || {}));
        } catch (error) {
            console.log('❌ Competitions without quotes failed:', error.message);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

checkTableStructure(); 