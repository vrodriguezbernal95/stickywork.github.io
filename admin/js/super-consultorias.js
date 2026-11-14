// Super Admin - Consultorías del plan Premium (1 hora al mes)
// Los negocios la piden desde su panel; aquí se agenda (les llega un email), se completa o se cancela.
const superConsultorias = {
    tab: 'pending',
    rows: [],
    ESTADOS: { pending: '⏳ Por agendar', scheduled: '📅 Agendadas', completed: '✅ Hechas', cancelled: '✕ Canceladas' },
    FRANJAS: { morning: 'Mañana (9:00-13:00)', afternoon: 'Tarde (15:00-19:00)', evening: 'Noche (19:00-21:00)' },

    async load() {
        document.getElementById('pageTitle').textContent = 'Consultorías';
        superUI.injectStyles();
        document.getElementById('contentArea').innerHTML = `
            <p class="sa-note" style="margin-top:0;">El plan Premium incluye 1 hora de consultoría al mes. Los negocios la piden desde su panel con tres fechas posibles; al agendarla aquí les llega un email con el día, la hora y el enlace.</p>
            <div class="sa-tabs" id="consTabs"></div>
            <div id="consList"><div class="loading">Cargando...</div></div>`;
        this.loadList();
    },

    switchTab(t) { this.tab = t; this.loadList(); },

    async loadList() {
        const list = document.getElementById('consList');
        try {
            const r = await superApi.get(`/api/super-admin/consultancy?status=${encodeURIComponent(this.tab)}`);
            this.rows = r.data || [];
            const counts = Object.fromEntries((r.stats || []).map(s => [s.status, Number(s.count)]));
            document.getElementById('consTabs').innerHTML = Object.entries(this.ESTADOS).map(([k, v]) =>
                `<button class="sa-tab ${this.tab === k ? 'active' : ''}" onclick="superConsultorias.switchTab('${k}')">${v} (${counts[k] || 0})</button>`).join('');
            if (!this.rows.length) { list.innerHTML = '<div class="sa-empty">No hay consultorías en este estado.</div>'; return; }
            list.innerHTML = this.rows.map(c => this.renderCard(c)).join('');
        } catch (e) {
            list.innerHTML = `<div class="sa-empty">Error: ${superUI.esc(e.message)}</div>`;
        }
    },

    renderCard(c) {
        const ui = superUI;
        const fechas = [c.preferred_date_1, c.preferred_date_2, c.preferred_date_3].filter(Boolean).map(f => ui.fecha(String(f).slice(0, 10)));
        return `
        <div class="sa-card" style="margin-bottom:1rem;">
            <div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
                <div><strong>${ui.esc(c.business_name)}</strong> <span class="sa-sub">· ${ui.esc(c.user_name)} · <a class="sa-link" href="mailto:${ui.esc(c.user_email)}">${ui.esc(c.user_email)}</a></span></div>
                <span class="sa-sub">Pedida el ${ui.fecha(c.created_at)}</span>
            </div>
            <h3 style="margin:0.6rem 0 0.3rem;">${ui.esc(c.topic || 'Sin tema')}</h3>
            ${c.description ? `<p class="sa-note" style="white-space:pre-wrap; color: var(--text-primary);">${ui.esc(c.description)}</p>` : ''}
            <dl class="sa-dl" style="margin-top:0.5rem;">
                <dt>Fechas que propone</dt><dd>${fechas.length ? fechas.join(' · ') : '—'}</dd>
                <dt>Franja</dt><dd>${ui.esc(this.FRANJAS[c.preferred_time_slot] || c.preferred_time_slot || '—')}</dd>
                ${c.scheduled_date ? `<dt>Agendada</dt><dd>${ui.fecha(String(c.scheduled_date).slice(0, 10))} a las ${ui.esc(String(c.scheduled_time || '').slice(0, 5))}${c.meeting_link ? ` · <a class="sa-link" href="${ui.esc(/^https?:\/\//.test(c.meeting_link) ? c.meeting_link : '#')}" target="_blank" rel="noopener">enlace</a>` : ''}</dd>` : ''}
                ${c.admin_notes ? `<dt>Notas</dt><dd style="white-space:pre-wrap;">${ui.esc(c.admin_notes)}</dd>` : ''}
            </dl>
            ${c.status === 'pending' ? `
                <div class="sa-form">
                    <input type="date" id="consDate-${c.id}">
                    <input type="time" id="consTime-${c.id}">
                    <input id="consLink-${c.id}" placeholder="Enlace de la videollamada (Meet, Zoom...)" style="flex:1; min-width:220px;">
                </div>
                <div class="sa-form"><input id="consNotes-${c.id}" placeholder="Nota para el negocio (opcional)" style="flex:1;"></div>
                <div class="sa-actions" style="margin-top:0.6rem;">
                    <button class="sa-btn primary" onclick="superConsultorias.schedule(${Number(c.id)})">📅 Agendar y avisar por email</button>
                    <button class="sa-btn danger" onclick="superConsultorias.cancel(${Number(c.id)})">Cancelar</button>
                </div>` : ''}
            ${c.status === 'scheduled' ? `
                <div class="sa-actions" style="margin-top:0.6rem;">
                    <button class="sa-btn primary" onclick="superConsultorias.complete(${Number(c.id)})">✅ Marcar como hecha</button>
                    <button class="sa-btn danger" onclick="superConsultorias.cancel(${Number(c.id)})">Cancelar</button>
                </div>` : ''}
        </div>`;
    },

    async schedule(id) {
        const v = k => document.getElementById(`${k}-${id}`).value.trim();
        if (!v('consDate') || !v('consTime')) return alert('Pon el día y la hora');
        const link = v('consLink');
        if (link && !/^https?:\/\//.test(link)) return alert('El enlace debe empezar por https://');
        try {
            await superApi.patch(`/api/super-admin/consultancy/${id}/schedule`, {
                scheduled_date: v('consDate'), scheduled_time: v('consTime'), meeting_link: link || null, admin_notes: v('consNotes') || null
            });
            this.loadList();
        } catch (e) { alert(e.message); }
    },

    async complete(id) {
        const notes = prompt('Notas de la sesión (opcional):', '');
        if (notes === null) return;
        try {
            await superApi.patch(`/api/super-admin/consultancy/${id}/complete`, { admin_notes: notes || null });
            this.loadList();
        } catch (e) { alert(e.message); }
    },

    async cancel(id) {
        const reason = prompt('¿Por qué se cancela? (opcional)', '');
        if (reason === null) return;
        try {
            await superApi.patch(`/api/super-admin/consultancy/${id}/cancel`, { reason: reason || null });
            this.loadList();
        } catch (e) { alert(e.message); }
    }
};
window.superConsultorias = superConsultorias;
