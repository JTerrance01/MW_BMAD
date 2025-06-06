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
        console.log('🔌 Connected to database');

        // Check Round1Assignments table structure
        console.log('\n📋 ROUND1ASSIGNMENTS TABLE STRUCTURE:');
        const round1StructureQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'Round1Assignments' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `;
        
        const round1StructureResult = await client.query(round1StructureQuery);
        round1StructureResult.rows.forEach((col, index) => {
            console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });

        // Check Users table structure for Round2 eligibility
        console.log('\n👤 ASPNETUSERS TABLE STRUCTURE (relevant fields):');
        const usersStructureQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'AspNetUsers' 
            AND table_schema = 'public'
            AND (column_name LIKE '%Round2%' OR column_name LIKE '%Eligible%' OR column_name LIKE '%Disqualif%')
            ORDER BY ordinal_position
        `;
        
        const usersStructureResult = await client.query(usersStructureQuery);
        if (usersStructureResult.rows.length > 0) {
            usersStructureResult.rows.forEach((col, index) => {
                console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
            });
        } else {
            console.log('   No Round2/Eligibility columns found in AspNetUsers table');
        }

        // Check if there's a separate Round2Assignments table
        console.log('\n🔍 CHECKING FOR ROUND2 RELATED TABLES:');
        const round2TablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%Round2%' OR table_name LIKE '%Voting%')
            ORDER BY table_name
        `;
        
        const round2TablesResult = await client.query(round2TablesQuery);
        if (round2TablesResult.rows.length > 0) {
            console.log('   Found Round2/Voting related tables:');
            round2TablesResult.rows.forEach((table, index) => {
                console.log(`   ${index + 1}. ${table.table_name}`);
            });
        } else {
            console.log('   No Round2/Voting specific tables found');
        }

        // Sample data from Round1Assignments
        console.log('\n📊 SAMPLE DATA FROM ROUND1ASSIGNMENTS:');
        const sampleDataQuery = `
            SELECT * FROM "Round1Assignments" 
            WHERE "CompetitionId" = 21 
            LIMIT 3
        `;
        
        const sampleDataResult = await client.query(sampleDataQuery);
        if (sampleDataResult.rows.length > 0) {
            console.log('   Sample records:');
            sampleDataResult.rows.forEach((row, index) => {
                console.log(`   ${index + 1}. VoterId: ${row.VoterId}, Group: ${row.AssignedGroupNumber}, HasVoted: ${row.HasVoted}`);
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

checkTableStructure(); 