const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'MixWarz',
  password: 'Ready2go!',
  port: 5432,
});

async function testEnhancedTieBreaking() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 TESTING ENHANCED TIE-BREAKING LOGIC');
    console.log('======================================\n');
    
    const competitionId = 21;
    
    // Step 1: Check current state
    console.log('1️⃣ Checking current finalists and their Round 1 scores...');
    const finalistsResult = await client.query(
      `SELECT s."SubmissionId", s."MixTitle", s."UserId", s."Round1Score", s."Round2Score", s."FinalScore"
       FROM "Submissions" s
       WHERE s."CompetitionId" = $1 AND s."AdvancedToRound2" = true AND s."IsEligibleForRound2Voting" = true
       ORDER BY s."Round1Score" DESC`,
      [competitionId]
    );
    
    console.log('Current Finalists:');
    finalistsResult.rows.forEach((finalist, index) => {
      console.log(`   ${index + 1}. "${finalist.MixTitle}" (ID: ${finalist.SubmissionId})`);
      console.log(`      Round1Score: ${finalist.Round1Score || 0}`);
      console.log(`      Round2Score: ${finalist.Round2Score || 0}`);
      console.log(`      FinalScore: ${finalist.FinalScore || 0}`);
      console.log();
    });
    
    // Step 2: Create test scenario - tie in Round 2 voting
    console.log('2️⃣ Creating test scenario with Round 2 tie...');
    
    // Clear existing Round 2 votes
    await client.query(
      'DELETE FROM "SubmissionVotes" WHERE "CompetitionId" = $1 AND "VotingRound" = 2',
      [competitionId]
    );
    
    // Get test users (non-finalists who can vote)
    const votersResult = await client.query(
      `SELECT u."Id", u."FirstName", u."LastName"
       FROM "AspNetUsers" u
       WHERE u."Id" NOT IN (
         SELECT DISTINCT s."UserId" 
         FROM "Submissions" s 
         WHERE s."CompetitionId" = $1 AND s."AdvancedToRound2" = true
       )
       LIMIT 6`,
      [competitionId]
    );
    
    if (votersResult.rows.length < 3) {
      console.log('❌ Not enough eligible voters for test');
      return;
    }
    
    const finalists = finalistsResult.rows;
    const voters = votersResult.rows;
    
    // Create a tie scenario where two submissions get the same Round 2 score
    // but have different Round 1 scores
    console.log('Creating Round 2 votes to simulate a tie...');
    
    const testVotes = [
      // Voter 1: Give finalist 1 and 2 the same points (3 each impossible, so create tie)
      // Let's give finalist 1 first place (3pts), finalist 2 second place (2pts), finalist 3 third place (1pt)
      { voterId: voters[0].Id, submissionId: finalists[0].SubmissionId, rank: 1, points: 3 },
      { voterId: voters[0].Id, submissionId: finalists[1].SubmissionId, rank: 2, points: 2 },
      { voterId: voters[0].Id, submissionId: finalists[2].SubmissionId, rank: 3, points: 1 },
      
      // Voter 2: Reverse order to create tie
      { voterId: voters[1].Id, submissionId: finalists[1].SubmissionId, rank: 1, points: 3 },
      { voterId: voters[1].Id, submissionId: finalists[0].SubmissionId, rank: 2, points: 2 },
      { voterId: voters[1].Id, submissionId: finalists[2].SubmissionId, rank: 3, points: 1 },
      
      // Voter 3: Another mix to create interesting scenario
      { voterId: voters[2].Id, submissionId: finalists[2].SubmissionId, rank: 1, points: 3 },
      { voterId: voters[2].Id, submissionId: finalists[0].SubmissionId, rank: 2, points: 2 },
      { voterId: voters[2].Id, submissionId: finalists[1].SubmissionId, rank: 3, points: 1 }
    ];
    
    // Insert test votes
    for (const vote of testVotes) {
      await client.query(
        `INSERT INTO "SubmissionVotes" 
         ("CompetitionId", "SubmissionId", "VoterId", "Rank", "Points", "VotingRound", "VoteTime")
         VALUES ($1, $2, $3, $4, $5, 2, NOW())`,
        [competitionId, vote.submissionId, vote.voterId, vote.rank, vote.points]
      );
      
      console.log(`   ${voters.find(v => v.Id === vote.voterId).FirstName} voted: ` +
        `Submission ${vote.submissionId} = ${vote.rank}${vote.rank === 1 ? 'st' : vote.rank === 2 ? 'nd' : 'rd'} place (${vote.points} pts)`);
    }
    console.log();
    
    // Step 3: Calculate Round 2 scores manually to verify
    console.log('3️⃣ Manual calculation of Round 2 scores...');
    
    for (const finalist of finalists) {
      const voteCount = await client.query(
        `SELECT 
           SUM("Points") as total_points,
           COUNT(CASE WHEN "Rank" = 1 THEN 1 END) as first_place_votes,
           COUNT(CASE WHEN "Rank" = 2 THEN 1 END) as second_place_votes,
           COUNT(CASE WHEN "Rank" = 3 THEN 1 END) as third_place_votes
         FROM "SubmissionVotes" 
         WHERE "CompetitionId" = $1 AND "VotingRound" = 2 AND "SubmissionId" = $2`,
        [competitionId, finalist.SubmissionId]
      );
      
      const stats = voteCount.rows[0];
      const round1Score = parseFloat(finalist.Round1Score) || 0;
      const round2Score = parseInt(stats.total_points) || 0;
      const combinedScore = round1Score + round2Score;
      
      console.log(`   "${finalist.MixTitle}" (ID: ${finalist.SubmissionId}):`);
      console.log(`      Round 1 Score: ${round1Score}`);
      console.log(`      Round 2 Score: ${round2Score} (1st: ${stats.first_place_votes}, 2nd: ${stats.second_place_votes}, 3rd: ${stats.third_place_votes})`);
      console.log(`      Combined Score: ${combinedScore}`);
      console.log();
    }
    
    // Step 4: Update competition status for tallying
    console.log('4️⃣ Setting competition to VotingRound2Tallying status...');
    await client.query(
      'UPDATE "Competitions" SET "Status" = $1 WHERE "CompetitionId" = $2',
      [22, competitionId] // VotingRound2Tallying = 22
    );
    console.log('✅ Competition status updated to VotingRound2Tallying\n');
    
    console.log('🎯 TEST SCENARIO READY!');
    console.log('======================');
    console.log('Now you can test the enhanced tie-breaking logic by:');
    console.log('1. Using the "Tally Round 2 Votes & Determine Winner" button in admin interface');
    console.log('2. Or calling the TallyRound2VotesAsync API endpoint directly');
    console.log('3. The system should use Round1Score + Round2Score to break ties');
    console.log('4. Check the logs for detailed tie-breaking information');
    
  } catch (error) {
    console.error('❌ Error during test setup:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await testEnhancedTieBreaking();
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
main(); 