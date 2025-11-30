// Dark Mode Toggle
(function() {
    // Obtener preferencia guardada o sistema
    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }

        // Detectar preferencia del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    };

    // Aplicar tema
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem('theme', theme);
        updateToggleButton(theme);
    };

    // Actualizar botón toggle
    const updateToggleButton = (theme) => {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        const icon = toggle.querySelector('.theme-icon');

        if (theme === 'dark') {
            if (icon) {
                icon.textContent = '☀️';
            } else {
                toggle.textContent = '☀️';
            }
            toggle.setAttribute('aria-label', 'Cambiar a modo claro');
            toggle.setAttribute('title', 'Modo claro');
        } else {
            if (icon) {
                icon.textContent = '🌙';
            } else {
                toggle.textContent = '🌙';
            }
            toggle.setAttribute('aria-label', 'Cambiar a modo oscuro');
            toggle.setAttribute('title', 'Modo oscuro');
        }
    };

    // Cambiar tema
    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    };

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        // Aplicar tema inicial
        const initialTheme = getInitialTheme();
        applyTheme(initialTheme);

        // Agregar event listener al botón toggle
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', toggleTheme);
        }

        // Escuchar cambios en preferencia del sistema
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Solo aplicar si el usuario no ha seleccionado manualmente
                if (!localStorage.getItem('theme')) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    });
})();
