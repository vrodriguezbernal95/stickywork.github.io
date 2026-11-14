// Super Admin Dashboard Module
const superDashboard = {
    // Aviso si los emails de StickyWork están fallando (p. ej. Brevo bloquea la IP del servidor)
    async loadEmailHealth() {
        const box = document.getElementById('emailHealth');
        if (!box) return;
        try {
            const h = (await superApi.get('/api/super-admin/email-health')).data;
            const f = d => {
                if (!d) return '—';
                const x = new Date(d);
                return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')} ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
            };
            const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
            const base = 'padding: 0.85rem 1.1rem; border-radius: 12px; margin-bottom: 1.25rem; line-height: 1.5; font-size: 0.92rem; color: var(--text-primary);';
            const recuperado = h.fail24 > 0 && h.lastOk && new Date(h.lastOk) > new Date(h.lastFail);
            if (recuperado) {
                box.innerHTML = `<div style="${base} background: rgba(16,185,129,0.10); border: 1px solid rgba(16,185,129,0.45);">
                    ✓ <strong>Emails funcionando de nuevo</strong> · último enviado: ${f(h.lastOk)}.
                    <span style="color: var(--text-secondary);">Hubo ${h.fail24} ${h.fail24 === 1 ? 'fallo' : 'fallos'} en las últimas 24 horas (el último a las ${f(h.lastFail)}).</span></div>`;
            } else if (h.fail24 > 0) {
                box.innerHTML = `<div style="${base} background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.55);">
                    <strong>⚠️ ${h.fail24} ${h.fail24 === 1 ? 'email ha fallado' : 'emails han fallado'} en las últimas 24 horas</strong>
                    (${h.ok24} enviados bien). Último error (${f(h.lastFail)}): <em>${esc(h.lastError)}</em><br>
                    Si habla de una IP no reconocida: Brevo → Seguridad → IP autorizadas → autoriza la IP nueva de Railway.</div>`;
            } else if (h.lastOk) {
                box.innerHTML = `<div style="${base} background: var(--bg-secondary); border: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-secondary);">✓ Emails funcionando · último enviado: ${f(h.lastOk)}</div>`;
            } else {
                box.innerHTML = '';
            }
        } catch (e) {
            box.innerHTML = '';
        }
    },

    async load() {
        document.getElementById('pageTitle').textContent = 'Dashboard';
        superUI.injectStyles();
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = '<div class="loading"><p>Cargando...</p></div>';
        try {
            const d = (await superApi.get('/api/super-admin/overview')).data;
            const n = d.negocios, p = n.planes, pend = d.pendientes;
            const ui = superUI;
            const kpi = (label, value, sub) => `
                <div class="sa-card"><div class="sa-kpi-label">${label}</div><div class="sa-kpi-value">${value}</div><div class="sa-kpi-sub">${sub}</div></div>`;
            const fila = (txt, num, page, alerta) => `
                <div class="sa-list-row"><span>${txt}</span>
                    <span><span class="sa-count ${alerta && num > 0 ? 'alert' : ''}">${num}</span>
                    ${page ? ` · <a onclick="superDashboard.go('${page}')">Ver</a>` : ''}</span></div>`;

            // Últimos 6 meses, también los que no tuvieron registros
            const meses = [];
            const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const hoy = new Date();
            for (let i = 5; i >= 0; i--) {
                const f = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
                const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
                const hit = d.crecimiento.find(c => c.mes === key);
                meses.push({ label: nombres[f.getMonth()], n: hit ? hit.n : 0 });
            }
            const max = Math.max(1, ...meses.map(m => m.n));

            contentArea.innerHTML = `
                <div id="emailHealth"></div>
                <div class="sa-grid">
                    ${kpi('Negocios reales', n.total, `${n.nuevosMes} ${n.nuevosMes === 1 ? 'nuevo' : 'nuevos'} este mes`)}
                    ${kpi('Activos (30 días)', n.activos30, `con alguna reserva en los últimos 30 días`)}
                    ${kpi('Ingresos al mes', `${n.ingresosMes} €`, `${p.pagando} ${p.pagando === 1 ? 'negocio paga' : 'negocios pagan'} con Stripe`)}
                    ${kpi('Reservas', d.reservas.delMes, `este mes · ${d.reservas.creadas30} hechas en los últimos 30 días`)}
                </div>
                <div class="sa-two">
                    <div class="sa-card">
                        <h3>Pendiente de tu atención</h3>
                        ${fila('Mensajes de contacto sin leer', pend.contacto, 'messages', true)}
                        ${fila('Mensajes de soporte sin responder', pend.soporte, 'messages', true)}
                        ${fila('Consultorías por agendar', pend.consultorias, 'consultorias', true)}
                        ${fila('Captación: contactos para hoy', pend.captacionHoy, 'captacion', false)}
                    </div>
                    <div class="sa-card">
                        <h3>Planes de los negocios reales</h3>
                        ${fila('💳 Pagando con Stripe', p.pagando)}
                        ${fila('⏳ En los 7 días de prueba', p.enPrueba)}
                        ${fila('🎁 Mes regalado (invitaciones)', p.regalo)}
                        ${fila('🤝 Cortesía: plan de pago sin cobrar', p.cortesia)}
                        ${fila('Gratis', p.free)}
                        ${n.suspendidos ? fila('⛔ Suspendidos', n.suspendidos, 'negocios', true) : ''}
                    </div>
                </div>
                <div class="sa-card">
                    <h3>Negocios nuevos por mes</h3>
                    <div class="sa-bars">
                        ${meses.map(m => `<div class="sa-bar"><span class="sa-bar-n">${m.n}</span><div class="sa-bar-fill" style="height:${Math.round(m.n / max * 100)}%"></div><span>${m.label}</span></div>`).join('')}
                    </div>
                </div>
                <p class="sa-note" style="margin-top:1rem;">Sin contar las ${d.demos.negocios} demos ni las cuentas de prueba (las demos han tenido ${d.demos.reservas30} reservas de prueba en 30 días). «Cortesía» son negocios con plan de pago que no pagan, como los primeros clientes con acceso gratis.</p>`;
            this.loadEmailHealth();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            contentArea.innerHTML = `<div class="error-message"><p>⚠️ Error al cargar el dashboard: ${utils.escapeHtml(error.message)}</p></div>`;
        }
    },

    // Navegar a otra sección marcando el menú
    go(page) {
        const link = document.querySelector(`.nav-link[data-page="${page}"]`);
        if (link) link.click();
    }
};
