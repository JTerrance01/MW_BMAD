const { Client } = require('pg');

// Database connection configuration (from appsettings.Development.json)
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'MixWarz',
  user: 'postgres',
  password: 'Ready2go!'
});

async function checkAndAddThirdPlaceVotes() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check if ThirdPlaceVotes column exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'SubmissionGroups' 
      AND column_name = 'ThirdPlaceVotes';
    `;

    const result = await client.query(checkColumnQuery);
    
    if (result.rows.length === 0) {
      console.log('ThirdPlaceVotes column does not exist. Adding it...');
      
      // Add the column
      const addColumnQuery = `
        ALTER TABLE "SubmissionGroups" 
        ADD COLUMN "ThirdPlaceVotes" integer;
      `;
      
      await client.query(addColumnQuery);
      console.log('✅ ThirdPlaceVotes column added successfully!');
    } else {
      console.log('✅ ThirdPlaceVotes column already exists.');
    }

    // Show current column structure
    const showColumnsQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'SubmissionGroups' 
      ORDER BY ordinal_position;
    `;

    const columns = await client.query(showColumnsQuery);
    console.log('\nSubmissionGroups table structure:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAndAddThirdPlaceVotes(); 