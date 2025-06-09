const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'MixWarz',
  password: 'Ready2go!',
  port: 5432,
});

async function verifyCompetition21Reset() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFYING COMPETITION 21 RESET');
    console.log('==================================\n');
    
    // Check competition status
    console.log('1️⃣ Competition Status Check...');
    const competitionResult = await client.query(
      'SELECT "CompetitionId", "Title", "Status", "StartDate", "EndDate" FROM "Competitions" WHERE "CompetitionId" = 21'
    );
    
    if (competitionResult.rows.length === 0) {
      console.log('❌ Competition 21 not found!');
      return;
    }
    
    const competition = competitionResult.rows[0];
    console.log(`📊 Competition: ${competition.Title}`);
    console.log(`📊 Status: ${competition.Status} ${competition.Status === 21 ? '(VotingRound2Open) ✅' : '❌'}`);
    console.log(`📅 Start Date: ${competition.StartDate}`);
    console.log(`📅 End Date: ${competition.EndDate}\n`);
    
    // Check Round 2 votes (should be 0 after reset)
    console.log('2️⃣ Round 2 Votes Check...');
    const votesResult = await client.query(
      `SELECT COUNT(*) as vote_count, 
              COUNT(DISTINCT "VoterId") as unique_voters
       FROM "SubmissionVotes" 
       WHERE "CompetitionId" = 21 AND "VotingRound" = 2`
    );
    
    const voteStats = votesResult.rows[0];
    console.log(`📊 Round 2 Votes: ${voteStats.vote_count} ${voteStats.vote_count === '0' ? '✅' : '❌'}`);
    console.log(`👥 Unique Voters: ${voteStats.unique_voters}\n`);
    
    // Check Round 2 finalists
    console.log('3️⃣ Round 2 Finalists Check...');
    const finalistsResult = await client.query(
      `SELECT COUNT(*) as finalist_count
       FROM "Submissions" 
       WHERE "CompetitionId" = 21 AND "AdvancedToRound2" = true AND "IsEligibleForRound2Voting" = true`
    );
    
    const finalistCount = finalistsResult.rows[0].finalist_count;
    console.log(`🏆 Round 2 Finalists: ${finalistCount} ${finalistCount > 0 ? '✅' : '❌'}\n`);
    
    // List the finalists
    if (finalistCount > 0) {
      console.log('4️⃣ Finalist Details...');
      const finalistDetails = await client.query(
        `SELECT s."SubmissionId", s."MixTitle", s."UserId", s."Round1Score"
         FROM "Submissions" s
         WHERE s."CompetitionId" = 21 AND s."AdvancedToRound2" = true AND s."IsEligibleForRound2Voting" = true
         ORDER BY s."Round1Score" DESC`
      );
      
      finalistDetails.rows.forEach((finalist, index) => {
        console.log(`   ${index + 1}. "${finalist.MixTitle}" (ID: ${finalist.SubmissionId}) - Score: ${finalist.Round1Score}`);
      });
      console.log();
    }
    
    // Check eligible voters
    console.log('5️⃣ Eligible Voters Check...');
    const eligibleVotersResult = await client.query(
      `SELECT COUNT(*) as eligible_count
       FROM "AspNetUsers" u
       WHERE u."Id" NOT IN (
         SELECT DISTINCT s."UserId" 
         FROM "Submissions" s 
         WHERE s."CompetitionId" = 21 AND s."AdvancedToRound2" = true
       )`
    );
    
    const eligibleVoters = eligibleVotersResult.rows[0].eligible_count;
    console.log(`👥 Eligible Round 2 Voters: ${eligibleVoters} users ✅\n`);
    
    // Summary
    console.log('📋 VERIFICATION SUMMARY');
    console.log('======================');
    const statusOk = competition.Status === 21;
    const votesCleared = voteStats.vote_count === '0';
    const hasFinalists = finalistCount > 0;
    const hasEligibleVoters = eligibleVoters > 0;
    
    console.log(`✅ Status: ${statusOk ? 'VotingRound2Open (21)' : 'INCORRECT'}`);
    console.log(`✅ Round 2 Votes: ${votesCleared ? 'Cleared (0)' : 'NOT CLEARED'}`);
    console.log(`✅ Finalists: ${hasFinalists ? `${finalistCount} available` : 'NONE AVAILABLE'}`);
    console.log(`✅ Eligible Voters: ${hasEligibleVoters ? `${eligibleVoters} users` : 'NONE'}`);
    
    const allGood = statusOk && votesCleared && hasFinalists && hasEligibleVoters;
    console.log(`\n🎯 OVERALL STATUS: ${allGood ? '✅ READY FOR ROUND 2 VOTING' : '❌ ISSUES DETECTED'}`);
    
    if (allGood) {
      console.log('\n📝 Next Steps:');
      console.log('   1. Users can now access Round 2 voting interface');
      console.log('   2. Users can vote for their top 3 finalists');
      console.log('   3. Admin can use "Tally Round 2 Votes" when voting is complete');
      console.log('   4. New votes will use correct business logic (1st=3pts, 2nd=2pts, 3rd=1pt)');
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
    await verifyCompetition21Reset();
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the verification
main(); 