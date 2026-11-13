// Programa de recomendación: «Invita a otro negocio y ganáis un mes de Profesional los dos».
//
// - Cada negocio tiene un código (businesses.referral_code) y un enlace: stickywork.com/registro.html?ref=CODIGO
// - El negocio invitado empieza con 1 mes de Profesional nada más registrarse.
// - Quien invita gana su mes cuando el invitado recibe sus primeras RESERVAS_PARA_PREMIO reservas
//   (así no sirve de nada crear cuentas vacías).
// - El mes regalado se guarda en businesses.plan_bonus_until. Cuando vence, el negocio vuelve a Gratis.
//   Si en medio contrata un plan de pago, el regalo se olvida (stripe.js pone plan_bonus_until = NULL).
// - Si quien invita ya paga un plan, no se le puede «subir» de plan: se apunta en
//   referral_pending_rewards y se avisa a ADMIN_EMAIL para descontarle un mes a mano en Stripe.

const crypto = require('crypto');
const { getPlanLimits } = require('./plans');
// Las demos no participan: sus credenciales son públicas y cualquiera podría usar su enlace
const { isDemoBusiness } = require('./demo-businesses');

const DIAS_PREMIO = 30;
const RESERVAS_PARA_PREMIO = 3;
const MAX_PREMIOS = 12;          // tope de meses que se pueden ganar invitando
const PAID_PLANS = ['founders', 'professional', 'premium'];

// Sin 0/O ni 1/I/L para que no haya confusiones al dictarlo
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// Columnas nuevas en businesses (se ejecuta al arrancar el servidor; no hace nada si ya existen)
async function ensureReferralColumns(db) {
    const columnas = {
        referral_code: 'VARCHAR(16) NULL UNIQUE',
        referred_by: 'INT NULL',
        referral_rewarded_at: 'DATETIME NULL',
        referral_pending_rewards: 'INT NOT NULL DEFAULT 0',
        plan_bonus_until: 'DATETIME NULL'
    };
    const existentes = await db.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'businesses'`
    );
    const nombres = new Set(existentes.map(c => c.COLUMN_NAME));
    for (const [col, def] of Object.entries(columnas)) {
        if (!nombres.has(col)) {
            await db.query(`ALTER TABLE businesses ADD COLUMN ${col} ${def}`);
            console.log(`✅ Columna businesses.${col} añadida (recomendaciones)`);
        }
    }
}

function nuevoCodigo() {
    const bytes = crypto.randomBytes(6);
    let code = '';
    for (const b of bytes) code += ALFABETO[b % ALFABETO.length];
    return code;
}

// Devuelve el código del negocio, creándolo la primera vez
async function getOrCreateCode(db, businessId) {
    const rows = await db.query('SELECT referral_code FROM businesses WHERE id = ?', [businessId]);
    if (!rows.length) return null;
    if (rows[0].referral_code) return rows[0].referral_code;
    for (let intento = 0; intento < 5; intento++) {
        const code = nuevoCodigo();
        try {
            await db.query('UPDATE businesses SET referral_code = ? WHERE id = ? AND referral_code IS NULL', [code, businessId]);
            const again = await db.query('SELECT referral_code FROM businesses WHERE id = ?', [businessId]);
            return again[0].referral_code;
        } catch (e) {
            if (e.code !== 'ER_DUP_ENTRY') throw e;
        }
    }
    throw new Error('No se pudo generar el código de invitación');
}

async function findByCode(db, code) {
    if (!code || !/^[A-Z0-9]{4,16}$/i.test(code)) return null;
    const rows = await db.query('SELECT id, name, email, plan FROM businesses WHERE referral_code = ?', [String(code).toUpperCase()]);
    if (!rows.length || isDemoBusiness(rows[0].id)) return null;
    return rows[0];
}

// Regala DIAS_PREMIO días de Profesional. Devuelve 'bonus' si se aplicó o 'pending' si el negocio ya paga.
async function grantMonth(db, businessId) {
    if (isDemoBusiness(businessId)) return null;
    const rows = await db.query('SELECT plan, plan_bonus_until FROM businesses WHERE id = ?', [businessId]);
    if (!rows.length) return null;
    const { plan, plan_bonus_until } = rows[0];

    // Ya paga un plan (y no es un regalo anterior): se le descuenta a mano
    if (PAID_PLANS.includes(plan) && !plan_bonus_until) {
        await db.query('UPDATE businesses SET referral_pending_rewards = referral_pending_rewards + 1 WHERE id = ?', [businessId]);
        return 'pending';
    }

    const limits = getPlanLimits('professional');
    await db.query(
        `UPDATE businesses
         SET plan = 'professional', plan_limits = ?, ai_reports_enabled = ?,
             plan_bonus_until = DATE_ADD(GREATEST(COALESCE(plan_bonus_until, NOW()), NOW()), INTERVAL ? DAY)
         WHERE id = ?`,
        [JSON.stringify(limits), limits.features.aiReports ? 1 : 0, DIAS_PREMIO, businessId]
    );
    return 'bonus';
}

// Al registrarse con un código: se apunta quién le invitó y el invitado empieza con su mes de Profesional
async function applyAtSignup(db, newBusinessId, code) {
    try {
        const referrer = await findByCode(db, code);
        if (!referrer || referrer.id === newBusinessId) return false;
        await db.query('UPDATE businesses SET referred_by = ? WHERE id = ? AND referred_by IS NULL', [referrer.id, newBusinessId]);
        await grantMonth(db, newBusinessId);
        console.log(`🎁 [Recomendación] Negocio ${newBusinessId} registrado con el código de ${referrer.id}`);
        return true;
    } catch (e) {
        // Nunca romper un registro por esto
        console.error('Error aplicando código de invitación:', e.message);
        return false;
    }
}

function fechaLarga(d) {
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const f = new Date(d);
    return `${f.getDate()} de ${meses[f.getMonth()]} de ${f.getFullYear()}`;
}

function emailPremio(nombreQuienInvita, nombreInvitado, resultado, hasta) {
    const detalle = resultado === 'bonus'
        ? `<p>Ya tienes el plan <strong>Profesional</strong> activo hasta el <strong>${fechaLarga(hasta)}</strong>, sin hacer nada. Si invitas a más negocios, se van sumando meses.</p>`
        : `<p>Como ya tienes un plan de pago, te descontaremos <strong>un mes</strong> en tu próxima factura.</p>`;
    return {
        subject: '🎁 Has ganado un mes de StickyWork Profesional',
        html: `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f5f5f7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden">
<div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:28px;text-align:center;color:#fff">
<div style="font-size:40px">🎁</div><h1 style="margin:8px 0 0;font-size:22px">¡Gracias por recomendarnos!</h1></div>
<div style="padding:28px;line-height:1.6;font-size:15px">
<p>Hola, ${nombreQuienInvita}:</p>
<p><strong>${nombreInvitado}</strong> se registró con tu enlace y ya está recibiendo reservas con StickyWork.</p>
${detalle}
<p style="text-align:center;margin:28px 0"><a href="https://stickywork.com/admin-dashboard.html" style="background:#3b82f6;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">Ir a mi panel</a></p>
<p style="color:#6b7280;font-size:13px">Tu enlace de invitación está en tu panel, en Configuración → Plan.</p>
</div></div></body></html>`
    };
}

// Cron: premia a quien invitó cuando el invitado llega a RESERVAS_PARA_PREMIO reservas
async function checkReferralRewards(db, emailService) {
    const candidatos = await db.query(
        `SELECT b.id, b.name, b.referred_by,
                (SELECT COUNT(*) FROM bookings bk WHERE bk.business_id = b.id AND bk.status != 'cancelled') AS reservas
         FROM businesses b
         WHERE b.referred_by IS NOT NULL AND b.referral_rewarded_at IS NULL`
    );
    for (const invitado of candidatos) {
        if (Number(invitado.reservas) < RESERVAS_PARA_PREMIO) continue;

        // Marcar primero, para no premiar dos veces aunque falle algo después
        const upd = await db.query(
            'UPDATE businesses SET referral_rewarded_at = NOW() WHERE id = ? AND referral_rewarded_at IS NULL',
            [invitado.id]
        );
        if (!upd.affectedRows) continue;

        const [ganados] = await db.query(
            'SELECT COUNT(*) AS n FROM businesses WHERE referred_by = ? AND referral_rewarded_at IS NOT NULL',
            [invitado.referred_by]
        );
        if (Number(ganados.n) > MAX_PREMIOS) continue;

        const resultado = await grantMonth(db, invitado.referred_by);
        if (!resultado) continue;
        console.log(`🎁 [Recomendación] Premio para el negocio ${invitado.referred_by} (${resultado}) por invitar a ${invitado.id}`);

        try {
            const [ref] = await db.query(
                `SELECT b.name, b.email, b.plan_bonus_until, au.email AS owner_email
                 FROM businesses b
                 LEFT JOIN admin_users au ON au.business_id = b.id AND au.role = 'owner'
                 WHERE b.id = ? LIMIT 1`,
                [invitado.referred_by]
            );
            const destino = ref.owner_email || ref.email;
            if (destino) await emailService.sendEmail(destino, emailPremio(ref.name, invitado.name, resultado, ref.plan_bonus_until));
            if (resultado === 'pending' && process.env.ADMIN_EMAIL) {
                await emailService.sendEmail(process.env.ADMIN_EMAIL, {
                    subject: `[StickyWork] Descontar 1 mes a ${ref.name} (recomendación)`,
                    html: `<p>${ref.name} (negocio ${invitado.referred_by}) ha ganado un mes por recomendar a ${invitado.name} (negocio ${invitado.id}), pero ya paga un plan.</p><p>Aplícale el descuento de un mes en Stripe.</p>`
                });
            }
        } catch (e) {
            console.error('Error enviando email de premio de recomendación:', e.message);
        }
    }
}

// Cron: los meses regalados que han vencido vuelven a Gratis
async function expireBonuses(db) {
    const vencidos = await db.query(
        'SELECT id FROM businesses WHERE plan_bonus_until IS NOT NULL AND plan_bonus_until < NOW()'
    );
    if (!vencidos.length) return;
    const free = getPlanLimits('free');
    for (const b of vencidos) {
        await db.query(
            `UPDATE businesses SET plan = 'free', plan_limits = ?, ai_reports_enabled = 0, plan_bonus_until = NULL
             WHERE id = ? AND plan_bonus_until IS NOT NULL AND plan_bonus_until < NOW()`,
            [JSON.stringify(free), b.id]
        );
        console.log(`⏳ [Recomendación] Fin del mes regalado: negocio ${b.id} vuelve a Gratis`);
    }
}

// Resumen para el panel
async function getSummary(db, businessId) {
    if (isDemoBusiness(businessId)) return { demo: true };
    const code = await getOrCreateCode(db, businessId);
    const [b] = await db.query('SELECT plan, plan_bonus_until, referral_pending_rewards FROM businesses WHERE id = ?', [businessId]);
    const [stats] = await db.query(
        `SELECT COUNT(*) AS invitados, SUM(referral_rewarded_at IS NOT NULL) AS premiados
         FROM businesses WHERE referred_by = ?`,
        [businessId]
    );
    return {
        code,
        link: `https://stickywork.com/registro.html?ref=${code}`,
        invited: Number(stats.invitados) || 0,
        rewarded: Number(stats.premiados) || 0,
        plan: b.plan,
        bonusUntil: b.plan_bonus_until,
        pendingRewards: b.referral_pending_rewards || 0,
        bookingsNeeded: RESERVAS_PARA_PREMIO,
        maxRewards: MAX_PREMIOS
    };
}

module.exports = {
    ensureReferralColumns, getOrCreateCode, findByCode, applyAtSignup, grantMonth,
    checkReferralRewards, expireBonuses, getSummary,
    RESERVAS_PARA_PREMIO, DIAS_PREMIO
};
