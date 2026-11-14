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

    // Detalles de planes (mismos textos que planes.html)
    plans: {
        free: {
            name: 'Gratis',
            price: 0,
            features: ['1 usuario', 'Hasta 30 reservas al mes', 'WhatsApp con un clic y encuestas', 'Incluye el enlace «Reservas con StickyWork»']
        },
        founders: {
            name: 'Founders',
            price: 25,
            features: ['3 usuarios', 'Reservas ilimitadas', '1 reporte IA al mes', 'Soporte prioritario', 'Precio garantizado de por vida']
        },
        professional: {
            name: 'Profesional',
            price: 39,
            features: ['3 usuarios', 'Reservas ilimitadas', '1 reporte IA al mes', 'Te ayudamos a integrarlo en tu web', 'Sin la marca StickyWork']
        },
        premium: {
            name: 'Premium',
            price: 79,
            features: ['10 usuarios', 'Reservas ilimitadas', '2 reportes IA a la semana', 'Consultoría 1 h al mes', 'Landing page incluida', 'Soporte prioritario', 'Sin la marca StickyWork']
        }
    },

    esc(v) {
        return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    // Fecha larga sin toISOString: «14 de diciembre de 2026»
    fechaLarga(d) {
        if (!d) return '';
        const f = new Date(d);
        if (isNaN(f)) return '';
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${f.getDate()} de ${meses[f.getMonth()]} de ${f.getFullYear()}`;
    },

    // Cargar sección de facturación
    async load() {
        const contentArea = this._getContainer();
        if (!this._container) document.getElementById('pageTitle').textContent = 'Plan';
        this.injectStyles();

        contentArea.innerHTML = `
            <div class="loading">
                <p>Cargando tu plan...</p>
            </div>
        `;

        try {
            const subResponse = await api.get('/api/stripe/subscription-status');
            this.subscriptionData = subResponse.data;

            this.paymentHistory = [];
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
                    <p>No se pudo cargar la información de tu plan</p>
                    <button class="btn-secondary" onclick="billing.load()" style="margin-top: 1rem;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    // Estado del plan actual en una frase
    renderStatusLine(sub, currentPlan) {
        if (sub.bonusUntil) {
            return `<div class="billing-note gift">🎁 De regalo por el programa de recomendación hasta el <strong>${this.fechaLarga(sub.bonusUntil)}</strong>. Después vuelves al plan Gratis automáticamente, sin pagar nada.</div>`;
        }
        if (currentPlan === 'free') {
            return '';
        }
        if (sub.status === 'trialing' && sub.trialEnd) {
            return `<div class="billing-note">🎁 Estás en los días de prueba gratis hasta el <strong>${this.fechaLarga(sub.trialEnd)}</strong>. Si no cancelas antes, se cobrará el primer mes ese día.</div>`;
        }
        if (sub.status === 'past_due') {
            return `<div class="billing-note warn">⚠️ No se ha podido cobrar el último pago. Revisa tu tarjeta en <strong>Gestionar suscripción</strong> para no perder el plan.</div>`;
        }
        if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd) {
            return `<div class="billing-note warn">Tu suscripción está cancelada: mantienes el plan hasta el <strong>${this.fechaLarga(sub.currentPeriodEnd)}</strong> y después pasas al plan Gratis.</div>`;
        }
        if (sub.status === 'active' && sub.currentPeriodEnd) {
            return `<div class="billing-note">📅 Próxima renovación: <strong>${this.fechaLarga(sub.currentPeriodEnd)}</strong>.</div>`;
        }
        if (!sub.hasActiveSubscription) {
            return `<div class="billing-note">Este plan lo gestionamos nosotros directamente. Para cualquier cambio, escríbenos desde <strong>Soporte</strong>.</div>`;
        }
        return '';
    },

    // Barra de uso del mes (plan Gratis)
    renderUsage(usage) {
        if (!usage) return '';
        const { bookingsThisMonth, maxBookings } = usage;
        const pct = Math.min(100, Math.round((bookingsThisMonth / maxBookings) * 100));
        const lleno = bookingsThisMonth >= maxBookings;
        const cerca = !lleno && pct >= 80;
        const nota = lleno
            ? 'Has llegado al límite: tus clientes no pueden reservar online hasta el mes que viene, salvo que cambies a Profesional.'
            : cerca
                ? 'Te queda poco: al llegar a ' + maxBookings + ', tus clientes no podrán reservar online hasta el mes que viene.'
                : 'Al llegar a ' + maxBookings + ', tus clientes no podrán reservar online hasta el mes que viene.';
        return `
            <div class="billing-usage">
                <div class="billing-usage-head">
                    <span>Reservas este mes</span>
                    <strong>${bookingsThisMonth} de ${maxBookings}</strong>
                </div>
                <div class="billing-usage-bar"><div class="billing-usage-fill ${lleno ? 'full' : cerca ? 'near' : ''}" style="width: ${pct}%"></div></div>
                <p class="billing-usage-note">${nota}</p>
            </div>`;
    },

    // Renderizar página del plan
    render() {
        const contentArea = this._getContainer();
        const sub = this.subscriptionData || {};
        const currentPlan = this.plans[sub.plan] ? sub.plan : 'free';
        const plan = this.plans[currentPlan];
        const isOwner = auth.userData?.role === 'owner';
        const showUpgrade = !sub.hasActiveSubscription && currentPlan !== 'premium';
        const upgradeKeys = !sub.bonusUntil && (currentPlan === 'professional' || currentPlan === 'founders') ? ['premium'] : ['professional', 'premium'];

        contentArea.innerHTML = `
            <div class="billing-container">
                <div class="billing-section">
                    <h2>Tu plan actual</h2>
                    <div class="current-plan-card ${currentPlan}">
                        <div class="plan-badge">${sub.bonusUntil ? '🎁 ' : ''}${utils.escapeHtml(plan.name)}</div>
                        <div class="plan-price">
                            ${currentPlan === 'free' ? '0 €' : sub.bonusUntil ? 'Gratis (regalo)' : `${plan.price} €/mes`}
                        </div>
                        <ul class="billing-current-features">
                            ${plan.features.map(f => `<li>✓ ${f}</li>`).join('')}
                        </ul>
                        ${this.renderStatusLine(sub, currentPlan)}
                        ${currentPlan === 'free' ? this.renderUsage(sub.usage) : ''}
                        ${sub.pendingRewards > 0 ? `<div class="billing-note gift">🎁 Has ganado <strong>${sub.pendingRewards} ${sub.pendingRewards === 1 ? 'mes' : 'meses'}</strong> invitando a otros negocios: te los descontaremos de tus próximas facturas.</div>` : ''}
                    </div>

                    <div class="billing-actions">
                        ${isOwner && sub.hasActiveSubscription ? `
                            <button class="btn-secondary" onclick="billing.openPortal()">💳 Gestionar suscripción, tarjeta y facturas</button>
                        ` : ''}
                        <button class="btn-secondary" onclick="billing.goInvite()">🎁 Invita a otro negocio y gana un mes gratis</button>
                    </div>
                </div>

                ${showUpgrade ? `
                    <div class="billing-section">
                        <h2>${sub.bonusUntil ? 'Mantén las ventajas cuando acabe el regalo' : 'Mejora tu plan'}</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                            Pruébalo gratis 7 días. Pagas con tarjeta de forma segura a través de Stripe y puedes cancelar cuando quieras.
                        </p>
                        <div class="plans-grid">
                            ${upgradeKeys.map(k => this.renderPlanCard(k, sub.bonusUntil ? null : currentPlan, isOwner)).join('')}
                        </div>
                        ${!isOwner ? `<p class="billing-owner-note">Solo la persona propietaria de la cuenta puede cambiar el plan.</p>` : ''}
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 1rem; text-align: center;">
                            ¿Dudas? <a href="https://stickywork.com/planes.html" target="_blank" rel="noopener" style="color: var(--primary-color);">Compara todos los planes</a> o escríbenos desde Soporte.
                        </p>
                    </div>
                ` : ''}

                ${isOwner && this.paymentHistory.length > 0 ? `
                    <div class="billing-section">
                        <h2>Historial de pagos</h2>
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
                                            <td>${this.esc(p.description || 'Suscripción StickyWork')}</td>
                                            <td><strong>${this.esc(p.amount)} €</strong></td>
                                            <td>${this.getPaymentStatusBadge(p.status)}</td>
                                            <td>
                                                ${p.invoice_pdf && /^https:\/\//.test(p.invoice_pdf) ? `
                                                    <a href="${this.esc(p.invoice_pdf)}" target="_blank" rel="noopener" class="btn-link">📄 PDF</a>
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
    renderPlanCard(planKey, currentPlan, isOwner) {
        const plan = this.plans[planKey];
        const isCurrent = planKey === currentPlan;
        const isPopular = planKey === 'professional';

        return `
            <div class="plan-card ${isCurrent ? 'current' : ''} ${isPopular ? 'popular' : ''}">
                ${isPopular ? '<div class="popular-badge">⭐ Recomendado</div>' : ''}
                <h3>${utils.escapeHtml(plan.name)}</h3>
                <div class="plan-price-large">
                    <span class="price">${plan.price} €</span>
                    <span class="period">/mes</span>
                </div>
                <ul class="plan-features">
                    ${plan.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
                ${isCurrent ? `
                    <button class="btn-current" disabled>Tu plan actual</button>
                ` : isOwner ? `
                    <button class="btn-upgrade" onclick="billing.startCheckout('${planKey}')">
                        Probar 7 días gratis
                    </button>
                ` : ''}
            </div>
        `;
    },

    // Ir a la pestaña «Invita y gana» (desde Configuración o desde la página suelta de Plan)
    async goInvite() {
        if (document.getElementById('tab-invite')) return settings.switchTab('invite');
        await app.navigateTo('settings');
        if (window.settings && document.getElementById('tab-invite')) settings.switchTab('invite');
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

billing.injectStyles = function () {
    if (document.getElementById('billing-extra-styles')) return;
    const st = document.createElement('style');
    st.id = 'billing-extra-styles';
    st.textContent = `
        .billing-current-features { list-style: none; padding: 0; margin: 1rem 0; display: grid; gap: 0.35rem; color: var(--text-secondary); font-size: 0.95rem; }
        .billing-note { margin-top: 1rem; padding: 0.85rem 1rem; border-radius: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); line-height: 1.5; font-size: 0.95rem; }
        .billing-note.gift { border-color: rgba(16, 185, 129, 0.45); }
        .billing-note.warn { border-color: rgba(245, 158, 11, 0.6); }
        .billing-usage { margin-top: 1.25rem; }
        .billing-usage-head { display: flex; justify-content: space-between; color: var(--text-primary); margin-bottom: 0.5rem; font-size: 0.95rem; }
        .billing-usage-bar { height: 10px; border-radius: 999px; background: var(--bg-secondary); border: 1px solid var(--border-color); overflow: hidden; }
        .billing-usage-fill { height: 100%; background: var(--primary-color); border-radius: 999px; }
        .billing-usage-fill.near { background: #f59e0b; }
        .billing-usage-fill.full { background: #ef4444; }
        .billing-usage-note { margin: 0.5rem 0 0; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; }
        .billing-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; }
        .billing-owner-note { margin-top: 1rem; text-align: center; color: var(--text-secondary); font-size: 0.9rem; }
    `;
    document.head.appendChild(st);
};

// Export
window.billing = billing;
