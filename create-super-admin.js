// Script para crear tabla platform_admins y usuario super-admin inicial
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createSuperAdmin() {
    let connection;

    try {
        // Conectar a la base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'stickywork',
            port: process.env.DB_PORT || 3306
        });

        console.log('✓ Conectado a la base de datos');

        // Crear tabla platform_admins si no existe
        await connection.query(`
            CREATE TABLE IF NOT EXISTS platform_admins (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role ENUM('super_admin', 'support', 'viewer') DEFAULT 'super_admin',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✓ Tabla platform_admins creada/verificada');

        // Crear usuario super-admin inicial
        const email = 'admin@stickywork.com';
        const password = 'StickyAdmin2025!'; // CAMBIAR ESTO EN PRODUCCIÓN
        const fullName = 'Super Admin StickyWork';

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Insertar super-admin (o actualizar si ya existe)
        await connection.query(`
            INSERT INTO platform_admins (email, password_hash, full_name, role, is_active)
            VALUES (?, ?, ?, 'super_admin', TRUE)
            ON DUPLICATE KEY UPDATE
                password_hash = VALUES(password_hash),
                full_name = VALUES(full_name),
                updated_at = CURRENT_TIMESTAMP
        `, [email, passwordHash, fullName]);

        console.log('✓ Usuario super-admin creado/actualizado');
        console.log('');
        console.log('==============================================');
        console.log('CREDENCIALES SUPER-ADMIN:');
        console.log('==============================================');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('==============================================');
        console.log('');
        console.log('⚠️  IMPORTANTE: Cambia la contraseña después de hacer login por primera vez');
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('✓ Conexión cerrada');
        }
    }
}

// Ejecutar
createSuperAdmin()
    .then(() => {
        console.log('✓ Script completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script falló:', error);
        process.exit(1);
    });
