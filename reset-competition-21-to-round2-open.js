const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'MixWarz',
  password: 'Ready2go!',
  port: 5432,
});

async function resetCompetition21ToRound2Open() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting Competition 21 reset to Round 2 Open...\n');
    
    // Step 1: Check current competition status
    console.log('1️⃣ Checking current competition status...');
    const competitionResult = await client.query(
      'SELECT "CompetitionId", "Title", "Status", "StartDate", "EndDate", "SubmissionDeadline" FROM "Competitions" WHERE "CompetitionId" = 21'
    );
    
    if (competitionResult.rows.length === 0) {
      console.log('❌ Competition 21 not found!');
      return;
    }
    
    const competition = competitionResult.rows[0];
    console.log(`📊 Current Competition Status: ${competition.Status}`);
    console.log(`📅 Competition: ${competition.Title}`);
    console.log(`📅 Start Date: ${competition.StartDate}`);
    console.log(`📅 End Date: ${competition.EndDate}`);
    console.log(`📅 Submission Deadline: ${competition.SubmissionDeadline}\n`);
    
    // Step 2: Check existing Round 2 votes
    console.log('2️⃣ Checking existing Round 2 votes...');
    const round2VotesResult = await client.query(
              `SELECT COUNT(*) as vote_count, 
                COUNT(DISTINCT "VoterId") as unique_voters,
                MIN("Points") as min_points,
                MAX("Points") as max_points
         FROM "SubmissionVotes" 
         WHERE "CompetitionId" = 21 AND "VotingRound" = 2`
    );
    
    const voteStats = round2VotesResult.rows[0];
    console.log(`📊 Total Round 2 Votes: ${voteStats.vote_count}`);
    console.log(`👥 Unique Voters: ${voteStats.unique_voters}`);
    console.log(`📈 Points Range: ${voteStats.min_points} - ${voteStats.max_points}`);
    
    // Check if votes need to be cleared (all points = 1 indicates the bug was present)
         const buggyVotesResult = await client.query(
       `SELECT COUNT(*) as buggy_count
        FROM "SubmissionVotes" 
        WHERE "CompetitionId" = 21 AND "VotingRound" = 2 AND "Points" = 1 AND "Rank" = 1`
     );
    
    const buggyVotes = buggyVotesResult.rows[0].buggy_count;
    const shouldClearVotes = buggyVotes > 0 && buggyVotes == voteStats.vote_count;
    
    if (shouldClearVotes) {
      console.log('⚠️  Detected buggy votes (all Points=1, Rank=1) - these will be cleared');
    }
    
    // Step 3: Check Round 2 finalists
    console.log('\n3️⃣ Checking Round 2 finalists...');
         const finalistsResult = await client.query(
       `SELECT COUNT(*) as finalist_count
        FROM "Submissions" 
        WHERE "CompetitionId" = 21 AND "AdvancedToRound2" = true AND "IsEligibleForRound2Voting" = true`
     );
    
    const finalistCount = finalistsResult.rows[0].finalist_count;
    console.log(`🏆 Round 2 Finalists: ${finalistCount}`);
    
    if (finalistCount === 0) {
      console.log('❌ No finalists found! Competition may need Round 1 tallying first.');
      console.log('❓ Would you like to continue anyway? This will set status but voting may not work.');
    }
    
    // Step 4: Clear existing Round 2 votes (if buggy or user wants fresh start)
    if (shouldClearVotes || voteStats.vote_count > 0) {
      console.log('\n4️⃣ Clearing existing Round 2 votes...');
             const deleteResult = await client.query(
         'DELETE FROM "SubmissionVotes" WHERE "CompetitionId" = 21 AND "VotingRound" = 2'
       );
      console.log(`🗑️  Deleted ${deleteResult.rowCount} Round 2 votes`);
    } else {
      console.log('\n4️⃣ No Round 2 votes to clear');
    }
    
    // Step 5: Reset competition status to VotingRound2Open
    console.log('\n5️⃣ Setting competition status to VotingRound2Open...');
         const updateResult = await client.query(
       'UPDATE "Competitions" SET "Status" = $1 WHERE "CompetitionId" = 21',
       [21]  // VotingRound2Open = 21
     );
    
    if (updateResult.rowCount === 1) {
      console.log('✅ Competition status updated to VotingRound2Open');
    } else {
      console.log('❌ Failed to update competition status');
      return;
    }
    
    // Step 6: Verify the reset
    console.log('\n6️⃣ Verifying reset...');
         const verifyResult = await client.query(
       'SELECT "Status" FROM "Competitions" WHERE "CompetitionId" = 21'
     );
     
     const newStatus = verifyResult.rows[0].Status;
    console.log(`✅ Competition 21 status confirmed: ${newStatus}`);
    
    // Step 7: Check Round 2 voting eligibility
    console.log('\n7️⃣ Checking Round 2 voting eligibility...');
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
    console.log(`👥 Eligible Round 2 Voters: ${eligibleVoters} users`);
    
    // Summary
    console.log('\n🎉 RESET COMPLETE!');
    console.log('=====================================');
    console.log(`✅ Competition 21 Status: VotingRound2Open`);
    console.log(`✅ Round 2 Votes Cleared: ${shouldClearVotes ? 'Yes' : 'No votes to clear'}`);
    console.log(`✅ Finalists Available: ${finalistCount}`);
    console.log(`✅ Eligible Voters: ${eligibleVoters}`);
    console.log('\n📝 Next Steps:');
    console.log('   1. Users can now vote on Round 2 finalists');
    console.log('   2. Admin can use "Tally Round 2 Votes" when voting is complete');
    console.log('   3. New votes will use correct business logic (1st=3pts, 2nd=2pts, 3rd=1pt)');
    
  } catch (error) {
    console.error('❌ Error during reset:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await resetCompetition21ToRound2Open();
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main(); 