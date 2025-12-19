// Migration 012: Add cancellation tracking fields to bookings table

async function up(db) {
    console.log('Running migration 012: Add cancellation tracking fields...');

    try {
        // Add cancellation_reason column
        await db.query(`
            ALTER TABLE bookings
            ADD COLUMN cancellation_reason TEXT NULL
        `);
        console.log('✅ Added cancellation_reason column');

        // Add cancellation_date column
        await db.query(`
            ALTER TABLE bookings
            ADD COLUMN cancellation_date DATETIME NULL
        `);
        console.log('✅ Added cancellation_date column');

        // Add viewed_by_admin column
        await db.query(`
            ALTER TABLE bookings
            ADD COLUMN viewed_by_admin BOOLEAN DEFAULT FALSE
        `);
        console.log('✅ Added viewed_by_admin column');

        console.log('✅ Migration 012 completed successfully');
    } catch (error) {
        console.error('❌ Migration 012 failed:', error.message);
        throw error;
    }
}

async function down(db) {
    console.log('Rolling back migration 012...');

    try {
        await db.query('ALTER TABLE bookings DROP COLUMN cancellation_reason');
        await db.query('ALTER TABLE bookings DROP COLUMN cancellation_date');
        await db.query('ALTER TABLE bookings DROP COLUMN viewed_by_admin');
        console.log('✅ Migration 012 rolled back successfully');
    } catch (error) {
        console.error('❌ Rollback failed:', error.message);
        throw error;
    }
}

module.exports = { up, down };
