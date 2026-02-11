// Global Search Module
const globalSearch = {
    debounceTimer: null,
    isOpen: false,

    init() {
        const input = document.getElementById('globalSearchInput');
        const results = document.getElementById('globalSearchResults');
        if (!input || !results) return;

        // Debounce en input
        input.addEventListener('input', () => {
            clearTimeout(this.debounceTimer);
            const query = input.value.trim();

            if (query.length < 2) {
                this.close();
                return;
            }

            this.debounceTimer = setTimeout(() => this.search(query), 300);
        });

        // Escape para cerrar
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                input.value = '';
                this.close();
                input.blur();
            }
        });

        // Click fuera para cerrar
        document.addEventListener('click', (e) => {
            const wrapper = document.getElementById('globalSearchWrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                this.close();
            }
        });
    },

    async search(query) {
        const results = document.getElementById('globalSearchResults');
        results.style.display = 'block';
        results.innerHTML = '<div class="gs-loading">Buscando...</div>';
        this.isOpen = true;

        try {
            const data = await api.get(`/api/search?q=${encodeURIComponent(query)}`);
            this.renderResults(data.data, query);
        } catch (error) {
            console.error('Error en búsqueda global:', error);
            results.innerHTML = '<div class="gs-empty">Error al buscar</div>';
        }
    },

    renderResults(data, query) {
        const results = document.getElementById('globalSearchResults');
        const { clients, bookings, services } = data;
        const total = clients.length + bookings.length + services.length;

        if (total === 0) {
            results.innerHTML = `<div class="gs-empty">Sin resultados para "${query}"</div>`;
            return;
        }

        let html = '';

        // Clientes
        if (clients.length > 0) {
            html += '<div class="gs-category"><span class="gs-category-title">👥 Clientes</span></div>';
            clients.forEach(c => {
                const statusBadge = this.getStatusBadge(c.status);
                html += `
                    <div class="gs-item" onclick="globalSearch.goToClient(${c.id})">
                        <div class="gs-item-main">
                            <span class="gs-item-name">${this.highlight(c.name, query)}</span>
                            ${statusBadge}
                        </div>
                        <div class="gs-item-detail">${this.highlight(c.phone || '', query)} · ${this.highlight(c.email || '', query)}</div>
                    </div>
                `;
            });
        }

        // Reservas
        if (bookings.length > 0) {
            html += '<div class="gs-category"><span class="gs-category-title">📅 Reservas</span></div>';
            bookings.forEach(b => {
                const date = new Date(b.booking_date);
                const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const timeStr = b.booking_time ? b.booking_time.substring(0, 5) : '';
                const statusColor = b.status === 'completed' ? '#22c55e' : b.status === 'cancelled' ? '#ef4444' : b.status === 'confirmed' ? '#3b82f6' : '#f59e0b';
                html += `
                    <div class="gs-item" onclick="globalSearch.goToBookings()">
                        <div class="gs-item-main">
                            <span class="gs-item-name">${this.highlight(b.customer_name, query)}</span>
                            <span class="gs-item-badge" style="background: ${statusColor};">${b.status}</span>
                        </div>
                        <div class="gs-item-detail">${b.service_name || 'Servicio'} · ${dateStr} ${timeStr}</div>
                    </div>
                `;
            });
        }

        // Servicios
        if (services.length > 0) {
            html += '<div class="gs-category"><span class="gs-category-title">🛠️ Servicios</span></div>';
            services.forEach(s => {
                const price = s.price ? `${parseFloat(s.price).toFixed(2)}€` : '';
                const duration = s.duration ? `${s.duration} min` : '';
                const detail = [duration, price].filter(Boolean).join(' · ');
                html += `
                    <div class="gs-item" onclick="globalSearch.goToServices()">
                        <div class="gs-item-main">
                            <span class="gs-item-name">${this.highlight(s.name, query)}</span>
                        </div>
                        ${detail ? `<div class="gs-item-detail">${detail}</div>` : ''}
                    </div>
                `;
            });
        }

        results.innerHTML = html;
    },

    highlight(text, query) {
        if (!text || !query) return text || '';
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark class="gs-highlight">$1</mark>');
    },

    getStatusBadge(status) {
        const colors = {
            premium: { bg: '#f59e0b', label: 'VIP' },
            riesgo: { bg: '#ef4444', label: 'Riesgo' },
            baneado: { bg: '#dc2626', label: 'Baneado' },
            normal: { bg: '#3b82f6', label: 'Normal' }
        };
        const s = colors[status] || colors.normal;
        return `<span class="gs-item-badge" style="background: ${s.bg};">${s.label}</span>`;
    },

    goToClient(clientId) {
        this.close();
        document.getElementById('globalSearchInput').value = '';
        // Navegar a clientes
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        const clientsLink = document.querySelector('[data-section="clients"]');
        if (clientsLink) clientsLink.classList.add('active');
        app.navigateTo('clients');
    },

    goToBookings() {
        this.close();
        document.getElementById('globalSearchInput').value = '';
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        const link = document.querySelector('[data-section="bookings"]');
        if (link) link.classList.add('active');
        app.navigateTo('bookings');
    },

    goToServices() {
        this.close();
        document.getElementById('globalSearchInput').value = '';
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        const link = document.querySelector('[data-section="services"]');
        if (link) link.classList.add('active');
        app.navigateTo('services');
    },

    close() {
        const results = document.getElementById('globalSearchResults');
        if (results) results.style.display = 'none';
        this.isOpen = false;
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    globalSearch.init();
});

window.globalSearch = globalSearch;
