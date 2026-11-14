// Opiniones Module (sección del panel: app.navigateTo('opiniones'))
(function () {
    let currentFilters = {
        rating: '',
        period: ''
    };

    // Cargar feedbacks pendientes de enviar
    async function loadPendingFeedbacks() {
        const container = document.getElementById('pendingFeedbackContainer');
        if (!container) return;

        try {
            const businessId = auth.getBusinessId();
            const response = await api.get(`/api/admin/feedback/pending/${businessId}`);

            if (response.success) {
                const pendingList = response.data;

                if (pendingList.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state-small">
                            <span style="font-size: 24px">✅</span>
                            <p style="margin: 0.5rem 0 0 0; color: #10b981; font-weight: 500;">
                                ¡Todo al día! No hay solicitudes de feedback pendientes.
                            </p>
                        </div>
                    `;
                    return;
                }

                // Mostrar badge con número de pendientes
                const badge = document.getElementById('pendingCount');
                if (badge) {
                    badge.textContent = pendingList.length;
                    badge.style.display = 'inline-block';
                }

                container.innerHTML = `
                    <div class="pending-feedback-header">
                        <h3>📝 Solicitudes Pendientes (${pendingList.length})</h3>
                        <p style="margin: 0.5rem 0; color: #666;">Clientes que completaron su servicio hace 24h y están esperando tu solicitud de opinión</p>
                    </div>
                    <div class="pending-feedback-list"></div>
                `;

                const listContainer = container.querySelector('.pending-feedback-list');

                pendingList.forEach(pending => {
                    const card = createPendingCard(pending);
                    listContainer.appendChild(card);
                });
            }
        } catch (error) {
            console.error('Error al cargar feedbacks pendientes:', error);
            container.innerHTML = `
                <div class="empty-state-small">
                    <span style="font-size: 24px">⚠️</span>
                    <p style="margin: 0.5rem 0 0 0; color: #ef4444;">Error al cargar solicitudes pendientes</p>
                </div>
            `;
        }
    }

    // Crear tarjeta de feedback pendiente
    function createPendingCard(pending) {
        const card = document.createElement('div');
        card.className = 'pending-feedback-card';

        const bookingDate = new Date(pending.booking_date);
        const dateStr = bookingDate.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });

        const daysAgo = pending.days_ago;
        const daysText = daysAgo === 1 ? 'ayer' : `hace ${daysAgo} días`;

        card.innerHTML = `
            <div class="pending-info">
                <h4>${utils.escapeHtml(pending.customer_name)}</h4>
                <p class="pending-meta">
                    ${utils.escapeHtml(pending.service_name || 'Servicio')} • ${dateStr} (${daysText})
                </p>
                ${pending.customer_phone ? `<p class="pending-phone">📱 ${utils.escapeHtml(pending.customer_phone)}</p>` : ''}
            </div>
            <button class="btn-send-feedback" onclick="opiniones.sendFeedbackWhatsApp(${Number(pending.id)}, this.dataset.name, this.dataset.phone, this.dataset.service, this.dataset.token)" data-name="${utils.escapeHtml(pending.customer_name)}" data-phone="${utils.escapeHtml(pending.customer_phone)}" data-service="${utils.escapeHtml(pending.service_name || '')}" data-token="${utils.escapeHtml(pending.feedback_token)}">
                💬 Solicitar Opinión
            </button>
        `;

        return card;
    }

    // Enviar solicitud de feedback por WhatsApp
    async function sendFeedbackWhatsApp(bookingId, customerName, customerPhone, serviceName, feedbackToken) {
        try {
            const businessId = auth.getBusinessId();

            // Obtener configuración de WhatsApp del negocio
            const businessResponse = await api.get(`/api/business/${businessId}`);
            if (!businessResponse.success) {
                alert('Error al obtener datos del negocio');
                return;
            }

            const business = businessResponse.data;

            // Verificar que WhatsApp esté configurado
            if (!business.whatsapp_enabled || !business.whatsapp_number) {
                alert('⚠️ Debes configurar WhatsApp primero en Configuración → Notificaciones');
                return;
            }

            if (!customerPhone) {
                alert('⚠️ Este cliente no tiene número de teléfono registrado');
                return;
            }

            // Generar URL de feedback
            const feedbackUrl = `https://stickywork.com/feedback.html?token=${feedbackToken}`;

            // Crear mensaje personalizado
            const message = `Hola ${customerName}! 👋

    ¿Qué tal tu ${serviceName} en ${business.name}?

    Tu opinión nos ayuda a mejorar. Solo te tomará 1 minuto:
    ${feedbackUrl}

    ¡Gracias!
    ${business.name}`;

            // Limpiar número de teléfono (solo dígitos)
            let cleanPhone = customerPhone.replace(/\D/g, '');

            // Si el número tiene 9 dígitos y no empieza con código de país, añadir +34 (España)
            if (cleanPhone.length === 9) {
                cleanPhone = '34' + cleanPhone;
            }
            // Si empieza con 6, 7, 8 o 9 (números españoles sin código), añadir 34
            else if (cleanPhone.length === 9 && /^[6-9]/.test(cleanPhone)) {
                cleanPhone = '34' + cleanPhone;
            }

            console.log('📱 Número original:', customerPhone);
            console.log('📱 Número limpio:', cleanPhone);

            // Abrir WhatsApp Web
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

            // Marcar como enviado
            const markResponse = await api.post(`/api/admin/feedback/mark-sent/${bookingId}`);

            if (markResponse.success) {
                alert('✅ Solicitud marcada como enviada');
                // Recargar lista
                await loadPendingFeedbacks();
            }

        } catch (error) {
            console.error('Error al enviar feedback por WhatsApp:', error);
            alert('❌ Error al enviar solicitud. Inténtalo de nuevo.');
        }
    }

    // Cargar estadísticas
    async function loadStats() {
        try {
            const businessId = auth.getBusinessId();
            const response = await api.get(`/api/admin/feedback/stats/${businessId}`);

            if (response.success) {
                const stats = response.data;

                // Rating promedio con estrellas
                const avgRating = parseFloat(stats.averageRating);
                const stars = '⭐'.repeat(Math.round(avgRating));
                document.getElementById('averageRating').textContent = `${stars} ${avgRating}`;

                // Total opiniones
                document.getElementById('totalFeedback').textContent = stats.total;

                // Últimos 7 días
                document.getElementById('recentFeedback').textContent = `+${stats.recentCount}`;
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    }

    // Cargar lista de feedbacks
    async function loadFeedbacks() {
        const container = document.getElementById('feedbackContainer');
        container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

        try {
            const businessId = auth.getBusinessId();

            // Construir query params
            const params = new URLSearchParams();
            if (currentFilters.rating) {
                params.append('rating', currentFilters.rating);
            }
            if (currentFilters.period) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - parseInt(currentFilters.period));
                params.append('startDate', startDate.toISOString());
            }

            const response = await api.get(`/api/admin/feedback/${businessId}?${params.toString()}`);

            if (response.success) {
                const feedbacks = response.data;

                if (feedbacks.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">📭</div>
                            <h3>No hay opiniones aún</h3>
                            <p>Cuando tus clientes dejen opiniones, aparecerán aquí.</p>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = `<div class="feedback-list"></div>`;
                const listContainer = container.querySelector('.feedback-list');

                feedbacks.forEach(feedback => {
                    const feedbackCard = createFeedbackCard(feedback);
                    listContainer.appendChild(feedbackCard);
                });
            }
        } catch (error) {
            console.error('Error al cargar opiniones:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <h3>Error al cargar opiniones</h3>
                    <p>Por favor, intenta recargar la página.</p>
                </div>
            `;
        }
    }

    // Crear tarjeta de feedback
    function createFeedbackCard(feedback) {
        const card = document.createElement('div');
        card.className = 'feedback-card';

        const stars = '⭐'.repeat(feedback.rating);
        const date = new Date(feedback.created_at);
        const dateStr = date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Construir HTML de preguntas adicionales con estructura mejorada
        let questionsHTML = '';
        if (feedback.questions) {
            const questions = feedback.questions;
            const questionItems = [];

            // Mapeo de IDs a etiquetas legibles (fallback para datos antiguos)
            const questionLabels = {
                'q1': '¿Cómo calificarías nuestro servicio?',
                'q2': '¿Qué podríamos mejorar?',
                'q3': 'Pregunta 3',
                'q4': 'Pregunta 4',
                'q5': 'Pregunta 5',
                'cleanliness': 'Limpieza',
                'punctuality': 'Puntualidad',
                'wouldRecommend': 'Recomendaría'
            };

            // Recorrer todas las respuestas del objeto questions
            Object.keys(questions).forEach(key => {
                const item = questions[key];

                // Nuevo formato estructurado: { question, type, answer }
                if (item && typeof item === 'object' && item.question && item.answer !== null && item.answer !== undefined && item.answer !== '') {
                    const questionText = item.question;
                    const answerValue = item.answer;
                    const type = item.type;

                    // Renderizar según el tipo
                    if (type === 'rating' && typeof answerValue === 'number') {
                        questionItems.push(`
                            <div class="question-item-structured">
                                <div class="question-text">❓ ${questionText}</div>
                                <div class="answer-rating">${'⭐'.repeat(answerValue)} (${answerValue}/5)</div>
                            </div>
                        `);
                    } else if (type === 'multiple_choice') {
                        questionItems.push(`
                            <div class="question-item-structured">
                                <div class="question-text">❓ ${questionText}</div>
                                <div class="answer-choice">✓ ${answerValue}</div>
                            </div>
                        `);
                    } else if (type === 'text' && answerValue.trim() !== '') {
                        questionItems.push(`
                            <div class="question-item-structured">
                                <div class="question-text">❓ ${questionText}</div>
                                <div class="answer-text">"${answerValue}"</div>
                            </div>
                        `);
                    }
                }
                // Formato antiguo (compatibilidad hacia atrás)
                else {
                    const value = item;

                    // Saltar valores nulos o vacíos
                    if (value === null || value === undefined || value === '') {
                        return;
                    }

                    const label = questionLabels[key] || key;

                    // Determinar tipo de respuesta
                    if (typeof value === 'number' && value >= 1 && value <= 5) {
                        // Rating (estrellas)
                        questionItems.push(`
                            <div class="question-item">
                                <span class="question-label">${utils.escapeHtml(label)}:</span>
                                <span class="question-value">${'⭐'.repeat(value)}</span>
                            </div>
                        `);
                    } else if (typeof value === 'boolean') {
                        // Sí/No
                        questionItems.push(`
                            <div class="question-item">
                                <span class="question-label">${utils.escapeHtml(label)}:</span>
                                <span style="color: ${value ? '#10b981' : '#ef4444'}; font-weight: 600;">
                                    ${value ? '✓ Sí' : '✗ No'}
                                </span>
                            </div>
                        `);
                    } else if (typeof value === 'string' && value.trim() !== '') {
                        // Texto libre
                        questionItems.push(`
                            <div class="question-item">
                                <span class="question-label">${utils.escapeHtml(label)}:</span>
                                <div class="question-text-response">"${value}"</div>
                            </div>
                        `);
                    }
                }
            });

            if (questionItems.length > 0) {
                questionsHTML = `
                    <div class="feedback-questions-structured">
                        ${questionItems.join('')}
                    </div>
                `;
            }
        }

        card.innerHTML = `
            <div class="feedback-header">
                <div class="feedback-customer">
                    <h3>${utils.escapeHtml(feedback.customer_name || 'Cliente Anónimo')}</h3>
                    <div class="feedback-meta">
                        ${dateStr} • ${timeStr}
                        ${feedback.customer_email ? `• ${utils.escapeHtml(feedback.customer_email)}` : ''}
                    </div>
                    ${feedback.service_name ? `
                        <span class="feedback-service">📋 ${utils.escapeHtml(feedback.service_name)}</span>
                    ` : ''}
                </div>
                <div class="feedback-stars">${stars}</div>
            </div>

            ${feedback.comment ? `
                <div class="question-item-structured">
                    <div class="question-text">💬 ¿Algo más que quieras comentar?</div>
                    <div class="answer-text">"${utils.escapeHtml(feedback.comment)}"</div>
                </div>
            ` : ''}

            ${questionsHTML}
        `;

        return card;
    }

    // Formatear rating para mostrar
    function formatRating(rating) {
        return '⭐'.repeat(rating);
    }

    const TEMPLATE = `
            <!-- Feedbacks Pendientes -->
            <div class="pending-feedback-section">
                <div id="pendingFeedbackContainer">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        
            <!-- Estadísticas -->
            <div class="stats-grid" id="statsGrid">
                <div class="stat-card">
                    <div class="stat-label">Rating Promedio</div>
                    <div class="stat-value star-rating" id="averageRating">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Opiniones</div>
                    <div class="stat-value" id="totalFeedback">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Últimos 7 días</div>
                    <div class="stat-value" id="recentFeedback">-</div>
                </div>
            </div>
        
            <!-- Filtros -->
            <div class="filters-section">
                <h3>Filtros</h3>
                <div class="filters-grid">
                    <div class="filter-group">
                        <label for="filterRating">Calificación</label>
                        <select id="filterRating">
                            <option value="">Todas</option>
                            <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                            <option value="4">⭐⭐⭐⭐ (4)</option>
                            <option value="3">⭐⭐⭐ (3)</option>
                            <option value="2">⭐⭐ (2)</option>
                            <option value="1">⭐ (1)</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="filterPeriod">Período</label>
                        <select id="filterPeriod">
                            <option value="">Todo el tiempo</option>
                            <option value="7">Última semana</option>
                            <option value="30">Último mes</option>
                            <option value="90">Últimos 3 meses</option>
                        </select>
                    </div>
                </div>
            </div>
        
            <!-- Lista de opiniones -->
            <div id="feedbackContainer">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
            </div>
        
    `;

    async function load() {
        document.getElementById('pageTitle').textContent = 'Opiniones';
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `<div class="opiniones-section">${TEMPLATE}</div>`;

        currentFilters = { rating: '', period: '' };
        document.getElementById('filterRating').addEventListener('change', (e) => {
            currentFilters.rating = e.target.value;
            loadFeedbacks();
        });
        document.getElementById('filterPeriod').addEventListener('change', (e) => {
            currentFilters.period = e.target.value;
            loadFeedbacks();
        });

        await Promise.all([loadPendingFeedbacks(), loadStats(), loadFeedbacks()]);
    }

    window.opiniones = {
        load,
        sendFeedbackWhatsApp,
        loadPendingFeedbacks,
        loadStats,
        loadFeedbacks
    };

    // Estilos de la sección (limitados a .opiniones-section para no chocar con otros módulos)
    const style = document.createElement('style');
    style.textContent = `
        .opiniones-section .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .opiniones-section .stat-card {
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            transition: transform 0.2s ease;
        }

        .opiniones-section .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .opiniones-section .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--primary-color);
            margin: 0.5rem 0;
        }

        .opiniones-section .stat-label {
            font-size: 0.95rem;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .opiniones-section .star-rating {
            color: #fbbf24;
            font-size: 1.8rem;
        }

        .opiniones-section .filters-section {
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .opiniones-section .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }

        .opiniones-section .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .opiniones-section .filter-group label {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-secondary);
        }

        .filter-group select,
        .opiniones-section .filter-group input {
            padding: 0.6rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-size: 0.95rem;
        }

        .opiniones-section .feedback-list {
            display: grid;
            gap: 1.5rem;
        }

        .opiniones-section .feedback-card {
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.2s ease;
        }

        .opiniones-section .feedback-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .opiniones-section .feedback-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .opiniones-section .feedback-customer {
            flex: 1;
        }

        .opiniones-section .feedback-customer h3 {
            font-size: 1.1rem;
            color: var(--text-primary);
            margin-bottom: 0.3rem;
        }

        .opiniones-section .feedback-meta {
            font-size: 0.85rem;
            color: var(--text-secondary);
        }

        .opiniones-section .feedback-stars {
            color: #fbbf24;
            font-size: 1.5rem;
        }

        .opiniones-section .feedback-service {
            display: inline-block;
            background: var(--bg-secondary);
            padding: 0.3rem 0.8rem;
            border-radius: 6px;
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin: 0.5rem 0;
        }

        .opiniones-section .feedback-comment {
            color: #1f2937;
            line-height: 1.6;
            margin: 1rem 0;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            font-style: italic;
        }

        .opiniones-section .feedback-questions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border-color);
        }

        .opiniones-section .question-item {
            font-size: 0.9rem;
        }

        .opiniones-section .question-label {
            color: var(--text-secondary);
            display: block;
            margin-bottom: 0.3rem;
        }

        .opiniones-section .question-value {
            color: #fbbf24;
        }

        .opiniones-section .question-text-response {
            color: var(--text-primary);
            line-height: 1.6;
            margin-top: 0.5rem;
            padding: 0.8rem;
            background: var(--bg-secondary);
            border-radius: 6px;
            font-style: italic;
            border-left: 3px solid var(--primary-color);
        }

        /* Nuevo formato estructurado de preguntas/respuestas */
        .opiniones-section .feedback-questions-structured {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border-color);
        }

        .opiniones-section .question-item-structured {
            background: var(--bg-secondary);
            border-radius: 8px;
            padding: 1rem;
            border-left: 4px solid var(--primary-color);
        }

        .opiniones-section .question-text {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
            font-size: 0.95rem;
        }

        .opiniones-section .answer-rating {
            color: #fbbf24;
            font-size: 1.2rem;
            font-weight: 600;
        }

        .opiniones-section .answer-choice {
            color: var(--primary-color);
            font-weight: 600;
            font-size: 0.95rem;
        }

        .opiniones-section .answer-text {
            color: #1f2937;
            line-height: 1.6;
            font-style: italic;
            padding: 0.5rem;
            background: #f9fafb;
            border-radius: 6px;
            margin-top: 0.5rem;
            border: 1px solid #e5e7eb;
        }

        .opiniones-section .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-secondary);
        }

        .opiniones-section .empty-state-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }

        .opiniones-section .loading-spinner {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 3rem;
        }

        .opiniones-section .spinner {
            border: 4px solid var(--border-color);
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: opiniones-spin 1s linear infinite;
        }

        @keyframes opiniones-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Pending Feedbacks Section */
        .opiniones-section .pending-feedback-section {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #fbbf24;
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .opiniones-section .pending-feedback-header h3 {
            margin: 0 0 0.5rem 0;
            color: #92400e;
        }

        .opiniones-section .pending-feedback-list {
            display: grid;
            gap: 1rem;
            margin-top: 1rem;
        }

        .opiniones-section .pending-feedback-card {
            background: white;
            border: 1px solid #fbbf24;
            border-radius: 12px;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            transition: all 0.2s ease;
        }

        .opiniones-section .pending-feedback-card:hover {
            box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
            transform: translateY(-2px);
        }

        .opiniones-section .pending-info h4 {
            margin: 0 0 0.3rem 0;
            color: #92400e;
            font-size: 1rem;
        }

        .opiniones-section .pending-meta {
            font-size: 0.85rem;
            color: #78350f;
            margin: 0.2rem 0;
        }

        .opiniones-section .pending-phone {
            font-size: 0.85rem;
            color: #78350f;
            margin: 0.2rem 0;
            font-weight: 500;
        }

        .opiniones-section .btn-send-feedback {
            background: linear-gradient(135deg, #25D366 0%, #20BA5A 100%);
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s ease;
            font-size: 0.95rem;
        }

        .opiniones-section .btn-send-feedback:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);
        }

        .opiniones-section .empty-state-small {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 12px;
        }

        @media (max-width: 768px) {
            .opiniones-section .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .opiniones-section .filters-grid {
                grid-template-columns: 1fr;
            }

            .opiniones-section .feedback-header {
                flex-direction: column;
            }

            .opiniones-section .pending-feedback-card {
                flex-direction: column;
                align-items: flex-start;
            }

            .opiniones-section .btn-send-feedback {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
})();
