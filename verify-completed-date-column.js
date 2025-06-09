const { Pool } = require('pg');

async function verifyCompletedDateColumn() {
  console.log('🔍 Verifying CompletedDate column in Competitions table...\n');
  
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'MixWarz',
    password: 'Ready2go!',
    port: 5432,
  });

  try {
    // Check if CompletedDate column exists
    console.log('📊 Checking Competitions table structure...');
    const columnQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Competitions' 
      AND column_name = 'CompletedDate';
    `;
    
    const columnResult = await pool.query(columnQuery);
    
    if (columnResult.rows.length > 0) {
      console.log('✅ CompletedDate column found!');
      console.log('Column details:', columnResult.rows[0]);
    } else {
      console.log('❌ CompletedDate column NOT found');
    }
    
    // Show all columns in Competitions table
    console.log('\n📋 All columns in Competitions table:');
    const allColumnsQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Competitions' 
      ORDER BY ordinal_position;
    `;
    
    const allColumnsResult = await pool.query(allColumnsQuery);
    allColumnsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    // Check specific competition (if any exist)
    console.log('\n🏆 Checking Competition 21 CompletedDate...');
    const competitionQuery = `
      SELECT "CompetitionId", "Title", "Status", "CompletedDate", "CreationDate"
      FROM "Competitions" 
      WHERE "CompetitionId" = 21;
    `;
    
    const competitionResult = await pool.query(competitionQuery);
    
    if (competitionResult.rows.length > 0) {
      const comp = competitionResult.rows[0];
      console.log('Competition 21 details:');
      console.log('- Title:', comp.Title);
      console.log('- Status:', comp.Status);
      console.log('- CompletedDate:', comp.CompletedDate || 'NULL');
      console.log('- CreationDate:', comp.CreationDate);
    } else {
      console.log('Competition 21 not found');
    }
    
    console.log('\n✅ Database verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying database:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the verification
verifyCompletedDateColumn(); 