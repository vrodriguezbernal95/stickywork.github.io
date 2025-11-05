// Adaptador universal de base de datos
// Usa PostgreSQL en producción (Render) y MySQL en desarrollo (local)

require('dotenv').config();

// Detectar qué base de datos usar
const usePostgres = process.env.DATABASE_URL || process.env.USE_POSTGRES === 'true';

// Cargar el driver correspondiente
const db = usePostgres
    ? require('./database-postgres')
    : require('./database-mysql');

console.log(`🗄️  Usando: ${usePostgres ? 'PostgreSQL' : 'MySQL'}`);

// Exportar la interfaz unificada
module.exports = db;
