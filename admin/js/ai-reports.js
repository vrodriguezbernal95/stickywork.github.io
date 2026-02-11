// AI Reports Module
const aiReports = {
    currentReport: null,
    currentTab: 'reportes',
    businessContext: {},

    async load() {
        // Update page title
        document.getElementById('pageTitle').textContent = 'Reportes IA';

        // Render layout with tabs
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <style>
                .ai-tabs {
                    display: flex;
                    gap: 0;
                    border-bottom: 2px solid var(--border);
                    margin-bottom: 1.5rem;
                }
                .ai-tab {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                    border-bottom: 2px solid transparent;
                    margin-bottom: -2px;
                    transition: all 0.2s;
                }
                .ai-tab:hover {
                    color: var(--text-primary);
                    background: rgba(59, 130, 246, 0.05);
                }
                .ai-tab.active {
                    color: var(--primary);
                    border-bottom-color: var(--primary);
                    font-weight: 600;
                }
                .ai-tab-content {
                    display: none;
                }
                .ai-tab-content.active {
                    display: block;
                }
                .context-cards {
                    display: grid;
                    gap: 1.5rem;
                }
                .context-card {
                    background: var(--card-bg, #fff);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 1.5rem;
                    transition: border-color 0.2s;
                }
                .context-card:hover {
                    border-color: var(--primary);
                }
                .context-card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .context-card-header h4 {
                    margin: 0;
                    font-size: 1rem;
                    color: var(--text-primary);
                }
                .context-card-help {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin-bottom: 0.75rem;
                    line-height: 1.4;
                }
                .context-card textarea {
                    width: 100%;
                    min-height: 80px;
                    padding: 0.75rem;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    font-family: inherit;
                    font-size: 0.9rem;
                    resize: vertical;
                    background: var(--input-bg, #fff);
                    color: var(--text-primary);
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                }
                .context-card textarea:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                .context-card textarea::placeholder {
                    color: var(--text-secondary);
                    opacity: 0.7;
                }
                .context-save-bar {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    align-items: center;
                    margin-top: 1.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--border);
                }
                .context-save-bar .save-status {
                    font-size: 0.9rem;
                    color: var(--success);
                    display: none;
                }
            </style>

            <div class="ai-reports-container">
                <!-- Tabs -->
                <div class="ai-tabs">
                    <button class="ai-tab active" data-tab="reportes" onclick="aiReports.switchTab('reportes')">
                        📊 Reportes
                    </button>
                    <button class="ai-tab" data-tab="mi-negocio" onclick="aiReports.switchTab('mi-negocio')">
                        🏢 Mi Negocio
                    </button>
                </div>

                <!-- Tab: Reportes -->
                <div id="tab-reportes" class="ai-tab-content active">
                    <!-- Header con descripción -->
                    <div class="card" style="margin-bottom: 2rem;">
                        <div class="card-header">
                            <h3>🤖 Reportes Mensuales con Inteligencia Artificial</h3>
                        </div>
                        <div class="card-body">
                            <p style="color: var(--text-secondary); line-height: 1.6;">
                                Los Reportes IA analizan automáticamente el rendimiento de tu negocio cada mes,
                                identificando fortalezas, debilidades, tendencias y oportunidades de mejora.
                                Incluye análisis de encuestas, feedback de clientes y recomendaciones personalizadas.
                            </p>
                        </div>
                    </div>

                    <!-- Generar nuevo reporte -->
                    <div class="card" style="margin-bottom: 2rem;">
                        <div class="card-header">
                            <h3>📊 Generar Nuevo Reporte</h3>
                        </div>
                        <div class="card-body">
                            <div style="display: flex; gap: 1rem; align-items: end; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 150px;">
                                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                                        Mes
                                    </label>
                                    <select id="reportMonth" class="filter-select" style="width: 100%;">
                                        <option value="1">Enero</option>
                                        <option value="2">Febrero</option>
                                        <option value="3">Marzo</option>
                                        <option value="4">Abril</option>
                                        <option value="5">Mayo</option>
                                        <option value="6">Junio</option>
                                        <option value="7">Julio</option>
                                        <option value="8">Agosto</option>
                                        <option value="9">Septiembre</option>
                                        <option value="10">Octubre</option>
                                        <option value="11">Noviembre</option>
                                        <option value="12">Diciembre</option>
                                    </select>
                                </div>

                                <div style="flex: 1; min-width: 150px;">
                                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                                        Año
                                    </label>
                                    <select id="reportYear" class="filter-select" style="width: 100%;">
                                        ${this.getYearOptions()}
                                    </select>
                                </div>

                                <button
                                    onclick="aiReports.generateReport()"
                                    class="btn-primary"
                                    style="padding: 0.75rem 2rem;"
                                >
                                    🤖 Generar Reporte
                                </button>
                            </div>

                            <div id="generationStatus" style="margin-top: 1rem; display: none;">
                                <!-- Status messages will appear here -->
                            </div>
                        </div>
                    </div>

                    <!-- Área de reporte generado -->
                    <div id="reportDisplay" style="display: none;">
                        <!-- El reporte se mostrará aquí -->
                    </div>

                    <!-- Histórico de reportes -->
                    <div class="card">
                        <div class="card-header">
                            <h3>📚 Histórico de Reportes</h3>
                        </div>
                        <div id="reportsHistory">
                            <div class="loading" style="padding: 2rem;">
                                Cargando histórico...
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab: Mi Negocio -->
                <div id="tab-mi-negocio" class="ai-tab-content">
                    <div class="card" style="margin-bottom: 1.5rem;">
                        <div class="card-header">
                            <h3>🏢 Contexto de Mi Negocio</h3>
                        </div>
                        <div class="card-body">
                            <p style="color: var(--text-secondary); line-height: 1.6;">
                                Describe tu negocio para que la IA genere reportes mucho más personalizados y
                                relevantes. Cuanta más información proporciones, mejor serán las recomendaciones
                                y el análisis. Todos los campos son opcionales.
                            </p>
                        </div>
                    </div>

                    <div class="context-cards" id="contextCards">
                        <div class="loading" style="padding: 2rem;">Cargando...</div>
                    </div>
                </div>
            </div>
        `;

        // Set current month and year by default
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        document.getElementById('reportMonth').value = lastMonth.getMonth() + 1;
        document.getElementById('reportYear').value = lastMonth.getFullYear();

        // Load reports history
        await this.loadReportsHistory();
    },

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.ai-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update tab content
        document.querySelectorAll('.ai-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tab}`);
        });

        // Load context data when switching to Mi Negocio tab
        if (tab === 'mi-negocio') {
            this.loadBusinessContext();
        }
    },

    async loadBusinessContext() {
        const container = document.getElementById('contextCards');
        if (!container) return;

        try {
            const businessId = auth.getBusinessId();
            if (!businessId) {
                container.innerHTML = '<p style="color: var(--text-secondary); padding: 1rem;">No se pudo obtener el ID del negocio.</p>';
                return;
            }

            const data = await api.get(`/api/businesses/${businessId}/business-context`);
            this.businessContext = data.data || {};

            this.renderContextForm();

        } catch (error) {
            console.error('Error loading business context:', error);
            // Si la columna no existe aún, mostrar formulario vacío igualmente
            this.businessContext = {};
            this.renderContextForm();
        }
    },

    renderContextForm() {
        const container = document.getElementById('contextCards');
        if (!container) return;

        const fields = [
            {
                key: 'description',
                icon: '📋',
                title: 'Describe tu negocio',
                help: '¿Qué hace tu negocio? ¿Cuánto tiempo lleváis? ¿Dónde estáis ubicados?',
                placeholder: 'Ej: Somos una peluquería familiar en el centro de Madrid con 15 años de experiencia...'
            },
            {
                key: 'differentiators',
                icon: '⭐',
                title: '¿Qué os diferencia?',
                help: '¿Qué os hace diferentes de la competencia? ¿Cuál es vuestro punto fuerte?',
                placeholder: 'Ej: Nos diferenciamos por el trato personalizado y usamos productos ecológicos...'
            },
            {
                key: 'services',
                icon: '🛠️',
                title: 'Servicios principales',
                help: '¿Qué servicios ofrecéis? ¿Cuáles son los más populares o rentables?',
                placeholder: 'Ej: Ofrecemos cortes, coloración, tratamientos capilares. El más popular es la coloración...'
            },
            {
                key: 'perception',
                icon: '📈',
                title: '¿Cómo percibes que va el negocio?',
                help: '¿Estás contento con cómo van las cosas? ¿Notas mejora o empeoramiento?',
                placeholder: 'Ej: Creo que vamos bien pero podríamos mejorar en captación de nuevos clientes...'
            },
            {
                key: 'challenges',
                icon: '🔧',
                title: 'Problemas y retos',
                help: '¿Qué dificultades o dudas tienes actualmente? ¿Qué te preocupa?',
                placeholder: 'Ej: Tenemos muchas cancelaciones de última hora y nos cuesta fidelizar clientes nuevos...'
            },
            {
                key: 'target_audience',
                icon: '👥',
                title: 'Público objetivo',
                help: '¿Quiénes son tus clientes principales? ¿A qué perfil de cliente te diriges?',
                placeholder: 'Ej: Mujeres de 25-55 años del barrio, también familias con niños los fines de semana...'
            },
            {
                key: 'goals',
                icon: '🎯',
                title: 'Objetivos',
                help: '¿Qué quieres lograr en los próximos meses? ¿Qué te gustaría mejorar?',
                placeholder: 'Ej: Queremos aumentar la clientela un 20%, abrir los domingos y lanzar packs de servicios...'
            }
        ];

        container.innerHTML = fields.map(field => `
            <div class="context-card">
                <div class="context-card-header">
                    <span style="font-size: 1.2rem;">${field.icon}</span>
                    <h4>${field.title}</h4>
                </div>
                <p class="context-card-help">${field.help}</p>
                <textarea
                    id="context-${field.key}"
                    placeholder="${field.placeholder}"
                    maxlength="2000"
                >${this.businessContext[field.key] || ''}</textarea>
            </div>
        `).join('') + `
            <div class="context-save-bar">
                <span class="save-status" id="contextSaveStatus">Guardado correctamente</span>
                <button onclick="aiReports.saveBusinessContext()" class="btn-primary" style="padding: 0.75rem 2rem;" id="btnSaveContext">
                    💾 Guardar
                </button>
            </div>
        `;
    },

    async saveBusinessContext() {
        const btn = document.getElementById('btnSaveContext');
        const statusEl = document.getElementById('contextSaveStatus');

        const fields = ['description', 'differentiators', 'services', 'perception', 'challenges', 'target_audience', 'goals'];
        const context = {};

        for (const field of fields) {
            const textarea = document.getElementById(`context-${field}`);
            if (textarea) {
                context[field] = textarea.value.trim();
            }
        }

        btn.disabled = true;
        btn.textContent = 'Guardando...';

        try {
            const businessId = auth.getBusinessId();
            await api.patch(`/api/businesses/${businessId}/business-context`, context);

            this.businessContext = context;

            statusEl.style.display = 'inline';
            statusEl.style.color = 'var(--success)';
            statusEl.textContent = 'Guardado correctamente';

            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);

        } catch (error) {
            console.error('Error saving business context:', error);
            statusEl.style.display = 'inline';
            statusEl.style.color = 'var(--danger)';
            statusEl.textContent = 'Error al guardar: ' + (error.message || 'Intenta de nuevo');

            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        } finally {
            btn.disabled = false;
            btn.textContent = '💾 Guardar';
        }
    },

    getYearOptions() {
        const currentYear = new Date().getFullYear();
        const years = [];

        // Show last 3 years
        for (let i = 0; i < 3; i++) {
            const year = currentYear - i;
            years.push(`<option value="${year}">${year}</option>`);
        }

        return years.join('');
    },

    async loadReportsHistory() {
        const historyContainer = document.getElementById('reportsHistory');

        try {
            const data = await api.get('/api/reports/history');

            if (!data.data || data.data.length === 0) {
                historyContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No hay reportes generados aún</p>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            Genera tu primer reporte mensual usando el formulario de arriba
                        </p>
                    </div>
                `;
                return;
            }

            historyContainer.innerHTML = `
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Período</th>
                                <th>Generado</th>
                                <th>Modelo IA</th>
                                <th style="text-align: center;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.data.map(report => this.renderReportRow(report)).join('')}
                        </tbody>
                    </table>
                </div>
            `;

        } catch (error) {
            console.error('Error loading reports history:', error);
            historyContainer.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar el histórico de reportes</p>
                </div>
            `;
        }
    },

    renderReportRow(report) {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        const generatedDate = new Date(report.generated_at);
        const formattedDate = generatedDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <tr>
                <td>
                    <strong>${monthNames[report.month - 1]} ${report.year}</strong>
                </td>
                <td>${formattedDate}</td>
                <td>
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">
                        ${report.generated_by || 'Claude Sonnet 4'}
                    </span>
                </td>
                <td style="text-align: center; white-space: nowrap;">
                    <button
                        onclick="aiReports.viewReport(${report.id})"
                        class="btn-icon"
                        title="Ver reporte"
                        style="font-size: 1.2rem;"
                    >
                        👁️
                    </button>
                    <button
                        onclick="aiReports.downloadPDF(${report.id})"
                        class="btn-icon"
                        title="Descargar PDF"
                        style="font-size: 1.2rem;"
                    >
                        📄
                    </button>
                    <button
                        onclick="aiReports.deleteReport(${report.id}, '${monthNames[report.month - 1]} ${report.year}')"
                        class="btn-icon"
                        title="Eliminar reporte"
                        style="font-size: 1.2rem;"
                    >
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    },

    async generateReport() {
        const month = document.getElementById('reportMonth').value;
        const year = document.getElementById('reportYear').value;
        const statusDiv = document.getElementById('generationStatus');
        const generateBtn = event.target;

        // Show loading status
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `
            <div class="loading" style="padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                <p style="margin: 0; color: var(--primary);">
                    🤖 Generando reporte con IA... Esto puede tomar 10-30 segundos
                </p>
            </div>
        `;
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generando...';

        try {
            const data = await api.post('/api/reports/generate', { month, year });

            if (data.success) {
                statusDiv.innerHTML = `
                    <div style="padding: 1rem; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border-left: 4px solid var(--success);">
                        <p style="margin: 0; color: var(--success); font-weight: 600;">
                            ✅ Reporte generado exitosamente
                        </p>
                    </div>
                `;

                // Show the report
                await this.viewReport(data.data.reportId);

                // Reload history
                await this.loadReportsHistory();

                // Hide status after 3 seconds
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 3000);
            }

        } catch (error) {
            console.error('Error generating report:', error);
            statusDiv.innerHTML = `
                <div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 4px solid var(--danger);">
                    <p style="margin: 0; color: var(--danger); font-weight: 600;">
                        ⚠️ Error al generar el reporte
                    </p>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: var(--text-secondary);">
                        ${error.message || 'Intenta nuevamente en unos momentos'}
                    </p>
                </div>
            `;
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '🤖 Generar Reporte';
        }
    },

    async viewReport(reportId) {
        const reportDisplay = document.getElementById('reportDisplay');
        reportDisplay.style.display = 'block';
        reportDisplay.innerHTML = '<div class="loading">Cargando reporte...</div>';

        try {
            const data = await api.get(`/api/reports/${reportId}`);
            const report = data.data;

            // Renderizar reporte completo
            reportDisplay.innerHTML = this.renderFullReport(report);

            // Scroll to report
            reportDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error('Error loading report:', error);
            reportDisplay.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar el reporte</p>
                </div>
            `;
        }
    },

    renderFullReport(report) {
        const stats = report.stats;
        const completionRate = stats.totalBookings > 0
            ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
            : 0;
        const cancellationRate = stats.totalBookings > 0
            ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100)
            : 0;

        return `
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <h2 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                            <span>🤖</span>
                            <span>Reporte IA - ${this.getMonthName(report.month)} ${report.year}</span>
                        </h2>
                        <div style="display: flex; gap: 0.5rem;">
                            <button
                                onclick="aiReports.downloadPDF(${report.id})"
                                class="btn-secondary"
                                style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);"
                            >
                                📄 Descargar PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div class="card-body">
                    <!-- Estadísticas clave -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                        <div class="stat-card-small">
                            <div class="stat-value">${stats.totalBookings || 0}</div>
                            <div class="stat-label">Total Reservas</div>
                        </div>
                        <div class="stat-card-small">
                            <div class="stat-value" style="color: var(--success);">${stats.completedBookings || 0}</div>
                            <div class="stat-label">Completadas</div>
                        </div>
                        <div class="stat-card-small">
                            <div class="stat-value" style="color: var(--danger);">${stats.cancelledBookings || 0}</div>
                            <div class="stat-label">Canceladas</div>
                        </div>
                        <div class="stat-card-small">
                            <div class="stat-value">${completionRate}%</div>
                            <div class="stat-label">Tasa de Éxito</div>
                        </div>
                    </div>

                    <!-- Resumen Ejecutivo -->
                    <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border-left: 4px solid #667eea;">
                        <h3 style="margin-top: 0; display: flex; align-items: center; gap: 0.5rem;">
                            <span>📊</span>
                            <span>Resumen Ejecutivo</span>
                        </h3>
                        <p style="line-height: 1.8; margin: 0; white-space: pre-line;">${report.ai_executive_summary || 'No disponible'}</p>
                    </div>

                    <!-- Insights Clave -->
                    <div style="margin-bottom: 2rem;">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>💡</span>
                            <span>Insights Clave</span>
                        </h3>
                        <div style="display: grid; gap: 1rem;">
                            ${report.ai_insights.map((insight, i) => `
                                <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 8px; border-left: 3px solid #3b82f6;">
                                    <strong style="color: #3b82f6;">${i + 1}.</strong> ${insight}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Fortalezas y Debilidades -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
                        <!-- Fortalezas -->
                        <div>
                            <h3 style="display: flex; align-items: center; gap: 0.5rem; color: var(--success);">
                                <span>✅</span>
                                <span>Fortalezas</span>
                            </h3>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                ${report.ai_strengths.map(strength => `
                                    <li style="background: rgba(34, 197, 94, 0.1); padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 0.5rem; border-left: 3px solid var(--success);">
                                        ${strength}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>

                        <!-- Debilidades -->
                        <div>
                            <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #f59e0b;">
                                <span>⚠️</span>
                                <span>Áreas de Mejora</span>
                            </h3>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                ${report.ai_weaknesses.map(weakness => `
                                    <li style="background: rgba(245, 158, 11, 0.1); padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 0.5rem; border-left: 3px solid #f59e0b;">
                                        ${weakness}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>

                    <!-- Análisis de Feedback -->
                    ${report.ai_feedback_analysis ? `
                        <div style="background: rgba(139, 92, 246, 0.1); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border-left: 4px solid #8b5cf6;">
                            <h3 style="margin-top: 0; display: flex; align-items: center; gap: 0.5rem;">
                                <span>💬</span>
                                <span>Análisis de Feedback de Clientes</span>
                            </h3>
                            <p style="line-height: 1.8; margin: 0; white-space: pre-line;">${report.ai_feedback_analysis}</p>
                        </div>
                    ` : ''}

                    <!-- Recomendaciones -->
                    <div style="margin-bottom: 2rem;">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>🎯</span>
                            <span>Recomendaciones</span>
                        </h3>
                        <div style="display: grid; gap: 1rem;">
                            ${report.ai_recommendations.map((rec, i) => `
                                <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; border-left: 3px solid #10b981;">
                                    <strong style="color: #10b981;">${i + 1}.</strong> ${rec}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Impacto Económico -->
                    ${report.ai_economic_impact ? `
                        <div style="background: rgba(34, 197, 94, 0.1); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border-left: 4px solid var(--success);">
                            <h3 style="margin-top: 0; display: flex; align-items: center; gap: 0.5rem;">
                                <span>💰</span>
                                <span>Impacto Económico</span>
                            </h3>
                            <p style="line-height: 1.8; margin: 0; white-space: pre-line;">${report.ai_economic_impact}</p>
                        </div>
                    ` : ''}

                    <!-- Plan de Acción -->
                    <div>
                        <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>📋</span>
                            <span>Plan de Acción</span>
                        </h3>
                        <div style="display: grid; gap: 1rem;">
                            ${report.ai_action_plan.map(action => {
                                const priorityColors = {
                                    'Alta': { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#ef4444' },
                                    'Media': { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#f59e0b' },
                                    'Baja': { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#3b82f6' }
                                };
                                const colors = priorityColors[action.priority] || priorityColors['Media'];

                                return `
                                    <div style="background: ${colors.bg}; padding: 1rem; border-radius: 8px; border-left: 3px solid ${colors.border};">
                                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                            <span style="background: ${colors.border}; color: white; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600;">
                                                ${action.priority}
                                            </span>
                                            <strong>${action.action}</strong>
                                        </div>
                                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                            <strong>Impacto esperado:</strong> ${action.expectedImpact}
                                        </p>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Metadatos del reporte -->
                    <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
                        <div>
                            <strong>Generado:</strong> ${new Date(report.generated_at).toLocaleString('es-ES')}
                        </div>
                        <div>
                            <strong>Modelo:</strong> ${report.generated_by || 'Claude Sonnet 4'}
                        </div>
                        ${report.tokens_used ? `
                            <div>
                                <strong>Tokens usados:</strong> ${report.tokens_used.toLocaleString()}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    async downloadPDF(reportId) {
        try {
            // Obtener el token de autenticación
            const token = api.getToken();

            // Abrir el PDF en una nueva ventana
            const pdfUrl = `${api.baseURL}/api/reports/${reportId}/pdf`;

            // Crear un enlace temporal para descargar
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.target = '_blank';

            // Añadir el token en el header usando fetch y blob
            const response = await fetch(pdfUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al generar PDF');
            }

            // Convertir a blob y descargar
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            link.href = blobUrl;
            link.download = `Reporte_IA_${reportId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Liberar el objeto URL
            window.URL.revokeObjectURL(blobUrl);

            // Recargar el histórico para actualizar el estado de pdf_generated
            await this.loadReportsHistory();

        } catch (error) {
            console.error('Error downloading PDF:', error);
            this.showNotification('Error al descargar el PDF', 'error');
        }
    },

    async deleteReport(reportId, reportPeriod) {
        if (!confirm(`¿Estás seguro de que quieres eliminar el reporte de ${reportPeriod}?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const data = await api.delete(`/api/reports/${reportId}`);

            if (data.success) {
                // Mostrar notificación de éxito
                this.showNotification(data.message, 'success');

                // Recargar histórico
                await this.loadReportsHistory();

                // Ocultar el display del reporte si está visible
                const reportDisplay = document.getElementById('reportDisplay');
                if (reportDisplay) {
                    reportDisplay.style.display = 'none';
                }
            }

        } catch (error) {
            console.error('Error al eliminar reporte:', error);
            this.showNotification('Error al eliminar el reporte: ' + error.message, 'error');
        }
    },

    showNotification(message, type = 'info') {
        const statusDiv = document.getElementById('generationStatus');

        const colors = {
            success: { bg: 'rgba(34, 197, 94, 0.1)', border: 'var(--success)', text: 'var(--success)' },
            error: { bg: 'rgba(239, 68, 68, 0.1)', border: 'var(--danger)', text: 'var(--danger)' },
            info: { bg: 'rgba(59, 130, 246, 0.1)', border: 'var(--primary)', text: 'var(--primary)' }
        };

        const color = colors[type] || colors.info;

        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `
            <div style="padding: 1rem; background: ${color.bg}; border-radius: 8px; border-left: 4px solid ${color.border};">
                <p style="margin: 0; color: ${color.text}; font-weight: 600;">
                    ${message}
                </p>
            </div>
        `;

        // Auto-ocultar después de 4 segundos
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 4000);
    },

    getMonthName(month) {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return monthNames[month - 1];
    }
};

// Export
window.aiReports = aiReports;
