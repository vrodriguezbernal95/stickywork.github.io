// Loading Spinner System para formularios
(function() {
    // CSS para el spinner
    const spinnerStyles = `
        .btn-loading {
            position: relative;
            pointer-events: none;
            opacity: 0.7;
        }

        .btn-loading::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            top: 50%;
            left: 50%;
            margin-left: -8px;
            margin-top: -8px;
            border: 2px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spinner 0.6s linear infinite;
        }

        @keyframes spinner {
            to { transform: rotate(360deg); }
        }

        .btn-loading .btn-text {
            visibility: hidden;
        }
    `;

    // Inyectar estilos
    const styleSheet = document.createElement('style');
    styleSheet.textContent = spinnerStyles;
    document.head.appendChild(styleSheet);

    // Función para mostrar loading en un botón
    window.showButtonLoading = function(button) {
        if (!button) return;

        // Guardar texto original
        button.dataset.originalText = button.innerHTML;

        // Agregar clase loading
        button.classList.add('btn-loading');
        button.disabled = true;

        // Envolver texto en span si no existe
        if (!button.querySelector('.btn-text')) {
            button.innerHTML = `<span class="btn-text">${button.innerHTML}</span>`;
        }
    };

    // Función para ocultar loading
    window.hideButtonLoading = function(button) {
        if (!button) return;

        button.classList.remove('btn-loading');
        button.disabled = false;

        // Restaurar texto original
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    };

    // Función para mostrar mensaje de éxito/error
    window.showButtonFeedback = function(button, message, type = 'success') {
        if (!button) return;

        const originalText = button.dataset.originalText || button.innerHTML;

        // Cambiar texto y color
        button.innerHTML = message;
        button.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';

        // Restaurar después de 2 segundos
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.backgroundColor = '';
            button.classList.remove('btn-loading');
            button.disabled = false;
        }, 2000);
    };

    // Auto-aplicar a formularios con data-loading="true"
    document.addEventListener('DOMContentLoaded', function() {
        const forms = document.querySelectorAll('form[data-loading="true"]');

        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                const submitButton = form.querySelector('[type="submit"]');
                if (submitButton) {
                    showButtonLoading(submitButton);
                }
            });
        });
    });
})();
