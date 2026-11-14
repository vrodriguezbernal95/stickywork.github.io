// Negocios suspendidos desde el super admin (businesses.is_active = 0).
// Un negocio suspendido no puede usar su panel ni recibir reservas online.
// Se guarda en memoria y se refresca cada minuto (y al momento cuando el super admin lo cambia),
// para no consultar la base de datos en cada petición del panel.

let suspendidos = new Set();
let db = null;

const MENSAJE_PANEL = 'Tu cuenta está suspendida. Si crees que es un error, escríbenos a soporte@stickywork.com.';
const MENSAJE_PUBLICO = 'Este negocio no acepta reservas online en este momento.';

async function ensureColumn(database) {
    db = database;
    const cols = await db.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'businesses' AND COLUMN_NAME = 'is_active'`
    );
    const marcar = () => db.query(
        `INSERT IGNORE INTO admin_documents (doc_key, content) VALUES ('flag-suspension-v1', 'Suspensiones antiguas reactivadas')`);
    if (!cols.length) {
        await db.query('ALTER TABLE businesses ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1');
        await marcar();
        console.log('✅ Columna businesses.is_active añadida (suspensión de negocios)');
    } else {
        // Hasta noviembre de 2026 el botón «Suspender» no bloqueaba nada. La primera vez que la suspensión
        // empieza a aplicarse, se reactivan todos para que nadie quede bloqueado por una marca antigua.
        // Si esta comprobación falla, no se aplica ninguna suspensión (mejor no bloquear a nadie por error).
        const flag = await db.query(`SELECT doc_key FROM admin_documents WHERE doc_key = 'flag-suspension-v1'`);
        if (!flag.length) {
            const r = await db.query('UPDATE businesses SET is_active = 1 WHERE is_active = 0');
            await marcar();
            if (r.affectedRows) console.log(`ℹ️ Suspensión: ${r.affectedRows} negocios con marca antigua reactivados`);
        }
    }
    await refresh();
    setInterval(() => refresh().catch(() => {}), 60 * 1000).unref();
}

async function refresh() {
    if (!db) return;
    const rows = await db.query('SELECT id FROM businesses WHERE is_active = 0');
    suspendidos = new Set(rows.map(r => Number(r.id)));
}

function isSuspended(businessId) {
    return businessId !== undefined && businessId !== null && suspendidos.has(Number(businessId));
}

module.exports = { ensureColumn, refresh, isSuspended, MENSAJE_PANEL, MENSAJE_PUBLICO };
