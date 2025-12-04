/**
 * Verificar usuarios admin en la base de datos
 */
const { withConnection } = require('./db-helper');

async function checkAdminUsers() {
    await withConnection(async (connection) => {
        console.log('👥 Usuarios admin en la base de datos:\n');

        const [users] = await connection.query(`
            SELECT au.id, au.email, au.full_name, b.name as business_name, b.id as business_id
            FROM admin_users au
            JOIN businesses b ON au.business_id = b.id
            ORDER BY b.id
        `);

        if (users.length === 0) {
            console.log('❌ No hay usuarios admin en la base de datos');
        } else {
            users.forEach(u => {
                console.log(`ID ${u.business_id}: ${u.business_name}`);
                console.log(`  Email: ${u.email}`);
                console.log(`  Nombre: ${u.full_name}\n`);
            });
        }

        console.log(`Total: ${users.length} usuarios admin`);
    });
}

// Ejecutar
checkAdminUsers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Script falló:', error.message);
        process.exit(1);
    });
