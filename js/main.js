// Navegación móvil
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Cerrar menú al hacer clic en un enlace
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
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

// Formulario de contacto - Envío a la API
async function handleContactFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Deshabilitar botón mientras se envía
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        business: document.getElementById('business').value,
        businessType: document.getElementById('business-type').value,
        interest: document.getElementById('interest').value,
        message: document.getElementById('message').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            // Mostrar mensaje de éxito
            alert('¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.\n\nID del mensaje: ' + data.data.id);
            form.reset();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error al enviar formulario:', error);
        alert('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    } finally {
        // Rehabilitar botón
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar Mensaje';
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
