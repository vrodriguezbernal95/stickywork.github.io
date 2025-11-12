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
            // Configuración básica
            businessId: null,
            apiUrl: 'http://localhost:3000',
            language: 'es',
            containerId: 'stickywork-widget',
            mode: 'embedded', // 'embedded' o 'modal'
            trigger: null, // Selector del botón para modo modal

            // Colores
            primaryColor: '#3b82f6',
            secondaryColor: '#10b981',
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            textSecondaryColor: '#6b7280',
            errorColor: '#ef4444',
            successColor: '#10b981',

            // Tipografía
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: '1rem',
            fontSizeTitle: '1.8rem',
            fontSizeLabel: '1rem',
            fontWeight: '400',
            fontWeightBold: '600',

            // Bordes y forma
            borderRadius: '15px',
            borderRadiusInput: '8px',
            borderRadiusButton: '8px',
            borderWidth: '2px',
            borderColor: '#e5e7eb',
            borderColorFocus: null, // null = usa primaryColor

            // Espaciados
            padding: '2rem',
            paddingInput: '0.75rem',
            paddingButton: '1rem',
            spacing: '1.5rem', // Espacio entre campos

            // Sombras
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            boxShadowModal: '0 20px 60px rgba(0, 0, 0, 0.5)',
            boxShadowInput: 'none',
            boxShadowButton: '0 10px 25px rgba(0,0,0,0.15)',

            // Inputs
            inputBackgroundColor: null, // null = usa backgroundColor
            inputTextColor: null, // null = usa textColor
            inputBorderColor: null, // null = usa borderColor
            inputPlaceholderColor: '#9ca3af',

            // Botones
            buttonBackgroundColor: null, // null = usa primaryColor
            buttonTextColor: '#ffffff',
            buttonHoverTransform: 'translateY(-2px)',
            buttonDisabledColor: '#9ca3af',

            // Efectos y animaciones
            transitionSpeed: '0.3s',
            animationDuration: '0.3s',

            // Modo modal específico
            modalOverlayColor: 'rgba(0, 0, 0, 0.7)',
            modalMaxWidth: '650px',
            modalMaxHeight: '90vh',
            modalCloseButtonColor: null, // null = usa secondaryColor
            modalCloseButtonHoverColor: '#ef4444'
        },

        services: [],
        selectedService: null,
        selectedDate: null,
        selectedTime: null,
        modalOpen: false,

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

            // Determinar modo de funcionamiento
            if (this.config.mode === 'modal') {
                this.initModalMode();
            } else {
                // Modo embedded tradicional
                this.loadServices();
            }
        },

        /**
         * Inicializa el modo modal
         */
        initModalMode: function() {
            if (!this.config.trigger) {
                console.error('StickyWork Error: trigger es requerido para modo modal');
                return;
            }

            // Buscar el botón trigger
            const triggerElement = document.querySelector(this.config.trigger);

            if (!triggerElement) {
                console.error('StickyWork Error: No se encontró el elemento trigger:', this.config.trigger);
                return;
            }

            // Agregar evento click al botón
            triggerElement.addEventListener('click', () => this.openModal());
        },

        /**
         * Abre el modal
         */
        openModal: function() {
            if (this.modalOpen) return;

            this.modalOpen = true;

            // Crear overlay
            const overlay = document.createElement('div');
            overlay.id = 'stickywork-modal-overlay';
            overlay.className = 'stickywork-modal-overlay';
            overlay.addEventListener('click', () => this.closeModal());

            // Crear contenedor del modal
            const modalContainer = document.createElement('div');
            modalContainer.id = 'stickywork-modal-container';
            modalContainer.className = 'stickywork-modal-container';

            // Crear botón de cerrar
            const closeButton = document.createElement('button');
            closeButton.className = 'stickywork-modal-close';
            closeButton.innerHTML = '×';
            closeButton.addEventListener('click', () => this.closeModal());

            // Crear contenedor del widget
            const widgetContainer = document.createElement('div');
            widgetContainer.id = this.config.containerId + '-modal';

            modalContainer.appendChild(closeButton);
            modalContainer.appendChild(widgetContainer);

            document.body.appendChild(overlay);
            document.body.appendChild(modalContainer);

            // Temporalmente cambiar el containerId para renderizar en el modal
            const originalContainerId = this.config.containerId;
            this.config.containerId = this.config.containerId + '-modal';

            // Cargar servicios y renderizar
            this.loadServices();
        },

        /**
         * Cierra el modal
         */
        closeModal: function() {
            if (!this.modalOpen) return;

            const overlay = document.getElementById('stickywork-modal-overlay');
            const container = document.getElementById('stickywork-modal-container');

            if (overlay) overlay.remove();
            if (container) container.remove();

            this.modalOpen = false;
        },

        /**
         * Inyecta los estilos CSS del widget
         */
        injectStyles: function() {
            // Helper para obtener valores con fallback
            const c = this.config;
            const borderColorFocus = c.borderColorFocus || c.primaryColor;
            const inputBg = c.inputBackgroundColor || c.backgroundColor;
            const inputText = c.inputTextColor || c.textColor;
            const inputBorder = c.inputBorderColor || c.borderColor;
            const buttonBg = c.buttonBackgroundColor || c.primaryColor;
            const modalCloseBg = c.modalCloseButtonColor || c.secondaryColor;

            const styles = `
                /* Modal - Overlay y contenedor */
                .stickywork-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: ${c.modalOverlayColor};
                    z-index: 9998;
                    animation: stickywork-fadeIn ${c.animationDuration} ease;
                }
                .stickywork-modal-container {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: ${c.backgroundColor};
                    border-radius: ${c.borderRadius};
                    padding: ${c.padding};
                    z-index: 9999;
                    max-width: ${c.modalMaxWidth};
                    width: 90%;
                    max-height: ${c.modalMaxHeight};
                    overflow-y: auto;
                    box-shadow: ${c.boxShadowModal};
                    animation: stickywork-slideUp ${c.animationDuration} ease;
                    font-family: ${c.fontFamily};
                }
                .stickywork-modal-close {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: ${modalCloseBg};
                    color: ${c.buttonTextColor};
                    border: none;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.5rem;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all ${c.transitionSpeed} ease;
                    line-height: 1;
                }
                .stickywork-modal-close:hover {
                    transform: rotate(90deg);
                    background: ${c.modalCloseButtonHoverColor};
                }

                /* Animaciones */
                @keyframes stickywork-fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes stickywork-slideUp {
                    from { opacity: 0; transform: translate(-50%, -45%); }
                    to { opacity: 1; transform: translate(-50%, -50%); }
                }
                @keyframes stickywork-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Widget principal */
                .stickywork-widget {
                    font-family: ${c.fontFamily};
                    max-width: 600px;
                    margin: 0 auto;
                    background: ${c.backgroundColor};
                    border-radius: ${c.borderRadius};
                    padding: ${c.padding};
                    box-shadow: ${c.boxShadow};
                    color: ${c.textColor};
                    font-size: ${c.fontSize};
                    font-weight: ${c.fontWeight};
                }

                /* Títulos y texto */
                .stickywork-title {
                    color: ${c.primaryColor};
                    font-size: ${c.fontSizeTitle};
                    font-weight: ${c.fontWeightBold};
                    margin-bottom: 0.5rem;
                    text-align: center;
                }
                .stickywork-subtitle {
                    color: ${c.textSecondaryColor};
                    font-size: ${c.fontSize};
                    text-align: center;
                    margin-bottom: 2rem;
                }

                /* Formulario */
                .stickywork-form-group {
                    margin-bottom: ${c.spacing};
                }
                .stickywork-label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: ${c.fontWeightBold};
                    font-size: ${c.fontSizeLabel};
                    color: ${c.textColor};
                }

                /* Inputs, selects y textareas */
                .stickywork-input,
                .stickywork-select,
                .stickywork-textarea {
                    width: 100%;
                    padding: ${c.paddingInput};
                    border: ${c.borderWidth} solid ${inputBorder};
                    border-radius: ${c.borderRadiusInput};
                    font-size: ${c.fontSize};
                    font-family: ${c.fontFamily};
                    background: ${inputBg};
                    color: ${inputText};
                    box-shadow: ${c.boxShadowInput};
                    transition: border-color ${c.transitionSpeed}, box-shadow ${c.transitionSpeed};
                    box-sizing: border-box;
                }
                .stickywork-input::placeholder,
                .stickywork-select::placeholder,
                .stickywork-textarea::placeholder {
                    color: ${c.inputPlaceholderColor};
                }
                .stickywork-input:focus,
                .stickywork-select:focus,
                .stickywork-textarea:focus {
                    outline: none;
                    border-color: ${borderColorFocus};
                }
                .stickywork-textarea {
                    resize: vertical;
                    min-height: 100px;
                }

                /* Botones */
                .stickywork-button {
                    width: 100%;
                    padding: ${c.paddingButton};
                    background: ${buttonBg};
                    color: ${c.buttonTextColor};
                    border: none;
                    border-radius: ${c.borderRadiusButton};
                    font-size: 1.1rem;
                    font-weight: ${c.fontWeightBold};
                    font-family: ${c.fontFamily};
                    cursor: pointer;
                    transition: all ${c.transitionSpeed};
                }
                .stickywork-button:hover {
                    transform: ${c.buttonHoverTransform};
                    box-shadow: ${c.boxShadowButton};
                }
                .stickywork-button:disabled {
                    background: ${c.buttonDisabledColor};
                    cursor: not-allowed;
                    transform: none;
                }

                /* Mensajes de error y éxito */
                .stickywork-error {
                    color: ${c.errorColor};
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                }
                .stickywork-success {
                    background: linear-gradient(135deg, ${c.successColor}, #059669);
                    color: ${c.buttonTextColor};
                    padding: ${c.padding};
                    border-radius: ${c.borderRadius};
                    text-align: center;
                }
                .stickywork-success h3 {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    font-weight: ${c.fontWeightBold};
                }

                /* Loading */
                .stickywork-loading {
                    text-align: center;
                    padding: ${c.padding};
                    color: ${c.textSecondaryColor};
                }
                .stickywork-spinner {
                    border: 3px solid #f3f4f6;
                    border-top: 3px solid ${c.primaryColor};
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: stickywork-spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }

                /* Selector de horarios */
                .stickywork-time-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }
                .stickywork-time-slot {
                    padding: ${c.paddingInput};
                    border: ${c.borderWidth} solid ${inputBorder};
                    border-radius: ${c.borderRadiusInput};
                    text-align: center;
                    cursor: pointer;
                    transition: all ${c.transitionSpeed};
                    background: ${inputBg};
                    color: ${inputText};
                }
                .stickywork-time-slot:hover {
                    border-color: ${c.primaryColor};
                    background: ${c.primaryColor}10;
                }
                .stickywork-time-slot.selected {
                    background: ${c.primaryColor};
                    color: ${c.buttonTextColor};
                    border-color: ${c.primaryColor};
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
