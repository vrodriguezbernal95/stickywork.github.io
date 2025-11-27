const fs = require('fs');

// Template base (psicólogo)
const template = fs.readFileSync('demos/psicologo.html', 'utf8');

// Configuraciones para cada negocio
const configs = {
    gimnasio: {
        businessId: 8,
        colors: { primary: '#FF5722', secondary: '#FFC107', rgba: '255, 87, 34' },
        title: 'PowerFit Gym & Training - Reserva tu clase',
        logo: '💪 PowerFit Gym',
        heroTitle: 'Transforma tu Cuerpo, Supera tus Límites',
        heroSubtitle: 'Entrenamiento personal y clases grupales con los mejores instructores certificados',
        servicesTitle: 'Nuestros Servicios',
        servicesSubtitle: 'Encuentra tu entrenamiento perfecto',
        services: [
            { icon: '🏋️', name: 'Entrenamiento Personal', desc: 'Sesión individual con entrenador certificado', time: '60 min', price: '40€' },
            { icon: '🧘', name: 'Yoga Grupal', desc: 'Clase de yoga para todos los niveles', time: '60 min', price: '15€' },
            { icon: '🚴', name: 'Spinning', desc: 'Clase de ciclismo indoor intensivo', time: '45 min', price: '12€' },
            { icon: '💪', name: 'CrossFit', desc: 'Entrenamiento funcional de alta intensidad', time: '60 min', price: '18€' },
            { icon: '🤸', name: 'Pilates', desc: 'Clase de pilates con máquinas y suelo', time: '50 min', price: '20€' }
        ],
        team: [
            { name: 'Marcos Ruiz', role: 'Entrenador Personal', desc: 'Especializado en fuerza y acondicionamiento físico' },
            { name: 'Elena Torres', role: 'Instructora de Yoga y Pilates', desc: 'Certificada internacionalmente en yoga y pilates' },
            { name: 'David Moreno', role: 'Coach de CrossFit', desc: 'Experto en entrenamiento funcional de alta intensidad' }
        ],
        footerName: 'PowerFit Gym',
        footerTagline: 'Tu mejor versión empieza aquí',
        footerDesc: 'Fitness profesional y motivador',
        address: 'Calle Bravo Murillo 456, Madrid',
        phone: '+34 915 678 012',
        email: 'reservas@powerfit.demo',
        schedule: 'Lunes a Sábado\n07:00 - 22:00',
        bookingTitle: 'Reserva tu Clase o Sesión Personal',
        bookingDesc: 'Elige tu entrenamiento favorito y reserva tu plaza. ¡Tu transformación comienza ahora!'
    },
    estetica: {
        businessId: 9,
        colors: { primary: '#E91E63', secondary: '#9C27B0', rgba: '233, 30, 99' },
        title: 'Estética Bella & Bella - Reserva tu cita',
        logo: '💅 Bella & Bella',
        heroTitle: 'Belleza y Bienestar en Cada Detalle',
        heroSubtitle: 'Tratamientos faciales y corporales con productos de alta calidad',
        servicesTitle: 'Nuestros Servicios',
        servicesSubtitle: 'Cuida tu belleza con profesionales',
        services: [
            { icon: '💅', name: 'Manicura Completa', desc: 'Arreglo y esmaltado de uñas', time: '45 min', price: '25€' },
            { icon: '🦶', name: 'Pedicura Spa', desc: 'Tratamiento completo para pies', time: '60 min', price: '35€' },
            { icon: '✨', name: 'Uñas de Gel', desc: 'Aplicación de uñas de gel con diseño', time: '90 min', price: '45€' },
            { icon: '💆', name: 'Tratamiento Facial Hidratante', desc: 'Limpieza profunda e hidratación facial', time: '60 min', price: '50€' },
            { icon: '🌟', name: 'Tratamiento Anti-Edad', desc: 'Tratamiento facial rejuvenecedor avanzado', time: '75 min', price: '70€' }
        ],
        team: [
            { name: 'Patricia Gómez', role: 'Esteticista Senior', desc: 'Más de 15 años de experiencia en tratamientos faciales' },
            { name: 'Silvia Ramírez', role: 'Especialista en Uñas', desc: 'Experta en manicura, pedicura y nail art' },
            { name: 'Cristina Ortiz', role: 'Especialista Facial', desc: 'Certificada en tratamientos anti-edad y rejuvenecimiento' }
        ],
        footerName: 'Bella & Bella',
        footerTagline: 'Tu belleza, nuestra especialidad',
        footerDesc: 'Estética profesional y personalizada',
        address: 'Calle Goya 178, Madrid',
        phone: '+34 916 789 123',
        email: 'citas@bellabella.demo',
        schedule: 'Lunes a Sábado\n10:00 - 20:00',
        bookingTitle: 'Reserva tu Tratamiento',
        bookingDesc: 'Agenda tu cita de belleza. Mereces un momento para ti'
    },
    abogados: {
        businessId: 10,
        colors: { primary: '#1976D2', secondary: '#424242', rgba: '25, 118, 210' },
        title: 'Despacho Jurídico Lex & Partners - Reserva tu consulta',
        logo: '⚖️ Lex & Partners',
        heroTitle: 'Asesoramiento Legal Profesional',
        heroSubtitle: 'Abogados especializados con más de 20 años de experiencia defendiendo tus derechos',
        servicesTitle: 'Áreas de Práctica',
        servicesSubtitle: 'Asesoramiento legal especializado',
        services: [
            { icon: '📋', name: 'Consulta Inicial', desc: 'Primera consulta legal sin compromiso', time: '30 min', price: 'Gratis' },
            { icon: '🏛️', name: 'Asesoramiento Civil', desc: 'Consulta sobre derecho civil', time: '60 min', price: 'Consultar' },
            { icon: '💼', name: 'Asesoramiento Mercantil', desc: 'Consulta sobre derecho mercantil y empresarial', time: '60 min', price: 'Consultar' },
            { icon: '👔', name: 'Asesoramiento Laboral', desc: 'Consulta sobre derecho laboral', time: '60 min', price: 'Consultar' },
            { icon: '⚖️', name: 'Defensa Penal', desc: 'Consulta sobre procesos penales', time: '60 min', price: 'Consultar' }
        ],
        team: [
            { name: 'Letrado Miguel Ángel Pérez', role: 'Abogado Civilista', desc: 'Especializado en derecho civil y de familia' },
            { name: 'Letrada Isabel Fernández', role: 'Abogada Mercantilista', desc: 'Experta en derecho mercantil y societario' },
            { name: 'Letrado Antonio Castro', role: 'Abogado Penalista', desc: 'Más de 15 años en defensa penal' }
        ],
        footerName: 'Lex & Partners',
        footerTagline: 'Tu defensa legal, nuestra misión',
        footerDesc: 'Asesoramiento jurídico de confianza',
        address: 'Paseo de la Castellana 95, Madrid',
        phone: '+34 917 890 234',
        email: 'consultas@lexpartners.demo',
        schedule: 'Lunes a Viernes\n09:00 - 19:00',
        bookingTitle: 'Reserva tu Consulta Legal',
        bookingDesc: 'Agenda tu cita con nuestros abogados especializados. Primera consulta sin compromiso'
    }
};

// Función para generar HTML de servicios
function generateServices(services) {
    return services.map(s => `
                <div class="service-card">
                    <div class="service-icon">${s.icon}</div>
                    <h3>${s.name}</h3>
                    <p>${s.desc}</p>
                    <div class="service-details"><span>⏱️ ${s.time}</span><span>💰 ${s.price}</span></div>
                </div>`).join('');
}

// Función para generar HTML de equipo
function generateTeam(team) {
    return team.map(t => `
                <div class="team-member">
                    <div class="team-avatar">👤</div>
                    <h3>${t.name}</h3>
                    <p>${t.role}</p>
                    <p style="color: #999; font-size: 0.9rem; margin-top: 10px;">${t.desc}</p>
                </div>`).join('');
}

// Generar cada página
Object.keys(configs).forEach(key => {
    const config = configs[key];
    let html = template;

    // Reemplazos
    html = html.replace(/Centro de Psicología Mente Clara - Reserva tu consulta/g, config.title);
    html = html.replace(/🧠 Mente Clara/g, config.logo);
    html = html.replace(/Tu Bienestar Mental es Nuestra Prioridad/g, config.heroTitle);
    html = html.replace(/Terapia profesional con psicólogos certificados en un entorno confidencial y acogedor/g, config.heroSubtitle);
    html = html.replace(/Agenda tu cita de forma fácil y confidencial\. Primer paso hacia tu bienestar/g, config.bookingDesc);

    // Colores
    html = html.replace(/rgba\(74, 144, 226/g, `rgba(${config.colors.rgba}`);
    html = html.replace(/#4A90E2/g, config.colors.primary);
    html = html.replace(/#7B68EE/g, config.colors.secondary);

    // businessId
    html = html.replace(/businessId: 6/g, `businessId: ${config.businessId}`);

    // Servicios
    const servicesSection = `            <h2 class="section-title">${config.servicesTitle}</h2>
            <p class="section-subtitle">${config.servicesSubtitle}</p>

            <div class="services-grid">${generateServices(config.services)}
            </div>`;
    html = html.replace(/<h2 class="section-title">Nuestros Servicios<\/h2>[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/m, servicesSection + '\n        </div>\n    </section>');

    // Equipo
    const teamSection = `            <h2 class="section-title">Nuestro Equipo</h2>
            <p class="section-subtitle">Profesionales con amplia experiencia</p>

            <div class="team-grid">${generateTeam(config.team)}
            </div>`;
    html = html.replace(/<h2 class="section-title">Nuestro Equipo<\/h2>[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/m, teamSection + '\n        </div>\n    </section>');

    // Reserva
    html = html.replace(/Reserva tu Consulta<\/h2>/g, `${config.bookingTitle}</h2>`);

    // Footer
    html = html.replace(/Mente Clara<\/h4>/g, `${config.footerName}</h4>`);
    html = html.replace(/Tu salud mental, nuestra misión/g, config.footerTagline);
    html = html.replace(/Psicología profesional y cercana/g, config.footerDesc);
    html = html.replace(/Calle Serrano 89, Madrid/g, config.address);
    html = html.replace(/\+34 913 456 789/g, config.phone);
    html = html.replace(/contacto@menteclara\.demo/g, config.email);
    html = html.replace(/Lunes a Viernes<\/p>\s*<p>09:00 - 20:00/g, config.schedule.replace('\n', '</p>\n                <p>'));
    html = html.replace(/Centro de Psicología Mente Clara - Demo/g, `${config.footerName} - Demo`);

    // Escribir archivo
    fs.writeFileSync(`demos/${key}.html`, html, 'utf8');
    console.log(`✓ ${key}.html creado`);
});

console.log('\n🎉 ¡Todas las páginas generadas exitosamente!');
