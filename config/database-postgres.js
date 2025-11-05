const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

// Crear pool de conexiones PostgreSQL
async function createPool() {
    if (pool) return pool;

    // Render proporciona DATABASE_URL automáticamente
    const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

    pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    console.log('✓ Pool de conexiones PostgreSQL creado');
    return pool;
}

// Obtener una conexión
async function getConnection() {
    if (!pool) {
        await createPool();
    }
    return pool;
}

// Ejecutar query (adaptador compatible con MySQL)
async function query(sql, params = []) {
    const client = await getConnection();

    // Convertir placeholders de MySQL (?) a PostgreSQL ($1, $2, etc.)
    let pgSql = sql;
    let pgParams = params;

    if (sql.includes('?')) {
        let index = 1;
        pgSql = sql.replace(/\?/g, () => `$${index++}`);
    }

    try {
        const result = await client.query(pgSql, pgParams);
        return result.rows;
    } catch (error) {
        console.error('Error en query PostgreSQL:', error.message);
        throw error;
    }
}

// Verificar conexión
async function testConnection() {
    try {
        const result = await query('SELECT NOW() as now');
        console.log('✓ Conexión a PostgreSQL exitosa');
        return true;
    } catch (error) {
        console.error('✗ Error de conexión a PostgreSQL:', error.message);
        return false;
    }
}

// Cerrar conexión
async function closeConnection() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('Conexión a PostgreSQL cerrada');
    }
}

module.exports = {
    createPool,
    getConnection,
    query,
    testConnection,
    closeConnection
};
