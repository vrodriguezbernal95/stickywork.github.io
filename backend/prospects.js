// Captación de clientes: negocios potenciales (prospects), su historial y la lista de no contactar.
//
// Flujo (ver docs/captacion/diseno-agente-captacion.md):
//   llamada o visita → si da permiso, WhatsApp → seguimiento → registrado → activo
// Reglas legales que el sistema hace cumplir:
//   - Sin permiso apuntado (consent_wa_at) no se ofrece el botón de WhatsApp (LSSI art. 21).
//   - Quien pide no ser contactado entra en do_not_contact y no se puede volver a importar.
//   - Los que no responden o no tienen interés se borran a los 12 meses (cleanupOldProspects).

const crypto = require('crypto');

const SECTORES = ['peluqueria', 'estetica', 'fisioterapia', 'psicologia', 'nutricion', 'podologia',
    'canina', 'tatuajes', 'optica', 'dental', 'gimnasio', 'otro'];

const ESTADOS = ['nuevo', 'no_contesta', 'volver_llamar', 'interesado', 'permiso_wa', 'mensaje_enviado',
    'seguimiento', 'registrado', 'no_interesa', 'no_contactar', 'descartado'];

const MAX_INTENTOS = 3;
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

async function ensureProspectTables(db) {
    await db.query(`
        CREATE TABLE IF NOT EXISTS prospects (
            id INT PRIMARY KEY AUTO_INCREMENT,
            code VARCHAR(12) NOT NULL UNIQUE,
            name VARCHAR(200) NOT NULL,
            sector VARCHAR(40) NULL,
            address VARCHAR(255) NULL,
            district VARCHAR(120) NULL,
            city VARCHAR(120) NULL,
            phone VARCHAR(40) NULL,
            phone_norm VARCHAR(20) NULL,
            website VARCHAR(255) NULL,
            instagram VARCHAR(255) NULL,
            booking_method VARCHAR(40) NULL,
            booking_tool VARCHAR(80) NULL,
            score INT NULL,
            tier CHAR(1) NULL,
            hook TEXT NULL,
            call_script TEXT NULL,
            wa_message TEXT NULL,
            followup_message TEXT NULL,
            source VARCHAR(160) NULL,
            source_date DATE NULL,
            batch VARCHAR(40) NULL,
            variant VARCHAR(20) NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'nuevo',
            attempts INT NOT NULL DEFAULT 0,
            next_action_at DATE NULL,
            consent_wa_at DATETIME NULL,
            business_id INT NULL,
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_prospect_status (status),
            INDEX idx_prospect_next (next_action_at),
            INDEX idx_prospect_phone (phone_norm),
            INDEX idx_prospect_business (business_id)
        )
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS prospect_events (
            id INT PRIMARY KEY AUTO_INCREMENT,
            prospect_id INT NOT NULL,
            type VARCHAR(30) NOT NULL,
            detail VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_pe_prospect (prospect_id),
            INDEX idx_pe_type (type)
        )
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS do_not_contact (
            id INT PRIMARY KEY AUTO_INCREMENT,
            phone_norm VARCHAR(20) NULL,
            name_norm VARCHAR(200) NULL,
            city_norm VARCHAR(120) NULL,
            reason VARCHAR(120) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_dnc_phone (phone_norm),
            INDEX idx_dnc_name (name_norm)
        )
    `);
    // Documentos internos del super admin (p. ej. la guía de captación): viven en la base de datos, no en Git
    await db.query(`
        CREATE TABLE IF NOT EXISTS admin_documents (
            doc_key VARCHAR(60) PRIMARY KEY,
            content MEDIUMTEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    await migrateOldLeads(db);
}

// La lista antigua de «Nuevos Clientes» (tabla leads) pasa a captación una sola vez
async function migrateOldLeads(db) {
    const existe = await db.query(
        `SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads'`
    );
    if (!Number(existe[0].n)) return;
    const [ya] = await db.query(`SELECT COUNT(*) AS n FROM prospect_events WHERE type = 'migrado'`);
    if (Number(ya.n)) return;
    const leads = await db.query('SELECT * FROM leads');
    let n = 0;
    for (const l of leads) {
        if (!l.business_name) continue;
        if (await findDuplicate(db, { name: l.business_name, phone: l.contact_phone, city: null })) continue;
        const status = l.status === 'invalid' ? 'descartado' : 'nuevo';
        const antiguo = { valid: 'válido', invalid: 'no válido', pending: 'pendiente' }[l.status] || l.status || '';
        const id = await insertProspect(db, {
            name: l.business_name, phone: l.contact_phone, website: l.website,
            notes: [l.notes, antiguo ? `(Lista antigua: ${antiguo})` : ''].filter(Boolean).join('\n'),
            source: 'Lista antigua de Nuevos Clientes', status
        });
        if (id) n++;
    }
    // Marca de que la migración ya se hizo (aunque no hubiera leads)
    await db.query(`INSERT INTO prospect_events (prospect_id, type, detail) VALUES (0, 'migrado', ?)`, [`${n} leads antiguos`]);
    if (n) console.log(`✅ Captación: ${n} leads antiguos pasados a prospects`);
}

// ---------- utilidades ----------

function normPhone(p) {
    if (!p) return null;
    let d = String(p).replace(/\D/g, '');
    if (d.startsWith('0034')) d = d.slice(4);
    if (d.length === 11 && d.startsWith('34')) d = d.slice(2);
    return d.length >= 9 ? d.slice(-9) : null;
}

function normText(s) {
    if (!s) return null;
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() || null;
}

function nuevoCodigo() {
    const bytes = crypto.randomBytes(6);
    let c = '';
    for (const b of bytes) c += ALFABETO[b % ALFABETO.length];
    return c;
}

// Fecha local AAAA-MM-DD sumando días laborables (sin toISOString)
function fechaLaborable(dias) {
    const d = new Date();
    let añadidos = 0;
    while (añadidos < dias) {
        d.setDate(d.getDate() + 1);
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) añadidos++;
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hoy() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Las columnas DATE llegan como Date en hora local del servidor: se devuelven como 'AAAA-MM-DD' (sin toISOString)
function fixDates(row) {
    if (!row) return row;
    for (const k of ['next_action_at', 'source_date']) {
        const v = row[k];
        if (v instanceof Date && !isNaN(v)) {
            row[k] = `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
        }
    }
    return row;
}

function recorta(v, max) {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s ? s.slice(0, max) : null;
}

async function isDoNotContact(db, { phone, name, city }) {
    const pn = normPhone(phone);
    const nn = normText(name);
    const cn = normText(city);
    if (pn) {
        const r = await db.query('SELECT id FROM do_not_contact WHERE phone_norm = ? LIMIT 1', [pn]);
        if (r.length) return true;
    }
    if (nn) {
        const r = await db.query(
            'SELECT id FROM do_not_contact WHERE name_norm = ? AND (city_norm IS NULL OR city_norm = ? OR ? IS NULL) LIMIT 1',
            [nn, cn, cn]
        );
        if (r.length) return true;
    }
    return false;
}

async function findDuplicate(db, { phone, name, city }) {
    const pn = normPhone(phone);
    if (pn) {
        const r = await db.query('SELECT id FROM prospects WHERE phone_norm = ? LIMIT 1', [pn]);
        if (r.length) return r[0].id;
    }
    const nn = normText(name);
    if (nn) {
        const rows = await db.query('SELECT id, name, city FROM prospects WHERE city <=> ? OR ? IS NULL', [city || null, city || null]);
        const hit = rows.find(r => normText(r.name) === nn);
        if (hit) return hit.id;
    }
    return null;
}

async function insertProspect(db, p) {
    for (let intento = 0; intento < 5; intento++) {
        try {
            const sector = SECTORES.includes(p.sector) ? p.sector : (p.sector ? 'otro' : null);
            const score = Number.isFinite(Number(p.score)) ? Math.max(0, Math.min(100, Math.round(Number(p.score)))) : null;
            const tier = ['A', 'B', 'C'].includes(p.tier) ? p.tier : (score === null ? null : score >= 70 ? 'A' : score >= 50 ? 'B' : 'C');
            const status = ESTADOS.includes(p.status) ? p.status : 'nuevo';
            const r = await db.query(
                `INSERT INTO prospects
                 (code, name, sector, address, district, city, phone, phone_norm, website, instagram,
                  booking_method, booking_tool, score, tier, hook, call_script, wa_message, followup_message,
                  source, source_date, batch, variant, status, next_action_at, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [nuevoCodigo(), recorta(p.name, 200), sector, recorta(p.address, 255), recorta(p.district, 120),
                    recorta(p.city, 120), recorta(p.phone, 40), normPhone(p.phone), recorta(p.website, 255),
                    recorta(p.instagram, 255), recorta(p.booking_method, 40), recorta(p.booking_tool, 80),
                    score, tier, recorta(p.hook, 2000), recorta(p.call_script, 6000), recorta(p.wa_message, 3000),
                    recorta(p.followup_message, 2000), recorta(p.source, 160),
                    /^\d{4}-\d{2}-\d{2}$/.test(p.source_date || '') ? p.source_date : null,
                    recorta(p.batch, 40), recorta(p.variant, 20), status,
                    status === 'nuevo' ? hoy() : null, recorta(p.notes, 4000)]
            );
            await logEvent(db, r.insertId, 'alta', recorta(p.source, 255));
            return r.insertId;
        } catch (e) {
            if (e.code !== 'ER_DUP_ENTRY') throw e;
        }
    }
    throw new Error('No se pudo generar el código del negocio');
}

async function logEvent(db, prospectId, type, detail) {
    await db.query('INSERT INTO prospect_events (prospect_id, type, detail) VALUES (?, ?, ?)',
        [prospectId, type, detail ? String(detail).slice(0, 255) : null]);
}

// ---------- operaciones ----------

// Importa una tanda (array de negocios preparados por el agente). Salta duplicados y la lista de no contactar.
async function importBatch(db, items, batchName) {
    const res = { added: 0, duplicates: 0, blocked: 0, invalid: 0 };
    for (const raw of items) {
        if (!raw || typeof raw !== 'object' || !raw.name || !String(raw.name).trim()) { res.invalid++; continue; }
        const p = { ...raw, batch: raw.batch || batchName };
        if (await isDoNotContact(db, p)) { res.blocked++; continue; }
        if (await findDuplicate(db, p)) { res.duplicates++; continue; }
        await insertProspect(db, p);
        res.added++;
    }
    return res;
}

// Resultado de un contacto: cambia el estado y calcula el siguiente paso
async function applyOutcome(db, id, outcome, extra = {}) {
    const [p] = await db.query('SELECT * FROM prospects WHERE id = ?', [id]);
    if (!p) return null;
    const sets = [];
    const vals = [];
    let detail = outcome;

    switch (outcome) {
        case 'no_contesta': {
            const intentos = (p.attempts || 0) + 1;
            sets.push('attempts = ?'); vals.push(intentos);
            sets.push('status = ?'); vals.push('no_contesta');
            sets.push('next_action_at = ?'); vals.push(intentos >= MAX_INTENTOS ? null : fechaLaborable(2));
            detail = `no contesta (intento ${intentos})`;
            break;
        }
        case 'volver_llamar':
            sets.push('status = ?'); vals.push('volver_llamar');
            sets.push('next_action_at = ?');
            vals.push(/^\d{4}-\d{2}-\d{2}$/.test(extra.date || '') ? extra.date : fechaLaborable(1));
            break;
        case 'interesado':
            sets.push('status = ?'); vals.push('interesado');
            sets.push('next_action_at = ?'); vals.push(fechaLaborable(3));
            break;
        case 'permiso_wa':
            sets.push('status = ?'); vals.push('permiso_wa');
            sets.push('consent_wa_at = COALESCE(consent_wa_at, NOW())');
            sets.push('next_action_at = ?'); vals.push(hoy());
            detail = 'permiso para WhatsApp';
            break;
        case 'mensaje_enviado':
            if (!p.consent_wa_at) return { error: 'Sin permiso apuntado no se puede enviar WhatsApp' };
            sets.push('status = ?'); vals.push('mensaje_enviado');
            sets.push('next_action_at = ?'); vals.push(fechaLaborable(3));
            break;
        case 'seguimiento':
            if (!p.consent_wa_at) return { error: 'Sin permiso apuntado no se puede enviar WhatsApp' };
            sets.push('status = ?'); vals.push('seguimiento');
            sets.push('next_action_at = ?'); vals.push(fechaLaborable(5));
            break;
        case 'registrado':
            sets.push('status = ?'); vals.push('registrado');
            sets.push('next_action_at = ?'); vals.push(fechaLaborable(5));
            break;
        case 'no_interesa':
            sets.push('status = ?'); vals.push('no_interesa');
            sets.push('next_action_at = NULL');
            break;
        case 'descartado':
            sets.push('status = ?'); vals.push('descartado');
            sets.push('next_action_at = NULL');
            break;
        case 'no_contactar':
            // Solo se guarda lo mínimo para no volver a contactar: la ficha y su historial se borran
            await addDoNotContact(db, { phone: p.phone, name: p.name, city: p.city, reason: extra.reason || 'Pidió no ser contactado' });
            await db.query('DELETE FROM prospect_events WHERE prospect_id = ?', [id]);
            await db.query('DELETE FROM prospects WHERE id = ?', [id]);
            return { deleted: true, prospect: { id: p.id, name: p.name, status: 'no_contactar', next_action_at: null } };
        default:
            return { error: 'Resultado desconocido' };
    }

    vals.push(id);
    await db.query(`UPDATE prospects SET ${sets.join(', ')} WHERE id = ?`, vals);
    await logEvent(db, id, outcome, detail);
    const [after] = await db.query('SELECT * FROM prospects WHERE id = ?', [id]);
    return { prospect: fixDates(after) };
}

async function addDoNotContact(db, { phone, name, city, reason }) {
    await db.query('INSERT INTO do_not_contact (phone_norm, name_norm, city_norm, reason) VALUES (?, ?, ?, ?)',
        [normPhone(phone), normText(name), normText(city), reason ? String(reason).slice(0, 120) : null]);
}

// Al registrarse un negocio: se enlaza con su ficha por el código ?lead= o, si no, por el teléfono
async function linkRegistration(db, businessId, { leadCode, phone } = {}) {
    try {
        let rows = [];
        if (leadCode && /^[A-Z0-9]{4,12}$/i.test(leadCode)) {
            rows = await db.query('SELECT id FROM prospects WHERE code = ? AND business_id IS NULL', [String(leadCode).toUpperCase()]);
        }
        const pn = normPhone(phone);
        if (!rows.length && pn) {
            rows = await db.query('SELECT id FROM prospects WHERE phone_norm = ? AND business_id IS NULL LIMIT 1', [pn]);
        }
        if (!rows.length) return false;
        await db.query(`UPDATE prospects SET business_id = ?, status = 'registrado', next_action_at = ? WHERE id = ?`,
            [businessId, fechaLaborable(5), rows[0].id]);
        await logEvent(db, rows[0].id, 'registrado', `negocio ${businessId}${leadCode ? ' (enlace)' : ' (teléfono)'}`);
        console.log(`🎯 [Captación] Negocio ${businessId} enlazado con el contacto ${rows[0].id}`);
        return true;
    } catch (e) {
        // Nunca romper un registro por esto
        console.error('Error enlazando registro con captación:', e.message);
        return false;
    }
}

// Embudo y desgloses para la pantalla de resultados
async function getStats(db) {
    const porEstado = await db.query('SELECT status, COUNT(*) AS n FROM prospects GROUP BY status');
    const porSector = await db.query(`
        SELECT COALESCE(sector, 'sin sector') AS sector,
               COUNT(*) AS total,
               SUM(status <> 'nuevo' AND status <> 'descartado') AS contactados,
               SUM(consent_wa_at IS NOT NULL) AS permisos,
               SUM(business_id IS NOT NULL) AS registrados
        FROM prospects GROUP BY sector ORDER BY total DESC`);
    const porVariante = await db.query(`
        SELECT COALESCE(variant, '—') AS variant, COUNT(*) AS total,
               SUM(consent_wa_at IS NOT NULL) AS permisos, SUM(business_id IS NOT NULL) AS registrados
        FROM prospects WHERE status <> 'nuevo' GROUP BY variant ORDER BY total DESC`);
    // Lo que de verdad importa: negocios registrados que lo usan
    const activacion = await db.query(`
        SELECT p.id, p.name, p.sector, p.business_id, b.plan, b.plan_bonus_until,
               (SELECT COUNT(*) FROM services s WHERE s.business_id = b.id AND s.is_active = TRUE) AS servicios,
               (SELECT COUNT(*) FROM bookings bk WHERE bk.business_id = b.id AND bk.status <> 'cancelled') AS reservas
        FROM prospects p JOIN businesses b ON b.id = p.business_id`);
    const est = Object.fromEntries(porEstado.map(r => [r.status, Number(r.n)]));
    const total = porEstado.reduce((a, r) => a + Number(r.n), 0);
    const [ev] = await db.query(`
        SELECT SUM(type = 'no_contesta') AS llamadas_sin_respuesta,
               SUM(type IN ('interesado','permiso_wa','no_interesa','no_contactar','volver_llamar')) AS conversaciones
        FROM prospect_events`);
    const pagan = activacion.filter(a => ['founders', 'professional', 'premium'].includes(a.plan) && !a.plan_bonus_until).length;
    return {
        total,
        porEstado: est,
        embudo: {
            investigados: total,
            contactados: total - (est.nuevo || 0) - (est.descartado || 0),
            conversaciones: Number(ev?.conversaciones) || 0,
            permisos: (est.permiso_wa || 0) + (est.mensaje_enviado || 0) + (est.seguimiento || 0) + (est.registrado || 0),
            registrados: activacion.length,
            conReservas: activacion.filter(a => Number(a.reservas) > 0).length,
            pagan
        },
        porSector: porSector.map(r => ({ ...r, total: Number(r.total), contactados: Number(r.contactados) || 0, permisos: Number(r.permisos) || 0, registrados: Number(r.registrados) || 0 })),
        porVariante: porVariante.map(r => ({ ...r, total: Number(r.total), permisos: Number(r.permisos) || 0, registrados: Number(r.registrados) || 0 })),
        activacion: activacion.map(a => ({ id: a.id, businessId: a.business_id, name: a.name, sector: a.sector, plan: a.plan, bonus: !!a.plan_bonus_until, servicios: Number(a.servicios), reservas: Number(a.reservas) }))
    };
}

// Retención: cualquier contacto que no llegó a registrarse y lleva 12 meses sin movimiento se borra (la lista de no contactar se queda)
async function cleanupOldProspects(db) {
    const viejos = await db.query(
        `SELECT id FROM prospects
         WHERE business_id IS NULL AND updated_at < DATE_SUB(NOW(), INTERVAL 12 MONTH)`
    );
    if (!viejos.length) return;
    const ids = viejos.map(v => v.id);
    await db.query(`DELETE FROM prospect_events WHERE prospect_id IN (${ids.map(() => '?').join(',')})`, ids);
    await db.query(`DELETE FROM prospects WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
    console.log(`🧹 [Captación] ${ids.length} contactos antiguos borrados (12 meses)`);
}

module.exports = {
    SECTORES, ESTADOS,
    ensureProspectTables, importBatch, insertProspect, applyOutcome, addDoNotContact,
    linkRegistration, getStats, cleanupOldProspects, logEvent, normPhone, normText,
    isDoNotContact, findDuplicate, fixDates
};
