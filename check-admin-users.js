const { Client } = require('pg');

async function checkAdminUsers() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'MixWarz',
        user: 'postgres',
        password: 'Ready2go!'
    });

    try {
        await client.connect();
        console.log('🔗 Connected to database');

        // Check admin users
        console.log('\n👥 ADMIN USERS:');
        const adminUsersResult = await client.query(`
            SELECT 
                u."Id",
                u."UserName", 
                u."Email",
                u."FirstName",
                u."LastName"
            FROM "AspNetUsers" u
            JOIN "AspNetUserRoles" ur ON u."Id" = ur."UserId"
            JOIN "AspNetRoles" r ON ur."RoleId" = r."Id"
            WHERE r."Name" = 'Admin'
            ORDER BY u."UserName"
        `);

        if (adminUsersResult.rows.length > 0) {
            console.log('Found admin users:');
            adminUsersResult.rows.forEach(user => {
                console.log(`  ${user.UserName} (${user.Email}) - ${user.FirstName} ${user.LastName}`);
            });
        } else {
            console.log('No admin users found');
        }

        // Also check a few regular users
        console.log('\n👤 SAMPLE REGULAR USERS:');
        const regularUsersResult = await client.query(`
            SELECT 
                u."Id",
                u."UserName", 
                u."Email"
            FROM "AspNetUsers" u
            WHERE u."UserName" NOT LIKE '%admin%'
            ORDER BY u."UserName"
            LIMIT 5
        `);

        regularUsersResult.rows.forEach(user => {
            console.log(`  ${user.UserName} (${user.Email})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

checkAdminUsers(); 