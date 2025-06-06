// Test script to verify the ranking fix for existing judgments
const https = require('https');

const API_BASE = 'https://localhost:7001';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGVzIjpbIkFkbWluIl0sIm5iZiI6MTczNTIzMzk2NSwiZXhwIjoxNzM1MjM3NTY1LCJpYXQiOjE3MzUyMzM5NjUsImlzcyI6Ik1peFdhcnoiLCJhdWQiOiJNaXhXYXJ6In0.kZL4KTm2OKcQElz_V5Oe_cgHTGYsGAhCQGR6wGwkJrE';

// Create HTTPS agent to ignore self-signed certificates
const agent = new https.Agent({
  rejectUnauthorized: false
});

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 7001,
      path,
      method,
      agent,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testRankingFix() {
  console.log('🔧 Testing Ranking Fix for Existing Judgments...\n');

  const competitionId = 21;

  try {
    // 1. Check Round 1 voting assignments
    console.log('📋 Step 1: Fetching Round 1 voting assignments...');
    const assignmentsResult = await makeRequest(`/api/competitions/${competitionId}/voting/round1/assignments`);
    
    if (assignmentsResult.status !== 200) {
      console.log('❌ Failed to fetch assignments:', assignmentsResult.status, assignmentsResult.data);
      return;
    }

    const assignments = assignmentsResult.data.submissions || [];
    console.log(`✅ Found ${assignments.length} assigned submissions`);

    if (assignments.length === 0) {
      console.log('⚠️ No submissions assigned for voting');
      return;
    }

    // Display current assignments
    assignments.forEach((submission, index) => {
      console.log(`   ${index + 1}. Submission ID: ${submission.id}`);
    });

    // 2. Check if any existing judgments exist
    console.log('\\n📝 Step 2: Checking for existing judgments...');
    
    let existingJudgments = 0;
    let judgmentData = [];

    for (const submission of assignments) {
      const retrieveResult = await makeRequest(`/api/competitions/${competitionId}/voting/judgments/${submission.id}?votingRound=1`);
      
      if (retrieveResult.status === 200 && retrieveResult.data.success && retrieveResult.data.judgment) {
        existingJudgments++;
        const judgment = retrieveResult.data.judgment;
        judgmentData.push({
          submissionId: submission.id,
          overallScore: judgment.overallScore,
          comments: judgment.overallComments
        });
        console.log(`   ✅ Found existing judgment for submission ${submission.id}: Score ${judgment.overallScore}`);
      } else {
        console.log(`   ❌ No existing judgment for submission ${submission.id}`);
      }
    }

    console.log(`\\n📊 Summary: Found ${existingJudgments} existing judgments out of ${assignments.length} submissions`);

    if (existingJudgments === 0) {
      console.log('\\n⚠️ No existing judgments found. Creating test judgments first...');
      
      // Create test judgments
      const testScores = [8.5, 7.2, 6.8];
      for (let i = 0; i < Math.min(assignments.length, testScores.length); i++) {
        const submission = assignments[i];
        const score = testScores[i];
        
        console.log(`   Creating test judgment for submission ${submission.id} with score ${score}...`);
        
        const judgmentData = {
          submissionId: submission.id,
          overallScore: score,
          overallComments: `Test judgment for ranking fix verification - score ${score}`,
          criteriaScores: {
            mixQuality: score,
            creativity: score - 0.5,
            technicalSkill: score + 0.3,
            adherenceToSource: score - 0.2
          },
          votingRound: 1
        };

        const submitResult = await makeRequest(
          `/api/competitions/${competitionId}/voting/judgments`,
          'POST',
          judgmentData
        );

        if (submitResult.status === 200 || submitResult.status === 201) {
          console.log(`   ✅ Test judgment created for submission ${submission.id}`);
          existingJudgments++;
        } else {
          console.log(`   ❌ Failed to create test judgment for submission ${submission.id}:`, submitResult.status);
        }
      }
    }

    // 3. Frontend testing instructions
    console.log('\\n🌐 Step 3: Frontend Testing Instructions:');
    console.log('   Now test the fix in your browser:');
    console.log('   1. Open: http://localhost:3000/competitions/21');
    console.log('   2. Go to "Judging" interface first (this loads existing judgments into Redux)');
    console.log('   3. Switch to "Voting" interface');
    console.log('   4. Verify that previously scored submissions now show their rankings instead of "Not yet scored"');
    console.log('');
    console.log('   🔍 In browser console, look for these debug messages:');
    console.log('      - "📋 Loaded existing judgments:" (from JudgingInterface)');
    console.log('      - "📊 Dispatched scores to Redux for X submissions" (from JudgingInterface)');
    console.log('      - "🎯 VotingRound1Card - scorecardScores updated:" (from VotingRound1Card)');
    console.log('      - "🔍 Submission X: position=Y, score=Z" (from VotingRound1Card)');

    if (existingJudgments > 0) {
      console.log('\\n✅ The fix should now work! Existing judgments should appear as rankings in the Voting view.');
    } else {
      console.log('\\n⚠️ No judgments available for testing. Create some judgments first using the Judging Interface.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testRankingFix().catch(console.error); 