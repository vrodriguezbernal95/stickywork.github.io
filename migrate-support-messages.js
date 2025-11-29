/**
 * Migration: Create support_messages table
 *
 * Sistema de mensajes de soporte entre clientes y super-admin
 * Restricciones: 150 palabras, 1 mensaje activo, timeout 72h
 */

const db = require('./config/database-mysql');

async function migrate() {
    console.log('🔄 Starting migration: Create support_messages table...\n');

    try {
        // Create support_messages table
        console.log('📋 Creating support_messages table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS support_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_id INT NOT NULL,
                category ENUM('bug', 'question', 'suggestion', 'call_request', 'email_request') NOT NULL DEFAULT 'question',
                message TEXT NOT NULL,
                word_count INT NOT NULL,
                status ENUM('pending', 'answered', 'closed') NOT NULL DEFAULT 'pending',
                admin_response TEXT NULL,
                answered_by VARCHAR(255) NULL COMMENT 'Email del super-admin que respondió',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                answered_at TIMESTAMP NULL,
                can_send_again_at TIMESTAMP NULL COMMENT 'Fecha después de la cual puede enviar otro mensaje si no hay respuesta',
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
                INDEX idx_business_id (business_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='Mensajes de soporte de clientes a super-admin'
        `);
        console.log('   ✅ support_messages table created\n');

        // Verify table structure
        console.log('🔍 Verifying table structure...');
        const [columns] = await db.query('SHOW COLUMNS FROM support_messages');

        console.log('\n📊 Table columns:');
        columns.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
        });

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run migration
migrate();
