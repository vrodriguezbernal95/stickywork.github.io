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
        // Update page title
        document.getElementById('pageTitle').textContent = 'Dashboard';

        try {
            // Fetch global stats
            const data = await superApi.get('/api/super-admin/stats');
            const stats = data.data;

            // Render dashboard
            const contentArea = document.getElementById('contentArea');
            contentArea.innerHTML = `
                <div id="emailHealth"></div>
                <div class="stats-grid">
                    ${this.renderStatCards(stats)}
                </div>

                <div class="dashboard-grid">
                    <div class="card">
                        <h3>Distribución de Negocios por Tipo</h3>
                        <div class="chart-container">
                            ${this.renderBusinessTypeChart(stats.businessesByType)}
                        </div>
                    </div>

                    <div class="card">
                        <h3>Crecimiento Mensual (últimos 6 meses)</h3>
                        <div class="chart-container">
                            ${this.renderMonthlyGrowthChart(stats.monthlyGrowth)}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Resumen Rápido</h3>
                    ${this.renderQuickSummary(stats)}
                </div>
            `;
            this.loadEmailHealth();

        } catch (error) {
            console.error('Error loading dashboard:', error);
            document.getElementById('contentArea').innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar el dashboard: ${utils.escapeHtml(error.message)}</p>
                </div>
            `;
        }
    },

    renderStatCards(stats) {
        return `
            ${createStatCard({
                icon: '🏢',
                value: stats.totalBusinesses || 0,
                label: 'Total Negocios',
                sublabel: `${stats.activeBusinesses || 0} activos`,
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            })}

            ${createStatCard({
                icon: '✨',
                value: stats.newThisMonth || 0,
                label: 'Nuevos Este Mes',
                sublabel: 'Negocios registrados',
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            })}

            ${createStatCard({
                icon: '📅',
                value: stats.totalBookings || 0,
                label: 'Total Reservas',
                sublabel: `${stats.bookingsThisMonth || 0} este mes`,
                gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            })}

            ${createStatCard({
                icon: '📧',
                value: stats.unreadMessages || 0,
                label: 'Mensajes Sin Leer',
                sublabel: 'Desde formulario contacto',
                gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
            })}
        `;
    },

    renderBusinessTypeChart(businessesByType) {
        if (!businessesByType || businessesByType.length === 0) {
            return '<p class="empty-state">No hay datos disponibles</p>';
        }

        const maxCount = Math.max(...businessesByType.map(b => b.count));

        const typeLabels = {
            'salon': 'Peluquería / Salón',
            'clinic': 'Clínica / Consultorio',
            'restaurant': 'Restaurante / Bar',
            'nutrition': 'Centro de Nutrición',
            'gym': 'Gimnasio',
            'spa': 'Spa / Bienestar',
            'lawyer': 'Despacho de Abogados',
            'other': 'Otro',
            'peluqueria': 'Peluquería',
            'nutricion': 'Nutrición',
            'psicologo': 'Psicología',
            'abogados': 'Abogados',
            'gimnasio': 'Gimnasio',
            'otro': 'Otros'
        };

        return `
            <div class="horizontal-bars">
                ${businessesByType.map(item => {
                    const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    const label = utils.escapeHtml(typeLabels[item.type] || item.type);
                    return `
                        <div class="bar-item">
                            <div class="bar-label">${label}</div>
                            <div class="bar-track">
                                <div class="bar-fill" style="width: ${percentage}%; background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));"></div>
                            </div>
                            <div class="bar-value">${item.count}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderMonthlyGrowthChart(monthlyGrowth) {
        if (!monthlyGrowth || monthlyGrowth.length === 0) {
            return '<p class="empty-state">No hay datos disponibles</p>';
        }

        const maxCount = Math.max(...monthlyGrowth.map(m => m.count));

        const monthNames = {
            '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
            '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
            '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
        };

        return `
            <div class="vertical-bars">
                ${monthlyGrowth.map(item => {
                    const [year, month] = item.month.split('-');
                    const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    const monthLabel = monthNames[month] || month;
                    return `
                        <div class="bar-column">
                            <div class="bar-value">${item.count}</div>
                            <div class="bar-vertical">
                                <div class="bar-vertical-fill" style="height: ${percentage}%; background: linear-gradient(180deg, var(--primary-color), var(--secondary-color));"></div>
                            </div>
                            <div class="bar-month">${monthLabel}<br>${year.slice(2)}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderQuickSummary(stats) {
        const activePercentage = stats.totalBusinesses > 0
            ? Math.round((stats.activeBusinesses / stats.totalBusinesses) * 100)
            : 0;

        const avgBookingsPerBusiness = stats.activeBusinesses > 0
            ? Math.round(stats.totalBookings / stats.activeBusinesses)
            : 0;

        return `
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-icon">📊</div>
                    <div class="summary-content">
                        <div class="summary-value">${activePercentage}%</div>
                        <div class="summary-label">Tasa de Activación</div>
                        <div class="summary-description">
                            ${stats.activeBusinesses} de ${stats.totalBusinesses} negocios activos
                        </div>
                    </div>
                </div>

                <div class="summary-item">
                    <div class="summary-icon">📈</div>
                    <div class="summary-content">
                        <div class="summary-value">${avgBookingsPerBusiness}</div>
                        <div class="summary-label">Promedio Reservas/Negocio</div>
                        <div class="summary-description">
                            ${stats.totalBookings} reservas en ${stats.activeBusinesses} negocios
                        </div>
                    </div>
                </div>

                <div class="summary-item">
                    <div class="summary-icon">🔥</div>
                    <div class="summary-content">
                        <div class="summary-value">${stats.bookingsThisMonth || 0}</div>
                        <div class="summary-label">Reservas Este Mes</div>
                        <div class="summary-description">
                            Actividad actual de la plataforma
                        </div>
                    </div>
                </div>

                <div class="summary-item">
                    <div class="summary-icon">💬</div>
                    <div class="summary-content">
                        <div class="summary-value">${stats.unreadMessages || 0}</div>
                        <div class="summary-label">Mensajes Pendientes</div>
                        <div class="summary-description">
                            Requieren tu atención
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
