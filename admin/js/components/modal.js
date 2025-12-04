/**
 * Modal Component
 * Sistema de modals reutilizable para reemplazar alert() y confirm()
 */

const modal = {
    /**
     * Muestra un modal de confirmación
     * @param {object} options - Configuración del modal
     * @returns {Promise<boolean>} - true si el usuario confirma, false si cancela
     *
     * @example
     * const confirmed = await modal.confirm({
     *     title: '¿Eliminar reserva?',
     *     message: 'Esta acción no se puede deshacer',
     *     confirmText: 'Sí, eliminar',
     *     cancelText: 'Cancelar',
     *     type: 'danger'
     * });
     */
    confirm(options = {}) {
        const {
            title = '¿Estás seguro?',
            message = '',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'primary' // 'primary', 'danger', 'warning', 'success'
        } = options;

        return new Promise((resolve) => {
            // Crear overlay
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease;
            `;

            // Colores según tipo
            const colors = {
                primary: '#3b82f6',
                danger: '#ef4444',
                warning: '#f59e0b',
                success: '#22c55e'
            };

            // Crear modal
            const modalEl = document.createElement('div');
            modalEl.className = 'modal-content';
            modalEl.style.cssText = `
                background: var(--bg-secondary, white);
                border-radius: 12px;
                padding: 0;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
                overflow: hidden;
            `;

            modalEl.innerHTML = `
                <div style="padding: 2rem; border-bottom: 1px solid var(--border-color, #e5e7eb);">
                    <h2 style="margin: 0; color: var(--text-primary, #1f2937); font-size: 1.5rem;">
                        ${title}
                    </h2>
                    ${message ? `
                        <p style="margin: 1rem 0 0 0; color: var(--text-secondary, #6b7280); line-height: 1.6;">
                            ${message}
                        </p>
                    ` : ''}
                </div>
                <div style="padding: 1.5rem 2rem; display: flex; gap: 1rem; justify-content: flex-end; background: var(--bg-tertiary, #f9fafb);">
                    <button id="modal-cancel-btn" style="
                        padding: 0.75rem 1.5rem;
                        border: 1px solid var(--border-color, #e5e7eb);
                        background: var(--bg-secondary, white);
                        color: var(--text-secondary, #6b7280);
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">${cancelText}</button>
                    <button id="modal-confirm-btn" style="
                        padding: 0.75rem 1.5rem;
                        border: none;
                        background: ${colors[type]};
                        color: white;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        box-shadow: 0 4px 12px ${colors[type]}40;
                    ">${confirmText}</button>
                </div>
            `;

            overlay.appendChild(modalEl);
            document.body.appendChild(overlay);

            // Función para cerrar modal
            const closeModal = (result) => {
                overlay.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(result);
                }, 200);
            };

            // Event listeners
            document.getElementById('modal-cancel-btn').onclick = () => closeModal(false);
            document.getElementById('modal-confirm-btn').onclick = () => closeModal(true);

            // Cerrar al hacer clic fuera
            overlay.onclick = (e) => {
                if (e.target === overlay) closeModal(false);
            };

            // Cerrar con ESC
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeModal(false);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            // Añadir animaciones CSS si no existen
            if (!document.getElementById('modal-animations')) {
                const style = document.createElement('style');
                style.id = 'modal-animations';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                    @keyframes slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        });
    },

    /**
     * Muestra un modal de alerta (reemplazo de alert())
     * @param {object} options - Configuración del modal
     * @returns {Promise<void>}
     *
     * @example
     * await modal.alert({
     *     title: 'Error',
     *     message: 'No se pudo completar la operación',
     *     type: 'danger'
     * });
     */
    async alert(options = {}) {
        const {
            title = 'Atención',
            message = '',
            buttonText = 'Aceptar',
            type = 'primary'
        } = options;

        await this.confirm({
            title,
            message,
            confirmText: buttonText,
            cancelText: null,
            type
        });
    },

    /**
     * Muestra un toast notification (mensaje temporal)
     * @param {object} options - Configuración del toast
     *
     * @example
     * modal.toast({
     *     message: 'Cambios guardados exitosamente',
     *     type: 'success',
     *     duration: 3000
     * });
     */
    toast(options = {}) {
        const {
            message = '',
            type = 'success',
            duration = 3000,
            position = 'top-right'
        } = options;

        const colors = {
            success: { bg: '#22c55e', icon: '✓' },
            error: { bg: '#ef4444', icon: '✗' },
            warning: { bg: '#f59e0b', icon: '⚠' },
            info: { bg: '#3b82f6', icon: 'ℹ' }
        };

        const config = colors[type];

        const positions = {
            'top-right': 'top: 2rem; right: 2rem;',
            'top-left': 'top: 2rem; left: 2rem;',
            'bottom-right': 'bottom: 2rem; right: 2rem;',
            'bottom-left': 'bottom: 2rem; left: 2rem;',
            'top-center': 'top: 2rem; left: 50%; transform: translateX(-50%);',
            'bottom-center': 'bottom: 2rem; left: 50%; transform: translateX(-50%);'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            ${positions[position]}
            background: ${config.bg};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1rem;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;

        toast.innerHTML = `
            <span style="font-size: 1.25rem;">${config.icon}</span>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        // Añadir animación si no existe
        if (!document.getElementById('toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideOutRight {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Eliminar después del duration
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }
};

// Exportar
window.modal = modal;
