#!/usr/bin/env node
// Publica en el super admin (sección 🤖 IA) las tareas pendientes y la actividad de los agentes.
// La clave va en .env (AGENT_BOARD_KEY) y en Railway; nunca en el chat ni en Git.
//
// Uso (desde la raíz del proyecto):
//   node backend/tools/tablero-ia.js tareas docs/ia/tareas.json        → sustituye la lista de tareas
//   node backend/tools/tablero-ia.js actividad docs/ia/actividad.json  → añade entradas de actividad
//   node backend/tools/tablero-ia.js ver                               → muestra el tablero (y qué ha marcado el usuario)
// Por defecto escribe en producción; con IA_BOARD_URL=http://localhost:3000 escribe en local.

require('dotenv').config();
const fs = require('fs');

const KEY = process.env.AGENT_BOARD_KEY;
const BASE = (process.env.IA_BOARD_URL || 'https://api.stickywork.com').replace(/\/$/, '');

async function main() {
    const [cmd, file] = process.argv.slice(2);
    if (!KEY) return console.error('Falta AGENT_BOARD_KEY en .env');
    const headers = { 'Content-Type': 'application/json', 'x-agent-key': KEY };
    let res;
    if (cmd === 'tareas' || cmd === 'actividad') {
        if (!file) return console.error(`Indica el archivo: node backend/tools/tablero-ia.js ${cmd} <archivo.json>`);
        const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
        const body = cmd === 'tareas' ? { tareas: data.tareas || data } : { actividad: data.actividad || data };
        res = await fetch(`${BASE}/api/agent/ia-tablero/${cmd}`, { method: cmd === 'tareas' ? 'PUT' : 'POST', headers, body: JSON.stringify(body) });
    } else if (cmd === 'ver') {
        res = await fetch(`${BASE}/api/agent/ia-tablero`, { headers });
    } else {
        return console.error('Comandos: tareas <archivo>, actividad <archivo>, ver');
    }
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return console.error(`❌ ${res.status}`, out.message || '');
    if (cmd === 'ver') {
        const t = out.data;
        console.log(`Actualizado: ${t.actualizado || '—'}`);
        for (const x of t.tareas) console.log(`${x.hecha ? '✅' : '⬜'} [${x.prioridad}] (${x.quien}) ${x.titulo}  id=${x.id}`);
        console.log(`Actividad: ${t.actividad.length} entradas`);
    } else {
        console.log('✅ Publicado', out);
    }
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
