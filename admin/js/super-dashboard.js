// Super Admin Dashboard Module
const superDashboard = {
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

        } catch (error) {
            console.error('Error loading dashboard:', error);
            document.getElementById('contentArea').innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar el dashboard: ${error.message}</p>
                </div>
            `;
        }
    },

    renderStatCards(stats) {
        return `
            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    🏢
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.totalBusinesses || 0}</div>
                    <div class="stat-label">Total Negocios</div>
                    <div class="stat-sublabel">
                        ${stats.activeBusinesses || 0} activos
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    ✨
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.newThisMonth || 0}</div>
                    <div class="stat-label">Nuevos Este Mes</div>
                    <div class="stat-sublabel">
                        Negocios registrados
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    📅
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.totalBookings || 0}</div>
                    <div class="stat-label">Total Reservas</div>
                    <div class="stat-sublabel">
                        ${stats.bookingsThisMonth || 0} este mes
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                    📧
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.unreadMessages || 0}</div>
                    <div class="stat-label">Mensajes Sin Leer</div>
                    <div class="stat-sublabel">
                        Desde formulario contacto
                    </div>
                </div>
            </div>
        `;
    },

    renderBusinessTypeChart(businessesByType) {
        if (!businessesByType || businessesByType.length === 0) {
            return '<p class="empty-state">No hay datos disponibles</p>';
        }

        const maxCount = Math.max(...businessesByType.map(b => b.count));

        const typeLabels = {
            'spa': 'Spa & Wellness',
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
                    const label = typeLabels[item.type] || item.type;
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
