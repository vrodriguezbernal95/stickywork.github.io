// Salud del envío de emails: apunta cada envío (bien o mal) para avisar en el super admin si fallan.
// Motivo: en noviembre de 2026 Brevo bloqueó la IP del servidor y los emails dejaron de salir sin que nadie se enterase.
// No se guarda a quién va el email: solo si salió, el error y la fecha. Se borran a los 30 días.

let tablaLista = false;

async function ensureEmailEventsTable(db) {
    await db.query(`
        CREATE TABLE IF NOT EXISTS email_events (
            id INT PRIMARY KEY AUTO_INCREMENT,
            ok BOOLEAN NOT NULL,
            error VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email_events_date (created_at)
        )
    `);
    tablaLista = true;
}

// Nunca lanza: apuntar el resultado no puede romper un envío
async function record(result) {
    if (!tablaLista) return;
    try {
        const db = require('../config/database');
        const ok = !!(result && result.success);
        let error = null;
        if (!ok) {
            error = String((result && (result.error || result.message)) || 'Error desconocido')
                .replace(/[^\s@]+@[^\s@]+/g, '[email]') // sin direcciones de email
                .slice(0, 255);
        }
        await db.query('INSERT INTO email_events (ok, error) VALUES (?, ?)', [ok, error]);
    } catch (e) {
        console.error('No se pudo apuntar el resultado del email:', e.message);
    }
}

async function getHealth(db) {
    const [r] = await db.query(`
        SELECT SUM(ok = 1 AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS ok24,
               SUM(ok = 0 AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS fail24,
               MAX(CASE WHEN ok = 1 THEN created_at END) AS lastOk,
               MAX(CASE WHEN ok = 0 THEN created_at END) AS lastFail
        FROM email_events`);
    const [last] = await db.query('SELECT error FROM email_events WHERE ok = 0 ORDER BY id DESC LIMIT 1');
    return {
        ok24: Number(r.ok24) || 0,
        fail24: Number(r.fail24) || 0,
        lastOk: r.lastOk || null,
        lastFail: r.lastFail || null,
        lastError: last ? last.error : null
    };
}

async function cleanup(db) {
    await db.query('DELETE FROM email_events WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)');
}

module.exports = { ensureEmailEventsTable, record, getHealth, cleanup };
