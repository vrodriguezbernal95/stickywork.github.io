// Tablero de IA del super admin: qué han hecho los agentes de Claude Code y qué tareas quedan por pedirle.
// Lo escribe Claude Code desde el ordenador del usuario con una clave propia (AGENT_BOARD_KEY), que solo sirve
// para este tablero. El super admin lo lee y marca tareas como hechas. Se guarda en admin_documents ('ia-tablero').

const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireSuperAdmin } = require('./middleware/super-admin');

const KEY = 'ia-tablero';
const MAX_ACTIVIDAD = 60;
const PRIORIDADES = ['alta', 'media', 'baja'];

const vacio = () => ({ actualizado: null, tareas: [], actividad: [] });

async function leer() {
    const [doc] = await db.query('SELECT content FROM admin_documents WHERE doc_key = ?', [KEY]);
    if (!doc) return vacio();
    try { return { ...vacio(), ...JSON.parse(doc.content) }; } catch (e) { return vacio(); }
}

async function guardar(t) {
    t.actualizado = new Date().toISOString();
    await db.query(
        'INSERT INTO admin_documents (doc_key, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)',
        [KEY, JSON.stringify(t)]
    );
}

const txt = (v, max) => String(v ?? '').trim().slice(0, max);

function limpiarTarea(t) {
    return {
        id: txt(t.id, 60) || crypto.randomBytes(4).toString('hex'),
        titulo: txt(t.titulo, 160),
        detalle: txt(t.detalle, 1200),
        prioridad: PRIORIDADES.includes(t.prioridad) ? t.prioridad : 'media',
        quien: t.quien === 'usuario' ? 'usuario' : 'claude', // quién tiene que hacerla
        pedir: txt(t.pedir, 400), // frase para copiar y pegar en Claude Code
        hecha: !!t.hecha
    };
}

function limpiarActividad(a) {
    return {
        fecha: txt(a.fecha, 30) || new Date().toISOString(),
        agente: txt(a.agente, 40) || 'Claude',
        resumen: txt(a.resumen, 600),
        resultado: txt(a.resultado, 300)
    };
}

// Clave de Claude Code (comparación en tiempo constante). Sin AGENT_BOARD_KEY configurada, la ruta no existe.
function requireAgentKey(req, res, next) {
    const esperada = process.env.AGENT_BOARD_KEY || '';
    const dada = String(req.headers['x-agent-key'] || '');
    if (esperada.length < 32) return res.status(404).end();
    const a = Buffer.from(esperada), b = Buffer.from(dada);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ success: false });
    next();
}

// ---- Claude Code escribe ----

// Sustituye la lista de tareas. Mantiene «hecha» si el super admin la había marcado y el agente no dice lo contrario.
router.put('/api/agent/ia-tablero/tareas', requireAgentKey, async (req, res) => {
    try {
        const tareas = (Array.isArray(req.body?.tareas) ? req.body.tareas : []).slice(0, 80).map(limpiarTarea).filter(t => t.titulo);
        const t = await leer();
        const hechasAntes = new Set(t.tareas.filter(x => x.hecha).map(x => x.id));
        t.tareas = tareas.map(x => ({ ...x, hecha: x.hecha || hechasAntes.has(x.id) }));
        await guardar(t);
        res.json({ success: true, tareas: t.tareas.length });
    } catch (e) {
        console.error('Error guardando tareas del tablero IA:', e.message);
        res.status(500).json({ success: false });
    }
});

// Añade entradas de actividad (se guardan las últimas MAX_ACTIVIDAD)
router.post('/api/agent/ia-tablero/actividad', requireAgentKey, async (req, res) => {
    try {
        const nuevas = (Array.isArray(req.body?.actividad) ? req.body.actividad : [req.body]).slice(0, 30).map(limpiarActividad).filter(a => a.resumen);
        const t = await leer();
        // Las que ya estaban (misma fecha, agente y resumen) no se repiten: se puede publicar el archivo entero
        const clave = a => `${a.fecha}|${a.agente}|${a.resumen}`;
        const ya = new Set(t.actividad.map(clave));
        const añadir = nuevas.filter(a => !ya.has(clave(a)));
        t.actividad = [...añadir, ...t.actividad]
            .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
            .slice(0, MAX_ACTIVIDAD);
        await guardar(t);
        res.json({ success: true, actividad: t.actividad.length });
    } catch (e) {
        console.error('Error guardando actividad del tablero IA:', e.message);
        res.status(500).json({ success: false });
    }
});

// Claude Code puede leerlo para saber qué ha marcado el usuario como hecho
router.get('/api/agent/ia-tablero', requireAgentKey, async (req, res) => {
    try { res.json({ success: true, data: await leer() }); } catch (e) { res.status(500).json({ success: false }); }
});

// ---- Super admin lee y marca ----

router.get('/api/super-admin/ia', requireSuperAdmin, async (req, res) => {
    try { res.json({ success: true, data: await leer() }); } catch (e) { res.status(500).json({ success: false, message: 'Error al leer el tablero' }); }
});

router.patch('/api/super-admin/ia/tareas/:id', requireSuperAdmin, async (req, res) => {
    try {
        const t = await leer();
        const tarea = t.tareas.find(x => x.id === req.params.id);
        if (!tarea) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        tarea.hecha = !!req.body?.hecha;
        await guardar(t);
        res.json({ success: true, data: tarea });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error al guardar' });
    }
});

module.exports = router;
