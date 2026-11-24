// Precio Fundador: el mismo pack que el plan Profesional a 25 €/mes para siempre, solo para las primeras plazas.
// Una plaza = un negocio real con plan 'founders' (si cancela, la plaza vuelve a quedar libre).
// La oferta solo está activa si en Stripe existe el precio (STRIPE_PRICE_FOUNDERS) y quedan plazas.

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { realBusinessSql } = require('./demo-businesses');

const PLAZAS = 50;
const PRECIO = 25;

const precioConfigurado = () => /^price_(?!founders_placeholder)/.test(process.env.STRIPE_PRICE_FOUNDERS || '');

let cache = { t: 0, data: null };

async function estadoFundador({ fresco = false } = {}) {
    if (!fresco && cache.data && Date.now() - cache.t < 60 * 1000) return cache.data;
    const [r] = await db.query(`SELECT COUNT(*) AS n FROM businesses b WHERE b.plan = 'founders' AND ${realBusinessSql('b')}`);
    const ocupadas = Number(r?.n || 0);
    const quedan = Math.max(0, PLAZAS - ocupadas);
    const data = { plazas: PLAZAS, ocupadas, quedan, precio: PRECIO, activo: precioConfigurado() && quedan > 0 };
    cache = { t: Date.now(), data };
    return data;
}

// Pública: la web y el panel la usan para el contador de plazas
router.get('/api/public/plazas-fundador', async (req, res) => {
    try {
        res.set('Cache-Control', 'public, max-age=60');
        res.json({ success: true, data: await estadoFundador() });
    } catch (e) {
        console.error('Error leyendo plazas de fundador:', e.message);
        res.status(500).json({ success: false });
    }
});

module.exports = { router, estadoFundador, PLAZAS, PRECIO };
