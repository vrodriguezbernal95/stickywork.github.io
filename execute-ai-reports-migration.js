const fetch = require('node-fetch');

async function executeMigration() {
    console.log('🚀 Ejecutando migración de Reportes IA en producción...\n');

    try {
        const response = await fetch('https://api.stickywork.com/api/setup/migrate-ai-reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: process.env.SUPER_ADMIN_SECRET
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Migración completada exitosamente!\n');
            console.log('📊 Negocios con Reportes IA habilitados:');
            data.enabledBusinesses.forEach(b => {
                console.log(`   - ${b.name} (ID: ${b.id})`);
            });
        } else {
            console.log('❌ Error:', data.message);
            if (data.error) console.log('   Detalle:', data.error);
        }

    } catch (error) {
        console.error('❌ Error ejecutando migración:', error.message);
    }
}

executeMigration();
