/**
 * Base de conocimiento del asistente de ayuda del panel.
 *
 * Cada tema es una pregunta tal y como la haría un negocio, con una respuesta corta
 * y botones que llevan a la pantalla correspondiente.
 *   go: 'seccion'            → app.navigateTo(seccion)        (dashboard, bookings, clients, services, calendar, opiniones, ai-reports, workshops, settings, support)
 *   go: 'settings:pestaña'   → Configuración en esa pestaña    (business, schedule, capacity, zones, notifications, feedback, widget, publicpage, profile, security, team, billing, invite, consultancy, advanced)
 *   go: 'clients:pestaña'    → Clientes en esa pestaña         (clientes, estadisticas, recordatorios, promociones)
 *
 * IMPORTANTE: describir solo lo que la plataforma hace de verdad. Al cambiar una función,
 * actualizar aquí su respuesta (es la única guía del panel).
 */
window.HELP_CATEGORIES = [
    { id: 'empezar', icon: '🚀', title: 'Primeros pasos' },
    { id: 'reservas', icon: '📅', title: 'Reservas y citas' },
    { id: 'servicios', icon: '🛠️', title: 'Servicios y horarios' },
    { id: 'avisos', icon: '📧', title: 'Emails y avisos' },
    { id: 'clientes', icon: '👥', title: 'Clientes y opiniones' },
    { id: 'web', icon: '🎨', title: 'Widget y página de reservas' },
    { id: 'cuenta', icon: '⚙️', title: 'Cuenta, equipo y plan' }
];

window.HELP_TOPICS = [
    // ===================== PRIMEROS PASOS =====================
    {
        id: 'empezar-reservas', cat: 'empezar', popular: true,
        q: '¿Cómo empiezo a recibir reservas online?',
        keywords: 'empezar comenzar inicio primeros pasos recibir reservas online clientes configurar',
        a: `<p>En tres pasos:</p>
            <ol>
                <li><strong>Revisa tus servicios y tu horario</strong>: al registrarte te creamos unos de ejemplo; ajústalos a tu negocio.</li>
                <li><strong>Comparte tu enlace de reservas</strong> en Instagram, Google o WhatsApp, o pon el formulario en tu web.</li>
                <li>Cuando un cliente reserve, te llegará un email y la verás en <strong>Reservas</strong>.</li>
            </ol>
            <p>En el Dashboard tienes la lista de <em>Primeros pasos</em> con tu progreso.</p>`,
        actions: [{ label: 'Ir a Servicios', go: 'services' }, { label: 'Ir a Horarios', go: 'settings:schedule' }]
    },
    {
        id: 'enlace-reservas', cat: 'empezar', popular: true,
        q: '¿Dónde está mi enlace de reservas para compartir?',
        keywords: 'enlace link url compartir pagina publica reservar instagram google whatsapp redes',
        a: `<p>Tu enlace está en <strong>Configuración → Mi página</strong>, con botones para copiarlo y verlo. Tiene esta forma: <code>stickywork.com/reservar?n=tu-negocio</code>.</p>
            <p>Funciona aunque no tengas web: tus clientes ven tus servicios y reservan desde ahí. En la misma pantalla tienes el <strong>código QR</strong> para imprimir.</p>`,
        actions: [{ label: 'Ir a Mi página', go: 'settings:publicpage' }]
    },
    {
        id: 'widget-web', cat: 'empezar',
        q: '¿Cómo pongo el formulario de reservas en mi web?',
        keywords: 'widget web pagina integrar codigo pegar insertar formulario embebido boton flotante html wordpress wix',
        a: `<p>Ve a <strong>Configuración → Widget</strong>, apartado <em>🔗 Integrar en tu web</em>, y elige:</p>
            <ul>
                <li><strong>Formulario embebido</strong>: aparece dentro de tu página (ideal para una página "Reservar").</li>
                <li><strong>Botón flotante</strong>: un botón fijo en una esquina que abre el formulario.</li>
            </ul>
            <p>Copia el código y pégalo en tu web (o pásaselo a quien te la lleve). Después haz una reserva de prueba para comprobar que llega.</p>`,
        actions: [{ label: 'Ir a Widget', go: 'settings:widget' }]
    },
    {
        id: 'google', cat: 'empezar',
        q: '¿Mi página de reservas sale en Google?',
        keywords: 'google buscador buscar aparecer encontrar seo posicionamiento indexar busquedas ocultar privado',
        a: `<p>Sí, si tienes al menos un servicio activo: tu página de reservas está preparada para que Google la encuentre, con tu nombre, tu descripción y tus servicios con precios. Suele tardar unas semanas en empezar a salir.</p>
            <p>Para que salga mejor, rellena la <strong>descripción del negocio</strong> y las descripciones de tus servicios.</p>
            <p>Si prefieres que no salga, desmarca <strong>🔎 Aparecer en Google</strong> en <strong>Configuración → Mi página</strong>. El enlace seguirá funcionando para quien lo tenga.</p>`,
        actions: [{ label: 'Ir a Mi página', go: 'settings:publicpage' }]
    },
    {
        id: 'invitar', cat: 'empezar',
        q: '¿Cómo consigo meses gratis de Profesional?',
        keywords: 'invitar recomendar referido amigo enlace invitacion mes gratis regalo profesional ganar compartir',
        a: `<p>Invita a otro negocio con tu enlace de <strong>Configuración → Invita y gana</strong>.</p>
            <ul>
                <li>El negocio invitado empieza con <strong>1 mes de Profesional</strong> gratis.</li>
                <li>Cuando reciba sus primeras 3 reservas, tú también ganas <strong>1 mes de Profesional</strong>. Los meses se suman.</li>
            </ul>
            <p>Al acabar, vuelves al plan Gratis sin pagar nada. Si ya pagas un plan, el mes se descuenta de tu factura.</p>`,
        actions: [{ label: 'Ir a Invita y gana', go: 'settings:invite' }]
    },
    {
        id: 'qr', cat: 'empezar',
        q: '¿Cómo consigo un código QR para mi local?',
        keywords: 'qr codigo imprimir local cartel folleto tarjeta escanear movil',
        a: `<p>En <strong>Configuración → Mi página</strong> tienes el código QR de tu página de reservas, listo para descargar e imprimir en carteles, tarjetas o menús. También está en <strong>Configuración → Widget</strong>, en la pestaña <em>Código QR</em>.</p>`,
        actions: [{ label: 'Ir a Mi página', go: 'settings:publicpage' }]
    },

    // ===================== RESERVAS =====================
    {
        id: 'confirmar-rechazar', cat: 'reservas', popular: true,
        q: '¿Cómo confirmo o rechazo una reserva?',
        keywords: 'confirmar aceptar aprobar rechazar denegar reserva pendiente solicitud',
        a: `<p>Si usas la <strong>confirmación manual</strong>, las solicitudes aparecen en el Dashboard, en <em>⏳ Pendientes de confirmar</em>, con los botones <strong>Confirmar</strong> y <strong>Rechazar</strong>. También puedes hacerlo desde <strong>Reservas</strong> con los botones de cada fila.</p>
            <p>Al confirmar, el cliente recibe un email con su cita confirmada. Al rechazar, puedes escribir el motivo y le llega un email con un enlace para reservar otro día.</p>`,
        actions: [{ label: 'Ir al Dashboard', go: 'dashboard' }, { label: 'Ir a Reservas', go: 'bookings' }]
    },
    {
        id: 'confirmacion-manual', cat: 'reservas', popular: true,
        q: '¿Cómo hago para aceptar cada reserva antes de que sea definitiva?',
        keywords: 'confirmacion manual aceptar cada reserva aprobar antes pendiente solicitud evitar que vengan sin cita',
        a: `<p>Activa <strong>Configuración → Notificaciones → "Confirmar cada reserva manualmente"</strong> y guarda.</p>
            <p>Desde ese momento, al reservar el cliente recibe un email de <em>solicitud recibida</em> (que le pide no acudir todavía) y tú decides si la confirmas o la rechazas. Revisa las solicitudes a menudo: el cliente no tiene la cita asegurada hasta que respondes.</p>`,
        actions: [{ label: 'Ir a Notificaciones', go: 'settings:notifications' }]
    },
    {
        id: 'cambiar-cita', cat: 'reservas', popular: true,
        q: '¿Cómo cambio la fecha o la hora de una cita?',
        keywords: 'cambiar mover reprogramar fecha hora cita reserva modificar dia otro horario',
        a: `<p>Dos formas:</p>
            <ul>
                <li><strong>Calendario</strong>: abre el día, y en la cita pulsa <em>📅 Cambiar fecha/hora</em>.</li>
                <li><strong>Reservas</strong>: botón 📅 de la fila.</li>
            </ul>
            <p>Puedes elegir cualquier fecha y hora, aunque el hueco esté ocupado (te avisamos si coincide con otra cita). Deja marcado <em>Avisar al cliente por email</em> para que reciba los datos nuevos.</p>`,
        actions: [{ label: 'Ir al Calendario', go: 'calendar' }]
    },
    {
        id: 'reserva-manual', cat: 'reservas',
        q: '¿Cómo apunto una reserva que me han hecho por teléfono?',
        keywords: 'crear nueva reserva manual telefono apuntar anadir cita a mano',
        a: `<p>En <strong>Reservas</strong>, pulsa <strong>+ Nueva Reserva</strong> y rellena nombre, contacto, servicio, fecha y hora.</p>`,
        actions: [{ label: 'Ir a Reservas', go: 'bookings' }]
    },
    {
        id: 'cancelar', cat: 'reservas',
        q: '¿Cómo cancelo una reserva?',
        keywords: 'cancelar anular eliminar borrar reserva cita motivo',
        a: `<p>En <strong>Reservas</strong>, pulsa el botón de cancelar de la reserva y, si quieres, escribe el motivo.</p>
            <p>Si usas la confirmación manual, el cliente recibe un email avisándole, con el motivo. Si no, conviene que se lo comuniques tú (por ejemplo, con el botón de WhatsApp de la reserva).</p>`,
        actions: [{ label: 'Ir a Reservas', go: 'bookings' }]
    },
    {
        id: 'estados', cat: 'reservas',
        q: '¿Qué significa cada estado de una reserva?',
        keywords: 'estado pendiente confirmada completada cancelada no presentado significado colores',
        a: `<ul>
                <li><strong>Pendiente</strong> (amarillo): reserva recibida.</li>
                <li><strong>Confirmada</strong> (verde): la has aceptado.</li>
                <li><strong>Completada</strong> (azul): la cita ya pasó. Se marca sola unas horas después de la cita.</li>
                <li><strong>Cancelada</strong> (rojo): la has cancelado tú o el cliente.</li>
                <li><strong>No se presentó</strong>: el cliente no vino (lo marcas tú).</li>
            </ul>`,
        actions: [{ label: 'Ir a Reservas', go: 'bookings' }]
    },
    {
        id: 'no-show', cat: 'reservas',
        q: '¿Qué hago si un cliente no se presenta?',
        keywords: 'no se presento no show falta falto no vino ausencia cliente riesgo',
        a: `<p>En <strong>Reservas</strong>, marca la cita como <strong>No se presentó</strong> (aunque ya aparezca como completada).</p>
            <p>Si un cliente acumula 3 faltas, pasa automáticamente a la categoría <em>Riesgo</em> en Clientes (salvo los VIP). Puedes cambiar su categoría cuando quieras.</p>`,
        actions: [{ label: 'Ir a Reservas', go: 'bookings' }]
    },
    {
        id: 'repetir', cat: 'reservas',
        q: '¿Cómo creo citas que se repiten cada semana?',
        keywords: 'repetir cita semanal periodica recurrente cada semana quincenal',
        a: `<p>En <strong>Reservas</strong>, pulsa el botón 🔄 <em>Repetir cita</em> de una reserva y elige cada cuántas semanas (1 a 4) y cuántas veces (hasta 12).</p>`,
        actions: [{ label: 'Ir a Reservas', go: 'bookings' }]
    },
    {
        id: 'cliente-gestiona', cat: 'reservas',
        q: '¿El cliente puede cancelar o cambiar su cita él mismo?',
        keywords: 'cliente cancelar cambiar su cita gestionar mi reserva autoservicio enlace email',
        a: `<p>Sí. En el email de su reserva hay un botón <strong>Gestionar mi reserva</strong> desde el que puede cancelarla o cambiar la hora (el mismo día).</p>
            <p>Cuando lo hace, te llega un email avisándote (puedes desactivarlo en Configuración → Notificaciones) y lo verás en el Dashboard.</p>`,
        actions: [{ label: 'Ir a Notificaciones', go: 'settings:notifications' }]
    },

    // ===================== SERVICIOS Y HORARIOS =====================
    {
        id: 'servicios', cat: 'servicios', popular: true,
        q: '¿Cómo añado o cambio un servicio y su precio?',
        keywords: 'servicio anadir crear nuevo editar cambiar precio duracion nombre descripcion',
        a: `<p>En <strong>Servicios</strong>: <strong>+ Nuevo Servicio</strong> para crear uno, o el icono ✏️ para editarlo. Puedes indicar nombre, descripción, duración, precio y cuántas personas pueden reservarlo a la vez. Los cambios se ven al momento en tu formulario de reservas.</p>`,
        actions: [{ label: 'Ir a Servicios', go: 'services' }]
    },
    {
        id: 'ocultar-servicio', cat: 'servicios',
        q: '¿Cómo oculto un servicio sin borrarlo?',
        keywords: 'ocultar desactivar servicio temporal quitar sin borrar',
        a: `<p>En <strong>Servicios</strong>, edita el servicio y desmarca <em>Activo</em>. Deja de aparecer para tus clientes y puedes volver a activarlo cuando quieras. Las reservas que ya tenía no se pierden.</p>`,
        actions: [{ label: 'Ir a Servicios', go: 'services' }]
    },
    {
        id: 'horario', cat: 'servicios', popular: true,
        q: '¿Cómo cambio mi horario de trabajo?',
        keywords: 'horario horas dias abrir cerrar laborables partido continuo turnos manana tarde intervalo',
        a: `<p>En <strong>Configuración → Horarios</strong> marcas qué días abres y eliges:</p>
            <ul>
                <li><strong>Horario continuo</strong>: un solo tramo (por ejemplo, 9:00 a 20:00).</li>
                <li><strong>Horario partido</strong>: varios turnos (por ejemplo, mañana y tarde).</li>
            </ul>
            <p>También puedes elegir cada cuántos minutos se ofrecen horas (15, 30, 60...).</p>`,
        actions: [{ label: 'Ir a Horarios', go: 'settings:schedule' }]
    },
    {
        id: 'festivo', cat: 'servicios',
        q: '¿Cómo cierro un día festivo o mis vacaciones?',
        keywords: 'festivo vacaciones cerrar dia concreto bloquear fecha puente cerrado',
        a: `<p>Todavía no se puede cerrar una fecha concreta. Lo que sí puedes hacer es desmarcar un día de la semana en <strong>Configuración → Horarios</strong>, pero eso cierra <em>todas</em> las semanas, así que acuérdate de volver a marcarlo después.</p>
            <p>Si alguien reserva ese día, puedes cancelar la cita indicando el motivo.</p>`,
        actions: [{ label: 'Ir a Horarios', go: 'settings:schedule' }]
    },
    {
        id: 'capacidad', cat: 'servicios',
        q: '¿Cómo hago que varias personas puedan reservar a la misma hora?',
        keywords: 'capacidad varias personas misma hora simultaneas plazas profesionales sillas',
        a: `<p>En <strong>Configuración → Capacidad</strong> indicas cuántas reservas aceptas a la vez (por ejemplo, 3 si sois tres profesionales). Cuando se llena una hora, deja de ofrecerse.</p>`,
        actions: [{ label: 'Ir a Capacidad', go: 'settings:capacity' }]
    },
    {
        id: 'zonas', cat: 'servicios',
        q: 'Tengo un restaurante: ¿puedo separar terraza e interior?',
        keywords: 'restaurante zonas terraza interior mesas comensales barra',
        a: `<p>Sí. En <strong>Configuración → Zonas</strong> (solo en restaurantes) creas tus zonas con su capacidad, y el cliente elige dónde quiere sentarse al reservar.</p>`,
        actions: [{ label: 'Ir a Zonas', go: 'settings:zones' }]
    },
    {
        id: 'talleres', cat: 'servicios',
        q: '¿Cómo publico un taller o una clase con plazas limitadas?',
        keywords: 'taller clase curso evento grupo plazas sesiones inscripcion',
        a: `<p>En <strong>Talleres</strong> pulsa <strong>+ Crear Taller</strong>, indica nombre, descripción y precio, y añade una o varias sesiones con fecha, hora y número de plazas. Aparecen en tu formulario de reservas y el sistema controla las plazas libres.</p>`,
        actions: [{ label: 'Ir a Talleres', go: 'workshops' }]
    },

    // ===================== EMAILS Y AVISOS =====================
    {
        id: 'emails-cliente', cat: 'avisos', popular: true,
        q: '¿Qué emails recibe mi cliente?',
        keywords: 'emails cliente recibe confirmacion recordatorio aviso mensaje correo',
        a: `<ul>
                <li><strong>Al reservar</strong>: email de confirmación con un archivo para añadir la cita a su calendario y el botón <em>Gestionar mi reserva</em>. Si usas la confirmación manual, recibe primero <em>solicitud recibida</em> y después la confirmación o el rechazo.</li>
                <li><strong>El día antes</strong>: un recordatorio de su cita con un botón para cancelarla o cambiar la hora (si tienes activados los recordatorios automáticos).</li>
                <li><strong>Si mueves su cita</strong> y marcas "Avisar al cliente": los datos nuevos.</li>
            </ul>`,
        actions: [{ label: 'Ir a Notificaciones', go: 'settings:notifications' }]
    },
    {
        id: 'avisos-negocio', cat: 'avisos',
        q: '¿Qué avisos me llegan a mí y cómo los desactivo?',
        keywords: 'avisos notificaciones negocio me llegan email nueva reserva cancelacion cambio desactivar',
        a: `<p>Te llega un email cuando:</p>
            <ul>
                <li>Un cliente hace una <strong>nueva reserva</strong>.</li>
                <li>Un cliente <strong>cancela</strong> su cita desde su email.</li>
                <li>Un cliente <strong>cambia la hora</strong> de su cita.</li>
            </ul>
            <p>Puedes activar o desactivar cada uno en <strong>Configuración → Notificaciones</strong>. Llegan al <em>Email de notificaciones</em> de esa misma pantalla.</p>`,
        actions: [{ label: 'Ir a Notificaciones', go: 'settings:notifications' }]
    },
    {
        id: 'no-llegan-emails', cat: 'avisos',
        q: 'Mis clientes dicen que no les llega el email',
        keywords: 'no llega email correo spam cliente no recibe confirmacion problema',
        a: `<ul>
                <li>Pídeles que miren en la carpeta de <strong>spam</strong> o "Promociones".</li>
                <li>Comprueba en <strong>Reservas</strong> que el email del cliente está bien escrito.</li>
                <li>Mientras tanto, puedes escribirle con el botón de <strong>WhatsApp</strong> de la reserva.</li>
            </ul>
            <p>Si sigue sin llegar, escríbenos y lo revisamos.</p>`,
        actions: [{ label: 'Escribir a soporte', go: 'support' }]
    },
    {
        id: 'recordatorios', cat: 'avisos',
        q: '¿Se envían recordatorios a los clientes antes de la cita?',
        keywords: 'recordatorio aviso antes cita dia anterior 24 horas olvido',
        a: `<p>Sí: cada mañana se envía un email a los clientes que tienen cita al día siguiente, con un botón para cancelar o cambiar la hora si no pueden venir. Puedes activarlo o desactivarlo en <strong>Configuración → Notificaciones → Recordatorios automáticos</strong>.</p>
            <p>En el Dashboard, la caja <em>Recordatorio 24h</em> te permite además enviarles un WhatsApp a mano.</p>`,
        actions: [{ label: 'Ir a Notificaciones', go: 'settings:notifications' }]
    },
    {
        id: 'whatsapp', cat: 'avisos',
        q: '¿Cómo uso WhatsApp con mis clientes?',
        keywords: 'whatsapp mensaje numero plantilla enviar cliente',
        a: `<p>En <strong>Configuración → Notificaciones</strong> pon tu número de WhatsApp y, si quieres, personaliza la plantilla del mensaje.</p>
            <p>Después, cada reserva tiene un botón de WhatsApp que abre la conversación con el mensaje ya escrito; tú solo pulsas enviar. Los mensajes no se envían solos.</p>`,
        actions: [{ label: 'Ir a Notificaciones', go: 'settings:notifications' }]
    },

    // ===================== CLIENTES Y OPINIONES =====================
    {
        id: 'categorias-clientes', cat: 'clientes',
        q: '¿Qué son las categorías VIP, Riesgo y Baneado?',
        keywords: 'clientes categorias vip premium normal riesgo baneado bloquear',
        a: `<ul>
                <li><strong>VIP</strong>: clientes especiales o habituales (lo marcas tú).</li>
                <li><strong>Normal</strong>: el resto.</li>
                <li><strong>Riesgo</strong>: clientes con 3 o más faltas; se asigna sola.</li>
                <li><strong>Baneado</strong>: clientes que no quieres atender; no pueden reservar online.</li>
            </ul>
            <p>Cambia la categoría desde la ficha del cliente en <strong>Clientes</strong>, y filtra tus reservas por categoría en <strong>Reservas</strong>.</p>`,
        actions: [{ label: 'Ir a Clientes', go: 'clients' }]
    },
    {
        id: 'clientes-inactivos', cat: 'clientes',
        q: '¿Cómo veo qué clientes hace tiempo que no vienen?',
        keywords: 'clientes inactivos no vienen recuperar volver recordatorio tiempo',
        a: `<p>En <strong>Clientes → Recordatorios</strong> ves los clientes que llevan tiempo sin reservar, para escribirles y animarles a volver.</p>`,
        actions: [{ label: 'Ir a Recordatorios', go: 'clients:recordatorios' }]
    },
    {
        id: 'fidelizacion', cat: 'clientes',
        q: '¿Cómo premio a los clientes que repiten?',
        keywords: 'fidelizacion fidelidad premio vale descuento repetir puntos tarjeta visitas',
        a: `<p>En <strong>Clientes → Promociones</strong> configuras el programa de fidelización: eliges cada cuántas visitas consigue un premio. Tus clientes consultan su progreso con un QR y reciben un vale al llegar a la meta.</p>`,
        actions: [{ label: 'Ir a Promociones', go: 'clients:promociones' }]
    },
    {
        id: 'pedir-opinion', cat: 'clientes', popular: true,
        q: '¿Cómo pido a mis clientes que me valoren?',
        keywords: 'opinion valoracion resena feedback encuesta pedir estrellas',
        a: `<p>Unas 24 horas después de cada cita aparece en el Dashboard (caja <em>Feedback post-cita</em>) y en <strong>Opiniones</strong>. Pulsa <strong>Solicitar opinión</strong>: se abre WhatsApp con un mensaje y el enlace a la encuesta.</p>
            <p>Las respuestas aparecen en <strong>Opiniones</strong> y se usan en los reportes de IA.</p>`,
        actions: [{ label: 'Ir a Opiniones', go: 'opiniones' }]
    },
    {
        id: 'preguntas-encuesta', cat: 'clientes',
        q: '¿Puedo cambiar las preguntas de la encuesta?',
        keywords: 'encuesta preguntas personalizar feedback cambiar opinion',
        a: `<p>Sí, en <strong>Configuración → Encuestas</strong> puedes añadir hasta 3 preguntas propias (estrellas, texto libre u opciones) además de la valoración general.</p>`,
        actions: [{ label: 'Ir a Encuestas', go: 'settings:feedback' }]
    },

    // ===================== WIDGET Y PÁGINA =====================
    {
        id: 'personalizar-widget', cat: 'web',
        q: '¿Cómo pongo los colores de mi negocio en el formulario?',
        keywords: 'personalizar colores diseno estilo widget formulario fuente botones',
        a: `<p>En <strong>Configuración → Widget</strong> eliges colores, tipografía, bordes y estilo de botones, con vista previa antes de guardar.</p>
            <p>Por ahora no se puede añadir tu logo al formulario.</p>`,
        actions: [{ label: 'Ir a Widget', go: 'settings:widget' }]
    },
    {
        id: 'widget-no-se-ve', cat: 'web',
        q: 'El formulario no se ve en mi web',
        keywords: 'widget no se ve no aparece no funciona web error codigo',
        a: `<ul>
                <li>Comprueba que pegaste el código completo, incluidas las etiquetas <code>&lt;script&gt;</code>.</li>
                <li>Si usas el formulario embebido, la página necesita el <code>&lt;div id="stickywork-widget"&gt;</code> del código.</li>
                <li>Prueba en una ventana de incógnito por si es la caché.</li>
            </ul>
            <p>Si sigue sin verse, escríbenos con la dirección de tu web y lo miramos.</p>`,
        actions: [{ label: 'Ir a Widget', go: 'settings:widget' }, { label: 'Escribir a soporte', go: 'support' }]
    },
    {
        id: 'idioma-widget', cat: 'web',
        q: '¿El formulario está en otros idiomas?',
        keywords: 'idioma ingles english lenguaje widget traducir',
        a: `<p>Está en español y en inglés. Para el inglés, en el código del widget cambia <code>language: 'es'</code> por <code>language: 'en'</code> (o pídenoslo y te ayudamos).</p>`,
        actions: [{ label: 'Escribir a soporte', go: 'support' }]
    },

    // ===================== CUENTA, EQUIPO Y PLAN =====================
    {
        id: 'contrasena', cat: 'cuenta',
        q: '¿Cómo cambio mi contraseña?',
        keywords: 'contrasena password clave cambiar seguridad acceso olvidada',
        a: `<p>En <strong>Configuración → Perfil</strong>, apartado <em>Cambiar contraseña</em>. En <strong>Configuración → Seguridad</strong> puedes activar además la verificación en dos pasos.</p>
            <p>Si la has olvidado, en la pantalla de acceso pulsa "¿Olvidaste tu contraseña?".</p>`,
        actions: [{ label: 'Ir a Perfil', go: 'settings:profile' }, { label: 'Ir a Seguridad', go: 'settings:security' }]
    },
    {
        id: 'equipo', cat: 'cuenta',
        q: '¿Cómo doy acceso a alguien de mi equipo?',
        keywords: 'equipo usuario empleado acceso anadir miembro rol permisos trabajador',
        a: `<p>En <strong>Configuración → Equipo</strong> (solo el propietario de la cuenta) creas el usuario con su email y una contraseña; le llega un email con sus datos de acceso. Elige su rol:</p>
            <ul>
                <li><strong>Administrador</strong>: puede gestionar casi todo.</li>
                <li><strong>Personal</strong>: trabaja con reservas, clientes y calendario, sin acceso a servicios, configuración, reportes ni facturación.</li>
            </ul>
            <p>El número de usuarios depende de tu plan: 1 en Gratis, 3 en Profesional y 10 en Premium.</p>`,
        actions: [{ label: 'Ir a Equipo', go: 'settings:team' }]
    },
    {
        id: 'planes', cat: 'cuenta', popular: true,
        q: '¿Qué incluye cada plan y cómo cambio?',
        keywords: 'plan planes precio precios cuanto cuesta coste tarifa gratis gratuito profesional premium cambiar pagar suscripcion limite 30 reservas marca logo stickywork quitar enlace',
        a: `<ul>
                <li><strong>Gratis</strong> (0 €): hasta 30 reservas al mes y 1 usuario. Tu formulario y los emails a tus clientes incluyen un pequeño enlace «Reservas con StickyWork».</li>
                <li><strong>Profesional</strong> (39 €/mes): reservas ilimitadas, 3 usuarios, 1 reporte de IA al mes y sin la marca StickyWork.</li>
                <li><strong>Premium</strong> (79 €/mes): 10 usuarios, 2 reportes de IA a la semana y 1 hora de consultoría al mes.</li>
            </ul>
            <p>Cambia de plan en <strong>Configuración → Plan</strong>; los planes de pago tienen 7 días de prueba. En el plan Gratis, al llegar a 30 reservas en el mes tus clientes no pueden reservar online hasta el mes siguiente, salvo que cambies a Profesional; te avisamos en el Dashboard cuando te acercas.</p>`,
        actions: [{ label: 'Ver planes', go: 'settings:billing' }]
    },
    {
        id: 'reportes-ia', cat: 'cuenta',
        q: '¿Qué son los reportes con IA?',
        keywords: 'reportes ia inteligencia artificial informe analisis mensual recomendaciones',
        a: `<p>Un informe en lenguaje sencillo sobre tu negocio: reservas, cancelaciones, servicios más pedidos, lo que opinan tus clientes, puntos fuertes, aspectos a mejorar y un plan de acción.</p>
            <p>Está incluido en los planes Profesional y Premium. En <strong>Reportes IA → Contexto de mi negocio</strong> puedes contarle a la IA cómo es tu negocio para que las recomendaciones sean más acertadas.</p>`,
        actions: [{ label: 'Ir a Reportes IA', go: 'ai-reports' }]
    },
    {
        id: 'consultoria', cat: 'cuenta',
        q: '¿Cómo solicito la consultoría?',
        keywords: 'consultoria asesoria llamada sesion ayuda personalizada premium',
        a: `<p>Con el plan Premium tienes 1 hora de consultoría al mes. Solicítala en <strong>Configuración → Consultoría</strong> eligiendo el tema, y te contactaremos para fijar la llamada.</p>`,
        actions: [{ label: 'Ir a Consultoría', go: 'settings:consultancy' }]
    },
    {
        id: 'eliminar-cuenta', cat: 'cuenta',
        q: '¿Cómo doy de baja mi cuenta y borro mis datos?',
        keywords: 'eliminar borrar cuenta baja darse de baja datos rgpd cancelar suscripcion cerrar',
        a: `<p>Escríbenos desde <strong>Ayuda → Escríbenos</strong> (o en <strong>Configuración → Avanzado → Eliminar mi cuenta</strong>) y gestionamos la baja y el borrado de tus datos: reservas, clientes y configuración. Te confirmaremos cuando esté hecho.</p>
            <p>Si solo quieres dejar de pagar, puedes cambiar al plan Gratis en <strong>Configuración → Plan</strong> sin perder nada.</p>`,
        actions: [{ label: 'Escribir a soporte', go: 'support' }, { label: 'Ver planes', go: 'settings:billing' }]
    },
    {
        id: 'datos-negocio', cat: 'cuenta',
        q: '¿Cómo cambio el nombre, la dirección o el teléfono de mi negocio?',
        keywords: 'datos negocio nombre direccion telefono web email cambiar informacion',
        a: `<p>En <strong>Configuración → Datos</strong>. Estos datos aparecen en tu formulario, tu página de reservas y los emails a tus clientes. Si tienes web, añádela: se usa en el enlace para volver a reservar.</p>`,
        actions: [{ label: 'Ir a Datos', go: 'settings:business' }]
    }
];
