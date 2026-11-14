// Super Admin - Captación de clientes
// Lista de negocios preparada por el agente «captador» (Claude Code), resultados de cada contacto y embudo.
// Regla legal: el botón de WhatsApp solo se activa si el negocio ha dado permiso (LSSI art. 21).

const superCaptacion = {
    tab: 'today',
    rows: [],
    filters: { status: '', sector: '', tier: '', q: '' },

    SECTORES: {
        peluqueria: 'Peluquería / barbería', estetica: 'Estética', fisioterapia: 'Fisioterapia', psicologia: 'Psicología',
        nutricion: 'Nutrición', podologia: 'Podología', canina: 'Peluquería canina', tatuajes: 'Tatuajes',
        optica: 'Óptica / audición', dental: 'Dental', gimnasio: 'Gimnasio / estudio', otro: 'Otro'
    },
    ESTADOS: {
        nuevo: '🆕 Nuevo', no_contesta: '📵 No contesta', volver_llamar: '🔁 Volver a llamar', interesado: '👀 Interesado',
        permiso_wa: '✅ Permiso WhatsApp', mensaje_enviado: '💬 Mensaje enviado', seguimiento: '⏳ Seguimiento enviado',
        registrado: '🎉 Registrado', no_interesa: '🙅 No le interesa', no_contactar: '⛔ No contactar', descartado: '🗑️ Descartado'
    },
    METODOS: {
        whatsapp_telefono: 'Cita por WhatsApp/teléfono', web_sin_reservas: 'Web sin reservas online', sin_web: 'Sin web',
        marketplace: 'En un marketplace', software: 'Usa un programa de gestión', desconocido: 'Desconocido'
    },

    esc(v) {
        return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    safeUrl(u) {
        if (!u) return null;
        let s = String(u).trim();
        if (/^@/.test(s)) s = 'https://www.instagram.com/' + s.slice(1);
        if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
        try { const url = new URL(s); return /^https?:$/.test(url.protocol) ? url.href : null; } catch (e) { return null; }
    },
    fecha(d) {
        if (!d) return '';
        if (String(d).includes('T')) {
            const f = new Date(d);
            if (!isNaN(f)) return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`;
        }
        const s = String(d).slice(0, 10);
        const [y, m, dd] = s.split('-');
        return y && m && dd ? `${dd}/${m}/${y}` : '';
    },
    leadLink(p) { return `https://stickywork.com/registro.html?lead=${p.code}`; },
    fillMessage(text, p) {
        return String(text || '')
            .replace(/\{enlace\}/g, this.leadLink(p))
            .replace(/\{demo\}/g, 'https://stickywork.com/demo.html')
            .replace(/\{negocio\}/g, p.name || '');
    },

    async load() {
        document.getElementById('pageTitle').textContent = 'Captación';
        this.injectStyles();
        document.getElementById('contentArea').innerHTML = `
            <div class="cap-page">
                <div class="cap-tabs">
                    ${[['today', '📅 Hoy'], ['all', '📋 Todos'], ['stats', '📈 Resultados'], ['import', '📥 Importar y añadir'], ['dnc', '⛔ No contactar'], ['guide', '📘 Guía']]
                        .map(([k, l]) => `<button class="cap-tab ${this.tab === k ? 'active' : ''}" onclick="superCaptacion.switchTab('${k}')">${l}</button>`).join('')}
                </div>
                <div id="capBody"><div class="loading" style="padding:2rem;">Cargando...</div></div>
            </div>
            <div id="capModal" class="cap-modal" style="display:none;" onclick="if(event.target===this) superCaptacion.closeModal()">
                <div class="cap-modal-box"><button class="cap-modal-close" onclick="superCaptacion.closeModal()">✕</button><div id="capModalBody"></div></div>
            </div>`;
        // La ventana va directamente en <body> para que no la tape el menú lateral
        document.querySelectorAll('body > #capModal').forEach(m => m.remove());
        document.body.appendChild(document.getElementById('capModal'));
        this.switchTab(this.tab);
    },

    switchTab(tab) {
        this.tab = tab;
        document.querySelectorAll('.cap-tab').forEach(b => b.classList.toggle('active', b.getAttribute('onclick').includes(`'${tab}'`)));
        if (tab === 'today') return this.loadToday();
        if (tab === 'all') return this.loadAll();
        if (tab === 'stats') return this.loadStats();
        if (tab === 'import') return this.renderImport();
        if (tab === 'dnc') return this.loadDnc();
        if (tab === 'guide') return this.loadGuide();
    },

    body() { return document.getElementById('capBody'); },

    // ---------- HOY ----------
    async loadToday() {
        try {
            const r = await superApi.get('/api/super-admin/prospects?view=today');
            this.rows = r.data || [];
            if (!this.rows.length) {
                this.body().innerHTML = `
                    <div class="cap-empty">
                        <div style="font-size:2.5rem;">☕</div>
                        <h3>Nada pendiente para hoy</h3>
                        <p>Pídele al agente en Claude Code: <em>«prepara la tanda de esta semana»</em> y sube el archivo en <strong>Importar y añadir</strong>.</p>
                    </div>`;
                return;
            }
            this.body().innerHTML = `
                <p class="cap-hint">${this.rows.length} ${this.rows.length === 1 ? 'negocio' : 'negocios'} para hoy. Primero los que te dieron permiso o te pidieron que les llamaras.
                Recuerda: preséntate, di de dónde sacaste su número y, si te dicen que no, márcalo como <strong>No contactar</strong>.</p>
                <div class="cap-cards">${this.rows.map(p => this.renderCard(p)).join('')}</div>`;
        } catch (e) {
            this.body().innerHTML = `<div class="cap-empty">Error: ${this.esc(e.message)}</div>`;
        }
    },

    renderCard(p) {
        const web = this.safeUrl(p.website);
        const insta = this.safeUrl(p.instagram);
        const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.name, p.address, p.city].filter(Boolean).join(' '))}`;
        const permiso = !!p.consent_wa_at;
        const waText = p.status === 'mensaje_enviado' || p.status === 'seguimiento' ? (p.followup_message || '') : (p.wa_message || '');
        const waReady = permiso && p.phone_norm && waText;
        const waHref = waReady ? `https://wa.me/34${p.phone_norm}?text=${encodeURIComponent(this.fillMessage(waText, p))}` : '';
        const waBtnLabel = p.status === 'mensaje_enviado' || p.status === 'seguimiento' ? '💬 Enviar seguimiento' : '💬 Abrir WhatsApp';
        const waMarca = p.status === 'mensaje_enviado' || p.status === 'seguimiento' ? 'seguimiento' : 'mensaje_enviado';

        return `
        <div class="cap-card" id="cap-card-${p.id}">
            <div class="cap-card-head">
                <div>
                    <div class="cap-name">${this.esc(p.name)} ${p.tier ? `<span class="cap-tier t${this.esc(p.tier)}">${this.esc(p.tier)}${p.score !== null && p.score !== undefined ? ' · ' + this.esc(p.score) : ''}</span>` : ''}</div>
                    <div class="cap-meta">${this.esc(this.SECTORES[p.sector] || p.sector || 'Sin sector')} · ${this.esc([p.district, p.city].filter(Boolean).join(', ') || 'Sin ubicación')}</div>
                </div>
                <span class="cap-status">${this.ESTADOS[p.status] || this.esc(p.status)}</span>
            </div>

            <div class="cap-chips">
                ${p.booking_method ? `<span class="cap-chip">${this.esc(this.METODOS[p.booking_method] || p.booking_method)}</span>` : ''}
                ${p.booking_tool ? `<span class="cap-chip warn">${this.esc(p.booking_tool)}</span>` : ''}
                ${p.attempts ? `<span class="cap-chip">Intentos: ${this.esc(p.attempts)}</span>` : ''}
                ${permiso ? `<span class="cap-chip ok">Permiso WhatsApp ${this.fecha(p.consent_wa_at)}</span>` : ''}
                ${p.business_id ? `<span class="cap-chip ok">Negocio #${this.esc(p.business_id)}</span>` : ''}
            </div>

            ${p.hook ? `<div class="cap-hook">🔎 ${this.esc(p.hook)}</div>` : ''}

            <div class="cap-links">
                ${p.phone ? `<a href="tel:${p.phone_norm ? '+34' + this.esc(p.phone_norm) : this.esc(p.phone)}" class="cap-link strong">📞 ${this.esc(p.phone)}</a>` : `<span class="cap-link muted">Sin teléfono</span>`}
                <a href="${maps}" target="_blank" rel="noopener" class="cap-link">🗺️ Ver en Google Maps</a>
                ${web ? `<a href="${this.esc(web)}" target="_blank" rel="noopener" class="cap-link">🌐 Web</a>` : ''}
                ${insta ? `<a href="${this.esc(insta)}" target="_blank" rel="noopener" class="cap-link">📸 Instagram</a>` : ''}
            </div>
            <div class="cap-phone-edit">
                <input type="tel" id="cap-phone-${p.id}" placeholder="Apunta aquí el teléfono si lo sacas de Maps" value="${this.esc(p.phone || '')}">
                <button class="cap-btn small" onclick="superCaptacion.savePhone(${p.id})">Guardar</button>
            </div>

            ${p.call_script ? `<details class="cap-details"><summary>📞 Guion de llamada</summary><div class="cap-script">${this.esc(p.call_script)}</div></details>` : ''}
            ${waText ? `<details class="cap-details"><summary>💬 ${p.status === 'mensaje_enviado' || p.status === 'seguimiento' ? 'WhatsApp de seguimiento' : 'WhatsApp (solo con permiso)'}</summary>
                <div class="cap-script">${this.esc(this.fillMessage(waText, p))}</div>
                <button class="cap-btn small" onclick="superCaptacion.copy(${p.id})">📋 Copiar</button>
            </details>` : ''}

            <div class="cap-actions">
                ${waReady
                    ? `<a class="cap-btn primary" href="${this.esc(waHref)}" target="_blank" rel="noopener" onclick="setTimeout(() => superCaptacion.outcome(${p.id}, '${waMarca}'), 400)">${waBtnLabel}</a>`
                    : `<button class="cap-btn" disabled title="${permiso ? 'Falta el teléfono o el mensaje' : 'Primero pide permiso en la llamada o la visita'}">💬 WhatsApp ${permiso ? '' : '(sin permiso)'}</button>`}
                <button class="cap-btn" onclick="superCaptacion.outcome(${p.id}, 'no_contesta')">📵 No contesta</button>
                <button class="cap-btn" onclick="superCaptacion.askDate(${p.id})">🔁 Llamar otro día</button>
                <button class="cap-btn" onclick="superCaptacion.outcome(${p.id}, 'interesado')">👀 Interesado</button>
                <button class="cap-btn ok" onclick="superCaptacion.outcome(${p.id}, 'permiso_wa')">✅ Permiso WhatsApp</button>
                <button class="cap-btn ok" onclick="superCaptacion.outcome(${p.id}, 'registrado')">🎉 Registrado</button>
                <button class="cap-btn" onclick="superCaptacion.outcome(${p.id}, 'no_interesa')">🙅 No le interesa</button>
                <button class="cap-btn danger" onclick="superCaptacion.outcome(${p.id}, 'no_contactar')">⛔ No contactar</button>
            </div>

            <div class="cap-notes">
                <textarea id="cap-notes-${p.id}" placeholder="Notas: qué usa, qué le preocupa, con quién hablaste...">${this.esc(p.notes || '')}</textarea>
                <div class="cap-notes-row">
                    <label>Próximo paso: <input type="date" id="cap-next-${p.id}" value="${this.esc(String(p.next_action_at || '').slice(0, 10))}"></label>
                    <button class="cap-btn small" onclick="superCaptacion.saveNotes(${p.id})">💾 Guardar</button>
                    <button class="cap-btn small" onclick="superCaptacion.history(${p.id})">🕓 Historial</button>
                    <button class="cap-btn small danger" onclick="superCaptacion.remove(${p.id})" title="Si pide que borremos sus datos">Borrar datos</button>
                </div>
                <div id="cap-history-${p.id}" class="cap-history"></div>
            </div>
            <div class="cap-source">Fuente: ${this.esc(p.source || '—')}${p.batch ? ' · Tanda ' + this.esc(p.batch) : ''}</div>
        </div>`;
    },

    async refreshCard(p) {
        const el = document.getElementById(`cap-card-${p.id}`);
        if (!el) return;
        if (this.tab === 'today') {
            const sigue = p.next_action_at && String(p.next_action_at).slice(0, 10) <= this.hoy() && !['no_interesa', 'no_contactar', 'descartado'].includes(p.status);
            if (!sigue) {
                el.classList.add('cap-done');
                el.innerHTML = `<div class="cap-done-msg">${this.esc(p.name)} → ${this.ESTADOS[p.status] || this.esc(p.status)}${p.next_action_at ? ' · próximo paso ' + this.fecha(p.next_action_at) : ''}</div>`;
                return;
            }
        }
        el.outerHTML = this.renderCard(p);
    },

    hoy() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    async outcome(id, outcome, extra = {}) {
        if (outcome === 'no_contactar' && !confirm('¿Marcar como «No contactar»? Se borra su ficha y no se le podrá volver a llamar ni importar.')) return;
        try {
            const r = await superApi.post(`/api/super-admin/prospects/${id}/outcome`, { outcome, ...extra });
            if (r.deleted) {
                this.rows = this.rows.filter(x => x.id !== id);
                const el = document.getElementById(`cap-card-${id}`);
                if (el) { el.classList.add('cap-done'); el.innerHTML = `<div class="cap-done-msg">${this.esc(r.data.name)} → ⛔ No contactar (ficha borrada, queda en la lista de no contactar)</div>`; }
                if (document.getElementById('capModal').style.display !== 'none') this.closeModal();
                return;
            }
            this.rows = this.rows.map(x => x.id === id ? r.data : x);
            await this.refreshCard(r.data);
            if (document.getElementById('capModal').style.display !== 'none') this.openProspect(id);
        } catch (e) {
            alert(e.message);
        }
    },

    askDate(id) {
        const v = prompt('¿Qué día le vuelves a llamar? (DD/MM/AAAA). Déjalo vacío para mañana.', '');
        if (v === null) return;
        let date;
        const m = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) date = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
        this.outcome(id, 'volver_llamar', date ? { date } : {});
    },

    async savePhone(id) {
        const phone = document.getElementById(`cap-phone-${id}`).value.trim();
        try {
            const r = await superApi.patch(`/api/super-admin/prospects/${id}`, { phone });
            this.rows = this.rows.map(x => x.id === id ? r.data : x);
            await this.refreshCard(r.data);
        } catch (e) { alert(e.message); }
    },

    async saveNotes(id) {
        const notes = document.getElementById(`cap-notes-${id}`).value;
        const next = document.getElementById(`cap-next-${id}`).value || null;
        try {
            const r = await superApi.patch(`/api/super-admin/prospects/${id}`, { notes, next_action_at: next });
            this.rows = this.rows.map(x => x.id === id ? r.data : x);
            const btn = document.querySelector(`#cap-card-${id} .cap-notes-row .cap-btn`);
            if (btn) { btn.textContent = '✓ Guardado'; setTimeout(() => { btn.textContent = '💾 Guardar'; }, 1500); }
        } catch (e) { alert(e.message); }
    },

    async history(id) {
        const box = document.getElementById(`cap-history-${id}`);
        if (box.innerHTML) { box.innerHTML = ''; return; }
        try {
            const r = await superApi.get(`/api/super-admin/prospects/${id}/events`);
            box.innerHTML = (r.data || []).map(e => {
                const d = new Date(e.created_at);
                const f = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                return `<div>${f} · ${this.esc(e.detail || e.type)}</div>`;
            }).join('') || '<div>Sin historial</div>';
        } catch (e) { box.textContent = e.message; }
    },

    async remove(id) {
        if (!confirm('¿Borrar los datos de este negocio? Pasará a la lista de no contactar para no volver a importarlo.')) return;
        try {
            await superApi.delete(`/api/super-admin/prospects/${id}`);
            const el = document.getElementById(`cap-card-${id}`);
            if (el) el.remove();
            this.closeModal();
            if (this.tab === 'all') this.loadAll();
        } catch (e) { alert(e.message); }
    },

    copy(id) {
        const p = this.rows.find(x => x.id === id);
        if (!p) return;
        const text = this.fillMessage(p.status === 'mensaje_enviado' || p.status === 'seguimiento' ? p.followup_message : p.wa_message, p);
        navigator.clipboard.writeText(text).then(() => alert('Mensaje copiado'), () => alert('No se pudo copiar'));
    },

    // ---------- TODOS ----------
    async loadAll() {
        const f = this.filters;
        this.body().innerHTML = `
            <div class="cap-filters">
                <input type="search" id="capQ" placeholder="Buscar nombre, ciudad, barrio o teléfono" value="${this.esc(f.q)}" onkeydown="if(event.key==='Enter') superCaptacion.applyFilters()">
                <select id="capStatus"><option value="">Todos los estados</option>${Object.entries(this.ESTADOS).map(([k, v]) => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
                <select id="capSector"><option value="">Todos los sectores</option>${Object.entries(this.SECTORES).map(([k, v]) => `<option value="${k}" ${f.sector === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
                <select id="capTier"><option value="">A, B y C</option>${['A', 'B', 'C'].map(t => `<option ${f.tier === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
                <button class="cap-btn primary" onclick="superCaptacion.applyFilters()">Filtrar</button>
            </div>
            <div id="capTable"><div class="loading" style="padding:2rem;">Cargando...</div></div>`;
        try {
            const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
            const r = await superApi.get(`/api/super-admin/prospects${qs ? '?' + qs : ''}`);
            this.rows = r.data || [];
            document.getElementById('capTable').innerHTML = this.rows.length ? `
                <div class="cap-table-wrap"><table class="cap-table">
                    <thead><tr><th>Negocio</th><th>Sector</th><th>Zona</th><th>Nota</th><th>Estado</th><th>Próximo paso</th></tr></thead>
                    <tbody>${this.rows.map(p => `
                        <tr onclick="superCaptacion.openProspect(${p.id})">
                            <td><strong>${this.esc(p.name)}</strong>${p.booking_tool ? `<div class="cap-sub">${this.esc(p.booking_tool)}</div>` : ''}</td>
                            <td>${this.esc(this.SECTORES[p.sector] || p.sector || '—')}</td>
                            <td>${this.esc([p.district, p.city].filter(Boolean).join(', ') || '—')}</td>
                            <td>${p.tier ? `<span class="cap-tier t${this.esc(p.tier)}">${this.esc(p.tier)}</span>` : '—'}</td>
                            <td>${this.ESTADOS[p.status] || this.esc(p.status)}</td>
                            <td>${this.fecha(p.next_action_at) || '—'}</td>
                        </tr>`).join('')}</tbody>
                </table></div>
                <p class="cap-hint">${this.rows.length} resultados${this.rows.length === 500 ? ' (máximo 500: afina el filtro)' : ''}.</p>`
                : '<div class="cap-empty">No hay negocios con estos filtros.</div>';
        } catch (e) {
            document.getElementById('capTable').innerHTML = `<div class="cap-empty">Error: ${this.esc(e.message)}</div>`;
        }
    },

    applyFilters() {
        this.filters = {
            q: document.getElementById('capQ').value.trim(),
            status: document.getElementById('capStatus').value,
            sector: document.getElementById('capSector').value,
            tier: document.getElementById('capTier').value
        };
        this.loadAll();
    },

    openProspect(id) {
        const p = this.rows.find(x => x.id === id);
        if (!p) return;
        document.getElementById('capModalBody').innerHTML = `<div class="cap-cards single">${this.renderCard(p)}</div>`;
        document.getElementById('capModal').style.display = 'flex';
    },

    closeModal() {
        const m = document.getElementById('capModal');
        if (m) m.style.display = 'none';
        if (this.tab === 'all' && document.getElementById('capTable')) this.loadAll();
    },

    // ---------- RESULTADOS ----------
    async loadStats() {
        try {
            const r = await superApi.get('/api/super-admin/prospects-stats');
            const s = r.data;
            const e = s.embudo;
            const pasos = [
                ['Investigados', e.investigados], ['Contactados', e.contactados], ['Conversaciones', e.conversaciones],
                ['Permiso WhatsApp', e.permisos], ['Registrados', e.registrados],
                ['Con reservas reales', e.conReservas], ['Pagan', e.pagan]
            ];
            const max = Math.max(1, ...pasos.map(x => x[1]));
            this.body().innerHTML = `
                <div class="cap-section">
                    <h3>Embudo</h3>
                    ${pasos.map(([l, v]) => `
                        <div class="cap-funnel-row"><span>${l}</span>
                            <div class="cap-funnel-bar"><div style="width:${Math.round(v / max * 100)}%"></div></div>
                            <strong>${v}</strong></div>`).join('')}
                    <p class="cap-hint">Lo que de verdad cuenta son los negocios <strong>con reservas reales</strong>: un registrado que no lo usa se va.</p>
                </div>
                <div class="cap-section">
                    <h3>Por sector</h3>
                    ${s.porSector.length ? `<div class="cap-table-wrap"><table class="cap-table">
                        <thead><tr><th>Sector</th><th>Total</th><th>Contactados</th><th>Permisos</th><th>Registrados</th><th>% permiso</th></tr></thead>
                        <tbody>${s.porSector.map(x => `<tr><td>${this.esc(this.SECTORES[x.sector] || x.sector)}</td><td>${x.total}</td><td>${x.contactados}</td><td>${x.permisos}</td><td>${x.registrados}</td><td>${x.contactados ? Math.round(x.permisos / x.contactados * 100) + ' %' : '—'}</td></tr>`).join('')}</tbody>
                    </table></div>` : '<p class="cap-hint">Aún no hay datos.</p>'}
                </div>
                ${s.porVariante.length ? `<div class="cap-section">
                    <h3>Por versión del mensaje</h3>
                    <div class="cap-table-wrap"><table class="cap-table">
                        <thead><tr><th>Versión</th><th>Contactados</th><th>Permisos</th><th>Registrados</th></tr></thead>
                        <tbody>${s.porVariante.map(x => `<tr><td>${this.esc(x.variant)}</td><td>${x.total}</td><td>${x.permisos}</td><td>${x.registrados}</td></tr>`).join('')}</tbody>
                    </table></div></div>` : ''}
                <div class="cap-section">
                    <h3>Negocios captados</h3>
                    ${s.activacion.length ? `<div class="cap-table-wrap"><table class="cap-table">
                        <thead><tr><th>Negocio</th><th>Plan</th><th>Servicios</th><th>Reservas</th><th></th></tr></thead>
                        <tbody>${s.activacion.map(a => `<tr>
                            <td>${this.esc(a.name)} <span class="cap-sub">#${this.esc(a.businessId)}</span></td>
                            <td>${this.esc(a.plan)}${a.bonus ? ' 🎁' : ''}</td>
                            <td>${a.servicios}</td>
                            <td>${a.reservas ? a.reservas : '⚠️ 0'}</td>
                            <td>${a.bonus ? '<span class="cap-sub">Ya tiene un mes regalado</span>' : `<button class="cap-btn small" onclick="superCaptacion.giftMonth(${Number(a.businessId)})">🎁 Regalar 1 mes de Profesional</button>`}</td>
                        </tr>`).join('')}</tbody>
                    </table></div>
                    <p class="cap-hint">⚠️ = aún sin reservas: llámales para ayudarles a ponerlo en marcha (enlace en Instagram, respuesta automática de WhatsApp, cartel con QR).</p>` : '<p class="cap-hint">Todavía ningún negocio captado. ¡A por el primero!</p>'}
                </div>`;
        } catch (e) {
            this.body().innerHTML = `<div class="cap-empty">Error: ${this.esc(e.message)}</div>`;
        }
    },

    async giftMonth(businessId) {
        if (!confirm(`¿Regalar un mes de Profesional al negocio #${businessId}?`)) return;
        try {
            const r = await superApi.post(`/api/super-admin/businesses/${businessId}/gift-month`, {});
            alert(r.message || 'Hecho');
            this.loadStats();
        } catch (e) { alert(e.message); }
    },

    // ---------- IMPORTAR Y AÑADIR ----------
    renderImport() {
        this.body().innerHTML = `
            <div class="cap-section">
                <h3>📥 Subir la tanda del agente</h3>
                <p class="cap-hint">En Claude Code pide <em>«prepara la tanda de esta semana»</em>. El agente deja un archivo en <code>captacion/tandas/</code>. Súbelo aquí: se saltan solos los duplicados y los de la lista de no contactar.</p>
                <input type="file" id="capFile" accept=".json,application/json">
                <button class="cap-btn primary" onclick="superCaptacion.importFile()">Importar</button>
                <div id="capImportResult" class="cap-hint"></div>
            </div>
            <div class="cap-section">
                <h3>➕ Añadir un negocio a mano</h3>
                <p class="cap-hint">El que ves por la calle o te recomiendan. Luego puedes pedirle al agente que lo investigue y le prepare el guion.</p>
                <div class="cap-form">
                    <input id="capNName" placeholder="Nombre del negocio *">
                    <select id="capNSector"><option value="">Sector</option>${Object.entries(this.SECTORES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
                    <input id="capNCity" placeholder="Ciudad" value="Sabadell">
                    <input id="capNDistrict" placeholder="Barrio / calle">
                    <input id="capNPhone" placeholder="Teléfono">
                    <input id="capNWeb" placeholder="Web">
                    <input id="capNInsta" placeholder="Instagram">
                    <textarea id="capNNotes" placeholder="Notas"></textarea>
                </div>
                <button class="cap-btn primary" onclick="superCaptacion.addManual()">Añadir</button>
                <div id="capAddResult" class="cap-hint"></div>
            </div>
            <div class="cap-section">
                <h3>📤 Exportar para el agente</h3>
                <p class="cap-hint">Descarga los dos archivos, guárdalos en <code>captacion/exportes/</code> y pide en Claude Code <em>«analiza los resultados»</em>. El agente también los usa para no repetir negocios.</p>
                <button class="cap-btn" onclick="superCaptacion.download('/api/super-admin/prospects-export', 'captacion.csv')">⬇️ captacion.csv</button>
                <button class="cap-btn" onclick="superCaptacion.download('/api/super-admin/prospects-export?type=dnc', 'no-contactar.csv')">⬇️ no-contactar.csv</button>
            </div>`;
    },

    async importFile() {
        const f = document.getElementById('capFile').files[0];
        const out = document.getElementById('capImportResult');
        if (!f) { out.textContent = 'Elige primero el archivo .json'; return; }
        try {
            const data = JSON.parse(await f.text());
            out.textContent = 'Importando...';
            const r = await superApi.post('/api/super-admin/prospects/import', data);
            const d = r.data;
            out.innerHTML = `✅ Añadidos <strong>${d.added}</strong> · duplicados ${d.duplicates} · en no contactar ${d.blocked} · sin nombre ${d.invalid}. Los tienes en <strong>Hoy</strong>.`;
        } catch (e) {
            out.textContent = 'Error: ' + e.message;
        }
    },

    async addManual() {
        const v = id => document.getElementById(id).value.trim();
        const out = document.getElementById('capAddResult');
        if (!v('capNName')) { out.textContent = 'Falta el nombre'; return; }
        try {
            await superApi.post('/api/super-admin/prospects', {
                name: v('capNName'), sector: v('capNSector') || null, city: v('capNCity'), district: v('capNDistrict'),
                phone: v('capNPhone'), website: v('capNWeb'), instagram: v('capNInsta'), notes: v('capNNotes')
            });
            out.textContent = '✅ Añadido. Lo verás hoy en «Hoy».';
            ['capNName', 'capNDistrict', 'capNPhone', 'capNWeb', 'capNInsta', 'capNNotes'].forEach(id => { document.getElementById(id).value = ''; });
        } catch (e) { out.textContent = 'Error: ' + e.message; }
    },

    async download(endpoint, filename) {
        try {
            const res = await fetch(`${API_URL}${endpoint}`, { headers: { Authorization: `Bearer ${superAuth.getToken()}` } });
            if (!res.ok) throw new Error('No se pudo descargar');
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        } catch (e) { alert(e.message); }
    },

    // ---------- NO CONTACTAR ----------
    async loadDnc() {
        try {
            const r = await superApi.get('/api/super-admin/do-not-contact');
            const rows = r.data || [];
            this.body().innerHTML = `
                <div class="cap-section">
                    <h3>⛔ Lista de no contactar</h3>
                    <p class="cap-hint">Negocios que pidieron no ser contactados o que borraron sus datos. Nunca se vuelven a importar ni a llamar.</p>
                    <div class="cap-form">
                        <input id="capDPhone" placeholder="Teléfono">
                        <input id="capDName" placeholder="Nombre del negocio">
                        <input id="capDCity" placeholder="Ciudad">
                    </div>
                    <button class="cap-btn" onclick="superCaptacion.addDnc()">Añadir a la lista</button>
                </div>
                <div class="cap-section">
                    ${rows.length ? `<div class="cap-table-wrap"><table class="cap-table">
                        <thead><tr><th>Teléfono</th><th>Nombre</th><th>Ciudad</th><th>Motivo</th><th>Fecha</th></tr></thead>
                        <tbody>${rows.map(x => `<tr><td>${this.esc(x.phone_norm || '—')}</td><td>${this.esc(x.name_norm || '—')}</td><td>${this.esc(x.city_norm || '—')}</td><td>${this.esc(x.reason || '')}</td><td>${this.fecha(x.created_at)}</td></tr>`).join('')}</tbody>
                    </table></div>` : '<p class="cap-hint">La lista está vacía.</p>'}
                </div>`;
        } catch (e) {
            this.body().innerHTML = `<div class="cap-empty">Error: ${this.esc(e.message)}</div>`;
        }
    },

    async addDnc() {
        const v = id => document.getElementById(id).value.trim();
        try {
            await superApi.post('/api/super-admin/do-not-contact', { phone: v('capDPhone'), name: v('capDName'), city: v('capDCity') });
            this.loadDnc();
        } catch (e) { alert(e.message); }
    },

    // ---------- GUÍA (documento en la base de datos, no en Git) ----------
    async loadGuide() {
        try {
            const r = await superApi.get('/api/super-admin/documents/guia-captacion');
            const doc = r.data;
            const subir = `
                <div class="cap-guide-upload">
                    <input type="file" id="capGuideFile" accept=".md,.txt,text/markdown,text/plain">
                    <button class="cap-btn" onclick="superCaptacion.uploadGuide()">${doc ? '🔄 Actualizar guía' : '📤 Subir guía'}</button>
                    <span class="cap-sub">${doc ? 'Última versión: ' + this.fecha(doc.updated_at) : ''}</span>
                </div>`;
            this.body().innerHTML = doc
                ? `<div class="cap-section">${subir}</div><div class="cap-section cap-guide">${this.mdToHtml(doc.content)}</div>`
                : `<div class="cap-section">
                       <h3>📘 Guía de captación</h3>
                       <p class="cap-hint">Todavía no hay guía. Sube el archivo <code>docs/captacion/diseno-agente-captacion.md</code> de tu ordenador: se guarda en la base de datos y no se publica en GitHub.</p>
                       ${subir}
                   </div>`;
        } catch (e) {
            this.body().innerHTML = `<div class="cap-empty">Error: ${this.esc(e.message)}</div>`;
        }
    },

    async uploadGuide() {
        const f = document.getElementById('capGuideFile').files[0];
        if (!f) return alert('Elige primero el archivo .md');
        try {
            await superApi.fetch('/api/super-admin/documents/guia-captacion', { method: 'PUT', body: JSON.stringify({ content: await f.text() }) });
            this.loadGuide();
        } catch (e) { alert(e.message); }
    },

    // Markdown sencillo → HTML (todo el texto se escapa antes; solo se generan etiquetas propias)
    mdToHtml(md) {
        const inline = t => this.esc(t)
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
            .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
        const lines = String(md).replace(/\r/g, '').split('\n');
        const out = [];
        let i = 0;
        while (i < lines.length) {
            const l = lines[i];
            if (/^```/.test(l)) {
                const buf = [];
                i++;
                while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
                i++;
                out.push(`<pre>${this.esc(buf.join('\n'))}</pre>`);
                continue;
            }
            const h = l.match(/^(#{1,4})\s+(.*)/);
            if (h) { out.push(`<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`); i++; continue; }
            if (/^---+\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
            if (/^\|/.test(l)) {
                const rows = [];
                while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
                const cells = r => r.replace(/^\||\|\s*$/g, '').split('|').map(c => c.trim());
                const body = rows.filter((r, k) => !(k === 1 && /^[\s|:-]+$/.test(r)));
                out.push('<div class="cap-table-wrap"><table class="cap-table">' + body.map((r, k) =>
                    '<tr>' + cells(r).map(c => k === 0 ? `<th>${inline(c)}</th>` : `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</table></div>');
                continue;
            }
            if (/^>\s?/.test(l)) {
                const buf = [];
                while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
                out.push(`<blockquote>${buf.map(b => b ? inline(b) : '<br>').join('<br>')}</blockquote>`);
                continue;
            }
            if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
                const ordered = /^\s*\d+\./.test(l);
                const buf = [];
                while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
                    const indent = lines[i].match(/^\s*/)[0].length;
                    buf.push(`<li${indent >= 2 ? ' class="sub"' : ''}>${inline(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''))}</li>`);
                    i++;
                }
                out.push(ordered ? `<ol>${buf.join('')}</ol>` : `<ul>${buf.join('')}</ul>`);
                continue;
            }
            if (!l.trim()) { i++; continue; }
            const buf = [];
            while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\||>|```|---|\s*([-*]|\d+\.)\s)/.test(lines[i])) buf.push(lines[i++]);
            out.push(`<p>${inline(buf.join(' '))}</p>`);
        }
        return out.join('\n');
    },

    injectStyles() {
        if (document.getElementById('cap-styles')) return;
        const st = document.createElement('style');
        st.id = 'cap-styles';
        st.textContent = `
            .cap-page { max-width: 1100px; }
            .cap-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem; }
            .cap-tab { padding: 0.55rem 1rem; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; font-size: 0.92rem; }
            .cap-tab.active { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
            .cap-hint { color: var(--text-secondary); font-size: 0.88rem; line-height: 1.55; margin: 0.5rem 0 1rem; }
            .cap-hint code { background: var(--bg-secondary); padding: 0.1rem 0.35rem; border-radius: 4px; }
            .cap-empty { text-align: center; padding: 3rem 1rem; color: var(--text-secondary); }
            .cap-empty h3 { color: var(--text-primary); margin: 0.75rem 0 0.5rem; }
            .cap-cards { display: grid; gap: 1rem; }
            .cap-card { background: var(--bg-primary, var(--bg-secondary)); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.1rem 1.2rem; }
            .cap-card.cap-done { opacity: 0.6; padding: 0.7rem 1.2rem; }
            .cap-done-msg { color: var(--text-secondary); font-size: 0.9rem; }
            .cap-card-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
            .cap-name { font-weight: 700; font-size: 1.08rem; color: var(--text-primary); }
            .cap-meta, .cap-sub { color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.15rem; }
            .cap-status { font-size: 0.82rem; white-space: nowrap; color: var(--text-primary); background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 0.25rem 0.6rem; border-radius: 999px; }
            .cap-tier { display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.45rem; border-radius: 6px; margin-left: 0.35rem; vertical-align: middle; color: #fff; }
            .cap-tier.tA { background: #10b981; } .cap-tier.tB { background: #f59e0b; } .cap-tier.tC { background: #6b7280; }
            .cap-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.7rem 0; }
            .cap-chip { font-size: 0.78rem; padding: 0.2rem 0.55rem; border-radius: 999px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-secondary); }
            .cap-chip.ok { border-color: rgba(16,185,129,0.5); color: #10b981; }
            .cap-chip.warn { border-color: rgba(245,158,11,0.55); color: #f59e0b; }
            .cap-hook { font-size: 0.9rem; color: var(--text-primary); background: var(--bg-secondary); border-left: 3px solid var(--primary-color); padding: 0.55rem 0.75rem; border-radius: 6px; margin-bottom: 0.7rem; line-height: 1.5; }
            .cap-links { display: flex; flex-wrap: wrap; gap: 0.9rem; margin-bottom: 0.5rem; }
            .cap-link { color: var(--primary-color); text-decoration: none; font-size: 0.9rem; }
            .cap-link.strong { font-weight: 700; font-size: 1rem; }
            .cap-link.muted { color: var(--text-secondary); }
            .cap-phone-edit { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; }
            .cap-phone-edit input, .cap-form input, .cap-form select, .cap-form textarea, .cap-filters input, .cap-filters select, .cap-notes textarea, .cap-notes input {
                background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem 0.65rem; font-size: 0.9rem; font-family: inherit; }
            .cap-phone-edit input { flex: 1; max-width: 340px; }
            .cap-details { margin: 0.45rem 0; }
            .cap-details summary { cursor: pointer; color: var(--text-primary); font-weight: 600; font-size: 0.92rem; }
            .cap-script { white-space: pre-wrap; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.8rem; margin: 0.5rem 0; font-size: 0.9rem; line-height: 1.55; color: var(--text-primary); }
            .cap-actions { display: flex; flex-wrap: wrap; gap: 0.45rem; margin: 0.8rem 0; }
            .cap-btn { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.5rem 0.8rem; border-radius: 9px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; font-size: 0.86rem; text-decoration: none; font-family: inherit; }
            .cap-btn:hover:not([disabled]) { border-color: var(--primary-color); }
            .cap-btn[disabled] { opacity: 0.5; cursor: not-allowed; }
            .cap-btn.primary { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
            .cap-btn.ok { border-color: rgba(16,185,129,0.55); }
            .cap-btn.danger { border-color: rgba(239,68,68,0.55); color: #ef4444; }
            .cap-btn.small { padding: 0.35rem 0.6rem; font-size: 0.8rem; }
            .cap-notes textarea { width: 100%; min-height: 60px; box-sizing: border-box; }
            .cap-notes-row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-top: 0.4rem; color: var(--text-secondary); font-size: 0.85rem; }
            .cap-history { font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.4rem; line-height: 1.6; }
            .cap-source { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem; }
            .cap-filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
            .cap-filters input { flex: 1; min-width: 220px; }
            .cap-table-wrap { overflow-x: auto; }
            .cap-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
            .cap-table th, .cap-table td { text-align: left; padding: 0.6rem 0.7rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); }
            .cap-table th { color: var(--text-secondary); font-weight: 600; font-size: 0.8rem; }
            .cap-table tbody tr { cursor: pointer; }
            .cap-table tbody tr:hover { background: var(--bg-secondary); }
            .cap-section { background: var(--bg-primary, var(--bg-secondary)); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.1rem 1.2rem; margin-bottom: 1rem; }
            .cap-section h3 { margin: 0 0 0.6rem; color: var(--text-primary); font-size: 1.05rem; }
            .cap-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin-bottom: 0.75rem; }
            .cap-form textarea { grid-column: 1 / -1; min-height: 60px; }
            .cap-funnel-row { display: grid; grid-template-columns: 170px 1fr 50px; gap: 0.75rem; align-items: center; margin: 0.4rem 0; color: var(--text-primary); font-size: 0.9rem; }
            .cap-funnel-bar { height: 12px; background: var(--bg-secondary); border-radius: 999px; overflow: hidden; border: 1px solid var(--border-color); }
            .cap-funnel-bar div { height: 100%; background: var(--primary-color); border-radius: 999px; }
            .cap-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 3vh 1rem; overflow-y: auto; }
            .cap-modal-box { position: relative; width: 100%; max-width: 760px; }
            .cap-modal-close { position: absolute; top: 0.6rem; right: 0.6rem; z-index: 2; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; width: 32px; height: 32px; cursor: pointer; }
            .cap-guide { color: var(--text-primary); line-height: 1.65; font-size: 0.95rem; }
            .cap-guide h2 { font-size: 1.4rem; margin: 0.5rem 0 1rem; } .cap-guide h3 { font-size: 1.15rem; margin: 1.6rem 0 0.6rem; } .cap-guide h4 { font-size: 1rem; margin: 1.2rem 0 0.5rem; }
            .cap-guide p, .cap-guide ul, .cap-guide ol { margin: 0.6rem 0; } .cap-guide li.sub { margin-left: 1.25rem; list-style: circle; }
            .cap-guide a { color: var(--primary-color); } .cap-guide hr { border: none; border-top: 1px solid var(--border-color); margin: 1.5rem 0; }
            .cap-guide code { background: var(--bg-secondary); padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.88em; }
            .cap-guide pre { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.8rem; overflow-x: auto; font-size: 0.8rem; line-height: 1.4; }
            .cap-guide blockquote { margin: 0.8rem 0; padding: 0.6rem 0.9rem; border-left: 3px solid var(--primary-color); background: var(--bg-secondary); border-radius: 6px; }
            .cap-guide .cap-table tbody tr { cursor: default; }
            .cap-guide-upload { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; }
            @media (max-width: 640px) {
                .cap-card-head { flex-direction: column; }
                .cap-funnel-row { grid-template-columns: 110px 1fr 40px; font-size: 0.82rem; }
            }
        `;
        document.head.appendChild(st);
    }
};

window.superCaptacion = superCaptacion;
