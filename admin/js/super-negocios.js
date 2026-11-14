// Super Admin - Negocios (sustituye a las antiguas pantallas Clientes y Planes)
// Lista de negocios reales con su plan de verdad y su actividad; ficha con todas las acciones.
const superNegocios = {
    filters: { search: '', status: '', plan: '', demos: false },
    rows: [],

    async load() {
        document.getElementById('pageTitle').textContent = 'Negocios';
        superUI.injectStyles();
        const f = this.filters;
        document.getElementById('contentArea').innerHTML = `
            <div class="sa-toolbar">
                <input type="search" id="negQ" placeholder="Buscar por nombre, email o enlace" value="${superUI.esc(f.search)}" onkeydown="if(event.key==='Enter') superNegocios.apply()">
                <select id="negStatus">
                    <option value="">Todos</option>
                    <option value="active" ${f.status === 'active' ? 'selected' : ''}>Activos (reservas en 30 días)</option>
                    <option value="inactive" ${f.status === 'inactive' ? 'selected' : ''}>Sin actividad en 30 días</option>
                    <option value="suspended" ${f.status === 'suspended' ? 'selected' : ''}>Suspendidos</option>
                </select>
                <select id="negPlan">
                    <option value="">Todos los planes</option>
                    ${Object.entries(superUI.PLANES).map(([k, v]) => `<option value="${k}" ${f.plan === k ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
                <label><input type="checkbox" id="negDemos" ${f.demos ? 'checked' : ''}> Ver demos y pruebas</label>
                <button class="sa-btn primary" onclick="superNegocios.apply()">Filtrar</button>
            </div>
            <div class="sa-card"><div id="negTable"><div class="loading">Cargando...</div></div></div>
            <div id="negModal" class="sa-modal" style="display:none" onclick="if(event.target===this) superNegocios.close()">
                <div class="sa-modal-box"><button class="sa-modal-close" onclick="superNegocios.close()">✕</button><div id="negModalBody"></div></div>
            </div>`;
        // La ventana va directamente en <body> para que no la tape el menú lateral
        document.querySelectorAll('body > #negModal').forEach(m => m.remove());
        document.body.appendChild(document.getElementById('negModal'));
        this.loadList();
    },

    apply() {
        this.filters = {
            search: document.getElementById('negQ').value.trim(),
            status: document.getElementById('negStatus').value,
            plan: document.getElementById('negPlan').value,
            demos: document.getElementById('negDemos').checked
        };
        this.loadList();
    },

    async loadList() {
        const box = document.getElementById('negTable');
        try {
            const f = this.filters;
            const qs = new URLSearchParams({ limit: 200 });
            if (f.search) qs.set('search', f.search);
            if (f.status) qs.set('status', f.status);
            if (f.plan) qs.set('plan', f.plan);
            if (f.demos) qs.set('include_demos', '1');
            const r = await superApi.get(`/api/super-admin/businesses?${qs}`);
            this.rows = r.data || [];
            if (!this.rows.length) { box.innerHTML = '<div class="sa-empty">No hay negocios con estos filtros.</div>'; return; }
            const ui = superUI;
            box.innerHTML = `
                <div class="sa-table-wrap"><table class="sa-table">
                    <thead><tr><th>Negocio</th><th>Plan</th><th>Reservas 30 días</th><th>Última reserva</th><th>Alta</th></tr></thead>
                    <tbody>${this.rows.map(b => {
                        const ep = ui.estadoPlan(b);
                        return `<tr class="click" onclick="superNegocios.open(${Number(b.id)})">
                            <td><strong>${ui.esc(b.name)}</strong>
                                ${b.is_demo ? ' <span class="sa-pill">Demo</span>' : ''}
                                ${Number(b.is_active) === 0 ? ' <span class="sa-pill danger">⛔ Suspendido</span>' : ''}
                                <div class="sa-sub">${ui.esc(b.email || 'Sin email')}</div></td>
                            <td><span class="sa-pill plan">${ui.esc(ui.PLANES[b.plan] || b.plan || '—')}</span><div class="sa-sub"><span class="sa-pill ${ep.cls}">${ep.txt}</span></div></td>
                            <td><strong>${Number(b.bookings_30d) || 0}</strong><div class="sa-sub">${Number(b.total_bookings) || 0} en total</div></td>
                            <td>${ui.hace(b.last_booking_at)}</td>
                            <td>${ui.fecha(b.created_at)}</td>
                        </tr>`;
                    }).join('')}</tbody>
                </table></div>
                <p class="sa-note" style="margin-top:0.75rem;">${r.pagination.total} ${r.pagination.total === 1 ? 'negocio' : 'negocios'}${f.demos ? '' : ' (sin demos ni cuentas de prueba)'}. Pulsa uno para ver su ficha.</p>`;
        } catch (e) {
            box.innerHTML = `<div class="sa-empty">Error: ${superUI.esc(e.message)}</div>`;
        }
    },

    async open(id) {
        const modal = document.getElementById('negModal');
        const body = document.getElementById('negModalBody');
        modal.style.display = 'flex';
        body.innerHTML = '<div class="loading">Cargando...</div>';
        try {
            const b = (await superApi.get(`/api/super-admin/businesses/${id}`)).data;
            const ui = superUI;
            const ep = ui.estadoPlan(b);
            const sub = b.subscription;
            const suspendido = Number(b.is_active) === 0;
            const pagina = b.slug ? `https://stickywork.com/reservar?n=${encodeURIComponent(b.slug)}` : null;
            body.innerHTML = `
                <h2 style="margin:0 2.5rem 0.3rem 0;">${ui.esc(b.name)}</h2>
                <div class="sa-actions" style="margin-bottom:0.5rem;">
                    <span class="sa-pill plan">${ui.esc(ui.PLANES[b.plan] || b.plan)}</span>
                    <span class="sa-pill ${ep.cls}">${ep.txt}</span>
                    ${b.is_demo ? '<span class="sa-pill">Demo</span>' : ''}
                    ${suspendido ? '<span class="sa-pill danger">⛔ Suspendido</span>' : ''}
                </div>

                <dl class="sa-dl">
                    <dt>Email</dt><dd>${b.email ? `<a class="sa-link" href="mailto:${ui.esc(b.email)}">${ui.esc(b.email)}</a>` : '—'}</dd>
                    <dt>Teléfono</dt><dd>${ui.esc(b.phone || '—')}</dd>
                    <dt>Tipo</dt><dd>${ui.esc(b.type || '—')}</dd>
                    <dt>Página de reservas</dt><dd>${pagina ? `<a class="sa-link" href="${ui.esc(pagina)}" target="_blank" rel="noopener">${ui.esc(b.slug)}</a>` : '—'}</dd>
                    <dt>Alta</dt><dd>${ui.fecha(b.created_at)}</dd>
                    <dt>Reservas</dt><dd>${b.stats.bookings30d} en los últimos 30 días · ${b.stats.totalBookings} en total · última ${ui.hace(b.stats.lastBookingAt)}</dd>
                    <dt>Servicios activos</dt><dd>${b.stats.activeServices}</dd>
                    ${sub ? `<dt>Stripe</dt><dd>${ui.esc(sub.status)}${sub.current_period_end ? ' · renueva ' + ui.fecha(sub.current_period_end) : ''}${sub.cancel_at_period_end ? ' · cancelada al final del periodo' : ''}</dd>` : ''}
                </dl>

                <div class="sa-section">
                    <h4>Plan</h4>
                    <div class="sa-form">
                        <select id="negNewPlan">${Object.entries(ui.PLANES).map(([k, v]) => `<option value="${k}" ${k === b.plan ? 'selected' : ''}>${v}${ui.PRECIO[k] ? ' (' + ui.PRECIO[k] + ' €/mes)' : ''}</option>`).join('')}</select>
                        <input id="negReason" placeholder="Motivo (opcional)" style="flex:1; min-width:180px;">
                        <button class="sa-btn primary" onclick="superNegocios.changePlan(${Number(b.id)})">Cambiar plan</button>
                    </div>
                    <p class="sa-note">Cambiar el plan aquí no cobra nada en Stripe: úsalo para cortesías o arreglos. Si tenía un mes regalado, se anula.</p>
                    <div class="sa-actions" style="margin-top:0.5rem;">
                        ${b.is_demo ? '' : `<button class="sa-btn" onclick="superNegocios.gift(${Number(b.id)})">🎁 Regalar 1 mes de Profesional</button>`}
                        <button class="sa-btn" onclick="superNegocios.history(${Number(b.id)})">📜 Historial de cambios</button>
                    </div>
                    <div id="negHistory"></div>
                </div>

                <div class="sa-section">
                    <h4>Usuarios del panel (${b.stats.admins.length})</h4>
                    ${b.stats.admins.length ? b.stats.admins.map(a => `
                        <div class="sa-list-row"><span>${ui.esc(a.full_name)} <span class="sa-sub">${ui.esc(a.role)}${a.is_active ? '' : ' · desactivado'}</span></span>
                        <a href="mailto:${ui.esc(a.email)}">${ui.esc(a.email)}</a></div>`).join('') : '<p class="sa-note">Sin usuarios.</p>'}
                </div>

                ${b.is_demo ? '' : `<div class="sa-section">
                    <h4>Suspensión</h4>
                    <p class="sa-note">${suspendido
                        ? 'Está suspendido: no puede entrar en su panel y su widget y su página no aceptan reservas.'
                        : 'Si lo suspendes, no podrá entrar en su panel y su widget y su página dejarán de aceptar reservas. Úsalo solo en casos de impago o abuso.'}</p>
                    <button class="sa-btn ${suspendido ? 'primary' : 'danger'}" onclick="superNegocios.toggleSuspend(${Number(b.id)}, ${suspendido ? 'false' : 'true'})">${suspendido ? '▶️ Reactivar negocio' : '⛔ Suspender negocio'}</button>
                </div>`}`;
        } catch (e) {
            body.innerHTML = `<div class="sa-empty">Error: ${superUI.esc(e.message)}</div>`;
        }
    },

    close() {
        document.getElementById('negModal').style.display = 'none';
    },

    async changePlan(id) {
        const plan = document.getElementById('negNewPlan').value;
        const reason = document.getElementById('negReason').value.trim();
        if (!confirm(`¿Cambiar el plan a ${superUI.PLANES[plan]}?`)) return;
        try {
            await superApi.patch(`/api/super-admin/businesses/${id}/change-plan`, { plan, reason: reason || null });
            await this.open(id);
            this.loadList();
        } catch (e) { alert(e.message); }
    },

    async gift(id) {
        if (!confirm('¿Regalar un mes del plan Profesional? Si ya tenía un mes regalado, se suman 30 días más.')) return;
        try {
            const r = await superApi.post(`/api/super-admin/businesses/${id}/gift-month`, {});
            alert(r.message || 'Hecho');
            await this.open(id);
            this.loadList();
        } catch (e) { alert(e.message); }
    },

    async history(id) {
        const box = document.getElementById('negHistory');
        try {
            const r = await superApi.get(`/api/super-admin/businesses/${id}/plan-history`);
            const rows = r.data || [];
            box.innerHTML = rows.length ? `<div style="margin-top:0.75rem;">${rows.map(h => `
                <div class="sa-list-row"><span>${superUI.esc((superUI.PLANES[h.old_plan] || h.old_plan || '—'))} → <strong>${superUI.esc(superUI.PLANES[h.new_plan] || h.new_plan)}</strong>
                ${h.change_reason ? `<span class="sa-sub">· ${superUI.esc(h.change_reason)}</span>` : ''}</span>
                <span class="sa-sub">${superUI.fechaHora(h.changed_at)}</span></div>`).join('')}</div>`
                : '<p class="sa-note" style="margin-top:0.75rem;">Sin cambios de plan registrados.</p>';
        } catch (e) { box.textContent = e.message; }
    },

    async toggleSuspend(id, suspender) {
        const msg = suspender
            ? '¿Suspender este negocio? No podrá entrar en su panel y no recibirá reservas online hasta que lo reactives.'
            : '¿Reactivar este negocio?';
        if (!confirm(msg)) return;
        try {
            await superApi.patch(`/api/super-admin/businesses/${id}`, { is_active: !suspender });
            await this.open(id);
            this.loadList();
        } catch (e) { alert(e.message); }
    }
};
window.superNegocios = superNegocios;
