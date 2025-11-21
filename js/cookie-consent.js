/**
 * StickyWork Cookie Consent Manager (CMP)
 * Cumple con GDPR/RGPD y LOPD-GDD
 *
 * Categorías de cookies:
 * - necessary: Siempre activas (funcionamiento básico)
 * - analytics: Google Analytics, estadísticas
 * - marketing: Publicidad, remarketing
 * - preferences: Preferencias del usuario
 */

(function() {
    'use strict';

    // Configuración del CMP
    const CMP_CONFIG = {
        cookieName: 'stickywork_consent',
        cookieExpiry: 365, // días
        version: '1.0',
        defaultLanguage: 'es'
    };

    // Textos en español
    const TEXTS = {
        es: {
            title: 'Utilizamos cookies',
            description: 'Usamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y mostrar contenido personalizado. Puedes aceptar todas, rechazarlas o personalizar tus preferencias.',
            acceptAll: 'Aceptar todas',
            rejectAll: 'Rechazar todas',
            customize: 'Personalizar',
            save: 'Guardar preferencias',
            necessary: {
                title: 'Cookies necesarias',
                description: 'Imprescindibles para el funcionamiento del sitio. No se pueden desactivar.'
            },
            analytics: {
                title: 'Cookies analíticas',
                description: 'Nos ayudan a entender cómo usas el sitio para mejorarlo.'
            },
            marketing: {
                title: 'Cookies de marketing',
                description: 'Permiten mostrarte publicidad relevante según tus intereses.'
            },
            preferences: {
                title: 'Cookies de preferencias',
                description: 'Recuerdan tus ajustes y preferencias para futuras visitas.'
            },
            moreInfo: 'Más información',
            cookiePolicy: 'Política de cookies'
        }
    };

    // Estado de consentimiento
    let consentState = {
        necessary: true, // Siempre true
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
        version: CMP_CONFIG.version
    };

    // Obtener consentimiento guardado
    function getStoredConsent() {
        try {
            const stored = localStorage.getItem(CMP_CONFIG.cookieName);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.version === CMP_CONFIG.version) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Error reading consent:', e);
        }
        return null;
    }

    // Guardar consentimiento
    function saveConsent(consent) {
        consent.timestamp = new Date().toISOString();
        consent.version = CMP_CONFIG.version;
        localStorage.setItem(CMP_CONFIG.cookieName, JSON.stringify(consent));
        consentState = consent;

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { detail: consent }));

        // Aplicar consentimiento
        applyConsent(consent);
    }

    // Aplicar consentimiento (activar/desactivar scripts)
    function applyConsent(consent) {
        // Analytics
        if (consent.analytics) {
            enableAnalytics();
        } else {
            disableAnalytics();
        }

        // Marketing
        if (consent.marketing) {
            enableMarketing();
        } else {
            disableMarketing();
        }

        // Preferences
        if (consent.preferences) {
            enablePreferences();
        }
    }

    // Funciones para activar/desactivar categorías
    function enableAnalytics() {
        // Aquí puedes cargar Google Analytics u otros
        console.log('Analytics cookies enabled');
        // Ejemplo: cargar GA4
        // loadScript('https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID');
    }

    function disableAnalytics() {
        console.log('Analytics cookies disabled');
        // Eliminar cookies de analytics si existen
        deleteCookie('_ga');
        deleteCookie('_gid');
        deleteCookie('_gat');
    }

    function enableMarketing() {
        console.log('Marketing cookies enabled');
    }

    function disableMarketing() {
        console.log('Marketing cookies disabled');
    }

    function enablePreferences() {
        console.log('Preference cookies enabled');
    }

    // Utilidad para eliminar cookies
    function deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    // Crear el banner HTML
    function createBanner() {
        const texts = TEXTS.es;

        const bannerHTML = `
            <div id="cookie-consent-banner" class="cmp-banner" role="dialog" aria-labelledby="cmp-title" aria-describedby="cmp-description">
                <div class="cmp-content">
                    <div class="cmp-text">
                        <h3 id="cmp-title" class="cmp-title">${texts.title}</h3>
                        <p id="cmp-description" class="cmp-description">${texts.description}</p>
                        <a href="politica-cookies.html" class="cmp-link">${texts.cookiePolicy}</a>
                    </div>
                    <div class="cmp-buttons">
                        <button id="cmp-accept-all" class="cmp-btn cmp-btn-primary">${texts.acceptAll}</button>
                        <button id="cmp-reject-all" class="cmp-btn cmp-btn-secondary">${texts.rejectAll}</button>
                        <button id="cmp-customize" class="cmp-btn cmp-btn-outline">${texts.customize}</button>
                    </div>
                </div>
            </div>

            <div id="cookie-consent-modal" class="cmp-modal" role="dialog" aria-labelledby="cmp-modal-title" aria-hidden="true">
                <div class="cmp-modal-overlay"></div>
                <div class="cmp-modal-content">
                    <div class="cmp-modal-header">
                        <h3 id="cmp-modal-title">${texts.customize}</h3>
                        <button class="cmp-modal-close" aria-label="Cerrar">&times;</button>
                    </div>
                    <div class="cmp-modal-body">
                        <div class="cmp-category">
                            <div class="cmp-category-header">
                                <div class="cmp-category-info">
                                    <h4>${texts.necessary.title}</h4>
                                    <p>${texts.necessary.description}</p>
                                </div>
                                <label class="cmp-toggle cmp-toggle-disabled">
                                    <input type="checkbox" checked disabled>
                                    <span class="cmp-toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div class="cmp-category">
                            <div class="cmp-category-header">
                                <div class="cmp-category-info">
                                    <h4>${texts.analytics.title}</h4>
                                    <p>${texts.analytics.description}</p>
                                </div>
                                <label class="cmp-toggle">
                                    <input type="checkbox" id="cmp-analytics">
                                    <span class="cmp-toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div class="cmp-category">
                            <div class="cmp-category-header">
                                <div class="cmp-category-info">
                                    <h4>${texts.marketing.title}</h4>
                                    <p>${texts.marketing.description}</p>
                                </div>
                                <label class="cmp-toggle">
                                    <input type="checkbox" id="cmp-marketing">
                                    <span class="cmp-toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div class="cmp-category">
                            <div class="cmp-category-header">
                                <div class="cmp-category-info">
                                    <h4>${texts.preferences.title}</h4>
                                    <p>${texts.preferences.description}</p>
                                </div>
                                <label class="cmp-toggle">
                                    <input type="checkbox" id="cmp-preferences">
                                    <span class="cmp-toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="cmp-modal-footer">
                        <button id="cmp-save" class="cmp-btn cmp-btn-primary">${texts.save}</button>
                    </div>
                </div>
            </div>
        `;

        // Insertar en el DOM
        const container = document.createElement('div');
        container.innerHTML = bannerHTML;
        document.body.appendChild(container);

        // Agregar estilos
        addStyles();

        // Agregar event listeners
        addEventListeners();
    }

    // Agregar estilos CSS
    function addStyles() {
        const styles = `
            /* Cookie Consent Banner */
            .cmp-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--bg-primary, #ffffff);
                border-top: 1px solid var(--border-color, #e0e0e0);
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
                z-index: 99999;
                padding: 1.5rem;
                animation: cmpSlideUp 0.3s ease-out;
            }

            @keyframes cmpSlideUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .cmp-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 1.5rem;
            }

            .cmp-text {
                flex: 1;
                min-width: 300px;
            }

            .cmp-title {
                color: var(--text-primary, #1a1a1a);
                font-size: 1.25rem;
                margin: 0 0 0.5rem 0;
                font-weight: 600;
            }

            .cmp-description {
                color: var(--text-secondary, #666666);
                font-size: 0.95rem;
                margin: 0 0 0.5rem 0;
                line-height: 1.5;
            }

            .cmp-link {
                color: var(--primary-color, #3b82f6);
                text-decoration: none;
                font-size: 0.9rem;
                font-weight: 500;
            }

            .cmp-link:hover {
                text-decoration: underline;
            }

            .cmp-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
            }

            .cmp-btn {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 2px solid transparent;
                white-space: nowrap;
            }

            .cmp-btn-primary {
                background: linear-gradient(135deg, var(--primary-color, #3b82f6), var(--secondary-color, #ef4444));
                color: white;
                border: none;
            }

            .cmp-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }

            .cmp-btn-secondary {
                background: var(--bg-secondary, #f5f5f5);
                color: var(--text-primary, #1a1a1a);
                border: 2px solid var(--border-color, #e0e0e0);
            }

            .cmp-btn-secondary:hover {
                background: var(--border-color, #e0e0e0);
            }

            .cmp-btn-outline {
                background: transparent;
                color: var(--primary-color, #3b82f6);
                border: 2px solid var(--primary-color, #3b82f6);
            }

            .cmp-btn-outline:hover {
                background: var(--primary-color, #3b82f6);
                color: white;
            }

            /* Modal */
            .cmp-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 100000;
                display: none;
                align-items: center;
                justify-content: center;
            }

            .cmp-modal.active {
                display: flex;
            }

            .cmp-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                animation: cmpFadeIn 0.2s ease-out;
            }

            @keyframes cmpFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .cmp-modal-content {
                position: relative;
                background: var(--bg-primary, #ffffff);
                border-radius: 16px;
                max-width: 550px;
                width: 90%;
                max-height: 85vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                animation: cmpScaleIn 0.3s ease-out;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }

            @keyframes cmpScaleIn {
                from {
                    transform: scale(0.9);
                    opacity: 0;
                }
                to {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            .cmp-modal-header {
                padding: 1.5rem;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .cmp-modal-header h3 {
                margin: 0;
                color: var(--text-primary, #1a1a1a);
                font-size: 1.25rem;
            }

            .cmp-modal-close {
                background: none;
                border: none;
                font-size: 1.75rem;
                cursor: pointer;
                color: var(--text-secondary, #666666);
                padding: 0;
                line-height: 1;
                transition: color 0.2s;
            }

            .cmp-modal-close:hover {
                color: var(--text-primary, #1a1a1a);
            }

            .cmp-modal-body {
                padding: 1.5rem;
                overflow-y: auto;
                flex: 1;
            }

            .cmp-modal-footer {
                padding: 1.5rem;
                border-top: 1px solid var(--border-color, #e0e0e0);
                text-align: right;
            }

            /* Categories */
            .cmp-category {
                padding: 1rem 0;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
            }

            .cmp-category:last-child {
                border-bottom: none;
            }

            .cmp-category-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
            }

            .cmp-category-info h4 {
                margin: 0 0 0.25rem 0;
                color: var(--text-primary, #1a1a1a);
                font-size: 1rem;
            }

            .cmp-category-info p {
                margin: 0;
                color: var(--text-secondary, #666666);
                font-size: 0.875rem;
                line-height: 1.4;
            }

            /* Toggle Switch */
            .cmp-toggle {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 28px;
                flex-shrink: 0;
            }

            .cmp-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .cmp-toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--border-color, #ccc);
                transition: 0.3s;
                border-radius: 28px;
            }

            .cmp-toggle-slider:before {
                position: absolute;
                content: "";
                height: 22px;
                width: 22px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.3s;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .cmp-toggle input:checked + .cmp-toggle-slider {
                background: linear-gradient(135deg, var(--primary-color, #3b82f6), var(--secondary-color, #ef4444));
            }

            .cmp-toggle input:checked + .cmp-toggle-slider:before {
                transform: translateX(22px);
            }

            .cmp-toggle-disabled .cmp-toggle-slider {
                opacity: 0.6;
                cursor: not-allowed;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .cmp-banner {
                    padding: 1rem;
                }

                .cmp-content {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 1rem;
                }

                .cmp-text {
                    min-width: 100%;
                }

                .cmp-title {
                    font-size: 1.1rem;
                }

                .cmp-description {
                    font-size: 0.9rem;
                }

                .cmp-buttons {
                    flex-direction: column;
                }

                .cmp-btn {
                    width: 100%;
                    text-align: center;
                }

                .cmp-modal-content {
                    width: 95%;
                    max-height: 90vh;
                }
            }

            /* Hide banner when consent given */
            .cmp-banner.hidden {
                display: none;
            }

            /* Cookie settings button (floating) */
            .cmp-settings-btn {
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: var(--bg-primary, #ffffff);
                border: 2px solid var(--border-color, #e0e0e0);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                z-index: 99998;
                transition: all 0.3s ease;
            }

            .cmp-settings-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            }

            .cmp-settings-btn.hidden {
                display: none;
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    // Agregar event listeners
    function addEventListeners() {
        const banner = document.getElementById('cookie-consent-banner');
        const modal = document.getElementById('cookie-consent-modal');

        // Aceptar todas
        document.getElementById('cmp-accept-all').addEventListener('click', function() {
            const consent = {
                necessary: true,
                analytics: true,
                marketing: true,
                preferences: true
            };
            saveConsent(consent);
            hideBanner();
            showSettingsButton();
        });

        // Rechazar todas
        document.getElementById('cmp-reject-all').addEventListener('click', function() {
            const consent = {
                necessary: true,
                analytics: false,
                marketing: false,
                preferences: false
            };
            saveConsent(consent);
            hideBanner();
            showSettingsButton();
        });

        // Personalizar
        document.getElementById('cmp-customize').addEventListener('click', function() {
            openModal();
        });

        // Cerrar modal
        document.querySelector('.cmp-modal-close').addEventListener('click', function() {
            closeModal();
        });

        document.querySelector('.cmp-modal-overlay').addEventListener('click', function() {
            closeModal();
        });

        // Guardar preferencias
        document.getElementById('cmp-save').addEventListener('click', function() {
            const consent = {
                necessary: true,
                analytics: document.getElementById('cmp-analytics').checked,
                marketing: document.getElementById('cmp-marketing').checked,
                preferences: document.getElementById('cmp-preferences').checked
            };
            saveConsent(consent);
            closeModal();
            hideBanner();
            showSettingsButton();
        });

        // Tecla Escape para cerrar modal
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    // Funciones de UI
    function hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.add('hidden');
        }
    }

    function showBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.remove('hidden');
        }
    }

    function openModal() {
        const modal = document.getElementById('cookie-consent-modal');
        // Cargar estado actual
        document.getElementById('cmp-analytics').checked = consentState.analytics;
        document.getElementById('cmp-marketing').checked = consentState.marketing;
        document.getElementById('cmp-preferences').checked = consentState.preferences;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        const modal = document.getElementById('cookie-consent-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showSettingsButton() {
        // Crear botón de configuración si no existe
        if (!document.getElementById('cmp-settings-btn')) {
            const btn = document.createElement('button');
            btn.id = 'cmp-settings-btn';
            btn.className = 'cmp-settings-btn';
            btn.innerHTML = '🍪';
            btn.setAttribute('aria-label', 'Configuración de cookies');
            btn.addEventListener('click', function() {
                openModal();
            });
            document.body.appendChild(btn);
        }
    }

    // Función pública para verificar consentimiento
    window.CookieConsent = {
        hasConsent: function(category) {
            return consentState[category] === true;
        },
        getConsent: function() {
            return { ...consentState };
        },
        showSettings: function() {
            openModal();
        },
        reset: function() {
            localStorage.removeItem(CMP_CONFIG.cookieName);
            location.reload();
        }
    };

    // Inicializar CMP
    function init() {
        const storedConsent = getStoredConsent();

        if (storedConsent) {
            // Ya hay consentimiento guardado
            consentState = storedConsent;
            applyConsent(storedConsent);
            showSettingsButton();
        } else {
            // Mostrar banner
            createBanner();
        }
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
