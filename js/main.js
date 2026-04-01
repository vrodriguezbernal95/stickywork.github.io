// Dark Mode Toggle
const themeToggle = () => {
    // Obtener tema actual
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Aplicar nuevo tema
    document.documentElement.setAttribute('data-theme', newTheme);

    // Guardar preferencia
    localStorage.setItem('theme', newTheme);

    // Actualizar ícono del botón
    const themeBtn = document.querySelector('.theme-toggle-nav');
    if (themeBtn) {
        themeBtn.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    }
};

// Cargar tema guardado al iniciar
const loadTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light'; // Light mode por defecto
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeBtn = document.querySelector('.theme-toggle-nav');
    if (themeBtn) {
        themeBtn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    }
};

// Navegación móvil
document.addEventListener('DOMContentLoaded', function() {
    // Cargar tema
    loadTheme();

    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('open');
        });
    }

    // Cerrar menú al hacer clic en un enlace
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            if (navToggle) navToggle.classList.remove('open');
        });
    });

    // Marcar enlace activo según la página actual
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // Animación al hacer scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    // Observar elementos que queremos animar
    const animatedElements = document.querySelectorAll('.feature-card, .step, .pricing-card');
    animatedElements.forEach(el => observer.observe(el));
});

// Formulario de contacto - Envío a la API (Modo Mixto)
async function handleContactFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Deshabilitar botón mientras se envía
    submitButton.disabled = true;
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Enviando...';

    // Obtener valores del formulario
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const business = document.getElementById('business').value;
    const businessType = document.getElementById('business-type').value;
    const interest = document.getElementById('interest').value;
    const message = document.getElementById('message').value;

    const formData = {
        name: name,
        email: email,
        phone: phone,
        business: business,
        businessType: businessType,
        interest: interest,
        message: message || `Solicitud de ${interest} - ${businessType}${business ? ' (' + business + ')' : ''}` // Valor por defecto si está vacío
    };

    let backendSuccess = false;
    let messageId = null;

    try {
        // Detectar si estamos en localhost o producción
        const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : 'https://api.stickywork.com';

        try {
            // Intentar enviar al backend con timeout de 5 segundos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(API_URL + '/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (response.ok && data.success) {
                backendSuccess = true;
                messageId = data.data?.id;
            }
        } catch (fetchError) {
            console.log('Backend no disponible, mostrando confirmación demo:', fetchError.message);
            // Continuar con modo demo
        }

        // Mostrar mensaje de éxito (tanto si funcionó el backend como si no)
        const successMessage = backendSuccess
            ? `¡Gracias por tu mensaje, ${formData.name}!\n\nTu solicitud ha sido enviada exitosamente.\n${messageId ? 'ID del mensaje: ' + messageId : ''}\n\nNos pondremos en contacto contigo en menos de 24 horas a ${formData.email}`
            : `¡Gracias por tu interés, ${formData.name}!\n\nEsta es una demostración del sistema.\n\nPara solicitudes reales, por favor contacta directamente a:\ncontacto@stickywork.com\n\nEn producción, recibirías una respuesta en menos de 24 horas.`;

        alert(successMessage);

        // Resetear formulario solo si fue exitoso
        if (backendSuccess) {
            form.reset();
        }

    } catch (error) {
        // Error crítico (no debería pasar)
        console.error('Error crítico al procesar formulario:', error);
        alert(`Solicitud Recibida (Demo)\n\nGracias por tu interés, ${formData.name}.\n\nEsta es una demostración del sistema.\nPara solicitudes reales, contacta: contacto@stickywork.com`);
    } finally {
        // Rehabilitar botón
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }

    return false;
}

// Mantener compatibilidad con código antiguo
function handleContactForm(event) {
    return handleContactFormSubmit(event);
}

// Widget de demo interactivo
function initDemoWidget() {
    const demoForm = document.getElementById('demo-booking-form');

    if (demoForm) {
        demoForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const name = document.getElementById('demo-name').value;
            const date = document.getElementById('demo-date').value;
            const time = document.getElementById('demo-time').value;
            const service = document.getElementById('demo-service').value;

            const confirmationMessage = `
                <div style="padding: 2rem; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 10px; text-align: center;">
                    <h3 style="margin-bottom: 1rem;">✓ Reserva Confirmada</h3>
                    <p><strong>Nombre:</strong> ${name}</p>
                    <p><strong>Servicio:</strong> ${service}</p>
                    <p><strong>Fecha:</strong> ${date}</p>
                    <p><strong>Hora:</strong> ${time}</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.9;">
                        Recibirás un correo de confirmación en breve.
                    </p>
                </div>
            `;

            const widgetFrame = document.querySelector('.widget-frame');
            widgetFrame.innerHTML = confirmationMessage;

            setTimeout(() => {
                location.reload();
            }, 5000);
        });
    }
}

// Inicializar widget de demo cuando la página cargue
document.addEventListener('DOMContentLoaded', initDemoWidget);

// Smooth scroll para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
