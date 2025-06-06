const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'MixWarz',
  user: 'postgres',
  password: 'Ready2go!'
});

async function checkAudioUrls() {
  try {
    const client = await pool.connect();
    
    console.log('🔍 Checking audio URLs for Competition 21 submissions...\n');
    
    const result = await client.query(`
      SELECT s."SubmissionId", s."AudioUrl", s."MixTitle", s."UserId"
      FROM "Submissions" s 
      WHERE s."CompetitionId" = 21 
      ORDER BY s."SubmissionId";
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No submissions found for Competition 21');
      return;
    }
    
    console.log(`✅ Found ${result.rows.length} submissions for Competition 21:\n`);
    
    result.rows.forEach((submission, index) => {
      console.log(`📀 Submission ${index + 1}:`);
      console.log(`   ID: ${submission.SubmissionId}`);
      console.log(`   Title: ${submission.MixTitle || 'No title'}`);
      console.log(`   User ID: ${submission.UserId}`);
      console.log(`   Audio URL: ${submission.AudioUrl || 'NULL'}`);
      console.log('');
    });
    
    // Check if files exist in filesystem
    const fs = require('fs');
    const path = require('path');
    const submissionsDir = path.join(__dirname, 'src/MixWarz.API/AppData/uploads/submissions/21');
    
    console.log('🔍 Checking filesystem for audio files...\n');
    console.log(`Directory: ${submissionsDir}\n`);
    
    if (fs.existsSync(submissionsDir)) {
      const files = fs.readdirSync(submissionsDir, { withFileTypes: true });
      const audioFiles = files.filter(file => file.isFile() && file.name.endsWith('.mp3'));
      
      console.log(`📁 Found ${audioFiles.length} MP3 files in filesystem:`);
      audioFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name}`);
      });
      
      // Test constructing URLs
      console.log('\n🔗 Testing URL construction:\n');
      audioFiles.forEach((file, index) => {
        const expectedPath = `uploads/submissions/21/${file.name}`;
        const fullUrl = `http://localhost:7001/${expectedPath}`;
        console.log(`   ${index + 1}. Expected URL: ${fullUrl}`);
      });
    } else {
      console.log('❌ Submissions directory does not exist');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error checking audio URLs:', error.message);
  } finally {
    await pool.end();
  }
}

checkAudioUrls(); 