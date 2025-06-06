const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'MixWarz',
  user: 'postgres',
  password: 'Ready2go!'
});

async function findActualAudioFiles() {
  try {
    const client = await pool.connect();
    
    console.log('🔍 Finding actual audio file paths for Competition 21...\n');
    
    // Get all submissions from database
    const result = await client.query(`
      SELECT s."SubmissionId", s."AudioUrl", s."MixTitle", s."UserId"
      FROM "Submissions" s 
      WHERE s."CompetitionId" = 21 
      ORDER BY s."SubmissionId";
    `);
    
    console.log(`📋 Database submissions (${result.rows.length}):\n`);
    
    result.rows.forEach((submission, index) => {
      console.log(`${index + 1}. Submission ID: ${submission.SubmissionId}`);
      console.log(`   Title: ${submission.MixTitle || 'No title'}`);
      console.log(`   User ID: ${submission.UserId}`);
      console.log(`   Audio URL: ${submission.AudioUrl || 'NULL'}`);
      console.log('');
    });
    
    // Check filesystem structure
    const submissionsDir = path.join(__dirname, 'src/MixWarz.API/AppData/uploads/submissions/21');
    
    console.log('📁 Filesystem structure:\n');
    
    if (fs.existsSync(submissionsDir)) {
      const subdirs = fs.readdirSync(submissionsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      console.log(`Found ${subdirs.length} submission directories:\n`);
      
      // Map each directory to its contents
      const fileMapping = {};
      
      subdirs.forEach((submissionId, index) => {
        const submissionDir = path.join(submissionsDir, submissionId);
        const files = fs.readdirSync(submissionDir);
        
        console.log(`${index + 1}. Directory: ${submissionId}`);
        if (files.length > 0) {
          const audioFile = files[0]; // Assuming one file per submission
          console.log(`   File: ${audioFile}`);
          
          // Construct the URL path
          const urlPath = `uploads/submissions/21/${submissionId}/${audioFile}`;
          console.log(`   URL Path: ${urlPath}`);
          
          fileMapping[submissionId] = {
            fileName: audioFile,
            urlPath: urlPath,
            fullUrl: `http://localhost:7001/${urlPath}`
          };
        } else {
          console.log(`   No files found`);
        }
        console.log('');
      });
      
      console.log('🔗 Complete URL mapping:\n');
      Object.entries(fileMapping).forEach(([submissionId, info], index) => {
        console.log(`${index + 1}. Submission: ${submissionId}`);
        console.log(`   Full URL: ${info.fullUrl}`);
        console.log('');
      });
      
      // Check if any database submissions match filesystem submissions
      console.log('🔄 Database vs Filesystem comparison:\n');
      result.rows.forEach((dbSubmission, index) => {
        const submissionIdStr = dbSubmission.SubmissionId.toString();
        const hasFileSystem = subdirs.includes(submissionIdStr);
        const fileInfo = fileMapping[submissionIdStr];
        
        console.log(`${index + 1}. DB Submission ${submissionIdStr}:`);
        console.log(`   Has filesystem directory: ${hasFileSystem ? '✅' : '❌'}`);
        console.log(`   Database AudioUrl: ${dbSubmission.AudioUrl || 'NULL'}`);
        if (fileInfo) {
          console.log(`   Expected URL: ${fileInfo.fullUrl}`);
        }
        console.log('');
      });
      
    } else {
      console.log('❌ Submissions directory not found');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findActualAudioFiles(); 