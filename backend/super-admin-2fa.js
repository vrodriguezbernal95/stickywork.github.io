// Verificación en dos pasos (TOTP: Google Authenticator, Authy...) para el super admin.
// - Al activarla, el login pide un código de 6 dígitos de la app (o un código de respaldo).
// - El secreto solo se da por bueno cuando el super admin confirma un código (no se activa a medias).
// - Códigos de respaldo: 10, de un solo uso, guardados como hash.
// - Recuperar la contraseña por email NO quita la verificación: hace falta la app o un código de respaldo.

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const SECRET = () => process.env.JWT_SECRET || 'your-secret-key';

async function ensureColumns(db) {
    const cols = await db.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'platform_admins'`
    );
    const tiene = new Set(cols.map(c => c.COLUMN_NAME));
    const nuevas = {
        two_factor_enabled: 'TINYINT(1) NOT NULL DEFAULT 0',
        two_factor_secret: 'VARCHAR(64) NULL',
        two_factor_pending_secret: 'VARCHAR(64) NULL',
        two_factor_backup_codes: 'TEXT NULL'
    };
    for (const [col, def] of Object.entries(nuevas)) {
        if (!tiene.has(col)) {
            await db.query(`ALTER TABLE platform_admins ADD COLUMN ${col} ${def}`);
            console.log(`✅ Columna platform_admins.${col} añadida (verificación en dos pasos)`);
        }
    }
}

const hash = c => crypto.createHash('sha256').update(String(c).trim().toUpperCase()).digest('hex');

function verifyTotp(secret, code) {
    if (!secret || !/^\d{6}$/.test(String(code || '').trim())) return false;
    return speakeasy.totp.verify({ secret, encoding: 'base32', token: String(code).trim(), window: 1 });
}

// Comprueba un código de la app o, si no, un código de respaldo (que se gasta)
async function checkCode(db, admin, code) {
    const c = String(code || '').trim();
    if (verifyTotp(admin.two_factor_secret, c)) return { ok: true };
    if (/^[0-9A-Fa-f]{8}$/.test(c)) {
        let codes = [];
        try { codes = JSON.parse(admin.two_factor_backup_codes || '[]'); } catch (e) { codes = []; }
        const h = hash(c);
        if (codes.includes(h)) {
            const quedan = codes.filter(x => x !== h);
            // Solo cuenta si nadie lo ha gastado a la vez (la lista sigue siendo la que leímos)
            const r = await db.query('UPDATE platform_admins SET two_factor_backup_codes = ? WHERE id = ? AND two_factor_backup_codes = ?',
                [JSON.stringify(quedan), admin.id, admin.two_factor_backup_codes]);
            if (r.affectedRows === 1) return { ok: true, backupUsed: true, backupLeft: quedan.length };
        }
    }
    return { ok: false };
}

// Token temporal entre la contraseña y el código (5 minutos, solo sirve para el segundo paso)
function tempToken(admin) {
    return jwt.sign({ super_admin_id: admin.id, purpose: 'super-2fa' }, SECRET(), { expiresIn: '5m' });
}

function readTempToken(token) {
    try {
        const d = jwt.verify(String(token || ''), SECRET());
        return d.purpose === 'super-2fa' ? d.super_admin_id : null;
    } catch (e) {
        return null;
    }
}

async function startSetup(db, admin) {
    const secret = speakeasy.generateSecret({ name: `StickyWork Super Admin (${admin.email})`, issuer: 'StickyWork', length: 20 });
    await db.query('UPDATE platform_admins SET two_factor_pending_secret = ? WHERE id = ?', [secret.base32, admin.id]);
    return { qrCode: await QRCode.toDataURL(secret.otpauth_url), manualEntry: secret.base32 };
}

async function confirmSetup(db, adminId, code) {
    const [a] = await db.query('SELECT id, two_factor_pending_secret FROM platform_admins WHERE id = ?', [adminId]);
    if (!a || !a.two_factor_pending_secret) return { error: 'Empieza de nuevo: pulsa «Activar» para generar el código QR.' };
    if (!verifyTotp(a.two_factor_pending_secret, code)) return { error: 'El código no es correcto. Revisa que la hora del móvil esté bien y prueba con el siguiente.' };
    const backup = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
    await db.query(
        `UPDATE platform_admins SET two_factor_enabled = 1, two_factor_secret = two_factor_pending_secret,
         two_factor_pending_secret = NULL, two_factor_backup_codes = ? WHERE id = ?`,
        [JSON.stringify(backup.map(hash)), adminId]
    );
    return { ok: true, backupCodes: backup };
}

async function disable(db, adminId) {
    await db.query(
        `UPDATE platform_admins SET two_factor_enabled = 0, two_factor_secret = NULL,
         two_factor_pending_secret = NULL, two_factor_backup_codes = NULL WHERE id = ?`, [adminId]);
}

async function newBackupCodes(db, adminId) {
    const backup = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
    await db.query('UPDATE platform_admins SET two_factor_backup_codes = ? WHERE id = ?', [JSON.stringify(backup.map(hash)), adminId]);
    return backup;
}

function backupLeft(admin) {
    try { return JSON.parse(admin.two_factor_backup_codes || '[]').length; } catch (e) { return 0; }
}

module.exports = { ensureColumns, checkCode, tempToken, readTempToken, startSetup, confirmSetup, disable, newBackupCodes, backupLeft };
