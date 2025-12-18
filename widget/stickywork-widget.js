/**
 * StickyWork Widget - Sistema de Reservas Embebible Adaptativo
 * Version: 2.0.0
 * Soporta diferentes tipos de negocio: servicios, restaurantes, clases
 */

(function() {
    'use strict';

    window.StickyWork = window.StickyWork || {};

    // Configuracion por defecto
    const defaultConfig = {
        businessId: 1,
        mode: 'embedded',
        bookingMode: 'services', // 'services', 'tables', 'classes', 'simple'
        apiUrl: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#ef4444',
        language: 'es',
        buttonText: 'Reserva tu Cita',
        showPrices: true,
        showDuration: true,
        position: 'bottom-right', // Para modo floating
        buttonColor: '#3b82f6', // Para modo floating
        // Datos que se cargan del backend
        services: [],
        professionals: [],
        zones: [],
        classes: []
    };

    let config = {};
    let widgetContainer = null;
    let businessConfig = null;

    // Traducciones
    const translations = {
        es: {
            title: 'Reserva tu Cita',
            titleRestaurant: 'Reserva tu Mesa',
            titleClass: 'Reserva tu Clase',
            name: 'Nombre completo',
            email: 'Email',
            phone: 'Telefono',
            service: 'Servicio',
            selectService: 'Selecciona un servicio',
            professional: 'Profesional',
            selectProfessional: 'Cualquier profesional',
            numPeople: 'Numero de personas',
            zone: 'Zona preferida',
            selectZone: 'Sin preferencia',
            class: 'Clase',
            selectClass: 'Selecciona una clase',
            date: 'Fecha',
            time: 'Hora',
            selectTime: 'Selecciona una hora',
            notes: 'Notas adicionales',
            notesPlaceholder: 'Alguna peticion especial...',
            submit: 'Reservar',
            success: 'Reserva Confirmada!',
            successMessage: 'Recibiras un email de confirmacion en breve',
            newBooking: 'Nueva Reserva',
            demoNote: 'Demo - En produccion se guardara en tu base de datos',
            loading: 'Cargando...',
            error: 'Error al cargar. Intentalo de nuevo.',
            people: 'personas',
            person: 'persona',
            minutes: 'min',
            spots: 'plazas'
        },
        en: {
            title: 'Book Your Appointment',
            titleRestaurant: 'Book Your Table',
            titleClass: 'Book Your Class',
            name: 'Full name',
            email: 'Email',
            phone: 'Phone',
            service: 'Service',
            selectService: 'Select a service',
            professional: 'Professional',
            selectProfessional: 'Any professional',
            numPeople: 'Number of guests',
            zone: 'Preferred area',
            selectZone: 'No preference',
            class: 'Class',
            selectClass: 'Select a class',
            date: 'Date',
            time: 'Time',
            selectTime: 'Select a time',
            notes: 'Additional notes',
            notesPlaceholder: 'Any special requests...',
            submit: 'Book Now',
            success: 'Booking Confirmed!',
            successMessage: 'You will receive a confirmation email shortly',
            newBooking: 'New Booking',
            demoNote: 'Demo - In production it will save to your database',
            loading: 'Loading...',
            error: 'Error loading. Please try again.',
            people: 'guests',
            person: 'guest',
            minutes: 'min',
            spots: 'spots'
        }
    };

    // Obtener colores del tema
    function getThemeColors() {
        const htmlElement = document.documentElement;
        const isDark = htmlElement.classList.contains('dark-mode');
        return {
            bgPrimary: isDark ? '#1e293b' : '#ffffff',
            bgSecondary: isDark ? '#334155' : '#f8fafc',
            textPrimary: isDark ? '#f1f5f9' : '#1e293b',
            textSecondary: isDark ? '#94a3b8' : '#64748b',
            borderColor: isDark ? '#475569' : '#e2e8f0'
        };
    }

    // Inyectar estilos
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
            }
            .stickywork-widget * { box-sizing: border-box; }
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
            .stickywork-field { display: flex; flex-direction: column; }
            .stickywork-label {
                display: block;
                margin-bottom: 0.5rem;
                color: ${colors.textPrimary};
                font-weight: 500;
                font-size: 0.95rem;
            }
            .stickywork-input,
            .stickywork-select,
            .stickywork-textarea {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid ${colors.borderColor};
                border-radius: 8px;
                font-size: 1rem;
                background: ${colors.bgPrimary};
                color: ${colors.textPrimary};
                transition: all 0.3s ease;
            }
            .stickywork-textarea {
                resize: vertical;
                min-height: 80px;
            }
            .stickywork-input:focus,
            .stickywork-select:focus,
            .stickywork-textarea:focus {
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
            .stickywork-service-option {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .stickywork-service-details {
                font-size: 0.85rem;
                color: ${colors.textSecondary};
            }
            .stickywork-people-selector {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            .stickywork-people-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 2px solid ${config.primaryColor};
                background: transparent;
                color: ${config.primaryColor};
                font-size: 1.5rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .stickywork-people-btn:hover {
                background: ${config.primaryColor};
                color: white;
            }
            .stickywork-people-count {
                font-size: 1.5rem;
                font-weight: 600;
                min-width: 60px;
                text-align: center;
                color: ${colors.textPrimary};
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
            }
            .stickywork-success-message {
                color: ${colors.textSecondary};
                margin-bottom: 1.5rem;
            }
            .stickywork-loading {
                text-align: center;
                padding: 3rem;
                color: ${colors.textSecondary};
            }
            .stickywork-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9998;
                animation: stickywork-fadeIn 0.3s ease;
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
                animation: stickywork-slideUp 0.3s ease;
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
            }
            @keyframes stickywork-fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes stickywork-slideUp {
                from { opacity: 0; transform: translate(-50%, -45%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
            @media (max-width: 600px) {
                .stickywork-row { grid-template-columns: 1fr; }
                .stickywork-widget { padding: 1.5rem; }
                .stickywork-modal { width: 95%; padding: 1.5rem; }
            }
            .stickywork-floating-btn {
                position: fixed;
                z-index: 9997;
                padding: 1rem 1.5rem;
                background: ${config.buttonColor || config.primaryColor};
                color: white;
                border: none;
                border-radius: 50px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .stickywork-floating-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
            }
            .stickywork-floating-btn.bottom-right {
                bottom: 2rem;
                right: 2rem;
            }
            .stickywork-floating-btn.bottom-left {
                bottom: 2rem;
                left: 2rem;
            }
            .stickywork-floating-btn.top-right {
                top: 2rem;
                right: 2rem;
            }
            .stickywork-floating-btn.top-left {
                top: 2rem;
                left: 2rem;
            }
            @media (max-width: 600px) {
                .stickywork-floating-btn {
                    padding: 0.8rem 1.2rem;
                    font-size: 0.9rem;
                }
                .stickywork-floating-btn.bottom-right,
                .stickywork-floating-btn.bottom-left {
                    bottom: 1rem;
                }
                .stickywork-floating-btn.bottom-right {
                    right: 1rem;
                }
                .stickywork-floating-btn.bottom-left {
                    left: 1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Cargar configuracion del negocio
    async function loadBusinessConfig() {
        if (!config.apiUrl || !config.businessId) return null;

        try {
            console.log('📡 [Widget] Cargando config desde:', `${config.apiUrl}/api/widget/${config.businessId}`);
            const response = await fetch(`${config.apiUrl}/api/widget/${config.businessId}`);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ [Widget] Config recibida:', data);
                console.log('   - scheduleType:', data.scheduleType);
                console.log('   - shifts:', data.shifts);
                return data;
            }
        } catch (error) {
            console.log('StickyWork: Usando configuracion local');
        }
        return null;
    }

    // Función auxiliar: Generar slots para un rango de tiempo específico
    function generateSlotsForRange(startTime, endTime, duration) {
        const slots = [];
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        let currentMin = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        while (currentMin < endMinutes) {
            const hour = Math.floor(currentMin / 60);
            const min = currentMin % 60;
            slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
            currentMin += duration;
        }

        return slots;
    }

    // Generar horarios (soporta horarios continuos y partidos)
    function generateTimeSlots() {
        const slots = [];
        const scheduleType = businessConfig?.scheduleType || 'continuous';
        const slotDuration = businessConfig?.slotDuration || 30;

        console.log('🕐 [Widget] Generando slots - scheduleType:', scheduleType);
        console.log('🕐 [Widget] businessConfig.shifts:', businessConfig?.shifts);

        if (scheduleType === 'multiple' && businessConfig?.shifts) {
            console.log('✅ [Widget] Usando horarios partidos con', businessConfig.shifts.length, 'turnos');
            // Generar slots para cada turno activo
            businessConfig.shifts.forEach(shift => {
                if (!shift.enabled) {
                    console.log('⏭️ [Widget] Turno deshabilitado:', shift.name);
                    return;
                }

                console.log(`📋 [Widget] Generando slots para turno "${shift.name}": ${shift.startTime}-${shift.endTime}`);
                const shiftSlots = generateSlotsForRange(
                    shift.startTime,
                    shift.endTime,
                    slotDuration
                );

                console.log(`   ✓ Slots generados: ${shiftSlots.length}`);
                slots.push(...shiftSlots);
            });
        } else {
            console.log('📋 [Widget] Usando horario continuo');
            // Modo continuo (legacy)
            const start = businessConfig?.workHoursStart || '09:00';
            const end = businessConfig?.workHoursEnd || '20:00';

            console.log(`   Rango: ${start}-${end}`);
            slots.push(...generateSlotsForRange(start, end, slotDuration));
        }

        console.log(`🎯 [Widget] Total de slots generados: ${slots.length}`);
        return slots;
    }

    // Obtener titulo segun modo
    function getTitle() {
        const t = translations[config.language];
        switch (config.bookingMode) {
            case 'tables': return t.titleRestaurant;
            case 'classes': return t.titleClass;
            default: return t.title;
        }
    }

    // Crear campos segun modo de reserva
    function createModeSpecificFields() {
        const t = translations[config.language];

        switch (config.bookingMode) {
            case 'tables':
                return createRestaurantFields(t);
            case 'classes':
                return createClassFields(t);
            case 'services':
            default:
                return createServiceFields(t);
        }
    }

    // Campos para servicios (peluqueria, clinica, etc.)
    function createServiceFields(t) {
        const serviceOptions = config.services.length > 0
            ? config.services.map(s => {
                const details = [];
                if (config.showDuration && s.duration) details.push(`${s.duration}${t.minutes}`);
                if (config.showPrices && s.price) details.push(`${s.price}€`);
                const detailsStr = details.length > 0 ? ` - ${details.join(' / ')}` : '';
                return `<option value="${s.id || ''}">${s.name}${detailsStr}</option>`;
            }).join('')
            : '';

        const professionalField = config.professionals && config.professionals.length > 0
            ? `
                <div class="stickywork-field">
                    <label class="stickywork-label">${t.professional}</label>
                    <select class="stickywork-select" name="professional">
                        <option value="">${t.selectProfessional}</option>
                        ${config.professionals.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                </div>
            `
            : '';

        return `
            <div class="stickywork-field">
                <label class="stickywork-label">${t.service}</label>
                <select class="stickywork-select" name="service" required>
                    <option value="">${t.selectService}</option>
                    ${serviceOptions}
                </select>
            </div>
            ${professionalField}
        `;
    }

    // Campos para restaurantes
    function createRestaurantFields(t) {
        const zoneOptions = config.zones && config.zones.length > 0
            ? config.zones.map(z => `<option value="${z.id || z.name}">${z.name}</option>`).join('')
            : `
                <option value="interior">Interior</option>
                <option value="terraza">Terraza</option>
            `;

        return `
            <div class="stickywork-field">
                <label class="stickywork-label">${t.numPeople}</label>
                <div class="stickywork-people-selector">
                    <button type="button" class="stickywork-people-btn" onclick="StickyWork.decrementPeople()">-</button>
                    <span class="stickywork-people-count" id="stickywork-people-count">2</span>
                    <button type="button" class="stickywork-people-btn" onclick="StickyWork.incrementPeople()">+</button>
                    <span style="color: var(--text-secondary);">${t.people}</span>
                </div>
                <input type="hidden" name="numPeople" id="stickywork-num-people" value="2">
            </div>
            <div class="stickywork-field">
                <label class="stickywork-label">${t.zone}</label>
                <select class="stickywork-select" name="zone">
                    <option value="">${t.selectZone}</option>
                    ${zoneOptions}
                </select>
            </div>
        `;
    }

    // Campos para clases (gimnasio)
    function createClassFields(t) {
        const classOptions = config.classes && config.classes.length > 0
            ? config.classes.map(c => {
                const spots = c.capacity ? ` (${c.capacity} ${t.spots})` : '';
                return `<option value="${c.id || c.name}">${c.name}${spots}</option>`;
            }).join('')
            : `
                <option value="yoga">Yoga - 60${t.minutes}</option>
                <option value="spinning">Spinning - 45${t.minutes}</option>
                <option value="pilates">Pilates - 50${t.minutes}</option>
            `;

        return `
            <div class="stickywork-field">
                <label class="stickywork-label">${t.class}</label>
                <select class="stickywork-select" name="class" required>
                    <option value="">${t.selectClass}</option>
                    ${classOptions}
                </select>
            </div>
        `;
    }

    // Crear HTML del formulario
    function createFormHTML() {
        const t = translations[config.language];
        const timeSlots = generateTimeSlots();
        const isDemoMode = !config.apiUrl;
        const showNotes = config.bookingMode === 'services';

        return `
            <div class="stickywork-widget">
                <h3 class="stickywork-title">${getTitle()}</h3>
                <form class="stickywork-form" id="stickywork-form">
                    <div class="stickywork-row">
                        <div class="stickywork-field">
                            <label class="stickywork-label">${t.name}</label>
                            <input type="text" class="stickywork-input" name="name" placeholder="${t.name}" required>
                        </div>
                        <div class="stickywork-field">
                            <label class="stickywork-label">${t.phone}</label>
                            <input type="tel" class="stickywork-input" name="phone" placeholder="+34 600 000 000" required>
                        </div>
                    </div>
                    <div class="stickywork-field">
                        <label class="stickywork-label">${t.email}</label>
                        <input type="email" class="stickywork-input" name="email" placeholder="${t.email}" required>
                    </div>
                    ${createModeSpecificFields()}
                    <div class="stickywork-row">
                        <div class="stickywork-field">
                            <label class="stickywork-label">${t.date}</label>
                            <input type="date" class="stickywork-input" name="date" required min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="stickywork-field">
                            <label class="stickywork-label">${t.time}</label>
                            <select class="stickywork-select" name="time" required>
                                <option value="">${t.selectTime}</option>
                                ${timeSlots.map(time => `<option value="${time}">${time}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    ${showNotes ? `
                        <div class="stickywork-field">
                            <label class="stickywork-label">${t.notes}</label>
                            <textarea class="stickywork-textarea" name="notes" placeholder="${t.notesPlaceholder}"></textarea>
                        </div>
                    ` : ''}
                    <button type="submit" class="stickywork-button">${t.submit}</button>
                    ${isDemoMode ? `<p class="stickywork-note">${t.demoNote}</p>` : ''}
                </form>
            </div>
        `;
    }

    // Crear HTML de confirmacion
    function createSuccessHTML(formData) {
        const t = translations[config.language];
        let details = `
            <p class="stickywork-success-detail"><strong>${t.name}:</strong> ${formData.name}</p>
            <p class="stickywork-success-detail"><strong>${t.email}:</strong> ${formData.email}</p>
            ${formData.phone ? `<p class="stickywork-success-detail"><strong>${t.phone}:</strong> ${formData.phone}</p>` : ''}
        `;

        if (config.bookingMode === 'tables') {
            details += `
                <p class="stickywork-success-detail"><strong>${t.numPeople}:</strong> ${formData.numPeople} ${formData.numPeople > 1 ? t.people : t.person}</p>
                ${formData.zone ? `<p class="stickywork-success-detail"><strong>${t.zone}:</strong> ${formData.zone}</p>` : ''}
            `;
        } else if (config.bookingMode === 'classes') {
            details += `<p class="stickywork-success-detail"><strong>${t.class}:</strong> ${formData.class}</p>`;
        } else {
            details += `<p class="stickywork-success-detail"><strong>${t.service}:</strong> ${formData.service}</p>`;
            if (formData.professional) {
                details += `<p class="stickywork-success-detail"><strong>${t.professional}:</strong> ${formData.professional}</p>`;
            }
        }

        details += `
            <p class="stickywork-success-detail"><strong>${t.date}:</strong> ${formData.date}</p>
            <p class="stickywork-success-detail"><strong>${t.time}:</strong> ${formData.time}</p>
        `;

        return `
            <div class="stickywork-widget">
                <div class="stickywork-success">
                    <div class="stickywork-success-icon">✓</div>
                    <h3 class="stickywork-success-title">${t.success}</h3>
                    <div class="stickywork-success-details">${details}</div>
                    <p class="stickywork-success-message">${t.successMessage}</p>
                    <button onclick="StickyWork.reset()" class="stickywork-button">${t.newBooking}</button>
                </div>
            </div>
        `;
    }

    // Enviar reserva
    async function submitBooking(formData) {
        if (!config.apiUrl) {
            return new Promise(resolve => {
                setTimeout(() => resolve({ success: true }), 1000);
            });
        }

        try {
            // Mapear campos del formulario a los nombres que espera el backend
            const bookingData = {
                business_id: config.businessId,
                customer_name: formData.name,
                customer_email: formData.email,
                customer_phone: formData.phone || '',
                booking_date: formData.date,
                booking_time: formData.time,
                service_id: formData.service || null,
                notes: formData.notes || ''
            };

            const response = await fetch(`${config.apiUrl}/api/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error al enviar reserva:', error);
            throw error;
        }
    }

    // Manejar submit
    function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;

        const formData = {
            name: form.name.value,
            email: form.email.value,
            phone: form.phone?.value || '',
            date: form.date.value,
            time: form.time.value
        };

        // Campos segun modo
        if (config.bookingMode === 'tables') {
            formData.numPeople = parseInt(form.numPeople.value) || 2;
            formData.zone = form.zone?.value || '';
        } else if (config.bookingMode === 'classes') {
            formData.class = form.class?.value || '';
        } else {
            formData.service = form.service?.value || '';
            formData.professional = form.professional?.value || '';
            formData.notes = form.notes?.value || '';
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;

        submitBooking(formData)
            .then(response => {
                if (response.success !== false) {
                    widgetContainer.innerHTML = createSuccessHTML(formData);
                } else {
                    alert('Error al crear la reserva. Por favor, intentalo de nuevo.');
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            })
            .catch(() => {
                alert('Error al enviar la reserva. Por favor, verifica tu conexion.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
    }

    // Contador de personas
    let peopleCount = 2;

    window.StickyWork.incrementPeople = function() {
        if (peopleCount < 20) {
            peopleCount++;
            updatePeopleCount();
        }
    };

    window.StickyWork.decrementPeople = function() {
        if (peopleCount > 1) {
            peopleCount--;
            updatePeopleCount();
        }
    };

    function updatePeopleCount() {
        const countEl = document.getElementById('stickywork-people-count');
        const inputEl = document.getElementById('stickywork-num-people');
        if (countEl) countEl.textContent = peopleCount;
        if (inputEl) inputEl.value = peopleCount;
    }

    // Renderizar embedded
    function renderEmbedded() {
        widgetContainer = document.getElementById('stickywork-widget');
        if (!widgetContainer) {
            console.error('StickyWork: No se encontro el contenedor #stickywork-widget');
            return;
        }

        widgetContainer.innerHTML = createFormHTML();
        const form = document.getElementById('stickywork-form');
        if (form) form.addEventListener('submit', handleSubmit);
    }

    // Renderizar modal
    function renderModal() {
        const triggerBtn = document.getElementById('stickywork-btn');
        if (!triggerBtn) {
            console.error('StickyWork: No se encontro el boton #stickywork-btn');
            return;
        }
        triggerBtn.addEventListener('click', openModal);
    }

    function openModal() {
        const overlay = document.createElement('div');
        overlay.className = 'stickywork-modal-overlay';
        overlay.id = 'stickywork-overlay';
        overlay.onclick = closeModal;

        const modal = document.createElement('div');
        modal.className = 'stickywork-modal';
        modal.id = 'stickywork-modal';
        modal.innerHTML = `
            <button class="stickywork-close-btn" onclick="StickyWork.closeModal()">✕</button>
            ${createFormHTML()}
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        const form = modal.querySelector('#stickywork-form');
        if (form) form.addEventListener('submit', handleSubmit);
        widgetContainer = modal.querySelector('.stickywork-widget');
    }

    function closeModal() {
        const overlay = document.getElementById('stickywork-overlay');
        const modal = document.getElementById('stickywork-modal');
        if (overlay) overlay.remove();
        if (modal) modal.remove();
    }

    // Renderizar botón flotante
    function renderFloating() {
        const position = config.position || 'bottom-right';
        const buttonText = config.buttonText || 'Reservar';

        const floatingBtn = document.createElement('button');
        floatingBtn.className = `stickywork-floating-btn ${position}`;
        floatingBtn.id = 'stickywork-floating-btn';
        floatingBtn.innerHTML = `📅 ${buttonText}`;
        floatingBtn.onclick = openModal;

        document.body.appendChild(floatingBtn);
    }

    function reset() {
        peopleCount = 2;
        if (config.mode === 'embedded') {
            renderEmbedded();
        } else {
            widgetContainer.innerHTML = createFormHTML();
            const form = widgetContainer.querySelector('#stickywork-form');
            if (form) form.addEventListener('submit', handleSubmit);
        }
    }

    // Inicializacion
    window.StickyWork.init = async function(userConfig) {
        config = { ...defaultConfig, ...userConfig };

        // Cargar configuracion del backend si hay API
        if (config.apiUrl && config.businessId) {
            const loaded = await loadBusinessConfig();
            if (loaded) {
                businessConfig = loaded;
                config = { ...config, ...loaded };
            }
        }

        injectStyles();

        if (config.mode === 'embedded') {
            renderEmbedded();
        } else if (config.mode === 'modal') {
            renderModal();
        } else if (config.mode === 'floating') {
            renderFloating();
        }
    };

    window.StickyWork.closeModal = closeModal;
    window.StickyWork.reset = reset;

})();
