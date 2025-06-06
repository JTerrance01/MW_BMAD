const https = require('https');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const options = {
    hostname: 'localhost',
    port: 7001,
    path: '/api/competitions/21',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    },
    rejectUnauthorized: false
};

console.log('Testing request to:', `https://${options.hostname}:${options.port}${options.path}`);

const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('Success! Submissions:', parsed.submissionsCount);
        } catch (e) {
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e.message);
});

req.end(); 