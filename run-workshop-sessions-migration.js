// Script para ejecutar la migración de sesiones múltiples en talleres
// Ejecutar con: node run-workshop-sessions-migration.js

const https = require('https');

const API_URL = 'api.stickywork.com';
const TOKEN = process.env.SUPER_ADMIN_SECRET || 'super-admin-test-token';

const options = {
    hostname: API_URL,
    port: 443,
    path: '/api/debug/run-workshop-sessions-migration',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    }
};

console.log('Ejecutando migración de sesiones múltiples para talleres...\n');

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            if (result.success) {
                console.log('Migración ejecutada correctamente!');
                console.log('   Tablas creadas:', result.tables?.join(', '));
                console.log('   Columnas añadidas:', result.columns?.join(', '));
            } else {
                console.log('Error:', result.message);
            }
        } catch (e) {
            console.log('Respuesta:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error de conexión:', error.message);
});

req.end();
