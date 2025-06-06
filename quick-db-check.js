// Quick database check script
const { Pool } = require('pg');

// Database connection (you may need to adjust these settings)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mixwarz',
  password: 'your_password', // Update this
  port: 5432,
});

async function quickDbCheck() {
  console.log('🔍 QUICK DATABASE CHECK FOR COMPETITION 21');
  console.log('==========================================\n');

  try {
    // Check 1: Count of SubmissionVotes for Competition 21
    console.log('1️⃣ Checking SubmissionVotes for Competition 21:');
    const votesQuery = `
      SELECT COUNT(*) as total_votes, 
             COUNT(DISTINCT "VoterId") as unique_voters
      FROM "SubmissionVotes" 
      WHERE "CompetitionId" = 21 AND "VotingRound" = 1;
    `;
    const votesResult = await pool.query(votesQuery);
    console.log(`   Total Votes: ${votesResult.rows[0].total_votes}`);
    console.log(`   Unique Voters: ${votesResult.rows[0].unique_voters}`);

    // Check 2: HasVoted flags in Round1Assignments
    console.log('\n2️⃣ Checking HasVoted flags in Round1Assignments:');
    const hasVotedQuery = `
      SELECT "HasVoted", COUNT(*) as count
      FROM "Round1Assignments" 
      WHERE "CompetitionId" = 21
      GROUP BY "HasVoted"
      ORDER BY "HasVoted";
    `;
    const hasVotedResult = await pool.query(hasVotedQuery);
    hasVotedResult.rows.forEach(row => {
      console.log(`   HasVoted = ${row.HasVoted}: ${row.count} records`);
    });

    // Check 3: Cross-check votes vs HasVoted flags
    console.log('\n3️⃣ Cross-checking Votes vs HasVoted flags:');
    const crossCheckQuery = `
      SELECT 
        r."VoterId",
        r."HasVoted",
        COUNT(sv."VoterId") as actual_votes,
        r."VotingCompletedDate"
      FROM "Round1Assignments" r
      LEFT JOIN "SubmissionVotes" sv ON r."VoterId" = sv."VoterId" 
        AND sv."CompetitionId" = 21 AND sv."VotingRound" = 1
      WHERE r."CompetitionId" = 21
      GROUP BY r."VoterId", r."HasVoted", r."VotingCompletedDate"
      HAVING COUNT(sv."VoterId") > 0 OR r."HasVoted" = true
      ORDER BY actual_votes DESC, r."HasVoted" DESC;
    `;
    const crossCheckResult = await pool.query(crossCheckQuery);
    
    if (crossCheckResult.rows.length === 0) {
      console.log('   ❌ No users have voted yet (no SubmissionVotes found)');
    } else {
      console.log('   Users with votes or HasVoted=true:');
      crossCheckResult.rows.forEach(row => {
        console.log(`   - VoterId: ${row.VoterId}, HasVoted: ${row.HasVoted}, ActualVotes: ${row.actual_votes}, CompletedDate: ${row.VotingCompletedDate || 'None'}`);
      });
    }

    // Check 4: Sample Round1Assignment records
    console.log('\n4️⃣ Sample Round1Assignment records:');
    const sampleQuery = `
      SELECT "VoterId", "VoterGroupNumber", "AssignedGroupNumber", "HasVoted", "VotingCompletedDate"
      FROM "Round1Assignments" 
      WHERE "CompetitionId" = 21
      ORDER BY "Round1AssignmentId"
      LIMIT 5;
    `;
    const sampleResult = await pool.query(sampleQuery);
    sampleResult.rows.forEach(row => {
      console.log(`   VoterGroup ${row.VoterGroupNumber} → AssignedGroup ${row.AssignedGroupNumber}, HasVoted: ${row.HasVoted}`);
    });

    console.log('\n💡 Analysis:');
    const totalVotes = parseInt(votesResult.rows[0].total_votes);
    const uniqueVoters = parseInt(votesResult.rows[0].unique_voters);
    const hasVotedTrue = hasVotedResult.rows.find(r => r.HasVoted === true)?.count || 0;

    if (totalVotes === 0) {
      console.log('   🔍 NO VOTES FOUND - Users may not have actually voted yet');
      console.log('   💡 The user\'s expectation of "9/30" may be based on outdated information');
    } else {
      console.log(`   📊 Found ${totalVotes} votes from ${uniqueVoters} voters`);
      if (hasVotedTrue !== uniqueVoters) {
        console.log(`   ⚠️ Mismatch: HasVoted flags (${hasVotedTrue}) vs actual voters (${uniqueVoters})`);
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.log('\n💡 If you get connection errors, you may need to:');
    console.log('   1. Update the database credentials in this script');
    console.log('   2. Ensure PostgreSQL is running');
    console.log('   3. Verify the database connection settings');
  } finally {
    await pool.end();
  }
}

quickDbCheck().catch(console.error); 