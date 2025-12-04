/**
 * Database Helper
 * Utilidad para manejar conexiones MySQL en scripts de mantenimiento
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Ejecuta una función con una conexión a la base de datos
 * Maneja automáticamente la creación, cierre y errores de la conexión
 *
 * @param {Function} callback - Función async que recibe la conexión como parámetro
 * @returns {Promise} - Resultado de la función callback
 *
 * @example
 * await withConnection(async (conn) => {
 *     const [rows] = await conn.query('SELECT * FROM users');
 *     return rows;
 * });
 */
async function withConnection(callback) {
    let connection;

    try {
        // Detectar entorno (Railway o local)
        const mysqlUrl = process.env.MYSQL_URL || process.env.MYSQLURL;

        if (mysqlUrl) {
            console.log('🔗 Conectando a Railway MySQL...');
            connection = await mysql.createConnection(mysqlUrl);
        } else {
            console.log('🔗 Conectando a MySQL local...');
            connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'stickywork',
                port: process.env.DB_PORT || 3306
            });
        }

        console.log('✅ Conectado exitosamente\n');

        // Ejecutar callback con la conexión
        const result = await callback(connection);

        return result;

    } catch (error) {
        console.error('\n❌ Error de base de datos:', error.message);

        // Detalles adicionales según el tipo de error
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   Verifica las credenciales de la base de datos');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('   No se puede conectar a la base de datos');
            console.error('   Verifica que MySQL esté corriendo');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('   La base de datos especificada no existe');
        }

        throw error;

    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

/**
 * Ejecuta una query simple y devuelve los resultados
 * Útil para queries de lectura rápidas
 *
 * @param {string} query - Query SQL a ejecutar
 * @param {Array} params - Parámetros de la query (opcional)
 * @returns {Promise<Array>} - Resultados de la query
 *
 * @example
 * const users = await executeQuery('SELECT * FROM users WHERE id = ?', [123]);
 */
async function executeQuery(query, params = []) {
    return withConnection(async (conn) => {
        const [rows] = await conn.query(query, params);
        return rows;
    });
}

/**
 * Imprime una tabla formateada en consola
 * Útil para mostrar resultados de queries de forma legible
 *
 * @param {Array} rows - Filas a mostrar
 * @param {Array} columns - Columnas a mostrar (opcional, muestra todas si no se especifica)
 *
 * @example
 * const users = await executeQuery('SELECT * FROM users');
 * printTable(users, ['id', 'name', 'email']);
 */
function printTable(rows, columns = null) {
    if (rows.length === 0) {
        console.log('📋 No hay resultados');
        return;
    }

    console.table(rows, columns);
}

module.exports = {
    withConnection,
    executeQuery,
    printTable
};
