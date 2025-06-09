const https = require('https');

// Create HTTPS agent that accepts self-signed certificates
const agent = new https.Agent({
  rejectUnauthorized: false
});

// Test the API endpoint directly
const options = {
  hostname: 'localhost',
  port: 7001,
  path: '/api/competitions/21/voting/round2/submissions',
  method: 'GET',
  agent: agent,
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🔗 Testing API endpoint: https://localhost:7001/api/competitions/21/voting/round2/submissions');

const req = https.request(options, (res) => {
  console.log('📊 Status Code:', res.statusCode);
  console.log('📋 Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📦 Response length:', data.length, 'characters');
    if (data.length > 0) {
      try {
        const parsed = JSON.parse(data);
        console.log('✅ JSON is valid');
        console.log('🔍 Response structure:', Object.keys(parsed));
        if (parsed.submissions) {
          console.log('📝 Submissions count:', parsed.submissions.length);
        }
      } catch (e) {
        console.log('❌ JSON parsing failed:', e.message);
        console.log('📄 Raw response (first 500 chars):', data.substring(0, 500));
      }
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Request error:', e.message);
});

req.end(); 