const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'MixWarz',
  user: 'postgres',
  password: 'Ready2go!'
});

async function checkAllColumns() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'SubmissionGroups' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nComplete SubmissionGroups table structure:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if we have the vote-related columns
    const voteColumns = ['TotalPoints', 'FirstPlaceVotes', 'SecondPlaceVotes', 'ThirdPlaceVotes'];
    const existingColumns = result.rows.map(row => row.column_name);
    
    console.log('\nVote-related columns status:');
    voteColumns.forEach(col => {
      const exists = existingColumns.includes(col);
      console.log(`- ${col}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAllColumns(); 