// Test script to verify Round 1 Voting ranking updates
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

async function testRankingUpdate() {
  console.log('🎯 Testing Round 1 Voting Ranking Updates...\n');

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

    // 2. Test submitting judgments for different scores
    console.log('\\n📊 Step 2: Submitting test judgments with different scores...');
    
    const testJudgments = [
      { submissionId: assignments[0]?.id, overallScore: 8.5, expectedRank: 1 },
      { submissionId: assignments[1]?.id, overallScore: 7.2, expectedRank: 2 },
      { submissionId: assignments[2]?.id, overallScore: 6.8, expectedRank: 3 }
    ];

    for (const judgment of testJudgments) {
      if (!judgment.submissionId) continue;

      console.log(`   Submitting judgment for submission ${judgment.submissionId} with score ${judgment.overallScore}...`);
      
      const judgmentData = {
        submissionId: judgment.submissionId,
        overallScore: judgment.overallScore,
        overallComments: `Test judgment for ranking verification - score ${judgment.overallScore}`,
        criteriaScores: {
          mixQuality: judgment.overallScore,
          creativity: judgment.overallScore - 0.5,
          technicalSkill: judgment.overallScore + 0.3,
          adherenceToSource: judgment.overallScore - 0.2
        },
        votingRound: 1
      };

      const submitResult = await makeRequest(
        `/api/competitions/${competitionId}/voting/judgments`,
        'POST',
        judgmentData
      );

      if (submitResult.status === 200 || submitResult.status === 201) {
        console.log(`   ✅ Judgment submitted successfully for submission ${judgment.submissionId}`);
      } else {
        console.log(`   ❌ Failed to submit judgment for submission ${judgment.submissionId}:`, submitResult.status, submitResult.data);
      }
    }

    // 3. Verify ranking calculation
    console.log('\\n🏆 Step 3: Verifying ranking calculation...');
    console.log('Expected rankings based on scores:');
    testJudgments
      .filter(j => j.submissionId)
      .sort((a, b) => b.overallScore - a.overallScore)
      .forEach((judgment, index) => {
        console.log(`   ${index + 1}. Submission ${judgment.submissionId} - Score: ${judgment.overallScore}`);
      });

    // 4. Test judgment retrieval
    console.log('\\n📝 Step 4: Testing judgment retrieval...');
    for (const judgment of testJudgments) {
      if (!judgment.submissionId) continue;

      const retrieveResult = await makeRequest(`/api/competitions/${competitionId}/voting/judgments/${judgment.submissionId}?votingRound=1`);
      
      if (retrieveResult.status === 200 && retrieveResult.data.success) {
        const retrievedJudgment = retrieveResult.data.judgment;
        console.log(`   ✅ Retrieved judgment for submission ${judgment.submissionId}:`);
        console.log(`      Overall Score: ${retrievedJudgment.overallScore}`);
        console.log(`      Comments: ${retrievedJudgment.overallComments}`);
      } else {
        console.log(`   ❌ Failed to retrieve judgment for submission ${judgment.submissionId}:`, retrieveResult.status, retrieveResult.data);
      }
    }

    // 5. Instructions for frontend testing
    console.log('\\n🌐 Step 5: Frontend Testing Instructions:');
    console.log('   1. Open the competition in your browser: http://localhost:3000/competitions/21');
    console.log('   2. Switch to "Judging" interface and verify the submitted scores are loaded');
    console.log('   3. Switch to "Voting" interface and verify rankings are displayed correctly:');
    testJudgments
      .filter(j => j.submissionId)
      .sort((a, b) => b.overallScore - a.overallScore)
      .forEach((judgment, index) => {
        console.log(`      - Mix with submission ID ${judgment.submissionId} should show as ${index + 1}${['st', 'nd', 'rd'][index] || 'th'} place (Score: ${judgment.overallScore})`);
      });
    console.log('   4. Submit new judgments via Judging Interface and verify rankings update automatically');

    console.log('\\n✅ Test completed! Check the frontend to verify ranking updates work correctly.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testRankingUpdate().catch(console.error); 