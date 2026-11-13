// Recuperación de contraseña del super admin (separada de la de los negocios).
// - Enlace de un solo uso que caduca a los 30 minutos; en la base de datos solo se guarda el hash del token.
// - Respuesta idéntica exista o no el email (no revela cuentas).
// - Al cambiar la contraseña se invalidan los demás enlaces pendientes.

const crypto = require('crypto');
const bcrypt = require('bcrypt');

const MIN_LONGITUD = 12;

async function ensureResetTable(db) {
    await db.query(`
        CREATE TABLE IF NOT EXISTS super_admin_reset_tokens (
            id INT PRIMARY KEY AUTO_INCREMENT,
            admin_id INT NOT NULL,
            token_hash CHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            used BOOLEAN NOT NULL DEFAULT FALSE,
            ip_address VARCHAR(64) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_sart_hash (token_hash)
        )
    `);
}

function hash(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function emailReset(nombre, url) {
    return {
        subject: '🔐 Restablecer la contraseña del super admin de StickyWork',
        html: `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f5f5f7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;line-height:1.6;font-size:15px">
<h1 style="font-size:20px;margin:0 0 16px">Restablecer contraseña</h1>
<p>Hola${nombre ? ', ' + String(nombre).replace(/[<>&"']/g, '') : ''}:</p>
<p>Alguien ha pedido restablecer la contraseña del <strong>super admin</strong> de StickyWork. Si has sido tú, pulsa el botón. El enlace caduca en 30 minutos y solo sirve una vez.</p>
<p style="text-align:center;margin:28px 0"><a href="${url}" style="background:#3b82f6;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">Elegir contraseña nueva</a></p>
<p style="color:#6b7280;font-size:13px">Si no has sido tú, ignora este email: tu contraseña no cambia. Si te llegan varios sin haberlos pedido, avísanos.</p>
</div></body></html>`
    };
}

// Siempre devuelve lo mismo; si el email existe y está activo, envía el enlace
async function requestReset(db, emailService, email, ip) {
    if (!email || typeof email !== 'string') return;
    const admins = await db.query('SELECT id, email, full_name FROM platform_admins WHERE email = ? AND is_active = TRUE', [email.trim()]);
    if (!admins.length) return;
    const admin = admins[0];
    const token = crypto.randomBytes(32).toString('hex');
    await db.query(
        `INSERT INTO super_admin_reset_tokens (admin_id, token_hash, expires_at, ip_address)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), ?)`,
        [admin.id, hash(token), ip ? String(ip).slice(0, 64) : null]
    );
    const base = process.env.FRONTEND_URL || 'https://stickywork.com';
    const url = `${base.replace(/\/$/, '')}/super-admin-reset.html?token=${token}`;
    const r = await emailService.sendEmail(admin.email, emailReset(admin.full_name, url));
    if (!r || r.success === false) console.error('⚠️ No se pudo enviar el email de recuperación del super admin');
    console.log(`🔐 [Super admin] Enlace de recuperación solicitado para el admin ${admin.id}`);
}

// Devuelve { ok: true } o { error: 'mensaje' }
async function resetPassword(db, token, newPassword) {
    if (!token || !/^[a-f0-9]{64}$/.test(String(token))) return { error: 'El enlace no es válido. Pide uno nuevo.' };
    if (!newPassword || String(newPassword).length < MIN_LONGITUD) return { error: `La contraseña debe tener al menos ${MIN_LONGITUD} caracteres.` };
    const rows = await db.query(
        `SELECT t.id, t.admin_id FROM super_admin_reset_tokens t
         JOIN platform_admins a ON a.id = t.admin_id AND a.is_active = TRUE
         WHERE t.token_hash = ? AND t.used = FALSE AND t.expires_at > NOW()`,
        [hash(token)]
    );
    if (!rows.length) return { error: 'El enlace ha caducado o ya se ha usado. Pide uno nuevo.' };
    const { id, admin_id } = rows[0];
    // Marcar primero como usado para que no se pueda reutilizar aunque algo falle después
    const upd = await db.query('UPDATE super_admin_reset_tokens SET used = TRUE WHERE id = ? AND used = FALSE', [id]);
    if (!upd.affectedRows) return { error: 'El enlace ya se ha usado. Pide uno nuevo.' };
    const passwordHash = await bcrypt.hash(String(newPassword), 12);
    await db.query('UPDATE platform_admins SET password_hash = ? WHERE id = ?', [passwordHash, admin_id]);
    await db.query('UPDATE super_admin_reset_tokens SET used = TRUE WHERE admin_id = ? AND used = FALSE', [admin_id]);
    console.log(`🔐 [Super admin] Contraseña restablecida para el admin ${admin_id}`);
    return { ok: true };
}

module.exports = { ensureResetTable, requestReset, resetPassword, MIN_LONGITUD };
