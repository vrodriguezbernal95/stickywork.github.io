// Billing Module - Gestión de suscripción y pagos

const billing = {
    subscriptionData: null,
    paymentHistory: [],
    _container: null,

    _getContainer() {
        if (this._container && document.contains(this._container)) return this._container;
        this._container = null;
        return document.getElementById('contentArea');
    },

    // Detalles de planes
    plans: {
        free: {
            name: 'Gratis',
            price: 0,
            features: ['1 usuario', '30 reservas/mes', 'Soporte por email']
        },
        founders: {
            name: 'Founders',
            price: 25,
            priceId: null, // Se configura desde Stripe
            features: ['3 usuarios', 'Reservas ilimitadas', '1 reporte IA/mes', 'Soporte prioritario', 'Precio garantizado de por vida']
        },
        professional: {
            name: 'Profesional',
            price: 39,
            priceId: null,
            features: ['3 usuarios', 'Reservas ilimitadas', '1 reporte IA/mes', 'Soporte por email']
        },
        premium: {
            name: 'Premium',
            price: 79,
            priceId: null,
            features: ['10 usuarios', 'Reservas ilimitadas', '2 reportes IA/semana', 'Consultoría 1h/mes', 'Landing page gratis', 'Soporte prioritario 24/7']
        }
    },

    // Cargar sección de facturación
    async load() {
        const contentArea = this._getContainer();
        if (!this._container) document.getElementById('pageTitle').textContent = 'Facturación';

        contentArea.innerHTML = `
            <div class="loading">
                <p>Cargando información de facturación...</p>
            </div>
        `;

        try {
            // Cargar estado de suscripción
            const subResponse = await api.get('/api/stripe/subscription-status');
            this.subscriptionData = subResponse.data;

            // Cargar historial de pagos si es owner
            if (auth.userData?.role === 'owner') {
                try {
                    const historyResponse = await api.get('/api/stripe/payment-history');
                    this.paymentHistory = historyResponse.data || [];
                } catch (e) {
                    this.paymentHistory = [];
                }
            }

            this.render();
        } catch (error) {
            console.error('Error loading billing:', error);
            contentArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Error al cargar información de facturación</p>
                    <button class="btn-secondary" onclick="billing.load()" style="margin-top: 1rem;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    // Renderizar página de facturación
    render() {
        const contentArea = this._getContainer();
        const sub = this.subscriptionData;
        const currentPlan = sub?.plan || 'free';
        const isOwner = auth.userData?.role === 'owner';

        contentArea.innerHTML = `
            <div class="billing-container">
                <!-- Estado actual de suscripción -->
                <div class="billing-section">
                    <h2>Tu Plan Actual</h2>
                    <div class="current-plan-card ${currentPlan}">
                        <div class="plan-badge">${this.plans[currentPlan]?.name || 'Gratis'}</div>
                        <div class="plan-price">
                            ${currentPlan === 'free' ? 'Gratis' : `€${this.plans[currentPlan]?.price}/mes`}
                        </div>
                        <div class="plan-status">
                            ${this.getStatusBadge(sub?.status)}
                        </div>
                        ${sub?.trialEnd ? `
                            <div class="trial-info">
                                <span>🎁 Trial hasta: ${utils.formatDateShort(sub.trialEnd)}</span>
                            </div>
                        ` : ''}
                        ${sub?.currentPeriodEnd && sub?.status === 'active' ? `
                            <div class="renewal-info">
                                <span>📅 Próxima factura: ${utils.formatDateShort(sub.currentPeriodEnd)}</span>
                            </div>
                        ` : ''}
                        ${sub?.cancelAtPeriodEnd ? `
                            <div class="cancel-warning">
                                <span>⚠️ Se cancelará al final del período</span>
                            </div>
                        ` : ''}
                    </div>

                    ${isOwner && sub?.hasActiveSubscription ? `
                        <button class="btn-secondary" onclick="billing.openPortal()" style="margin-top: 1rem;">
                            ⚙️ Gestionar suscripción
                        </button>
                    ` : ''}
                </div>

                ${currentPlan === 'free' || !sub?.hasActiveSubscription ? `
                    <!-- Planes disponibles para upgrade -->
                    <div class="billing-section">
                        <h2>Mejora tu Plan</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                            Desbloquea más funciones para hacer crecer tu negocio
                        </p>
                        <div class="plans-grid">
                            ${this.renderPlanCard('professional', currentPlan)}
                            ${this.renderPlanCard('premium', currentPlan)}
                        </div>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 1rem; text-align: center;">
                            🎁 Todos los planes incluyen 7 días de prueba gratis
                        </p>
                    </div>
                ` : ''}

                ${isOwner && this.paymentHistory.length > 0 ? `
                    <!-- Historial de pagos -->
                    <div class="billing-section">
                        <h2>Historial de Pagos</h2>
                        <div class="payment-history-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Descripción</th>
                                        <th>Importe</th>
                                        <th>Estado</th>
                                        <th>Factura</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.paymentHistory.map(p => `
                                        <tr>
                                            <td>${utils.formatDateShort(p.paid_at || p.created_at)}</td>
                                            <td>${p.description || 'Suscripción StickyWork'}</td>
                                            <td><strong>€${p.amount}</strong></td>
                                            <td>${this.getPaymentStatusBadge(p.status)}</td>
                                            <td>
                                                ${p.invoice_pdf ? `
                                                    <a href="${p.invoice_pdf}" target="_blank" class="btn-link">
                                                        📄 PDF
                                                    </a>
                                                ` : '-'}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    // Renderizar tarjeta de plan
    renderPlanCard(planKey, currentPlan) {
        const plan = this.plans[planKey];
        const isCurrent = planKey === currentPlan;
        const isPopular = planKey === 'professional';

        return `
            <div class="plan-card ${isCurrent ? 'current' : ''} ${isPopular ? 'popular' : ''}">
                ${isPopular ? '<div class="popular-badge">⭐ Recomendado</div>' : ''}
                <h3>${plan.name}</h3>
                <div class="plan-price-large">
                    <span class="price">€${plan.price}</span>
                    <span class="period">/mes</span>
                </div>
                <ul class="plan-features">
                    ${plan.features.map(f => `<li>✓ ${f}</li>`).join('')}
                </ul>
                ${isCurrent ? `
                    <button class="btn-current" disabled>Tu plan actual</button>
                ` : `
                    <button class="btn-upgrade" onclick="billing.startCheckout('${planKey}')">
                        🚀 Empezar prueba gratis
                    </button>
                `}
            </div>
        `;
    },

    // Obtener badge de estado
    getStatusBadge(status) {
        const badges = {
            'trialing': '<span class="status-badge trial">🎁 En prueba</span>',
            'active': '<span class="status-badge active">✓ Activo</span>',
            'past_due': '<span class="status-badge warning">⚠️ Pago pendiente</span>',
            'canceled': '<span class="status-badge canceled">✕ Cancelado</span>',
            'free': '<span class="status-badge free">Gratis</span>'
        };
        return badges[status] || badges['free'];
    },

    // Obtener badge de estado de pago
    getPaymentStatusBadge(status) {
        const badges = {
            'succeeded': '<span class="payment-status success">✓ Pagado</span>',
            'pending': '<span class="payment-status pending">⏳ Pendiente</span>',
            'failed': '<span class="payment-status failed">✕ Fallido</span>',
            'refunded': '<span class="payment-status refunded">↩ Reembolsado</span>'
        };
        return badges[status] || status;
    },

    // Iniciar checkout de Stripe
    async startCheckout(planName) {
        try {
            // Mostrar loading
            modal.toast('Preparando pago...', 'info');

            const response = await api.post('/api/stripe/create-checkout-session', {
                planName: planName
            });

            if (response.success && response.url) {
                // Redirigir a Stripe Checkout
                window.location.href = response.url;
            } else {
                throw new Error(response.message || 'Error al crear sesión de pago');
            }

        } catch (error) {
            console.error('Error starting checkout:', error);
            modal.alert({
                title: 'Error',
                message: error.message || 'No se pudo iniciar el proceso de pago. Por favor, inténtalo de nuevo.',
                type: 'danger'
            });
        }
    },

    // Abrir portal de cliente de Stripe
    async openPortal() {
        try {
            modal.toast('Abriendo portal de facturación...', 'info');

            const response = await api.post('/api/stripe/create-portal-session');

            if (response.success && response.url) {
                window.location.href = response.url;
            } else {
                throw new Error(response.message || 'Error al abrir portal');
            }

        } catch (error) {
            console.error('Error opening portal:', error);
            modal.alert({
                title: 'Error',
                message: error.message || 'No se pudo abrir el portal de facturación.',
                type: 'danger'
            });
        }
    }
};

// Export
window.billing = billing;
