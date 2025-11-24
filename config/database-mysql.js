const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a MySQL
// Prioriza MYSQL_URL (Railway) sobre variables individuales
let dbConfig;

if (process.env.MYSQL_URL) {
    // Usar URL de conexión directa (Railway)
    console.log('📦 Usando MYSQL_URL para conexión');
    dbConfig = process.env.MYSQL_URL;
} else {
    // Usar variables individuales (desarrollo local)
    dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'stickywork',
        port: parseInt(process.env.DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

// Pool de conexiones
let pool;

async function createPool() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('✓ Pool de conexiones MySQL creado');
        return pool;
    } catch (error) {
        console.error('✗ Error al crear pool de conexiones:', error.message);
        throw error;
    }
}

async function getConnection() {
    if (!pool) {
        await createPool();
    }
    return pool.getConnection();
}

async function query(sql, params) {
    const connection = await getConnection();
    try {
        const [results] = await connection.execute(sql, params);
        return results;
    } finally {
        connection.release();
    }
}

// Función para verificar la conexión
async function testConnection() {
    try {
        const connection = await getConnection();
        await connection.ping();
        connection.release();
        console.log('✓ Conexión a MySQL exitosa');
        return true;
    } catch (error) {
        console.error('✗ Error de conexión a MySQL:', error.message);
        return false;
    }
}

module.exports = {
    createPool,
    getConnection,
    query,
    testConnection,
    pool: () => pool
};
