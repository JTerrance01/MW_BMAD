const { Client } = require('pg');

async function checkRound2Structure() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'MixWarz',
        user: 'postgres',
        password: 'Ready2go!'
    });

    try {
        await client.connect();
        console.log('🔌 Connected to database');

        // Check all tables that might be related to Round 2 voting
        console.log('\n🔍 SEARCHING FOR ROUND2 VOTING RELATED TABLES:');
        const allTablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name ILIKE '%voting%'
            ORDER BY table_name
        `;
        
        const allTablesResult = await client.query(allTablesQuery);
        console.log('Found voting-related tables:');
        allTablesResult.rows.forEach((table, index) => {
            console.log(`   ${index + 1}. ${table.table_name}`);
        });

        // Check specific Round2VotingAssignments table if it exists
        const round2VotingStructureQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'Round2VotingAssignments' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `;
        
        const round2VotingStructureResult = await client.query(round2VotingStructureQuery);
        
        if (round2VotingStructureResult.rows.length > 0) {
            console.log('\n📋 ROUND2VOTINGASSIGNMENTS TABLE STRUCTURE:');
            round2VotingStructureResult.rows.forEach((col, index) => {
                console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
            });

            // Check sample data
            console.log('\n📊 SAMPLE DATA FROM ROUND2VOTINGASSIGNMENTS:');
            const sampleRound2Query = `
                SELECT * FROM "Round2VotingAssignments" 
                WHERE "CompetitionId" = 21 
                LIMIT 5
            `;
            
            const sampleRound2Result = await client.query(sampleRound2Query);
            if (sampleRound2Result.rows.length > 0) {
                console.log('   Sample records:');
                sampleRound2Result.rows.forEach((row, index) => {
                    console.log(`   ${index + 1}. VoterId: ${row.VoterId}, HasVoted: ${row.HasVoted || 'N/A'}`);
                });
            } else {
                console.log('   No Round2 voting assignments found for competition 21');
            }
        } else {
            console.log('\n❌ Round2VotingAssignments table does not exist');
        }

        // Now let me understand how Round 2 eligibility is determined
        // Check if it's based on Round1Assignments or a separate mechanism
        console.log('\n🔍 INVESTIGATING ROUND2 ELIGIBILITY LOGIC:');
        
        // Method 1: Check if there's an entity that tracks Round2 eligibility
        const userEligibilityQuery = `
            SELECT table_name, column_name
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND (column_name ILIKE '%round2%' OR column_name ILIKE '%eligible%')
            ORDER BY table_name, column_name
        `;
        
        const userEligibilityResult = await client.query(userEligibilityQuery);
        if (userEligibilityResult.rows.length > 0) {
            console.log('   Found columns related to Round2/Eligibility:');
            userEligibilityResult.rows.forEach((col, index) => {
                console.log(`   ${index + 1}. ${col.table_name}.${col.column_name}`);
            });
        } else {
            console.log('   No specific Round2/Eligibility columns found');
        }

        // Method 2: In the absence of explicit Round2 eligibility tracking,
        // the system likely determines eligibility based on Round1Assignments.HasVoted
        console.log('\n💡 ROUND2 ELIGIBILITY LOGIC INFERENCE:');
        console.log('   Since no explicit Round2 eligibility tracking found,');
        console.log('   eligibility likely determined by Round1Assignments.HasVoted = true');

        // Check the business logic: Who should be eligible for Round 2?
        console.log('\n📊 CURRENT ROUND1 COMPLETION STATUS:');
        const round1StatusQuery = `
            SELECT 
                ra."VoterId",
                u."UserName",
                ra."HasVoted",
                ra."VotingCompletedDate",
                CASE 
                    WHEN ra."HasVoted" = true THEN '✅ ELIGIBLE for Round2'
                    ELSE '❌ NOT ELIGIBLE for Round2 (incomplete Round1)'
                END as round2_eligibility_status
            FROM "Round1Assignments" ra
            LEFT JOIN "AspNetUsers" u ON ra."VoterId" = u."Id"
            WHERE ra."CompetitionId" = 21
            ORDER BY ra."HasVoted" DESC, u."UserName"
        `;

        const round1StatusResult = await client.query(round1StatusQuery);
        round1StatusResult.rows.forEach((judge, index) => {
            console.log(`   ${index + 1}. ${judge.UserName || judge.VoterId}`);
            console.log(`      - HasVoted: ${judge.HasVoted}`);
            console.log(`      - Completion Date: ${judge.VotingCompletedDate || 'Not completed'}`);
            console.log(`      - Status: ${judge.round2_eligibility_status}`);
        });

        console.log('\n❌ BUSINESS LOGIC VIOLATION IDENTIFIED:');
        console.log('   According to business rules, incomplete judges should NOT be eligible for Round2');
        console.log('   But currently, eligibility is only determined by Round1Assignments.HasVoted');
        console.log('   Solution: Need to update HasVoted=false for incomplete judges');

    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

checkRound2Structure(); 