const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'MixWarz',
  password: 'Ready2go!',
  port: 5432,
});

async function verifyEnhancedTieBreakingResults() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFYING ENHANCED TIE-BREAKING RESULTS');
    console.log('==========================================\n');
    
    const competitionId = 21;
    
    // Step 1: Check competition status
    console.log('1️⃣ Checking competition status...');
    const competitionResult = await client.query(
      'SELECT "CompetitionId", "Title", "Status" FROM "Competitions" WHERE "CompetitionId" = $1',
      [competitionId]
    );
    
    if (competitionResult.rows.length === 0) {
      console.log('❌ Competition 21 not found!');
      return;
    }
    
    const competition = competitionResult.rows[0];
    console.log(`📊 Competition Status: ${competition.Status}`);
    console.log(`📅 Competition: ${competition.Title}\n`);
    
    // Step 2: Check final results
    console.log('2️⃣ Checking final submission scores and rankings...');
    const submissionResults = await client.query(
      `SELECT s."SubmissionId", s."MixTitle", s."UserId", s."Round1Score", s."Round2Score", s."FinalScore",
              s."FinalRanking", s."IsWinner", 
              u."FirstName", u."LastName", u."UserName"
       FROM "Submissions" s
       JOIN "AspNetUsers" u ON s."UserId" = u."Id"
       WHERE s."CompetitionId" = $1 AND s."AdvancedToRound2" = true
       ORDER BY s."FinalRanking" ASC NULLS LAST, s."FinalScore" DESC NULLS LAST`,
      [competitionId]
    );
    
    console.log('🏆 FINAL RESULTS:');
    console.log('================');
    
    submissionResults.rows.forEach((submission, index) => {
      const rank = submission.FinalRanking || 'Not Set';
      const winner = submission.IsWinner ? '👑 WINNER' : '';
      const round1Score = parseFloat(submission.Round1Score) || 0;
      const round2Score = parseInt(submission.Round2Score) || 0;
      const finalScore = parseFloat(submission.FinalScore) || 0;
      
      console.log(`${rank === 'Not Set' ? `${index + 1}` : rank}. "${submission.MixTitle}" by ${submission.FirstName} ${submission.LastName} ${winner}`);
      console.log(`   User: ${submission.UserName} (ID: ${submission.UserId})`);
      console.log(`   Round 1 Score: ${round1Score}`);
      console.log(`   Round 2 Score: ${round2Score}`);
      console.log(`   Final Score: ${finalScore} (Round1 + Round2 = ${round1Score} + ${round2Score})`);
      console.log(`   Final Ranking: ${rank}`);
      console.log();
    });
    
    // Step 3: Analyze the tie-breaking logic
    console.log('3️⃣ Analyzing tie-breaking logic...');
    
    // Check if there were any ties in Round 2 scores
    const round2Ties = await client.query(
      `SELECT s."Round2Score", COUNT(*) as submission_count
       FROM "Submissions" s
       WHERE s."CompetitionId" = $1 AND s."AdvancedToRound2" = true AND s."Round2Score" IS NOT NULL
       GROUP BY s."Round2Score"
       HAVING COUNT(*) > 1
       ORDER BY s."Round2Score" DESC`,
      [competitionId]
    );
    
    if (round2Ties.rows.length > 0) {
      console.log('⚖️  Round 2 ties detected:');
      round2Ties.rows.forEach(tie => {
        console.log(`   ${tie.submission_count} submissions tied with Round 2 score: ${tie.Round2Score}`);
      });
      console.log('   ✅ Enhanced tie-breaking logic should have used Round1 + Round2 scores to resolve ties');
    } else {
      console.log('✅ No Round 2 ties detected - standard ranking applied');
    }
    
    // Step 4: Verify final score calculations
    console.log('\n4️⃣ Verifying final score calculations...');
    
    let calculationErrors = 0;
    for (const submission of submissionResults.rows) {
      const round1Score = parseFloat(submission.Round1Score) || 0;
      const round2Score = parseInt(submission.Round2Score) || 0;
      const storedFinalScore = parseFloat(submission.FinalScore) || 0;
      const expectedFinalScore = round1Score + round2Score;
      
      if (Math.abs(storedFinalScore - expectedFinalScore) > 0.01) {
        console.log(`❌ Calculation error for "${submission.MixTitle}":`)
        console.log(`   Expected: ${expectedFinalScore} (${round1Score} + ${round2Score})`);
        console.log(`   Stored: ${storedFinalScore}`);
        calculationErrors++;
      }
    }
    
    if (calculationErrors === 0) {
      console.log('✅ All final score calculations are correct!');
    } else {
      console.log(`❌ Found ${calculationErrors} calculation errors`);
    }
    
    // Step 5: Check for any remaining ties in final scores
    console.log('\n5️⃣ Checking for any remaining final score ties...');
    
    const finalTies = await client.query(
      `SELECT s."FinalScore", COUNT(*) as submission_count,
              ARRAY_AGG(s."MixTitle") as tied_submissions
       FROM "Submissions" s
       WHERE s."CompetitionId" = $1 AND s."AdvancedToRound2" = true AND s."FinalScore" IS NOT NULL
       GROUP BY s."FinalScore"
       HAVING COUNT(*) > 1
       ORDER BY s."FinalScore" DESC`,
      [competitionId]
    );
    
    if (finalTies.rows.length > 0) {
      console.log('⚠️  Final score ties still exist (manual selection required):');
      finalTies.rows.forEach(tie => {
        console.log(`   ${tie.submission_count} submissions tied with final score: ${tie.FinalScore}`);
        console.log(`   Tied submissions: ${tie.tied_submissions.join(', ')}`);
      });
    } else {
      console.log('✅ No final score ties - all submissions have unique final scores');
    }
    
    // Step 6: Summary
    console.log('\n📊 SUMMARY:');
    console.log('===========');
    
    const winnerCount = submissionResults.rows.filter(s => s.IsWinner).length;
    const rankedCount = submissionResults.rows.filter(s => s.FinalRanking !== null).length;
    
    console.log(`🏆 Winners declared: ${winnerCount}`);
    console.log(`📊 Submissions ranked: ${rankedCount} of ${submissionResults.rows.length}`);
    
    if (winnerCount === 1 && rankedCount === submissionResults.rows.length) {
      console.log('✅ Enhanced tie-breaking logic successfully determined a clear winner!');
    } else if (finalTies.rows.length > 0) {
      console.log('⚖️  Some ties remain - manual selection may be required');
    } else {
      console.log('ℹ️  Check competition status and ranking logic');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await verifyEnhancedTieBreakingResults();
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the verification
main(); 