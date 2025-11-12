/**
 * StickyWork Widget - Sistema de Reservas Embebible
 * Version: 1.0.0
 * Funciona en cualquier página web sin dependencias
 */

(function() {
    'use strict';

    // Namespace global
    window.StickyWork = window.StickyWork || {};

    // Configuración por defecto
    const defaultConfig = {
        businessId: 1,
        mode: 'embedded', // 'embedded' o 'modal'
        apiUrl: '', // Si está vacío, funciona en modo demo
        primaryColor: '#3b82f6',
        secondaryColor: '#ef4444',
        language: 'es',
        buttonText: '📅 Reserva tu Cita',
        services: [
            { name: 'Corte de pelo', price: '25€', duration: '30min' },
            { name: 'Tinte', price: '45€', duration: '60min' },
            { name: 'Manicura', price: '20€', duration: '45min' },
            { name: 'Masaje', price: '50€', duration: '60min' }
        ]
    };

    let config = {};
    let widgetContainer = null;

    // Textos según idioma
    const translations = {
        es: {
            title: 'Reserva tu Cita',
            name: 'Nombre completo',
            email: 'Email',
            phone: 'Teléfono',
            service: 'Servicio',
            selectService: 'Selecciona un servicio',
            date: 'Fecha',
            time: 'Hora',
            selectTime: 'Selecciona una hora',
            submit: 'Reservar',
            success: '¡Reserva Confirmada!',
            successMessage: 'Recibirás un email de confirmación en breve',
            newBooking: 'Nueva Reserva',
            demoNote: '✨ Demo - En producción se guardará en tu base de datos'
        },
        en: {
            title: 'Book Your Appointment',
            name: 'Full name',
            email: 'Email',
            phone: 'Phone',
            service: 'Service',
            selectService: 'Select a service',
            date: 'Date',
            time: 'Time',
            selectTime: 'Select a time',
            submit: 'Book Now',
            success: 'Booking Confirmed!',
            successMessage: 'You will receive a confirmation email shortly',
            newBooking: 'New Booking',
            demoNote: '✨ Demo - In production it will save to your database'
        }
    };

    // Función para obtener el tema actual (light/dark)
    function getCurrentTheme() {
        const htmlElement = document.documentElement;
        return htmlElement.classList.contains('dark-mode') ? 'dark' : 'light';
    }

    // Colores CSS adaptativos según tema
    function getThemeColors() {
        const isDark = getCurrentTheme() === 'dark';
        return {
            bgPrimary: isDark ? '#1e293b' : '#ffffff',
            bgSecondary: isDark ? '#334155' : '#f8fafc',
            textPrimary: isDark ? '#f1f5f9' : '#1e293b',
            textSecondary: isDark ? '#94a3b8' : '#64748b',
            borderColor: isDark ? '#475569' : '#e2e8f0'
        };
    }

    // Inyectar estilos CSS en el documento
    function injectStyles() {
        if (document.getElementById('stickywork-styles')) return;

        const colors = getThemeColors();
        const style = document.createElement('style');
        style.id = 'stickywork-styles';
        style.textContent = `
            .stickywork-widget {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                background: ${colors.bgPrimary};
                padding: 2rem;
                border-radius: 15px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
            }

            .stickywork-widget * {
                box-sizing: border-box;
            }

            .stickywork-title {
                text-align: center;
                color: ${config.primaryColor};
                margin-bottom: 1.5rem;
                font-size: 1.8rem;
                font-weight: 700;
            }

            .stickywork-form {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .stickywork-field {
                display: flex;
                flex-direction: column;
            }

            .stickywork-label {
                display: block;
                margin-bottom: 0.5rem;
                color: ${colors.textPrimary};
                font-weight: 500;
                font-size: 0.95rem;
            }

            .stickywork-input,
            .stickywork-select {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid ${colors.borderColor};
                border-radius: 8px;
                font-size: 1rem;
                background: ${colors.bgPrimary};
                color: ${colors.textPrimary};
                transition: all 0.3s ease;
            }

            .stickywork-input:focus,
            .stickywork-select:focus {
                outline: none;
                border-color: ${config.primaryColor};
                box-shadow: 0 0 0 3px ${config.primaryColor}20;
            }

            .stickywork-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }

            .stickywork-button {
                background: linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor});
                color: white;
                padding: 1rem;
                border: none;
                border-radius: 8px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 1rem;
            }

            .stickywork-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px ${config.primaryColor}40;
            }

            .stickywork-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            .stickywork-note {
                text-align: center;
                color: ${colors.textSecondary};
                margin-top: 1rem;
                font-size: 0.9rem;
            }

            .stickywork-success {
                text-align: center;
                padding: 3rem 2rem;
            }

            .stickywork-success-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }

            .stickywork-success-title {
                color: ${config.primaryColor};
                margin-bottom: 1rem;
                font-size: 1.8rem;
                font-weight: 700;
            }

            .stickywork-success-details {
                background: ${colors.bgSecondary};
                padding: 1.5rem;
                border-radius: 10px;
                margin-bottom: 1.5rem;
                text-align: left;
            }

            .stickywork-success-detail {
                margin: 0.5rem 0;
                color: ${colors.textPrimary};
                font-size: 1rem;
            }

            .stickywork-success-message {
                color: ${colors.textSecondary};
                margin-bottom: 1.5rem;
            }

            /* Modal styles */
            .stickywork-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9998;
                animation: fadeIn 0.3s ease;
            }

            .stickywork-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: ${colors.bgPrimary};
                border-radius: 20px;
                padding: 2rem;
                z-index: 9999;
                max-width: 650px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease;
            }

            .stickywork-close-btn {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: ${config.secondaryColor};
                color: white;
                border: none;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 1.2rem;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }

            .stickywork-close-btn:hover {
                transform: rotate(90deg);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from { opacity: 0; transform: translate(-50%, -45%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }

            @media (max-width: 600px) {
                .stickywork-row {
                    grid-template-columns: 1fr;
                }

                .stickywork-widget {
                    padding: 1.5rem;
                }

                .stickywork-modal {
                    width: 95%;
                    padding: 1.5rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Generar horarios disponibles
    function generateTimeSlots() {
        const slots = [];
        for (let hour = 9; hour <= 18; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            if (hour < 18) {
                slots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
        }
        return slots;
    }

    // Crear HTML del formulario
    function createFormHTML() {
        const t = translations[config.language];
        const timeSlots = generateTimeSlots();
        const isDemoMode = !config.apiUrl;

        return `
            <div class="stickywork-widget">
                <h3 class="stickywork-title">${t.title}</h3>

                <form class="stickywork-form" id="stickywork-form">
                    <div class="stickywork-field">
                        <label class="stickywork-label">${t.name}</label>
                        <input type="text" class="stickywork-input" name="name" placeholder="${t.name}" required>
                    </div>

                    <div class="stickywork-field">
                        <label class="stickywork-label">${t.email}</label>
                        <input type="email" class="stickywork-input" name="email" placeholder="${t.email}" required>
                    </div>

                    <div class="stickywork-field">
                        <label class="stickywork-label">${t.phone}</label>
                        <input type="tel" class="stickywork-input" name="phone" placeholder="+34 600 000 000">
                    </div>

                    <div class="stickywork-field">
                        <label class="stickywork-label">${t.service}</label>
                        <select class="stickywork-select" name="service" required>
                            <option value="">${t.selectService}</option>
                            ${config.services.map(service =>
                                `<option value="${service.name}">${service.name} - ${service.price}</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="stickywork-row">
                        <div class="stickywork-field">
                            <label class="stickywork-label">${t.date}</label>
                            <input type="date" class="stickywork-input" name="date" required>
                        </div>

                        <div class="stickywork-field">
                            <label class="stickywork-label">${t.time}</label>
                            <select class="stickywork-select" name="time" required>
                                <option value="">${t.selectTime}</option>
                                ${timeSlots.map(time => `<option value="${time}">${time}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <button type="submit" class="stickywork-button">${t.submit}</button>

                    ${isDemoMode ? `<p class="stickywork-note">${t.demoNote}</p>` : ''}
                </form>
            </div>
        `;
    }

    // Crear HTML de confirmación
    function createSuccessHTML(formData) {
        const t = translations[config.language];

        return `
            <div class="stickywork-widget">
                <div class="stickywork-success">
                    <div class="stickywork-success-icon">✓</div>
                    <h3 class="stickywork-success-title">${t.success}</h3>

                    <div class="stickywork-success-details">
                        <p class="stickywork-success-detail"><strong>${t.name}:</strong> ${formData.name}</p>
                        <p class="stickywork-success-detail"><strong>${t.email}:</strong> ${formData.email}</p>
                        ${formData.phone ? `<p class="stickywork-success-detail"><strong>${t.phone}:</strong> ${formData.phone}</p>` : ''}
                        <p class="stickywork-success-detail"><strong>${t.service}:</strong> ${formData.service}</p>
                        <p class="stickywork-success-detail"><strong>${t.date}:</strong> ${formData.date}</p>
                        <p class="stickywork-success-detail"><strong>${t.time}:</strong> ${formData.time}</p>
                    </div>

                    <p class="stickywork-success-message">${t.successMessage}</p>

                    <button onclick="StickyWork.reset()" class="stickywork-button">${t.newBooking}</button>
                </div>
            </div>
        `;
    }

    // Enviar reserva al backend
    async function submitBooking(formData) {
        if (!config.apiUrl) {
            // Modo demo: simular éxito después de 1 segundo
            return new Promise(resolve => {
                setTimeout(() => resolve({ success: true }), 1000);
            });
        }

        // Modo producción: enviar al backend
        try {
            const response = await fetch(`${config.apiUrl}/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    business_id: config.businessId
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Error al enviar reserva:', error);
            throw error;
        }
    }

    // Manejar envío del formulario
    function handleSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const formData = {
            name: form.name.value,
            email: form.email.value,
            phone: form.phone.value || '',
            service: form.service.value,
            date: form.date.value,
            time: form.time.value
        };

        // Deshabilitar botón
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '⏳ Enviando...';
        submitBtn.disabled = true;

        // Enviar
        submitBooking(formData)
            .then(response => {
                if (response.success !== false) {
                    // Mostrar confirmación
                    widgetContainer.innerHTML = createSuccessHTML(formData);
                } else {
                    alert('Error al crear la reserva. Por favor, inténtalo de nuevo.');
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            })
            .catch(error => {
                alert('Error al enviar la reserva. Por favor, verifica tu conexión.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
    }

    // Renderizar widget en modo embedded
    function renderEmbedded() {
        widgetContainer = document.getElementById('stickywork-widget');

        if (!widgetContainer) {
            console.error('StickyWork: No se encontró el contenedor #stickywork-widget');
            return;
        }

        widgetContainer.innerHTML = createFormHTML();

        // Agregar event listener al formulario
        const form = document.getElementById('stickywork-form');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
    }

    // Renderizar widget en modo modal
    function renderModal() {
        // Buscar el botón trigger
        const triggerBtn = document.getElementById('stickywork-btn');

        if (!triggerBtn) {
            console.error('StickyWork: No se encontró el botón #stickywork-btn');
            return;
        }

        // Agregar evento al botón
        triggerBtn.addEventListener('click', openModal);
    }

    // Abrir modal
    function openModal() {
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'stickywork-modal-overlay';
        overlay.id = 'stickywork-overlay';
        overlay.onclick = closeModal;

        // Crear modal
        const modal = document.createElement('div');
        modal.className = 'stickywork-modal';
        modal.id = 'stickywork-modal';
        modal.innerHTML = `
            <button class="stickywork-close-btn" onclick="StickyWork.closeModal()">✕</button>
            ${createFormHTML()}
        `;

        // Agregar al DOM
        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        // Event listener para el formulario en el modal
        const form = modal.querySelector('#stickywork-form');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }

        widgetContainer = modal.querySelector('.stickywork-widget');
    }

    // Cerrar modal
    function closeModal() {
        const overlay = document.getElementById('stickywork-overlay');
        const modal = document.getElementById('stickywork-modal');

        if (overlay) overlay.remove();
        if (modal) modal.remove();
    }

    // Reiniciar widget
    function reset() {
        if (config.mode === 'embedded') {
            renderEmbedded();
        } else {
            widgetContainer.innerHTML = createFormHTML();
            const form = widgetContainer.querySelector('#stickywork-form');
            if (form) {
                form.addEventListener('submit', handleSubmit);
            }
        }
    }

    // Función de inicialización pública
    window.StickyWork.init = function(userConfig) {
        config = { ...defaultConfig, ...userConfig };

        injectStyles();

        if (config.mode === 'embedded') {
            renderEmbedded();
        } else if (config.mode === 'modal') {
            renderModal();
        } else {
            console.error('StickyWork: Modo no válido. Usa "embedded" o "modal"');
        }
    };

    // Funciones públicas adicionales
    window.StickyWork.closeModal = closeModal;
    window.StickyWork.reset = reset;

})();
