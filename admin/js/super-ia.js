// Super Admin - IA: qué han hecho los agentes de Claude Code y qué pedirle a continuación.
// Lo actualiza Claude Code al terminar cada sesión de trabajo (backend/ia-board.js).
const superIA = {
    data: null,
    verHechas: false,
    AGENTES: {
        claude: { icon: '🧠', nombre: 'Claude (CEO)' },
        revisor: { icon: '🔍', nombre: 'Revisor' },
        'guardian-textos': { icon: '🛡️', nombre: 'Guardián de textos' },
        captador: { icon: '🎯', nombre: 'Captador' },
        'redactor-seo': { icon: '✍️', nombre: 'Redactor SEO' }
    },

    async load() {
        document.getElementById('pageTitle').textContent = 'IA';
        superUI.injectStyles();
        const area = document.getElementById('contentArea');
        area.innerHTML = '<div class="loading">Cargando...</div>';
        try {
            this.data = (await superApi.get('/api/super-admin/ia')).data;
            this.render();
        } catch (e) {
            area.innerHTML = `<div class="sa-empty">Error: ${superUI.esc(e.message)}</div>`;
        }
    },

    render() {
        const ui = superUI, d = this.data;
        const area = document.getElementById('contentArea');
        if (!d.actualizado) {
            area.innerHTML = `<div class="sa-empty"><div style="font-size:2.4rem;">🤖</div><h3>Todavía no hay nada</h3>
                <p>Claude lo rellenará al terminar la próxima sesión de trabajo en Claude Code.</p></div>`;
            return;
        }
        const orden = { alta: 0, media: 1, baja: 2 };
        const pendientes = d.tareas.filter(t => !t.hecha).sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);
        const hechas = d.tareas.filter(t => t.hecha);
        const mias = pendientes.filter(t => t.quien === 'usuario');
        const deClaude = pendientes.filter(t => t.quien !== 'usuario');
        const pill = p => `<span class="sa-pill ${p === 'alta' ? 'danger' : p === 'media' ? 'warn' : ''}">${p}</span>`;
        const tarea = t => `
            <div class="ia-task ${t.hecha ? 'done' : ''}">
                <label class="ia-check"><input type="checkbox" ${t.hecha ? 'checked' : ''} data-id="${ui.esc(t.id)}" onchange="superIA.toggle(this)"></label>
                <div class="ia-body">
                    <div class="ia-title">${ui.esc(t.titulo)} ${pill(t.prioridad)}</div>
                    ${t.detalle ? `<div class="sa-note">${ui.esc(t.detalle)}</div>` : ''}
                    ${t.pedir && !t.hecha ? `<div class="ia-ask"><span>💬 «${ui.esc(t.pedir)}»</span>
                        <button class="sa-btn small" data-text="${ui.esc(t.pedir)}" onclick="superIA.copy(this)">Copiar</button></div>` : ''}
                </div>
            </div>`;
        area.innerHTML = `
            <p class="sa-note" style="margin-top:0;">Lo actualiza Claude al terminar cada sesión de trabajo. Última actualización: <strong>${ui.fechaHora(d.actualizado)}</strong>.
            Para pedir algo, copia la frase y pégala en Claude Code (VS Code, la Terminal o el móvil con <code>claude rc</code>).</p>
            <div class="sa-two">
                <div class="sa-card">
                    <h3>💬 Qué pedirle a Claude (${deClaude.length})</h3>
                    ${deClaude.length ? deClaude.map(tarea).join('') : '<p class="sa-note">Nada pendiente.</p>'}
                </div>
                <div class="sa-card">
                    <h3>🙋 Lo que te toca a ti (${mias.length})</h3>
                    ${mias.length ? mias.map(tarea).join('') : '<p class="sa-note">Nada pendiente.</p>'}
                </div>
            </div>
            ${hechas.length ? `<div class="sa-card" style="margin-bottom:1.25rem;">
                <h3 style="cursor:pointer;" onclick="superIA.verHechas=!superIA.verHechas; superIA.render()">✅ Hechas (${hechas.length}) ${this.verHechas ? '▾' : '▸'}</h3>
                ${this.verHechas ? hechas.map(tarea).join('') : ''}
            </div>` : ''}
            <div class="sa-card">
                <h3>🕓 Actividad reciente de los agentes</h3>
                ${d.actividad.length ? d.actividad.map(a => {
                    const ag = this.AGENTES[a.agente] || { icon: '🤖', nombre: a.agente };
                    return `<div class="ia-act">
                        <div class="ia-act-head"><span>${ag.icon} <strong>${ui.esc(ag.nombre)}</strong></span><span class="sa-sub">${ui.fechaHora(a.fecha)}</span></div>
                        <div>${ui.esc(a.resumen)}</div>
                        ${a.resultado ? `<div class="sa-sub">→ ${ui.esc(a.resultado)}</div>` : ''}
                    </div>`;
                }).join('') : '<p class="sa-note">Sin actividad todavía.</p>'}
            </div>`;
        this.injectStyles();
    },

    async toggle(cb) {
        try {
            await superApi.patch(`/api/super-admin/ia/tareas/${encodeURIComponent(cb.dataset.id)}`, { hecha: cb.checked });
            const t = this.data.tareas.find(x => x.id === cb.dataset.id);
            if (t) t.hecha = cb.checked;
            this.render();
        } catch (e) { alert(e.message); cb.checked = !cb.checked; }
    },

    copy(btn) {
        navigator.clipboard.writeText(btn.dataset.text).then(() => { btn.textContent = '✓ Copiado'; setTimeout(() => { btn.textContent = 'Copiar'; }, 1500); });
    },

    injectStyles() {
        if (document.getElementById('ia-styles')) return;
        const st = document.createElement('style');
        st.id = 'ia-styles';
        st.textContent = `
            .ia-task { display: flex; gap: 0.7rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); }
            .ia-task:last-child { border-bottom: none; }
            .ia-task.done .ia-title { text-decoration: line-through; color: var(--text-secondary); }
            .ia-check input { width: 18px; height: 18px; margin-top: 0.15rem; cursor: pointer; }
            .ia-body { flex: 1; min-width: 0; }
            .ia-title { font-weight: 600; color: var(--text-primary); display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
            .ia-ask { display: flex; gap: 0.5rem; align-items: center; justify-content: space-between; margin-top: 0.45rem; padding: 0.5rem 0.65rem; border-radius: 9px; background: var(--bg-secondary); border: 1px solid var(--border-color); font-size: 0.88rem; color: var(--text-primary); }
            .ia-act { padding: 0.65rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; color: var(--text-primary); line-height: 1.5; }
            .ia-act:last-child { border-bottom: none; }
            .ia-act-head { display: flex; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.2rem; }
        `;
        document.head.appendChild(st);
    }
};
window.superIA = superIA;
