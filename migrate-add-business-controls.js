/**
 * Migration: Add is_active and free_access columns to businesses table
 *
 * Purpose:
 * - is_active: Manual control by super-admin (suspend/activate businesses)
 * - free_access: Grant permanent free access to special cases (sponsored projects, NGOs, etc.)
 */

const db = require('./config/database-mysql');

async function migrate() {
    console.log('🔄 Starting migration: Add business control columns...\n');

    try {
        // Check if columns already exist
        console.log('📋 Checking existing columns...');
        const [columns] = await db.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'businesses'
        `);

        const existingColumns = columns.map(c => c.COLUMN_NAME);
        console.log(`   Found ${existingColumns.length} columns in businesses table\n`);

        // Add is_active column if it doesn't exist
        if (!existingColumns.includes('is_active')) {
            console.log('➕ Adding is_active column...');
            await db.query(`
                ALTER TABLE businesses
                ADD COLUMN is_active BOOLEAN DEFAULT TRUE
                COMMENT 'Manual control by super-admin to activate/deactivate business'
            `);
            console.log('   ✅ is_active column added\n');
        } else {
            console.log('   ⏭️  is_active column already exists\n');
        }

        // Add free_access column if it doesn't exist
        if (!existingColumns.includes('free_access')) {
            console.log('➕ Adding free_access column...');
            await db.query(`
                ALTER TABLE businesses
                ADD COLUMN free_access BOOLEAN DEFAULT FALSE
                COMMENT 'Permanent free access for sponsored projects, NGOs, special cases'
            `);
            console.log('   ✅ free_access column added\n');
        } else {
            console.log('   ⏭️  free_access column already exists\n');
        }

        // Set all existing businesses to active by default
        console.log('🔧 Setting default values for existing businesses...');
        const [updateResult] = await db.query(`
            UPDATE businesses
            SET is_active = TRUE
            WHERE is_active IS NULL
        `);
        console.log(`   ✅ Updated ${updateResult.affectedRows} businesses to active\n`);

        // Verify the changes
        console.log('🔍 Verifying table structure...');
        const [newColumns] = await db.query(`
            SHOW COLUMNS FROM businesses
            WHERE Field IN ('is_active', 'free_access')
        `);

        console.log('\n📊 New columns:');
        newColumns.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type}, Default: ${col.Default}, Null: ${col.Null}`);
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
