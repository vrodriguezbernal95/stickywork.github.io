// Scroll to Top Button
(function() {
    // CSS para el botón
    const styles = `
        #scroll-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            opacity: 0;
            visibility: hidden;
            transform: translateY(100px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 999;
        }

        #scroll-to-top.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        #scroll-to-top:hover {
            transform: translateY(-5px) scale(1.1);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        #scroll-to-top:active {
            transform: translateY(-2px) scale(1.05);
        }

        /* Responsive */
        @media (max-width: 768px) {
            #scroll-to-top {
                width: 45px;
                height: 45px;
                bottom: 20px;
                right: 20px;
                font-size: 20px;
            }
        }
    `;

    // Inyectar estilos
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Crear botón
    const createButton = () => {
        const button = document.createElement('button');
        button.id = 'scroll-to-top';
        button.setAttribute('aria-label', 'Volver arriba');
        button.setAttribute('title', 'Volver arriba');
        button.innerHTML = '↑';
        document.body.appendChild(button);
        return button;
    };

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        const button = createButton();

        // Mostrar/ocultar botón según scroll
        let lastScrollTop = 0;
        const toggleButton = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // Mostrar si bajó más de 300px
            if (scrollTop > 300) {
                button.classList.add('show');
            } else {
                button.classList.remove('show');
            }

            lastScrollTop = scrollTop;
        };

        // Escuchar scroll con throttle para performance
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    toggleButton();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Click: scroll suave al inicio
        button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
})();
