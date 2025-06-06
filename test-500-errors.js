const https = require('https');

// Test configuration
const API_BASE = 'https://localhost:7001';
const TEST_ENDPOINTS = [
    // Basic endpoints
    { method: 'GET', path: '/api/competitions', description: 'Get competitions list' },
    { method: 'GET', path: '/api/competitions/21', description: 'Get specific competition' },
    { method: 'GET', path: '/api/products', description: 'Get products list' },
    { method: 'GET', path: '/api/categories', description: 'Get categories' },
    
    // Voting endpoints (should return 401, not 500)
    { method: 'GET', path: '/api/competitions/21/voting/round1/assignments', description: 'Round 1 voting assignments' },
    { method: 'GET', path: '/api/competitions/21/voting/status', description: 'Voting status' },
    
    // Admin endpoints (should return 401, not 500)
    { method: 'GET', path: '/api/v1/admin/competitions', description: 'Admin competitions' },
    { method: 'GET', path: '/api/v1/admin/users', description: 'Admin users' },
    { method: 'GET', path: '/api/v1/admin/statistics', description: 'Admin statistics' },
    
    // File endpoints
    { method: 'GET', path: '/uploads/competition-covers/test.png', description: 'Static file access' },
    
    // Competition management endpoints
    { method: 'GET', path: '/api/competitions/21/round1/voting-stats', description: 'Voting statistics' },
    { method: 'POST', path: '/api/competitions/21/round1/create-groups', description: 'Create voting groups', body: '{}' },
];

async function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const url = new URL(API_BASE + endpoint.path);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json',
            },
            rejectUnauthorized: false // Accept self-signed certificates
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const result = {
                    endpoint: endpoint.path,
                    method: endpoint.method,
                    description: endpoint.description,
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    isError500: res.statusCode >= 500,
                    isError: res.statusCode >= 400,
                    responseSize: data.length,
                    hasJsonResponse: false
                };

                try {
                    JSON.parse(data);
                    result.hasJsonResponse = true;
                } catch (e) {
                    // Not JSON, that's okay
                }

                if (res.statusCode >= 500) {
                    result.errorDetails = data.substring(0, 500); // First 500 chars of error
                }

                resolve(result);
            });
        });

        req.on('error', (error) => {
            resolve({
                endpoint: endpoint.path,
                method: endpoint.method,
                description: endpoint.description,
                statusCode: 0,
                statusMessage: 'Connection Error',
                isError500: false,
                isError: true,
                error: error.message
            });
        });

        if (endpoint.body) {
            req.write(endpoint.body);
        }

        req.end();
    });
}

async function runTests() {
    console.log('🔍 Testing API endpoints for 500 Internal Server Errors...\n');
    
    const results = [];
    
    for (const endpoint of TEST_ENDPOINTS) {
        console.log(`Testing: ${endpoint.method} ${endpoint.path}`);
        const result = await testEndpoint(endpoint);
        results.push(result);
        
        // Color-coded output
        const statusColor = result.isError500 ? '🔴' : 
                           result.isError ? '🟡' : '🟢';
        
        console.log(`  ${statusColor} ${result.statusCode} ${result.statusMessage} - ${result.description}`);
        
        if (result.isError500) {
            console.log(`    ❌ 500 ERROR DETAILS: ${result.errorDetails}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(50));
    
    const total = results.length;
    const errors500 = results.filter(r => r.isError500).length;
    const errors4xx = results.filter(r => r.isError && !r.isError500).length;
    const success = results.filter(r => !r.isError).length;
    
    console.log(`Total endpoints tested: ${total}`);
    console.log(`🟢 Successful (2xx): ${success}`);
    console.log(`🟡 Client errors (4xx): ${errors4xx}`);
    console.log(`🔴 Server errors (5xx): ${errors500}`);
    
    if (errors500 > 0) {
        console.log('\n🚨 INTERNAL SERVER ERRORS FOUND:');
        console.log('='.repeat(50));
        results.filter(r => r.isError500).forEach(result => {
            console.log(`❌ ${result.method} ${result.endpoint}`);
            console.log(`   Description: ${result.description}`);
            console.log(`   Status: ${result.statusCode} ${result.statusMessage}`);
            if (result.errorDetails) {
                console.log(`   Error: ${result.errorDetails}`);
            }
            console.log('');
        });
    } else {
        console.log('\n✅ No 500 Internal Server Errors found!');
        console.log('All endpoints are returning appropriate status codes.');
    }
    
    // Show 4xx errors for context (these are expected for auth-protected endpoints)
    const auth4xxErrors = results.filter(r => r.statusCode === 401);
    if (auth4xxErrors.length > 0) {
        console.log('\nℹ️  Authentication-protected endpoints (401 Unauthorized):');
        auth4xxErrors.forEach(result => {
            console.log(`   ${result.method} ${result.endpoint} - ${result.description}`);
        });
        console.log('These 401 errors are expected for protected endpoints without authentication.');
    }
}

// Run the tests
runTests().catch(console.error); 