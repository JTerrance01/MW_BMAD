const https = require('http');

const options = {
  hostname: 'localhost',
  port: 7001,
  path: '/api/competitions',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('API Response:');
      console.log(JSON.stringify(response, null, 2));
      
      if (response.competitions && response.competitions.length > 0) {
        console.log('\nFirst competition status:');
        console.log('Status value:', response.competitions[0].status);
        console.log('Status type:', typeof response.competitions[0].status);
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end(); 