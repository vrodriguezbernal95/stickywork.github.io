// Opiniones Module
let currentFilters = {
    rating: '',
    period: ''
};

// Inicializar
async function init() {
    // Verificar autenticación
    const isAuth = await auth.checkAuth();
    if (!isAuth) return;

    // Cargar datos
    await loadPendingFeedbacks();
    await loadStats();
    await loadFeedbacks();

    // Event listeners para filtros
    document.getElementById('filterRating').addEventListener('change', (e) => {
        currentFilters.rating = e.target.value;
        loadFeedbacks();
    });

    document.getElementById('filterPeriod').addEventListener('change', (e) => {
        currentFilters.period = e.target.value;
        loadFeedbacks();
    });
}

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
            <h4>${pending.customer_name}</h4>
            <p class="pending-meta">
                ${pending.service_name || 'Servicio'} • ${dateStr} (${daysText})
            </p>
            ${pending.customer_phone ? `<p class="pending-phone">📱 ${pending.customer_phone}</p>` : ''}
        </div>
        <button class="btn-send-feedback" onclick="opiniones.sendFeedbackWhatsApp(${pending.id}, '${pending.customer_name}', '${pending.customer_phone}', '${pending.service_name || ''}', '${pending.feedback_token}')">
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

    // Construir HTML de preguntas adicionales
    let questionsHTML = '';
    if (feedback.questions) {
        const questions = feedback.questions;
        const questionItems = [];

        // Mapeo de IDs a etiquetas legibles
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
            const value = questions[key];

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
                        <span class="question-label">${label}:</span>
                        <span class="question-value">${'⭐'.repeat(value)}</span>
                    </div>
                `);
            } else if (typeof value === 'boolean') {
                // Sí/No
                questionItems.push(`
                    <div class="question-item">
                        <span class="question-label">${label}:</span>
                        <span style="color: ${value ? '#10b981' : '#ef4444'}; font-weight: 600;">
                            ${value ? '✓ Sí' : '✗ No'}
                        </span>
                    </div>
                `);
            } else if (typeof value === 'string' && value.trim() !== '') {
                // Texto libre
                questionItems.push(`
                    <div class="question-item">
                        <span class="question-label">${label}:</span>
                        <div class="question-text-response">"${value}"</div>
                    </div>
                `);
            }
        });

        if (questionItems.length > 0) {
            questionsHTML = `
                <div class="feedback-questions">
                    ${questionItems.join('')}
                </div>
            `;
        }
    }

    card.innerHTML = `
        <div class="feedback-header">
            <div class="feedback-customer">
                <h3>${feedback.customer_name || 'Cliente Anónimo'}</h3>
                <div class="feedback-meta">
                    ${dateStr} • ${timeStr}
                    ${feedback.customer_email ? `• ${feedback.customer_email}` : ''}
                </div>
                ${feedback.service_name ? `
                    <span class="feedback-service">📋 ${feedback.service_name}</span>
                ` : ''}
            </div>
            <div class="feedback-stars">${stars}</div>
        </div>

        ${feedback.comment ? `
            <div class="feedback-comment">
                "${feedback.comment}"
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

// Exponer funciones públicas
const opiniones = {
    sendFeedbackWhatsApp,
    loadPendingFeedbacks,
    loadStats,
    loadFeedbacks
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.opiniones = opiniones;
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', init);
