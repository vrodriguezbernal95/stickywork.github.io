/**
 * Script unificado para crear tabla platform_admins y usuario super-admin
 * Funciona en entorno local y Railway (detecta automáticamente)
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupPlatformAdmin() {
    let connection;

    try {
        console.log('🚀 Iniciando configuración de Platform Admin...\n');

        // Detectar entorno y configurar conexión
        const mysqlUrl = process.env.MYSQL_URL || process.env.MYSQLURL;

        if (mysqlUrl) {
            console.log('🔗 Detectado entorno Railway (usando MYSQL_URL)');
            connection = await mysql.createConnection(mysqlUrl);
        } else {
            console.log('🔗 Detectado entorno local (usando variables individuales)');
            connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'stickywork',
                port: process.env.DB_PORT || 3306
            });
        }

        console.log('✅ Conectado a la base de datos\n');

        // 1. Crear tabla platform_admins si no existe
        console.log('📋 Creando tabla platform_admins...');
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
        console.log('✅ Tabla platform_admins creada/verificada\n');

        // 2. Crear/actualizar usuario super-admin
        console.log('👤 Configurando usuario super-admin...');
        const email = 'admin@stickywork.com';
        const password = 'StickyAdmin2025!'; // CAMBIAR EN PRODUCCIÓN
        const fullName = 'Super Admin StickyWork';

        // Hashear contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Insertar o actualizar usando ON DUPLICATE KEY UPDATE
        const [result] = await connection.query(`
            INSERT INTO platform_admins (email, password_hash, full_name, role, is_active)
            VALUES (?, ?, ?, 'super_admin', TRUE)
            ON DUPLICATE KEY UPDATE
                password_hash = VALUES(password_hash),
                full_name = VALUES(full_name),
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
        `, [email, passwordHash, fullName]);

        if (result.affectedRows === 1) {
            console.log('✅ Usuario super-admin creado exitosamente');
        } else {
            console.log('✅ Usuario super-admin actualizado exitosamente');
        }

        // Mostrar credenciales
        console.log('\n' + '='.repeat(60));
        console.log('📝 CREDENCIALES SUPER-ADMIN');
        console.log('='.repeat(60));
        console.log(`📧 Email:    ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log('='.repeat(60));
        console.log('\n🌐 Accede en: https://stickywork.com/super-admin-login.html');
        console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   Verifica las credenciales de la base de datos');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('   No se puede conectar a la base de datos');
            console.error('   Verifica que MySQL esté corriendo');
        }
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar
setupPlatformAdmin()
    .then(() => {
        console.log('\n✅ Script completado exitosamente\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script falló:', error.message);
        process.exit(1);
    });
