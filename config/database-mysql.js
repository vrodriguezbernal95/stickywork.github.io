const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a MySQL
// Prioriza MYSQL_URL (Railway) sobre variables individuales
let dbConfig;

if (process.env.MYSQL_URL || process.env.MYSQLURL) {
    // Usar URL de conexión directa (Railway)
    const url = process.env.MYSQL_URL || process.env.MYSQLURL;
    console.log('📦 Conectando vía MYSQL_URL');
    // Añadir charset a la URL si no lo tiene
    dbConfig = url.includes('?')
        ? `${url}&charset=utf8mb4`
        : `${url}?charset=utf8mb4`;
} else {
    // Usar variables individuales (desarrollo local)
    console.log('📦 Conectando vía variables individuales');
    dbConfig = {
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'stickywork',
        port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
        charset: 'utf8mb4',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

// Pool de conexiones
let pool;

async function createPool() {
    try {
        // dbConfig puede ser un string (URL) o un objeto (config individual)
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
