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
        questionsHTML = `
            <div class="feedback-questions">
                ${questions.cleanliness ? `
                    <div class="question-item">
                        <span class="question-label">Limpieza:</span>
                        <span class="question-value">${'⭐'.repeat(questions.cleanliness)}</span>
                    </div>
                ` : ''}
                ${questions.punctuality ? `
                    <div class="question-item">
                        <span class="question-label">Puntualidad:</span>
                        <span class="question-value">${'⭐'.repeat(questions.punctuality)}</span>
                    </div>
                ` : ''}
                ${questions.wouldRecommend !== null && questions.wouldRecommend !== undefined ? `
                    <div class="question-item">
                        <span class="question-label">Recomendaría:</span>
                        <span style="color: ${questions.wouldRecommend ? '#10b981' : '#ef4444'}; font-weight: 600;">
                            ${questions.wouldRecommend ? '✓ Sí' : '✗ No'}
                        </span>
                    </div>
                ` : ''}
            </div>
        `;
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

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', init);
