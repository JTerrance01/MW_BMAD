const https = require('https');
const fs = require('fs');
const path = require('path');

// First, check what files are in the submissions directory
const submissionsDir = path.join(__dirname, 'src/MixWarz.API/AppData/uploads/submissions/21');
console.log('🔍 Checking submission files...\n');

if (fs.existsSync(submissionsDir)) {
  const files = fs.readdirSync(submissionsDir).filter(f => f.endsWith('.mp3'));
  console.log(`Found ${files.length} MP3 files:`);
  files.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });

  if (files.length > 0) {
    // Test the first file
    const testFile = files[0];
    const testUrl = `http://localhost:7001/uploads/submissions/21/${testFile}`;
    
    console.log(`\n🔗 Testing URL: ${testUrl}`);
    
    // Make HTTP request to test if the file is accessible
    const http = require('http');
    const req = http.get(testUrl, (res) => {
      console.log(`📊 Response Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`📋 Content-Type: ${res.headers['content-type']}`);
      console.log(`📏 Content-Length: ${res.headers['content-length']}`);
      
      if (res.statusCode === 200) {
        console.log('✅ Audio file is accessible!');
      } else {
        console.log('❌ Audio file is not accessible');
      }
      
      // Don't download the whole file, just close after headers
      res.destroy();
    });
    
    req.on('error', (err) => {
      console.error('❌ Request failed:', err.message);
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Request timed out');
      req.destroy();
    });
  }
} else {
  console.log('❌ Submissions directory not found');
} 