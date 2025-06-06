const http = require('http');

const testData = JSON.stringify({
  Type: 0,
  Description: "Test activity from Node.js"
});

const options = {
  hostname: 'localhost',
  port: 7001,
  path: '/api/UserActivity/anonymous-track',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length,
    'X-Activity-Client': 'NodeJS-Test'
  }
};

console.log('Testing activity tracking API...');
console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('Data:', testData);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response body:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ Activity tracking API is working!');
    } else {
      console.log('❌ Activity tracking API returned an error');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.write(testData);
req.end(); 