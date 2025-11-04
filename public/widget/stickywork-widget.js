/**
 * StickyWork Widget - Sistema de Reservas Embebible
 * Versión: 1.0.0
 *
 * Uso:
 * <div id="stickywork-widget"></div>
 * <script src="http://localhost:3000/public/widget/stickywork-widget.js"></script>
 * <script>
 *   StickyWork.init({
 *     businessId: 1,
 *     apiUrl: 'http://localhost:3000',
 *     primaryColor: '#3b82f6',
 *     language: 'es'
 *   });
 * </script>
 */

(function(window) {
    'use strict';

    const StickyWork = {
        config: {
            businessId: null,
            apiUrl: 'http://localhost:3000',
            primaryColor: '#3b82f6',
            secondaryColor: '#10b981',
            language: 'es',
            containerId: 'stickywork-widget'
        },

        services: [],
        selectedService: null,
        selectedDate: null,
        selectedTime: null,

        /**
         * Inicializa el widget
         */
        init: function(options) {
            // Combinar configuración
            this.config = Object.assign({}, this.config, options);

            // Validar businessId
            if (!this.config.businessId) {
                console.error('StickyWork Error: businessId es requerido');
                return;
            }

            // Inyectar estilos
            this.injectStyles();

            // Cargar servicios
            this.loadServices();
        },

        /**
         * Inyecta los estilos CSS del widget
         */
        injectStyles: function() {
            const styles = `
                .stickywork-widget {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 15px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .stickywork-title {
                    color: ${this.config.primaryColor};
                    font-size: 1.8rem;
                    margin-bottom: 0.5rem;
                    text-align: center;
                }
                .stickywork-subtitle {
                    color: #6b7280;
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .stickywork-form-group {
                    margin-bottom: 1.5rem;
                }
                .stickywork-label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #1f2937;
                }
                .stickywork-input,
                .stickywork-select,
                .stickywork-textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-family: inherit;
                    transition: border-color 0.3s;
                    box-sizing: border-box;
                }
                .stickywork-input:focus,
                .stickywork-select:focus,
                .stickywork-textarea:focus {
                    outline: none;
                    border-color: ${this.config.primaryColor};
                }
                .stickywork-textarea {
                    resize: vertical;
                    min-height: 100px;
                }
                .stickywork-button {
                    width: 100%;
                    padding: 1rem;
                    background: ${this.config.primaryColor};
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .stickywork-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                }
                .stickywork-button:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                    transform: none;
                }
                .stickywork-error {
                    color: #ef4444;
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                }
                .stickywork-success {
                    background: linear-gradient(135deg, ${this.config.secondaryColor}, #059669);
                    color: white;
                    padding: 2rem;
                    border-radius: 10px;
                    text-align: center;
                }
                .stickywork-success h3 {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                }
                .stickywork-loading {
                    text-align: center;
                    padding: 2rem;
                    color: #6b7280;
                }
                .stickywork-spinner {
                    border: 3px solid #f3f4f6;
                    border-top: 3px solid ${this.config.primaryColor};
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: stickywork-spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }
                @keyframes stickywork-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .stickywork-service-option {
                    padding: 0.75rem;
                }
                .stickywork-time-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }
                .stickywork-time-slot {
                    padding: 0.75rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .stickywork-time-slot:hover {
                    border-color: ${this.config.primaryColor};
                    background: rgba(59, 130, 246, 0.05);
                }
                .stickywork-time-slot.selected {
                    background: ${this.config.primaryColor};
                    color: white;
                    border-color: ${this.config.primaryColor};
                }
                .stickywork-time-slot.unavailable {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
            `;

            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        },

        /**
         * Carga los servicios desde la API
         */
        loadServices: async function() {
            try {
                const container = document.getElementById(this.config.containerId);
                container.innerHTML = '<div class="stickywork-loading"><div class="stickywork-spinner"></div>Cargando...</div>';

                const response = await fetch(`${this.config.apiUrl}/api/services/${this.config.businessId}`);
                const data = await response.json();

                if (data.success) {
                    this.services = data.data;
                    this.renderForm();
                } else {
                    this.showError('Error al cargar los servicios');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showError('Error de conexión. Por favor, intenta más tarde.');
            }
        },

        /**
         * Renderiza el formulario de reservas
         */
        renderForm: function() {
            const container = document.getElementById(this.config.containerId);

            const html = `
                <div class="stickywork-widget">
                    <h2 class="stickywork-title">Reserva tu Cita</h2>
                    <p class="stickywork-subtitle">Completa el formulario para reservar</p>

                    <form id="stickywork-form">
                        <div class="stickywork-form-group">
                            <label class="stickywork-label">Selecciona el servicio *</label>
                            <select class="stickywork-select" id="sw-service" required>
                                <option value="">-- Elige un servicio --</option>
                                ${this.services.map(service => `
                                    <option value="${service.id}" data-duration="${service.duration}" data-price="${service.price}">
                                        ${service.name} ${service.price ? `(€${service.price})` : ''}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="stickywork-form-group">
                            <label class="stickywork-label">Fecha *</label>
                            <input type="date" class="stickywork-input" id="sw-date" required min="${this.getTodayDate()}">
                        </div>

                        <div class="stickywork-form-group" id="sw-time-container" style="display: none;">
                            <label class="stickywork-label">Hora disponible *</label>
                            <div class="stickywork-time-grid" id="sw-time-grid"></div>
                            <input type="hidden" id="sw-time" required>
                        </div>

                        <div class="stickywork-form-group">
                            <label class="stickywork-label">Tu nombre completo *</label>
                            <input type="text" class="stickywork-input" id="sw-name" placeholder="Ej: María García" required>
                        </div>

                        <div class="stickywork-form-group">
                            <label class="stickywork-label">Correo electrónico *</label>
                            <input type="email" class="stickywork-input" id="sw-email" placeholder="tu@email.com" required>
                        </div>

                        <div class="stickywork-form-group">
                            <label class="stickywork-label">Teléfono *</label>
                            <input type="tel" class="stickywork-input" id="sw-phone" placeholder="+34 600 000 000" required>
                        </div>

                        <div class="stickywork-form-group">
                            <label class="stickywork-label">Notas adicionales (opcional)</label>
                            <textarea class="stickywork-textarea" id="sw-notes" placeholder="¿Alguna preferencia o solicitud especial?"></textarea>
                        </div>

                        <button type="submit" class="stickywork-button" id="sw-submit">
                            Confirmar Reserva
                        </button>
                    </form>
                </div>
            `;

            container.innerHTML = html;

            // Event listeners
            document.getElementById('sw-date').addEventListener('change', (e) => this.loadAvailability(e.target.value));
            document.getElementById('stickywork-form').addEventListener('submit', (e) => this.handleSubmit(e));
        },

        /**
         * Carga los horarios disponibles para una fecha
         */
        loadAvailability: async function(date) {
            try {
                const response = await fetch(`${this.config.apiUrl}/api/availability/${this.config.businessId}?date=${date}`);
                const data = await response.json();

                if (data.success) {
                    this.renderTimeSlots(data.data.availableTimes);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        },

        /**
         * Renderiza los slots de tiempo disponibles
         */
        renderTimeSlots: function(availableTimes) {
            const container = document.getElementById('sw-time-container');
            const grid = document.getElementById('sw-time-grid');

            if (availableTimes.length === 0) {
                grid.innerHTML = '<p class="stickywork-error">No hay horarios disponibles para esta fecha</p>';
                container.style.display = 'block';
                return;
            }

            const html = availableTimes.map(time => {
                const displayTime = time.substring(0, 5); // HH:MM
                return `<div class="stickywork-time-slot" data-time="${time}">${displayTime}</div>`;
            }).join('');

            grid.innerHTML = html;
            container.style.display = 'block';

            // Event listeners para slots de tiempo
            document.querySelectorAll('.stickywork-time-slot').forEach(slot => {
                slot.addEventListener('click', function() {
                    document.querySelectorAll('.stickywork-time-slot').forEach(s => s.classList.remove('selected'));
                    this.classList.add('selected');
                    document.getElementById('sw-time').value = this.dataset.time;
                });
            });
        },

        /**
         * Maneja el envío del formulario
         */
        handleSubmit: async function(e) {
            e.preventDefault();

            const submitButton = document.getElementById('sw-submit');
            submitButton.disabled = true;
            submitButton.textContent = 'Procesando...';

            const formData = {
                businessId: this.config.businessId,
                serviceId: document.getElementById('sw-service').value,
                customerName: document.getElementById('sw-name').value,
                customerEmail: document.getElementById('sw-email').value,
                customerPhone: document.getElementById('sw-phone').value,
                bookingDate: document.getElementById('sw-date').value,
                bookingTime: document.getElementById('sw-time').value,
                notes: document.getElementById('sw-notes').value
            };

            try {
                const response = await fetch(`${this.config.apiUrl}/api/bookings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    this.showSuccess(data.data);
                } else {
                    alert(data.message || 'Error al crear la reserva');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Confirmar Reserva';
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión. Por favor, intenta más tarde.');
                submitButton.disabled = false;
                submitButton.textContent = 'Confirmar Reserva';
            }
        },

        /**
         * Muestra mensaje de éxito
         */
        showSuccess: function(booking) {
            const container = document.getElementById(this.config.containerId);

            const date = new Date(booking.booking_date + 'T' + booking.booking_time);
            const formattedDate = date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const formattedTime = booking.booking_time.substring(0, 5);

            const html = `
                <div class="stickywork-widget">
                    <div class="stickywork-success">
                        <h3>✓ Reserva Confirmada</h3>
                        <p><strong>Nombre:</strong> ${booking.customer_name}</p>
                        <p><strong>Fecha:</strong> ${formattedDate}</p>
                        <p><strong>Hora:</strong> ${formattedTime}</p>
                        <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.9;">
                            Recibirás un correo de confirmación en breve.
                        </p>
                        <p style="margin-top: 1rem; font-size: 0.9rem;">
                            <strong>ID de reserva:</strong> ${booking.id}
                        </p>
                    </div>
                </div>
            `;

            container.innerHTML = html;
        },

        /**
         * Muestra mensaje de error
         */
        showError: function(message) {
            const container = document.getElementById(this.config.containerId);
            container.innerHTML = `
                <div class="stickywork-widget">
                    <p class="stickywork-error">${message}</p>
                </div>
            `;
        },

        /**
         * Obtiene la fecha de hoy en formato YYYY-MM-DD
         */
        getTodayDate: function() {
            return new Date().toISOString().split('T')[0];
        }
    };

    // Exponer StickyWork globalmente
    window.StickyWork = StickyWork;

})(window);
