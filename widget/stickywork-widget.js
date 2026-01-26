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
        bookingMode: 'services', // 'services', 'tables', 'classes', 'workshops', 'simple'
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
        classes: [],
        workshops: []
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
            titleWorkshop: 'Reserva tu Taller',
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
            workshop: 'Taller',
            selectWorkshop: 'Selecciona un taller',
            noWorkshops: 'No hay talleres disponibles en este momento',
            workshopDate: 'Fecha del taller',
            workshopTime: 'Horario',
            workshopPrice: 'Precio',
            workshopSpots: 'Plazas disponibles',
            workshopFull: 'Completo',
            date: 'Fecha',
            time: 'Hora',
            selectTime: 'Selecciona una hora',
            notes: 'Notas adicionales',
            notesPlaceholder: 'Alguna peticion especial...',
            whatsappConsent: 'Quiero recibir confirmación de mi reserva por WhatsApp (opcional)',
            whatsappPrivacyNote: 'Al marcar esta casilla, consientes que te contactemos vía WhatsApp.',
            privacyPolicy: 'Política de privacidad',
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
            spots: 'plazas',
            free: 'Gratis'
        },
        en: {
            title: 'Book Your Appointment',
            titleRestaurant: 'Book Your Table',
            titleClass: 'Book Your Class',
            titleWorkshop: 'Book Your Workshop',
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
            workshop: 'Workshop',
            selectWorkshop: 'Select a workshop',
            noWorkshops: 'No workshops available at this time',
            workshopDate: 'Workshop date',
            workshopTime: 'Schedule',
            workshopPrice: 'Price',
            workshopSpots: 'Available spots',
            workshopFull: 'Full',
            date: 'Date',
            time: 'Time',
            selectTime: 'Select a time',
            notes: 'Additional notes',
            notesPlaceholder: 'Any special requests...',
            whatsappConsent: 'I want to receive booking confirmation via WhatsApp (optional)',
            whatsappPrivacyNote: 'By checking this box, you consent to be contacted via WhatsApp.',
            privacyPolicy: 'Privacy policy',
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
            spots: 'spots',
            free: 'Free'
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

        // Aplicar customización visual si existe
        const customization = config.customization || {};
        const primaryColor = customization.primaryColor || config.primaryColor || '#3b82f6';
        const secondaryColor = customization.secondaryColor || config.secondaryColor || '#8b5cf6';
        const fontFamily = customization.fontFamily || '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif';
        const borderRadius = customization.borderRadius || '12px';
        const buttonStyle = customization.buttonStyle || 'solid';

        // Actualizar config con valores de customización para usar en todo el widget
        config.primaryColor = primaryColor;
        config.secondaryColor = secondaryColor;
        config.borderRadius = borderRadius;
        config.fontFamily = fontFamily;
        config.buttonStyle = buttonStyle;

        const style = document.createElement('style');
        style.id = 'stickywork-styles';
        style.textContent = `
            .stickywork-widget {
                font-family: ${fontFamily};
                max-width: 600px;
                margin: 0 auto;
                background: ${colors.bgPrimary};
                padding: 2rem;
                border-radius: ${borderRadius};
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
                border-radius: ${borderRadius};
                font-size: 1rem;
                background: ${colors.bgPrimary};
                color: ${colors.textPrimary};
                transition: all 0.3s ease;
                font-family: ${fontFamily};
            }
            /* Custom Select Styles */
            .stickywork-custom-select {
                position: relative;
                width: 100%;
            }
            .stickywork-custom-select-trigger {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid ${colors.borderColor};
                border-radius: ${borderRadius};
                background: ${colors.bgPrimary};
                color: ${colors.textPrimary};
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.3s ease;
                font-family: ${fontFamily};
            }
            .stickywork-custom-select-trigger:hover {
                border-color: ${config.primaryColor};
            }
            .stickywork-custom-select.active .stickywork-custom-select-trigger {
                border-color: ${config.primaryColor};
                box-shadow: 0 0 0 3px ${config.primaryColor}20;
            }
            .stickywork-custom-select-arrow {
                transition: transform 0.3s ease;
                font-size: 0.8rem;
            }
            .stickywork-custom-select.active .stickywork-custom-select-arrow {
                transform: rotate(180deg);
            }
            .stickywork-custom-select-dropdown {
                position: absolute;
                top: calc(100% + 4px);
                left: 0;
                right: 0;
                max-height: 300px;
                overflow-y: auto;
                background: ${colors.bgPrimary};
                border: 2px solid ${config.primaryColor};
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: none;
                z-index: 99999;
            }
            .stickywork-custom-select.active .stickywork-custom-select-dropdown {
                display: block !important;
            }
            .stickywork-custom-select-group-label {
                padding: 0.6rem 0.75rem;
                font-weight: bold;
                font-size: 0.85rem;
                color: ${config.primaryColor};
                background: ${config.primaryColor}10;
                border-bottom: 1px solid ${config.primaryColor}30;
            }
            .stickywork-custom-select-option {
                padding: 0.6rem 0.75rem;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            .stickywork-custom-select-option:hover {
                background: ${config.primaryColor}20;
            }
            .stickywork-custom-select-option.selected {
                background: ${config.primaryColor};
                color: white;
            }
            .stickywork-custom-select-option.disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: #f5f5f5;
                color: #999;
            }
            .stickywork-custom-select-option.disabled:hover {
                background: #f5f5f5;
            }
            .stickywork-availability-badge {
                font-size: 0.85em;
                margin-left: 0.5rem;
                font-weight: 500;
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

            /* Calendario personalizado como dropdown */
            .stickywork-calendar-dropdown {
                position: relative;
                width: 100%;
            }
            .stickywork-calendar-trigger {
                background: ${colors.bgPrimary};
                border: 1px solid ${colors.border};
                border-radius: 8px;
                padding: 0.75rem 1rem;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s;
                min-height: 48px;
            }
            .stickywork-calendar-trigger:hover {
                border-color: ${config.primaryColor};
            }
            .stickywork-calendar-trigger.open {
                border-color: ${config.primaryColor};
                box-shadow: 0 0 0 3px ${config.primaryColor}20;
            }
            .stickywork-calendar-value {
                color: ${colors.textPrimary};
                font-size: 1rem;
            }
            .stickywork-calendar-value.placeholder {
                color: ${colors.textSecondary};
            }
            .stickywork-calendar-arrow {
                font-size: 1.2rem;
                transition: transform 0.2s;
            }
            .stickywork-calendar-trigger.open .stickywork-calendar-arrow {
                transform: rotate(180deg);
            }
            .stickywork-calendar-dropdown-content {
                position: absolute;
                top: calc(100% + 0.5rem);
                left: 0;
                right: 0;
                background: ${colors.bgPrimary};
                border: 2px solid ${colors.border};
                border-radius: 12px;
                padding: 1rem;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1);
                z-index: 1000;
                display: none;
            }
            .stickywork-calendar-dropdown-content.open {
                display: block;
            }
            .stickywork-calendar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px solid ${colors.border};
            }
            .stickywork-calendar-nav {
                background: ${colors.bgSecondary};
                border: 1px solid ${colors.border};
                border-radius: 6px;
                padding: 0.5rem 0.75rem;
                cursor: pointer;
                font-size: 1.2rem;
                transition: all 0.2s;
            }
            .stickywork-calendar-nav:hover {
                background: ${config.primaryColor}10;
                border-color: ${config.primaryColor};
            }
            .stickywork-calendar-month {
                font-weight: 600;
                font-size: 1.1rem;
                color: ${colors.textPrimary};
            }
            .stickywork-calendar-weekdays {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 0.25rem;
                margin-bottom: 0.5rem;
            }
            .stickywork-calendar-weekday {
                text-align: center;
                font-size: 0.85rem;
                font-weight: 600;
                color: ${colors.textSecondary};
                padding: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
            }
            .stickywork-calendar-days {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 0.25rem;
            }
            .stickywork-calendar-day {
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                font-size: 0.95rem;
                cursor: pointer;
                transition: all 0.2s;
                border: 2px solid transparent;
                background: ${colors.bgSecondary};
                color: ${colors.textPrimary};
                box-sizing: border-box;
            }
            .stickywork-calendar-day:hover:not(.disabled):not(.blocked):not(.no-availability) {
                background: ${config.primaryColor}10;
                border-color: ${config.primaryColor};
                transform: scale(1.05);
            }
            .stickywork-calendar-day.selected {
                background: ${config.primaryColor};
                color: white;
                font-weight: 600;
            }
            .stickywork-calendar-day.today {
                border-color: ${config.primaryColor};
            }
            .stickywork-calendar-day.blocked {
                background: #f5f5f5;
                color: #999;
                cursor: not-allowed;
                position: relative;
            }
            .stickywork-calendar-day.blocked::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 10%;
                right: 10%;
                height: 2px;
                background: #999;
                transform: translateY(-50%) rotate(-45deg);
            }
            .stickywork-calendar-day.no-availability {
                background: #fee;
                color: #c33;
                cursor: not-allowed;
                font-weight: 600;
            }
            .stickywork-calendar-day.no-availability::before {
                content: '🔴';
                position: absolute;
                top: 2px;
                right: 2px;
                font-size: 8px;
            }
            .stickywork-calendar-day.disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            .stickywork-calendar-day.other-month {
                opacity: 0.4;
                color: ${colors.textSecondary};
            }

            .stickywork-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }
            .stickywork-button {
                ${buttonStyle === 'solid'
                    ? `background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); color: white; border: 2px solid ${primaryColor};`
                    : buttonStyle === 'outline'
                    ? `background: transparent; color: ${primaryColor}; border: 2px solid ${primaryColor};`
                    : `background: ${primaryColor}15; color: ${primaryColor}; border: 2px solid transparent;`
                }
                padding: 1rem;
                border-radius: ${borderRadius};
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 1rem;
            }
            .stickywork-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px ${primaryColor}40;
                ${buttonStyle === 'outline' ? `background: ${primaryColor}10;` : ''}
            }
            .stickywork-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            .stickywork-whatsapp-consent {
                margin: 1rem 0;
                padding: 0.75rem;
                background: ${colors.bgSecondary};
                border-radius: 8px;
            }
            .stickywork-checkbox-container {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                cursor: pointer;
                margin-bottom: 8px;
            }
            .stickywork-checkbox {
                width: 18px;
                height: 18px;
                cursor: pointer;
                flex-shrink: 0;
                margin-top: 2px;
                accent-color: ${config.primaryColor};
            }
            .stickywork-checkbox-label {
                font-size: 0.95rem;
                color: ${colors.textPrimary};
                line-height: 1.4;
                user-select: none;
            }
            .stickywork-privacy-note {
                font-size: 0.85rem;
                color: ${colors.textSecondary};
                margin: 5px 0 0 28px;
                line-height: 1.4;
            }
            .stickywork-privacy-link {
                color: ${config.primaryColor};
                text-decoration: none;
            }
            .stickywork-privacy-link:hover {
                text-decoration: underline;
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
                width: 70px;
                text-align: center;
                color: ${colors.textPrimary};
                border: 1px solid ${colors.border};
                border-radius: 8px;
                background: ${colors.bgPrimary};
                padding: 0.25rem;
            }
            .stickywork-people-count::-webkit-inner-spin-button,
            .stickywork-people-count::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            .stickywork-people-count[type=number] {
                -moz-appearance: textfield;
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
                .stickywork-widget {
                    padding: 0.75rem;
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    max-width: 100%;
                    margin: 0;
                }
                .stickywork-modal { width: 95%; padding: 1.5rem; }
                .stickywork-title {
                    font-size: 1.4rem;
                    margin-bottom: 1rem;
                }
                .stickywork-form {
                    gap: 0.75rem;
                }
                .stickywork-label {
                    font-size: 0.9rem;
                    margin-bottom: 0.4rem;
                }
                .stickywork-input,
                .stickywork-select,
                .stickywork-textarea,
                .stickywork-custom-select-trigger,
                .stickywork-calendar-trigger {
                    padding: 0.75rem;
                    font-size: 1rem;
                    min-height: 48px;
                }
                .stickywork-button {
                    padding: 1rem;
                    font-size: 1.05rem;
                    min-height: 48px;
                }
                .stickywork-calendar-header {
                    padding: 0.75rem 0.5rem;
                }
                .stickywork-calendar-month {
                    font-size: 1rem;
                }
                .stickywork-calendar-nav {
                    padding: 0.4rem 0.7rem;
                    font-size: 1rem;
                }
                .stickywork-calendar-day {
                    font-size: 0.85rem;
                    border-radius: 6px;
                }
                .stickywork-calendar-weekday {
                    font-size: 0.8rem;
                }
                .stickywork-time-slots {
                    gap: 0.5rem;
                }
                .stickywork-time-slot {
                    padding: 0.6rem;
                    font-size: 0.9rem;
                    border-radius: 6px;
                }
                .stickywork-custom-select-dropdown,
                .stickywork-calendar-dropdown-content {
                    max-height: 60vh;
                    overflow-y: auto;
                }
                .stickywork-availability-badge {
                    font-size: 0.8rem;
                }
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

            /* Workshop Styles */
            .stickywork-workshop-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                max-height: 400px;
                overflow-y: auto;
                padding-right: 0.5rem;
            }
            .stickywork-workshop-card {
                border: 2px solid ${colors.borderColor};
                border-radius: ${borderRadius};
                padding: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                background: ${colors.bgSecondary};
            }
            .stickywork-workshop-card:hover:not(.stickywork-workshop-full) {
                border-color: ${primaryColor};
                box-shadow: 0 4px 12px ${primaryColor}20;
                transform: translateY(-2px);
            }
            .stickywork-workshop-card.selected {
                border-color: ${primaryColor};
                background: ${primaryColor}10;
                box-shadow: 0 0 0 3px ${primaryColor}30;
            }
            .stickywork-workshop-card.stickywork-workshop-full {
                opacity: 0.6;
                cursor: not-allowed;
                background: ${colors.bgSecondary};
            }
            .stickywork-workshop-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.5rem;
            }
            .stickywork-workshop-name {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 600;
                color: ${colors.textPrimary};
            }
            .stickywork-workshop-price {
                background: ${primaryColor};
                color: white;
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: 600;
            }
            .stickywork-workshop-desc {
                color: ${colors.textSecondary};
                font-size: 0.9rem;
                margin: 0.5rem 0;
                line-height: 1.4;
            }
            .stickywork-workshop-info {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                margin: 0.75rem 0;
            }
            .stickywork-workshop-date,
            .stickywork-workshop-time {
                color: ${colors.textSecondary};
                font-size: 0.9rem;
            }
            .stickywork-workshop-footer {
                border-top: 1px solid ${colors.borderColor};
                padding-top: 0.75rem;
                margin-top: 0.5rem;
            }
            .stickywork-workshop-status {
                font-size: 0.85rem;
                font-weight: 500;
            }
            .stickywork-workshop-status.available {
                color: #10b981;
            }
            .stickywork-workshop-status.full {
                color: #ef4444;
            }
            .stickywork-workshop-empty {
                text-align: center;
                padding: 2rem;
                color: ${colors.textSecondary};
            }

            /* Tabs Styles */
            .stickywork-tabs {
                display: flex;
                gap: 0;
                margin-bottom: 1.5rem;
                border-bottom: 2px solid ${colors.borderColor};
            }
            .stickywork-tab {
                flex: 1;
                padding: 0.75rem 1rem;
                background: transparent;
                border: none;
                border-bottom: 3px solid transparent;
                margin-bottom: -2px;
                cursor: pointer;
                font-size: 1rem;
                font-weight: 500;
                color: ${colors.textSecondary};
                transition: all 0.3s ease;
                font-family: inherit;
            }
            .stickywork-tab:hover {
                color: ${primaryColor};
                background: ${primaryColor}10;
            }
            .stickywork-tab.active {
                color: ${primaryColor};
                border-bottom-color: ${primaryColor};
                font-weight: 600;
            }
            .stickywork-tab-icon {
                margin-right: 0.5rem;
            }
            .stickywork-tab-content {
                display: none;
            }
            .stickywork-tab-content.active {
                display: block;
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

    // Cargar talleres disponibles
    async function loadWorkshops() {
        if (!config.apiUrl || !config.businessId) return [];

        try {
            console.log('📡 [Widget] Cargando talleres desde:', `${config.apiUrl}/api/workshops/public/${config.businessId}`);
            const response = await fetch(`${config.apiUrl}/api/workshops/public/${config.businessId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.workshops) {
                    console.log('✅ [Widget] Talleres recibidos:', data.workshops.length);
                    return data.workshops;
                }
            }
        } catch (error) {
            console.error('❌ [Widget] Error al cargar talleres:', error);
        }
        return [];
    }

    // Función auxiliar: Generar slots para un rango de tiempo específico
    function generateSlotsForRange(startTime, endTime, duration, filterPastSlots = false) {
        const slots = [];
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        let currentMin = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Obtener hora actual si necesitamos filtrar slots pasados
        let currentTimeMinutes = null;
        if (filterPastSlots) {
            const now = new Date();
            currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
        }

        while (currentMin < endMinutes) {
            const hour = Math.floor(currentMin / 60);
            const min = currentMin % 60;
            const timeSlot = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

            // Solo agregar slot si no estamos filtrando, o si el slot es en el futuro
            if (!filterPastSlots || currentMin > currentTimeMinutes) {
                slots.push(timeSlot);
            }

            currentMin += duration;
        }

        return slots;
    }

    // Generar horarios (soporta horarios continuos y partidos)
    // Devuelve: { grouped: boolean, shifts: [{name, slots}] } o array plano de slots (legacy)
    function generateTimeSlots() {
        const scheduleType = businessConfig?.scheduleType || 'continuous';
        const slotDuration = businessConfig?.slotDuration || 30;

        // Verificar si la fecha seleccionada es hoy para filtrar horas pasadas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const isToday = selectedDate === todayStr;

        console.log('🕐 [Widget] Generando slots - scheduleType:', scheduleType);
        console.log('🕐 [Widget] Fecha seleccionada:', selectedDate, '- Es hoy:', isToday);
        console.log('🕐 [Widget] businessConfig.shifts:', businessConfig?.shifts);

        if (scheduleType === 'multiple' && businessConfig?.shifts) {
            console.log('✅ [Widget] Usando horarios partidos con', businessConfig.shifts.length, 'turnos');

            // Obtener día de la semana de la fecha seleccionada (1=Lunes, 7=Domingo)
            const selectedDateObj = new Date(selectedDate + 'T00:00:00');
            const dayOfWeek = selectedDateObj.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
            const selectedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convertir a formato 1=Lunes, 7=Domingo
            console.log('📅 [Widget] Día de la semana seleccionado:', selectedDay);

            // Generar slots agrupados por turno
            const groupedSlots = {
                grouped: true,
                shifts: []
            };

            businessConfig.shifts.forEach(shift => {
                if (!shift.enabled) {
                    console.log('⏭️ [Widget] Turno deshabilitado:', shift.name);
                    return;
                }

                // Verificar si el turno está activo en este día
                const activeDays = shift.activeDays || [1, 2, 3, 4, 5, 6, 7]; // Por defecto todos los días
                if (!activeDays.includes(selectedDay)) {
                    console.log(`⏭️ [Widget] Turno "${shift.name}" no activo este día (${selectedDay}). Días activos:`, activeDays);
                    return;
                }

                console.log(`📋 [Widget] Generando slots para turno "${shift.name}": ${shift.startTime}-${shift.endTime}`);
                const shiftSlots = generateSlotsForRange(
                    shift.startTime,
                    shift.endTime,
                    slotDuration,
                    isToday // Filtrar horas pasadas solo si es hoy
                );

                console.log(`   ✓ Slots generados: ${shiftSlots.length}`);

                groupedSlots.shifts.push({
                    name: shift.name,
                    slots: shiftSlots
                });
            });

            console.log(`🎯 [Widget] Total de turnos: ${groupedSlots.shifts.length}`);
            return groupedSlots;
        } else {
            console.log('📋 [Widget] Usando horario continuo');
            // Modo continuo (legacy) - devolver array plano
            const start = businessConfig?.workHoursStart || '09:00';
            const end = businessConfig?.workHoursEnd || '20:00';

            console.log(`   Rango: ${start}-${end}`);
            const slots = generateSlotsForRange(start, end, slotDuration, isToday); // Filtrar horas pasadas solo si es hoy
            console.log(`🎯 [Widget] Total de slots generados: ${slots.length}`);

            return { grouped: false, slots };
        }
    }

    // Obtener titulo segun modo
    function getTitle() {
        const t = translations[config.language];
        switch (config.bookingMode) {
            case 'tables': return t.titleRestaurant;
            case 'classes': return t.titleClass;
            case 'workshops': return t.titleWorkshop;
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
            case 'workshops':
                return createWorkshopFields(t);
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
        // Selector de zona (Terraza, Interior, etc.) - desde booking_settings.zones
        // Filtrar solo zonas activas (enabled: true)
        const zoneOptions = config.restaurantZones && config.restaurantZones.length > 0
            ? config.restaurantZones
                .filter(z => {
                    // Si es string (formato antiguo), siempre mostrar
                    if (typeof z === 'string') return true;
                    // Si es objeto, solo mostrar si enabled !== false
                    return z.enabled !== false;
                })
                .map(z => {
                    const zoneName = typeof z === 'string' ? z : z.name;
                    return `<option value="${zoneName}">${zoneName}</option>`;
                })
                .join('')
            : `
                <option value="Interior">Interior</option>
                <option value="Terraza">Terraza</option>
            `;

        return `
            <div class="stickywork-field">
                <label class="stickywork-label">${t.numPeople}</label>
                <div class="stickywork-people-selector">
                    <button type="button" class="stickywork-people-btn" id="stickywork-people-decrement">-</button>
                    <input type="number" class="stickywork-people-count" id="stickywork-people-count"
                           value="2" min="1" max="50"
                           oninput="StickyWork.updatePeopleCount(this.value)">
                    <button type="button" class="stickywork-people-btn" id="stickywork-people-increment">+</button>
                    <span style="color: var(--text-secondary);">${t.people}</span>
                </div>
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

    // Campos para talleres (workshops)
    function createWorkshopFields(t) {
        const workshops = config.workshops || [];

        if (workshops.length === 0) {
            return `
                <div class="stickywork-workshop-empty">
                    <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        ${t.noWorkshops}
                    </p>
                </div>
            `;
        }

        // Formatear fecha
        const formatDate = (dateStr) => {
            const date = new Date(dateStr + 'T00:00:00');
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        };

        // Formatear hora
        const formatTime = (timeStr) => {
            return timeStr ? timeStr.substring(0, 5) : '';
        };

        // Crear tarjetas de talleres
        const workshopCards = workshops.map(w => {
            const availableSpots = w.available_spots || (w.capacity - (w.booked_count || 0));
            const isFull = availableSpots <= 0;
            const priceText = w.price > 0 ? `${w.price}€` : t.free;

            return `
                <div class="stickywork-workshop-card ${isFull ? 'stickywork-workshop-full' : ''}"
                     data-workshop-id="${w.id}"
                     ${!isFull ? `onclick="StickyWork.selectWorkshop(${w.id})"` : ''}>
                    <div class="stickywork-workshop-header">
                        <h4 class="stickywork-workshop-name">${w.name}</h4>
                        <span class="stickywork-workshop-price">${priceText}</span>
                    </div>
                    ${w.description ? `<p class="stickywork-workshop-desc">${w.description}</p>` : ''}
                    <div class="stickywork-workshop-info">
                        <span class="stickywork-workshop-date">📅 ${formatDate(w.workshop_date)}</span>
                        <span class="stickywork-workshop-time">🕐 ${formatTime(w.start_time)} - ${formatTime(w.end_time)}</span>
                    </div>
                    <div class="stickywork-workshop-footer">
                        ${isFull
                            ? `<span class="stickywork-workshop-status full">🔴 ${t.workshopFull}</span>`
                            : `<span class="stickywork-workshop-status available">🟢 ${availableSpots} ${t.workshopSpots}</span>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="stickywork-field">
                <label class="stickywork-label">${t.workshop}</label>
                <div class="stickywork-workshop-list">
                    ${workshopCards}
                </div>
                <input type="hidden" name="workshop_id" required>
            </div>
            <div class="stickywork-field">
                <label class="stickywork-label">${t.numPeople}</label>
                <div class="stickywork-people-selector">
                    <button type="button" class="stickywork-people-btn" id="stickywork-people-decrement">-</button>
                    <input type="number" class="stickywork-people-count" id="stickywork-people-count"
                           value="1" min="1" max="10"
                           oninput="StickyWork.updatePeopleCount(this.value)">
                    <button type="button" class="stickywork-people-btn" id="stickywork-people-increment">+</button>
                    <span style="color: var(--text-secondary);">${t.people}</span>
                </div>
            </div>
        `;
    }

    // Variable para taller seleccionado
    let selectedWorkshop = null;

    // Seleccionar taller
    window.StickyWork.selectWorkshop = function(workshopId) {
        const workshop = config.workshops.find(w => w.id === workshopId);
        if (!workshop) return;

        selectedWorkshop = workshop;

        // Actualizar input hidden
        const input = document.querySelector('input[name="workshop_id"]');
        if (input) input.value = workshopId;

        // Actualizar UI - marcar como seleccionado
        document.querySelectorAll('.stickywork-workshop-card').forEach(card => {
            card.classList.remove('selected');
        });
        const selectedCard = document.querySelector(`.stickywork-workshop-card[data-workshop-id="${workshopId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        console.log('🎫 [Widget] Taller seleccionado:', workshop.name);
    };

    // Cambiar entre tabs (servicios/talleres)
    window.StickyWork.switchTab = function(mode) {
        console.log('🔄 [Widget] Cambiando a tab:', mode);
        currentTabMode = mode;
        selectedWorkshop = null;

        // Re-renderizar el widget
        if (widgetContainer) {
            widgetContainer.innerHTML = createFormHTML();
            const form = widgetContainer.querySelector('#stickywork-form');
            if (form) form.addEventListener('submit', handleSubmit);

            // Inicializar componentes
            initCustomSelect();
            initPeopleButtons();

            // Solo inicializar calendario si no es modo workshops
            if (mode !== 'workshops') {
                calendarDropdownInitialized = false;
                initDateListener();
                initZoneListener();
                renderCalendar();
                initCalendarDropdown();
            }
        }
    };

    // Variable para rastrear el modo actual (para tabs)
    let currentTabMode = null;

    // Obtener etiqueta del tab según el modo
    function getTabLabel(mode) {
        const t = translations[config.language];
        switch (mode) {
            case 'services': return '✂️ Servicios';
            case 'tables': return '🍽️ Mesas';
            case 'classes': return '🏋️ Clases';
            case 'workshops': return '🎫 Talleres';
            default: return '📅 Reservar';
        }
    }

    // Crear HTML del formulario
    function createFormHTML() {
        const t = translations[config.language];
        const timeSlots = generateTimeSlots();
        const isDemoMode = !config.apiUrl;
        const showNotes = config.bookingMode === 'services';
        const isWorkshopMode = config.bookingMode === 'workshops';
        const hasWorkshops = config.workshops && config.workshops.length > 0;
        const showTabs = hasWorkshops && !isWorkshopMode;

        // Inicializar modo actual si no está definido
        if (!currentTabMode) {
            currentTabMode = config.bookingMode;
        }

        // Para workshops, no necesitamos el row de fecha/hora ya que viene del taller
        const dateTimeSection = (isWorkshopMode || currentTabMode === 'workshops') ? '' : `
                    <div class="stickywork-row">
                        <div class="stickywork-field">
                            <label class="stickywork-label">${t.date}</label>
                            <input type="hidden" name="date" required>
                            <div class="stickywork-calendar-dropdown" id="stickywork-calendar-dropdown">
                                <div class="stickywork-calendar-trigger">
                                    <span class="stickywork-calendar-value placeholder">Selecciona una fecha</span>
                                    <span class="stickywork-calendar-arrow">▼</span>
                                </div>
                                <div class="stickywork-calendar-dropdown-content" id="stickywork-calendar">
                                    <!-- Calendario se renderizará aquí -->
                                </div>
                            </div>
                        </div>
                        <div class="stickywork-field">
                            <label class="stickywork-label">${t.time}</label>
                            ${timeSlots.grouped ? `
                                <div class="stickywork-custom-select" data-required="true">
                                    <div class="stickywork-custom-select-trigger">
                                        <span class="stickywork-custom-select-value">${t.selectTime}</span>
                                        <span class="stickywork-custom-select-arrow">▼</span>
                                    </div>
                                    <div class="stickywork-custom-select-dropdown">
                                        ${timeSlots.shifts.map(shift => `
                                            <div class="stickywork-custom-select-group">
                                                <div class="stickywork-custom-select-group-label">📅 ${shift.name.toUpperCase()}</div>
                                                ${shift.slots.map(time => {
                                                    const isFull = isSlotFull(time);
                                                    const badge = getAvailabilityBadge(time);
                                                    return `
                                                        <div class="stickywork-custom-select-option ${isFull ? 'disabled' : ''}"
                                                             data-value="${time}"
                                                             ${isFull ? 'data-disabled="true"' : ''}>
                                                            ${time} ${badge}
                                                        </div>
                                                    `;
                                                }).join('')}
                                            </div>
                                        `).join('')}
                                    </div>
                                    <input type="hidden" name="time" required>
                                </div>
                            ` : `
                                <select class="stickywork-select" name="time" required>
                                    <option value="">${t.selectTime}</option>
                                    ${timeSlots.slots.map(time => {
                                        const isFull = isSlotFull(time);
                                        const badge = getAvailabilityBadge(time);
                                        return `<option value="${time}" ${isFull ? 'disabled' : ''}>${time} ${badge ? badge.replace(/<[^>]*>/g, '') : ''}</option>`;
                                    }).join('')}
                                </select>
                            `}
                        </div>
                    </div>
        `;

        // Crear tabs HTML si hay talleres disponibles
        const tabsHTML = showTabs ? `
            <div class="stickywork-tabs">
                <button type="button" class="stickywork-tab ${currentTabMode !== 'workshops' ? 'active' : ''}"
                        onclick="StickyWork.switchTab('${config.bookingMode}')">
                    ${getTabLabel(config.bookingMode)}
                </button>
                <button type="button" class="stickywork-tab ${currentTabMode === 'workshops' ? 'active' : ''}"
                        onclick="StickyWork.switchTab('workshops')">
                    ${getTabLabel('workshops')} (${config.workshops.length})
                </button>
            </div>
        ` : '';

        // Determinar qué campos mostrar según el tab activo
        const modeFields = currentTabMode === 'workshops' ? createWorkshopFields(t) : createModeSpecificFields();
        const showNotesField = currentTabMode === 'services';

        return `
            <div class="stickywork-widget">
                <h3 class="stickywork-title">${currentTabMode === 'workshops' ? t.titleWorkshop : getTitle()}</h3>
                ${tabsHTML}
                <form class="stickywork-form" id="stickywork-form" data-mode="${currentTabMode}">
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
                    ${modeFields}
                    ${currentTabMode !== 'workshops' ? dateTimeSection : ''}
                    ${showNotesField ? `
                        <div class="stickywork-field">
                            <label class="stickywork-label">${t.notes}</label>
                            <textarea class="stickywork-textarea" name="notes" placeholder="${t.notesPlaceholder}"></textarea>
                        </div>
                    ` : ''}
                    <div class="stickywork-whatsapp-consent">
                        <label class="stickywork-checkbox-container">
                            <input type="checkbox" id="stickywork-whatsapp-consent" class="stickywork-checkbox" name="whatsapp_consent">
                            <span class="stickywork-checkbox-label">
                                ${t.whatsappConsent || 'Quiero recibir confirmación de mi reserva por WhatsApp (opcional)'}
                            </span>
                        </label>
                        <p class="stickywork-privacy-note">
                            ${t.whatsappPrivacyNote || 'Al marcar esta casilla, consientes que te contactemos vía WhatsApp.'}
                            <a href="https://stickywork.com/politica-privacidad.html" target="_blank" class="stickywork-privacy-link">${t.privacyPolicy || 'Política de privacidad'}</a>
                        </p>
                    </div>
                    <button type="submit" class="stickywork-button">${t.submit}</button>
                    ${isDemoMode ? `<p class="stickywork-note">${t.demoNote}</p>` : ''}
                </form>
            </div>
        `;
    }

    // Crear HTML de confirmacion
    function createSuccessHTML(formData) {
        const t = translations[config.language];
        const activeMode = currentTabMode || config.bookingMode;
        const isWorkshopBooking = formData.workshopId || activeMode === 'workshops';

        let details = `
            <p class="stickywork-success-detail"><strong>${t.name}:</strong> ${formData.name}</p>
            <p class="stickywork-success-detail"><strong>${t.email}:</strong> ${formData.email}</p>
            ${formData.phone ? `<p class="stickywork-success-detail"><strong>${t.phone}:</strong> ${formData.phone}</p>` : ''}
        `;

        if (isWorkshopBooking) {
            // Reserva de taller (via tab o modo directo)
            details += `
                <p class="stickywork-success-detail"><strong>${t.workshop}:</strong> ${formData.workshopName}</p>
                <p class="stickywork-success-detail"><strong>${t.numPeople}:</strong> ${formData.numPeople} ${formData.numPeople > 1 ? t.people : t.person}</p>
            `;
        } else if (activeMode === 'tables') {
            details += `
                <p class="stickywork-success-detail"><strong>${t.numPeople}:</strong> ${formData.numPeople} ${formData.numPeople > 1 ? t.people : t.person}</p>
                ${formData.zone ? `<p class="stickywork-success-detail"><strong>${t.zone}:</strong> ${formData.zone}</p>` : ''}
            `;
        } else if (activeMode === 'classes') {
            details += `<p class="stickywork-success-detail"><strong>${t.class}:</strong> ${formData.class}</p>`;
        } else {
            details += `<p class="stickywork-success-detail"><strong>${t.service}:</strong> ${formData.service}</p>`;
            if (formData.professional) {
                details += `<p class="stickywork-success-detail"><strong>${t.professional}:</strong> ${formData.professional}</p>`;
            }
        }

        // Para workshops, la fecha y hora vienen del taller seleccionado
        if (!isWorkshopBooking) {
            details += `
                <p class="stickywork-success-detail"><strong>${t.date}:</strong> ${formData.date}</p>
                <p class="stickywork-success-detail"><strong>${t.time}:</strong> ${formData.time}</p>
            `;
        } else if (formData.workshopDate && formData.workshopTime) {
            details += `
                <p class="stickywork-success-detail"><strong>${t.workshopDate}:</strong> ${formData.workshopDate}</p>
                <p class="stickywork-success-detail"><strong>${t.workshopTime}:</strong> ${formData.workshopTime}</p>
            `;
        }

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

    // Variable para almacenar disponibilidad
    let slotsAvailability = {};

    // Consultar disponibilidad de slots para una fecha
    async function fetchAvailability(date) {
        if (!config.apiUrl || !date) {
            slotsAvailability = {};
            return;
        }

        try {
            const response = await fetch(`${config.apiUrl}/api/availability/${config.businessId}/${date}`);
            const data = await response.json();

            if (data.success) {
                slotsAvailability = data.slots || {};
                console.log('📊 [Widget] Disponibilidad cargada:', slotsAvailability);
            }
        } catch (error) {
            console.error('❌ Error al cargar disponibilidad:', error);
            slotsAvailability = {};
        }
    }

    // Obtener badge de disponibilidad para un slot
    function getAvailabilityBadge(time) {
        const availability = slotsAvailability[time];
        if (!availability) return '';

        let available, total, percentage, zoneName = '';

        // Si tiene zonas, usar la zona seleccionada por el usuario
        if (availability.zones) {
            // Obtener zona seleccionada en el dropdown
            const zoneSelect = document.querySelector('select[name="zone"]');
            const selectedZone = zoneSelect ? zoneSelect.value : '';

            if (selectedZone && availability.zones[selectedZone]) {
                // Mostrar disponibilidad de la zona seleccionada
                const zone = availability.zones[selectedZone];
                available = zone.available;
                total = zone.total;
                percentage = zone.percentage;
                zoneName = ` en ${selectedZone}`;
            } else {
                // Si no hay zona seleccionada, mostrar suma de todas
                total = 0;
                available = 0;
                let occupied = 0;

                Object.keys(availability.zones).forEach(name => {
                    const zone = availability.zones[name];
                    total += zone.total;
                    available += zone.available;
                    occupied += zone.occupied;
                });

                percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;
            }
        } else {
            // Estructura plana (sin zonas)
            available = availability.available;
            total = availability.total;
            percentage = availability.percentage;
        }

        // Determinar color según porcentaje de ocupación
        let badge = '';
        let text = '';

        if (percentage >= 100) {
            badge = '🔴';
            text = `Completo${zoneName}`;
        } else if (percentage >= 75) {
            badge = '🟡';
            text = `Quedan ${available} de ${total}${zoneName}`;
        } else if (percentage > 0) {
            badge = '🟢';
            text = `Quedan ${available} de ${total}${zoneName}`;
        } else {
            badge = '🟢';
            text = `${total} plazas disponibles${zoneName}`;
        }

        return `<span class="stickywork-availability-badge" title="${text}">${badge} ${text}</span>`;
    }

    // Verificar si un slot está lleno
    function isSlotFull(time) {
        const availability = slotsAvailability[time];
        if (!availability) return false;

        // Si tiene zonas, verificar la zona seleccionada
        if (availability.zones) {
            const zoneSelect = document.querySelector('select[name="zone"]');
            const selectedZone = zoneSelect ? zoneSelect.value : '';

            if (selectedZone && availability.zones[selectedZone]) {
                // Verificar solo la zona seleccionada
                return availability.zones[selectedZone].percentage >= 100;
            } else {
                // Sin zona seleccionada, verificar si TODAS están llenas
                return Object.values(availability.zones).every(zone => zone.percentage >= 100);
            }
        }

        return availability.percentage >= 100;
    }

    // ======= CALENDARIO PERSONALIZADO =======
    let currentCalendarYear = new Date().getFullYear();
    let currentCalendarMonth = new Date().getMonth();
    let selectedDate = null;
    let calendarBlockedDays = new Set(); // Días cerrados (negocio no abre)
    let calendarNoAvailabilityDays = new Set(); // Días sin disponibilidad (todos los slots ocupados)

    // Renderizar calendario
    async function renderCalendar() {
        const calendarEl = document.getElementById('stickywork-calendar');
        if (!calendarEl) return;

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

        // Obtener días bloqueados del mes actual
        await updateBlockedDays(currentCalendarYear, currentCalendarMonth);

        // Primera fecha del mes
        const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
        const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);

        // Día de la semana del primer día (0=Dom, 1=Lun, ...)
        let startDayOfWeek = firstDay.getDay();
        // Convertir a formato Lunes=0
        startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Generar HTML
        let html = `
            <div class="stickywork-calendar-header">
                <button type="button" class="stickywork-calendar-nav" id="prev-month">◀</button>
                <div class="stickywork-calendar-month">
                    ${monthNames[currentCalendarMonth]} ${currentCalendarYear}
                </div>
                <button type="button" class="stickywork-calendar-nav" id="next-month">▶</button>
            </div>
            <div class="stickywork-calendar-weekdays">
                ${weekDays.map(day => `<div class="stickywork-calendar-weekday">${day}</div>`).join('')}
            </div>
            <div class="stickywork-calendar-days">
        `;

        // Días del mes anterior para completar la primera semana
        const prevMonthLastDay = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            html += `<div class="stickywork-calendar-day other-month disabled">${day}</div>`;
        }

        // Días del mes actual
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(currentCalendarYear, currentCalendarMonth, day);
            date.setHours(0, 0, 0, 0);
            // Fix: Construir dateStr sin toISOString() para evitar problemas de zona horaria
            const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            let classes = ['stickywork-calendar-day'];

            // Marcar día actual
            if (date.getTime() === today.getTime()) {
                classes.push('today');
            }

            // Marcar día seleccionado
            if (selectedDate && selectedDate === dateStr) {
                classes.push('selected');
            }

            // Días pasados deshabilitados
            if (date < today) {
                classes.push('disabled');
            }
            // Días sin disponibilidad (todos los slots ocupados)
            else if (calendarNoAvailabilityDays.has(dateStr)) {
                classes.push('no-availability');
            }
            // Días cerrados (negocio no abre)
            else if (calendarBlockedDays.has(dateStr)) {
                classes.push('blocked');
            }

            const disabled = date < today || calendarBlockedDays.has(dateStr) || calendarNoAvailabilityDays.has(dateStr);
            html += `<div class="${classes.join(' ')}"
                          data-date="${dateStr}"
                          ${disabled ? '' : `onclick="window.StickyWork.selectCalendarDate('${dateStr}')"`}>
                        ${day}
                     </div>`;
        }

        // Días del próximo mes para completar la última semana
        const remainingDays = 7 - ((startDayOfWeek + lastDay.getDate()) % 7);
        if (remainingDays < 7) {
            for (let day = 1; day <= remainingDays; day++) {
                html += `<div class="stickywork-calendar-day other-month disabled">${day}</div>`;
            }
        }

        html += `</div>`;
        calendarEl.innerHTML = html;

        // Event listeners para navegación
        document.getElementById('prev-month')?.addEventListener('click', () => {
            currentCalendarMonth--;
            if (currentCalendarMonth < 0) {
                currentCalendarMonth = 11;
                currentCalendarYear--;
            }
            renderCalendar();
        });

        document.getElementById('next-month')?.addEventListener('click', () => {
            currentCalendarMonth++;
            if (currentCalendarMonth > 11) {
                currentCalendarMonth = 0;
                currentCalendarYear++;
            }
            renderCalendar();
        });
    }

    // Actualizar días bloqueados (cerrado + sin disponibilidad)
    async function updateBlockedDays(year, month) {
        calendarBlockedDays.clear();
        calendarNoAvailabilityDays.clear();

        // Determinar qué días están disponibles según el tipo de horario
        const scheduleType = businessConfig?.scheduleType || 'continuous';
        let workDays;

        if (scheduleType === 'multiple' && businessConfig?.shifts) {
            // Modo horarios partidos: un día está disponible si hay al menos un turno activo ese día
            workDays = new Set();
            businessConfig.shifts.forEach(shift => {
                if (shift.enabled) {
                    const activeDays = shift.activeDays || [1, 2, 3, 4, 5, 6, 7];
                    activeDays.forEach(day => workDays.add(day));
                }
            });
            workDays = Array.from(workDays);
            console.log('📅 [Widget] Días disponibles según turnos activos:', workDays);
        } else {
            // Modo continuo o legacy: usar workDays global
            workDays = config.workDays || businessConfig?.workDays || [1, 2, 3, 4, 5, 6];
            console.log('📅 [Widget] Días disponibles (modo continuo):', workDays);
        }

        // Recorrer todos los días del mes
        const lastDay = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Array de promesas para consultar disponibilidad en paralelo
        const availabilityPromises = [];

        for (let day = 1; day <= lastDay; day++) {
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);

            // Saltar días pasados
            if (date < today) continue;

            // Fix: Construir dateStr sin toISOString() para evitar problemas de zona horaria
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOfWeek = date.getDay() || 7; // Convertir Dom=0 a Dom=7

            // Verificar si el negocio abre ese día
            if (!workDays.includes(dayOfWeek)) {
                calendarBlockedDays.add(dateStr);
            } else if (config.apiUrl) {
                // Consultar disponibilidad del día
                availabilityPromises.push(
                    checkDayAvailability(dateStr)
                );
            }
        }

        // Esperar a que todas las consultas de disponibilidad terminen
        await Promise.all(availabilityPromises);
    }

    // Verificar si un día tiene disponibilidad
    async function checkDayAvailability(dateStr) {
        try {
            const response = await fetch(`${config.apiUrl}/api/availability/${config.businessId}/${dateStr}`);
            const data = await response.json();

            if (data.success && data.slots) {
                // Verificar si TODOS los slots están llenos
                const allSlotsFull = Object.keys(data.slots).length > 0 &&
                    Object.values(data.slots).every(slot => {
                        // Si tiene zonas, verificar que TODAS estén llenas
                        if (slot.zones) {
                            return Object.values(slot.zones).every(zone => zone.percentage >= 100);
                        }
                        // Si no tiene zonas, verificar el porcentaje general
                        return slot.percentage >= 100;
                    });

                if (allSlotsFull) {
                    calendarNoAvailabilityDays.add(dateStr);
                }
            }
        } catch (error) {
            console.error(`Error al verificar disponibilidad de ${dateStr}:`, error);
        }
    }

    // Seleccionar fecha del calendario
    window.StickyWork.selectCalendarDate = async function(dateStr) {
        selectedDate = dateStr;

        // Actualizar input hidden
        const dateInput = document.querySelector('input[name="date"]');
        if (dateInput) {
            dateInput.value = dateStr;
            // Disparar evento change
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Formatear fecha para mostrar (ej: "19 de Enero de 2026")
        const date = new Date(dateStr + 'T00:00:00');
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const formattedDate = `${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`;

        // Actualizar texto del trigger
        const valueEl = document.querySelector('.stickywork-calendar-value');
        if (valueEl) {
            valueEl.textContent = formattedDate;
            valueEl.classList.remove('placeholder');
        }

        // Cerrar dropdown
        toggleCalendarDropdown(false);

        // Re-renderizar calendario para mostrar selección
        await renderCalendar();

        // Cargar disponibilidad para esa fecha
        await fetchAvailability(dateStr);
        updateTimeSlots();
    };

    // Abrir/cerrar dropdown del calendario
    function toggleCalendarDropdown(forceState) {
        const trigger = document.querySelector('.stickywork-calendar-trigger');
        const dropdown = document.querySelector('.stickywork-calendar-dropdown-content');

        if (!trigger || !dropdown) {
            console.warn('⚠️ [Widget] Calendario dropdown no encontrado');
            return;
        }

        const isOpen = typeof forceState === 'boolean' ? forceState : !dropdown.classList.contains('open');

        if (isOpen) {
            trigger.classList.add('open');
            dropdown.classList.add('open');
        } else {
            trigger.classList.remove('open');
            dropdown.classList.remove('open');
        }
    }

    // Variable para evitar múltiples inicializaciones
    let calendarDropdownInitialized = false;

    // Inicializar dropdown del calendario
    function initCalendarDropdown() {
        const trigger = document.querySelector('.stickywork-calendar-trigger');

        if (!trigger) {
            console.warn('⚠️ [Widget] Trigger del calendario no encontrado');
            return;
        }

        // Evitar múltiples inicializaciones
        if (calendarDropdownInitialized) {
            console.log('📅 [Widget] Calendario dropdown ya inicializado');
            return;
        }

        // Agregar event listener al trigger
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🖱️ [Widget] Click en calendario trigger');
            toggleCalendarDropdown();
        });

        // Cerrar al hacer click fuera (solo una vez)
        document.addEventListener('click', (e) => {
            const calendarDropdown = document.querySelector('.stickywork-calendar-dropdown');
            if (calendarDropdown && !calendarDropdown.contains(e.target)) {
                toggleCalendarDropdown(false);
            }
        });

        calendarDropdownInitialized = true;
        console.log('✅ [Widget] Calendario dropdown inicializado');
    }

    // Enviar reserva
    async function submitBooking(formData) {
        if (!config.apiUrl) {
            return new Promise(resolve => {
                setTimeout(() => resolve({ success: true }), 1000);
            });
        }

        try {
            // Para talleres, usar endpoint especial
            if (config.bookingMode === 'workshops' && formData.workshopId) {
                const workshopBookingData = {
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_phone: formData.phone || '',
                    num_people: formData.numPeople || 1,
                    whatsapp_consent: formData.whatsappConsent || false
                };

                console.log('📤 [Debug] Enviando reserva de taller:', workshopBookingData);

                const response = await fetch(`${config.apiUrl}/api/workshops/book/${formData.workshopId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(workshopBookingData)
                });
                return await response.json();
            }

            // Determinar valor por defecto de personas según el tipo de negocio
            // - Servicios (peluquería, etc.): 1 persona por defecto
            // - Restaurantes/Mesas: 2 personas por defecto
            const defaultNumPeople = config.bookingMode === 'tables' ? 2 : 1;

            // Mapear campos del formulario a los nombres que espera el backend
            const bookingData = {
                business_id: config.businessId,
                customer_name: formData.name,
                customer_email: formData.email,
                customer_phone: formData.phone || '',
                booking_date: formData.date,
                booking_time: formData.time,
                service_id: formData.service || null,
                num_people: formData.numPeople || defaultNumPeople,
                zone: formData.zone || null,
                notes: formData.notes || '',
                whatsapp_consent: formData.whatsappConsent || false
            };

            console.log('📤 [Debug] Enviando al backend:', bookingData);

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

        // Determinar el modo actual (puede ser por tab o por config)
        const activeMode = currentTabMode || config.bookingMode;

        const formData = {
            name: form.name.value,
            email: form.email.value,
            phone: form.phone?.value || '',
            date: form.date?.value || '',
            time: form.time?.value || '',
            whatsappConsent: form.querySelector('input[name="whatsapp_consent"]')?.checked || false
        };

        // Campos segun modo activo (tab o config)
        if (activeMode === 'tables') {
            // Para restaurantes: leer el valor actual del input (por si lo escribió directamente)
            const peopleInput = form.querySelector('#stickywork-people-count');
            formData.numPeople = peopleInput ? parseInt(peopleInput.value) : peopleCount;
            console.log('🔍 [Debug] peopleInput:', peopleInput, 'value:', peopleInput?.value, 'numPeople final:', formData.numPeople);
            formData.zone = form.zone?.value || ''; // Zona (Terraza/Interior)
            // El servicio se asignará automáticamente en el backend según la hora
        } else if (activeMode === 'classes') {
            formData.class = form.class?.value || '';
        } else if (activeMode === 'workshops') {
            // Para talleres (modo directo o via tab)
            const workshopId = form.querySelector('input[name="workshop_id"]')?.value;
            if (!workshopId || !selectedWorkshop) {
                alert('Por favor selecciona un taller');
                return;
            }
            formData.workshopId = workshopId;
            formData.workshopName = selectedWorkshop.name;
            // Formatear fecha y hora del taller para mostrar en success
            const date = new Date(selectedWorkshop.workshop_date + 'T00:00:00');
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            formData.workshopDate = `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            formData.workshopTime = `${selectedWorkshop.start_time?.substring(0, 5)} - ${selectedWorkshop.end_time?.substring(0, 5)}`;
            // Personas
            const peopleInput = form.querySelector('#stickywork-people-count');
            formData.numPeople = peopleInput ? parseInt(peopleInput.value) : 1;
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
        if (peopleCount < 50) {
            peopleCount++;
            updatePeopleCountDisplay();
        }
    };

    window.StickyWork.decrementPeople = function() {
        if (peopleCount > 1) {
            peopleCount--;
            updatePeopleCountDisplay();
        }
    };

    window.StickyWork.updatePeopleCount = function(value) {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 1 && numValue <= 50) {
            peopleCount = numValue;
        }
    };

    function updatePeopleCountDisplay() {
        const countEl = document.querySelector('#stickywork-people-count');
        if (countEl) countEl.value = peopleCount;
    }

    // Inicializar botones de personas
    function initPeopleButtons(container) {
        // Si no se pasa contenedor, buscar en todo el documento
        const context = container || document;
        const decrementBtn = context.querySelector('#stickywork-people-decrement');
        const incrementBtn = context.querySelector('#stickywork-people-increment');

        if (decrementBtn) {
            decrementBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (peopleCount > 1) {
                    peopleCount--;
                    updatePeopleCountDisplay();
                }
            });
        }

        if (incrementBtn) {
            incrementBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (peopleCount < 50) {
                    peopleCount++;
                    updatePeopleCountDisplay();
                }
            });
        }
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

        // Inicializar custom select
        initCustomSelect();

        // Inicializar botones de personas
        initPeopleButtons();

        // Para workshops, no necesitamos calendario ni listeners de fecha/zona
        if (config.bookingMode !== 'workshops') {
            // Inicializar listener de fecha para cargar disponibilidad
            initDateListener();

            // Inicializar listener de zona para actualizar badges
            initZoneListener();

            // Resetear bandera antes de inicializar
            calendarDropdownInitialized = false;

            // Renderizar calendario personalizado
            renderCalendar();

            // Inicializar dropdown del calendario
            initCalendarDropdown();
        }
    }

    // Listener para campo de fecha
    function initDateListener() {
        const dateInput = document.querySelector('input[name="date"]');
        if (dateInput) {
            dateInput.addEventListener('change', async (e) => {
                const selectedDate = e.target.value;
                console.log('📅 [Widget] Fecha seleccionada:', selectedDate);

                // Consultar disponibilidad
                await fetchAvailability(selectedDate);

                // Actualizar solo el selector de tiempo (sin resetear el formulario)
                updateTimeSlots();
            });
        }
    }

    // Listener para campo de zona
    function initZoneListener() {
        const zoneSelect = document.querySelector('select[name="zone"]');
        if (zoneSelect) {
            zoneSelect.addEventListener('change', (e) => {
                console.log('🏷️ [Widget] Zona seleccionada:', e.target.value);
                // Actualizar badges con la nueva zona
                updateTimeSlots();
            });
        }
    }

    // Actualizar slots de tiempo sin resetear el formulario
    function updateTimeSlots() {
        const timeSlots = generateTimeSlots();
        const customSelect = document.querySelector('.stickywork-custom-select');
        const normalSelect = document.querySelector('.stickywork-select[name="time"]');

        if (customSelect) {
            // Actualizar dropdown de custom select
            const dropdown = customSelect.querySelector('.stickywork-custom-select-dropdown');
            if (dropdown && timeSlots.grouped) {
                dropdown.innerHTML = timeSlots.shifts.map(shift => `
                    <div class="stickywork-custom-select-group">
                        <div class="stickywork-custom-select-group-label">📅 ${shift.name.toUpperCase()}</div>
                        ${shift.slots.map(time => {
                            const isFull = isSlotFull(time);
                            const badge = getAvailabilityBadge(time);
                            return `
                                <div class="stickywork-custom-select-option ${isFull ? 'disabled' : ''}"
                                     data-value="${time}"
                                     ${isFull ? 'data-disabled="true"' : ''}>
                                    ${time} ${badge}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `).join('');
            }
        } else if (normalSelect) {
            // Actualizar select normal
            const selectedValue = normalSelect.value;
            const t = translations[config.language];
            normalSelect.innerHTML = `
                <option value="">${t.selectTime}</option>
                ${timeSlots.slots.map(time => {
                    const isFull = isSlotFull(time);
                    const badge = getAvailabilityBadge(time);
                    return `<option value="${time}" ${isFull ? 'disabled' : ''}>${time} ${badge ? badge.replace(/<[^>]*>/g, '') : ''}</option>`;
                }).join('')}
            `;
            // Restaurar valor seleccionado si aún es válido
            if (selectedValue && !isSlotFull(selectedValue)) {
                normalSelect.value = selectedValue;
            }
        }
    }

    // Variable para evitar agregar el listener múltiples veces
    let customSelectInitialized = false;

    // Funcionalidad del custom select usando event delegation
    function initCustomSelect() {
        // Solo inicializar una vez
        if (customSelectInitialized) {
            console.log('⚠️ [Custom Select] Ya inicializado, saltando...');
            return;
        }

        console.log('🔍 [Custom Select] Inicializando con event delegation');

        // Usar event delegation desde el document
        document.addEventListener('click', (e) => {
            // Click en opción - DEBE IR PRIMERO
            const clickedOption = e.target.closest('.stickywork-custom-select-option');
            if (clickedOption) {
                e.preventDefault();
                e.stopImmediatePropagation();

                console.log('⏰ [Custom Select] Click en opción detectado');

                // No permitir seleccionar opciones deshabilitadas
                if (clickedOption.hasAttribute('data-disabled') || clickedOption.classList.contains('disabled')) {
                    console.log('⚠️ [Custom Select] Opción deshabilitada, ignorando click');
                    return;
                }

                const customSelect = clickedOption.closest('.stickywork-custom-select');
                const valueDisplay = customSelect.querySelector('.stickywork-custom-select-value');
                const hiddenInput = customSelect.querySelector('input[type="hidden"]');
                const dropdown = customSelect.querySelector('.stickywork-custom-select-dropdown');
                const value = clickedOption.getAttribute('data-value');

                console.log('⏰ [Custom Select] Opción seleccionada:', value);

                // Update value
                if (hiddenInput) hiddenInput.value = value;
                if (valueDisplay) valueDisplay.textContent = value;

                // Update selected class
                customSelect.querySelectorAll('.stickywork-custom-select-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                clickedOption.classList.add('selected');

                // Close dropdown
                customSelect.classList.remove('active');
                if (dropdown) {
                    dropdown.style.display = 'none';
                    console.log('✅ [Custom Select] Dropdown CERRADO después de selección');
                }
                return;
            }

            // Click en trigger
            const clickedTrigger = e.target.closest('.stickywork-custom-select-trigger');
            if (clickedTrigger) {
                e.preventDefault();
                e.stopImmediatePropagation();

                console.log('🖱️ [Custom Select] Click en trigger detectado');

                const customSelect = clickedTrigger.closest('.stickywork-custom-select');
                const dropdown = customSelect.querySelector('.stickywork-custom-select-dropdown');

                if (customSelect && dropdown) {
                    // Cerrar otros dropdowns abiertos
                    document.querySelectorAll('.stickywork-custom-select.active').forEach(select => {
                        if (select !== customSelect) {
                            select.classList.remove('active');
                            const otherDropdown = select.querySelector('.stickywork-custom-select-dropdown');
                            if (otherDropdown) otherDropdown.style.display = 'none';
                        }
                    });

                    const wasActive = customSelect.classList.contains('active');

                    // Toggle clase
                    customSelect.classList.toggle('active');

                    // Forzar display con JavaScript
                    if (customSelect.classList.contains('active')) {
                        dropdown.style.display = 'block';
                        console.log('✅ [Custom Select] Dropdown ABIERTO (display: block)');
                    } else {
                        dropdown.style.display = 'none';
                        console.log('❌ [Custom Select] Dropdown CERRADO (display: none)');
                    }

                    console.log('📋 [Custom Select] Toggle:', wasActive, '→', customSelect.classList.contains('active'));
                } else {
                    console.error('❌ [Custom Select] No se encontró el contenedor o dropdown');
                }
                return;
            }

            // Click fuera de cualquier custom select - cerrar todos los dropdowns
            const clickedInsideCustomSelect = e.target.closest('.stickywork-custom-select');
            if (!clickedInsideCustomSelect) {
                document.querySelectorAll('.stickywork-custom-select.active').forEach(select => {
                    select.classList.remove('active');
                    const dropdown = select.querySelector('.stickywork-custom-select-dropdown');
                    if (dropdown) {
                        dropdown.style.display = 'none';
                        console.log('❌ [Custom Select] Dropdown CERRADO por click fuera');
                    }
                });
            }
        });

        customSelectInitialized = true;
        console.log('✅ [Custom Select] Event delegation configurado');
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

        // Solo cerrar si el click es en el overlay mismo, no en el modal
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        };

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

        // Inicializar custom select en modal
        initCustomSelect();

        // Inicializar botones de personas en modal (pasar modal como contexto)
        initPeopleButtons(modal);

        // Para workshops, no necesitamos calendario
        if (config.bookingMode !== 'workshops') {
            // Inicializar listeners
            initDateListener();
            initZoneListener();

            // Resetear bandera antes de inicializar
            calendarDropdownInitialized = false;

            // Renderizar calendario personalizado
            renderCalendar();

            // Inicializar dropdown del calendario
            initCalendarDropdown();
        }
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
        const activeMode = currentTabMode || config.bookingMode;
        peopleCount = activeMode === 'workshops' ? 1 : 2;
        selectedDate = null;
        selectedWorkshop = null;
        currentTabMode = config.bookingMode; // Reset to original mode
        calendarDropdownInitialized = false; // Resetear bandera
        if (config.mode === 'embedded') {
            renderEmbedded();
        } else {
            widgetContainer.innerHTML = createFormHTML();
            const form = widgetContainer.querySelector('#stickywork-form');
            if (form) form.addEventListener('submit', handleSubmit);
            initPeopleButtons();
            if (currentTabMode !== 'workshops') {
                initDateListener();
                initZoneListener();
                renderCalendar();
                initCalendarDropdown();
            }
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

            // Siempre cargar talleres para ver si hay disponibles
            const workshops = await loadWorkshops();
            config.workshops = workshops;
            if (workshops.length > 0) {
                console.log('🎫 [Widget] Talleres disponibles:', workshops.length);
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
