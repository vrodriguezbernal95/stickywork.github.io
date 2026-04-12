// Super Admin Statistics Module
const superStats = {
    async load() {
        // Update page title
        document.getElementById('pageTitle').textContent = 'Estadísticas';

        try {
            // Fetch stats
            const data = await superApi.get('/api/super-admin/stats');
            const stats = data.data;

            // Render stats page
            const contentArea = document.getElementById('contentArea');
            contentArea.innerHTML = `
                <div class="stats-overview">
                    <h2>Resumen General de la Plataforma</h2>
                    ${this.renderOverviewCards(stats)}
                </div>

                <div class="dashboard-grid">
                    <div class="card">
                        <h3>Crecimiento de Negocios (6 meses)</h3>
                        <div class="chart-container" style="min-height: 300px;">
                            ${this.renderGrowthChart(stats.monthlyGrowth)}
                        </div>
                    </div>

                    <div class="card">
                        <h3>Distribución por Tipo de Negocio</h3>
                        <div class="chart-container" style="min-height: 300px;">
                            ${this.renderTypeDistribution(stats.businessesByType)}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Métricas Detalladas</h3>
                    ${this.renderDetailedMetrics(stats)}
                </div>

                <div class="dashboard-grid">
                    <div class="card">
                        <h3>Estado de Negocios</h3>
                        ${this.renderBusinessStatusChart(stats)}
                    </div>

                    <div class="card">
                        <h3>Actividad de Reservas</h3>
                        ${this.renderBookingsActivity(stats)}
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error loading stats:', error);
            document.getElementById('contentArea').innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar las estadísticas: ${error.message}</p>
                </div>
            `;
        }
    },

    renderOverviewCards(stats) {
        const activePercentage = stats.totalBusinesses > 0
            ? Math.round((stats.activeBusinesses / stats.totalBusinesses) * 100)
            : 0;

        const avgBookingsPerBusiness = stats.activeBusinesses > 0
            ? Math.round(stats.totalBookings / stats.activeBusinesses)
            : 0;

        return `
            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.totalBusinesses || 0}</div>
                        <div class="stat-label">Total Negocios</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #fff; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.activeBusinesses || 0}</div>
                        <div class="stat-label">Negocios Activos</div>
                        <div class="stat-sublabel">${activePercentage}% del total</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #fff; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.newThisMonth || 0}</div>
                        <div class="stat-label">Nuevos Este Mes</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #fff; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.totalBookings || 0}</div>
                        <div class="stat-label">Total Reservas</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: #fff; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
                    <div class="stat-content">
                        <div class="stat-value">${avgBookingsPerBusiness}</div>
                        <div class="stat-label">Promedio/Negocio</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #555; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.unreadMessages || 0}</div>
                        <div class="stat-label">Mensajes Sin Leer</div>
                    </div>
                </div>
            </div>
        `;
    },

    renderGrowthChart(monthlyGrowth) {
        if (!monthlyGrowth || monthlyGrowth.length === 0) {
            return '<p class="empty-state">No hay datos disponibles</p>';
        }

        const maxCount = Math.max(...monthlyGrowth.map(m => m.count), 1);

        const monthNames = {
            '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
            '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
            '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
        };

        return `
            <div class="growth-chart">
                ${monthlyGrowth.map(item => {
                    const [year, month] = item.month.split('-');
                    const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    const monthLabel = monthNames[month] || month;
                    return `
                        <div class="growth-bar">
                            <div class="growth-value">${item.count}</div>
                            <div class="growth-bar-container">
                                <div
                                    class="growth-bar-fill"
                                    style="height: ${percentage}%; background: linear-gradient(180deg, var(--primary-color), var(--secondary-color));"
                                ></div>
                            </div>
                            <div class="growth-label">${monthLabel} ${year}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderTypeDistribution(businessesByType) {
        if (!businessesByType || businessesByType.length === 0) {
            return '<p class="empty-state">No hay datos disponibles</p>';
        }

        const total = businessesByType.reduce((sum, item) => sum + item.count, 0);

        const typeLabels = {
            'spa': 'Spa & Wellness',
            'peluqueria': 'Peluquería',
            'nutricion': 'Nutrición',
            'psicologo': 'Psicología',
            'abogados': 'Abogados',
            'gimnasio': 'Gimnasio',
            'otro': 'Otros'
        };

        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        ];

        return `
            <div class="type-distribution">
                ${businessesByType.map((item, index) => {
                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    const label = typeLabels[item.type] || item.type;
                    return `
                        <div class="distribution-item">
                            <div class="distribution-header">
                                <div class="distribution-label">
                                    <div
                                        class="distribution-color"
                                        style="background: ${colors[index % colors.length]};"
                                    ></div>
                                    <span>${label}</span>
                                </div>
                                <div class="distribution-stats">
                                    <span class="distribution-count">${item.count}</span>
                                    <span class="distribution-percentage">${percentage}%</span>
                                </div>
                            </div>
                            <div class="distribution-bar">
                                <div
                                    class="distribution-bar-fill"
                                    style="width: ${percentage}%; background: ${colors[index % colors.length]};"
                                ></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderDetailedMetrics(stats) {
        const businessesGrowth = stats.newThisMonth || 0;
        const bookingsGrowth = stats.bookingsThisMonth || 0;

        return `
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-header">
                        <h4>Negocios</h4>
                        <span class="metric-icon">🏢</span>
                    </div>
                    <div class="metric-data">
                        <div class="metric-row">
                            <span>Total registrados:</span>
                            <strong>${stats.totalBusinesses || 0}</strong>
                        </div>
                        <div class="metric-row">
                            <span>Activos:</span>
                            <strong class="text-success">${stats.activeBusinesses || 0}</strong>
                        </div>
                        <div class="metric-row">
                            <span>Inactivos:</span>
                            <strong class="text-warning">${stats.inactiveBusinesses || 0}</strong>
                        </div>
                        <div class="metric-row">
                            <span>Nuevos este mes:</span>
                            <strong class="text-primary">+${businessesGrowth}</strong>
                        </div>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-header">
                        <h4>Reservas</h4>
                        <span class="metric-icon">📅</span>
                    </div>
                    <div class="metric-data">
                        <div class="metric-row">
                            <span>Total plataforma:</span>
                            <strong>${stats.totalBookings || 0}</strong>
                        </div>
                        <div class="metric-row">
                            <span>Este mes:</span>
                            <strong class="text-success">${stats.bookingsThisMonth || 0}</strong>
                        </div>
                        <div class="metric-row">
                            <span>Promedio por negocio:</span>
                            <strong>${stats.activeBusinesses > 0
                                ? Math.round(stats.totalBookings / stats.activeBusinesses)
                                : 0}</strong>
                        </div>
                        <div class="metric-row">
                            <span>Crecimiento mensual:</span>
                            <strong class="text-primary">+${bookingsGrowth}</strong>
                        </div>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-header">
                        <h4>Comunicación</h4>
                        <span class="metric-icon">📧</span>
                    </div>
                    <div class="metric-data">
                        <div class="metric-row">
                            <span>Mensajes sin leer:</span>
                            <strong class="text-warning">${stats.unreadMessages || 0}</strong>
                        </div>
                        <div class="metric-row">
                            <span>Requieren atención:</span>
                            <strong>${stats.unreadMessages > 0 ? 'Sí' : 'No'}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderBusinessStatusChart(stats) {
        const activePercentage = stats.totalBusinesses > 0
            ? Math.round((stats.activeBusinesses / stats.totalBusinesses) * 100)
            : 0;

        const inactivePercentage = 100 - activePercentage;

        return `
            <div class="status-chart">
                <div class="status-visual">
                    <svg viewBox="0 0 200 200" style="max-width: 200px; margin: 2rem auto;">
                        <circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill="none"
                            stroke="#2a2f4a"
                            stroke-width="40"
                        />
                        <circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill="none"
                            stroke="url(#activeGradient)"
                            stroke-width="40"
                            stroke-dasharray="${activePercentage * 5.024} 502.4"
                            stroke-dashoffset="125.6"
                            transform="rotate(-90 100 100)"
                        />
                        <defs>
                            <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#11998e;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#38ef7d;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <text x="100" y="100" text-anchor="middle" dy=".3em" fill="var(--text-primary)" font-size="32" font-weight="bold">
                            ${activePercentage}%
                        </text>
                    </svg>
                </div>
                <div class="status-legend">
                    <div class="legend-item">
                        <div class="legend-color" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);"></div>
                        <div class="legend-label">
                            <strong>Activos</strong>
                            <span>${stats.activeBusinesses || 0} negocios (${activePercentage}%)</span>
                        </div>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #2a2f4a;"></div>
                        <div class="legend-label">
                            <strong>Inactivos</strong>
                            <span>${stats.inactiveBusinesses || 0} negocios (${inactivePercentage}%)</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderBookingsActivity(stats) {
        const bookingsThisMonth = stats.bookingsThisMonth || 0;
        const totalBookings = stats.totalBookings || 0;
        const previousMonthsBookings = totalBookings - bookingsThisMonth;

        const monthPercentage = totalBookings > 0
            ? Math.round((bookingsThisMonth / totalBookings) * 100)
            : 0;

        return `
            <div class="bookings-activity">
                <div class="activity-stats">
                    <div class="activity-item">
                        <div class="activity-label">Este mes</div>
                        <div class="activity-value">${bookingsThisMonth}</div>
                        <div class="activity-bar">
                            <div
                                class="activity-bar-fill"
                                style="width: ${monthPercentage}%; background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));"
                            ></div>
                        </div>
                        <div class="activity-percentage">${monthPercentage}% del total</div>
                    </div>

                    <div class="activity-item">
                        <div class="activity-label">Meses anteriores</div>
                        <div class="activity-value">${previousMonthsBookings}</div>
                        <div class="activity-bar">
                            <div
                                class="activity-bar-fill"
                                style="width: ${100 - monthPercentage}%; background: linear-gradient(90deg, #667eea, #764ba2);"
                            ></div>
                        </div>
                        <div class="activity-percentage">${100 - monthPercentage}% del total</div>
                    </div>

                    <div class="activity-summary">
                        <strong>Total de reservas:</strong> ${totalBookings}
                        ${stats.activeBusinesses > 0 ? `
                            <br><strong>Promedio por negocio activo:</strong>
                            ${Math.round(totalBookings / stats.activeBusinesses)} reservas
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
};
