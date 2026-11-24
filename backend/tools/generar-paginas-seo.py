# Uso: python3 backend/tools/generar-paginas-seo.py .   (desde la raíz del repo)
# Regenera las páginas de sector (reservas-online-*.html) y el blog (blog/). Para añadir un artículo: nuevo ARTICLES.append(...) y ejecutar.
"""Generador de las páginas SEO (sectores + blog) con la cabecera, menú y pie de la web."""
import json, html, os, sys

ROOT = sys.argv[1]
SITE = 'https://stickywork.com'

HEAD_TRACKING = '''    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-QNNFJWC6PV"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-QNNFJWC6PV');
    </script>
    <script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "us5furlqob");
    </script>
'''

NAV = '''    <nav class="navbar">
        <div class="nav-container">
            <a href="/index.html" class="logo">StickyWork</a>
            <button class="nav-toggle" aria-label="Abrir menú"><span></span><span></span><span></span></button>
            <ul class="nav-menu">
                <li><a href="/como-funciona.html" class="nav-link">Cómo funciona</a></li>
                <li><a href="/planes.html" class="nav-link">Planes</a></li>
                <li><a href="/casos-exito.html" class="nav-link">Casos de uso</a></li>
                <li><a href="/demo.html" class="nav-link">Demo</a></li>
                <li><a href="/blog/" class="nav-link">Blog</a></li>
                <li class="nav-sep" aria-hidden="true"></li><li><a href="/registro.html" class="nav-link nav-link-cta">Empezar Gratis</a></li>
                <li><a href="/admin-login.html" class="nav-link" style="color: var(--primary-color);">Iniciar Sesión</a></li>
                <li><button id="theme-toggle" class="theme-toggle-nav" aria-label="Cambiar a modo oscuro" role="menuitem"><span class="theme-icon">🌙</span></button></li>
            </ul>
        </div>
    </nav>
'''

FOOTER = '''    <footer class="footer">
        <div class="footer-content">
            <div class="footer-section">
                <h3>StickyWork</h3>
                <p>La plataforma de reservas online más sencilla para negocios físicos.</p>
            </div>
            <div class="footer-section">
                <h3>Producto</h3>
                <ul>
                    <li><a href="/como-funciona.html">Cómo funciona</a></li>
                    <li><a href="/planes.html">Planes y precios</a></li>
                    <li><a href="/casos-exito.html">Casos de uso</a></li>
                    <li><a href="/demo.html">Demo interactiva</a></li>
                    <li><a href="/blog/">Blog</a></li>
                    <li><a href="/herramientas/">Herramientas gratis</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h3>Para tu sector</h3>
                <ul>
                    <li><a href="/reservas-online-nutricionistas.html">Nutricionistas</a></li>
                    <li><a href="/reservas-online-peluquerias.html">Peluquerías</a></li>
                    <li><a href="/reservas-online-psicologos.html">Psicólogos</a></li>
                    <li><a href="/reservas-online-fisioterapeutas.html">Fisioterapeutas</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h3>Contacto</h3>
                <ul>
                    <li><a href="/contacto.html">Contacto</a></li>
                    <li><a href="mailto:soporte@stickywork.com">soporte@stickywork.com</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h3>Legal</h3>
                <ul>
                    <li><a href="/terminos.html">Términos de servicio</a></li>
                    <li><a href="/politica-privacidad.html">Política de privacidad</a></li>
                    <li><a href="/politica-cookies.html">Cookies</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 StickyWork. Todos los derechos reservados.</p>
        </div>
    </footer>

    <script src="/js/main.js"></script>
    <script src="/js/cookie-consent.js"></script>
    <script src="/js/dark-mode.js"></script>
    <script src="/js/scroll-to-top.js"></script>
'''

STYLE = '''    <style>
        .seo-hero { padding: 7.5rem 1.5rem 3rem; text-align: center; background: linear-gradient(135deg, var(--hero-bg-start, #0F16A3) 0%, var(--hero-bg-end, #4D53FF) 100%); color: var(--hero-text, #fff); }
        .seo-hero h1 { color: inherit; font-size: clamp(1.9rem, 4vw, 2.8rem); max-width: 860px; margin: 0 auto 1rem; line-height: 1.2; }
        .seo-hero p { max-width: 700px; margin: 0 auto 1.75rem; font-size: 1.1rem; opacity: 0.95; line-height: 1.6; }
        .seo-hero .seo-badge { display: inline-block; font-size: 0.85rem; font-weight: 600; padding: 0.35rem 0.9rem; border-radius: 999px; background: rgba(255,255,255,0.15); margin-bottom: 1rem; }
        .seo-hero .btn { margin: 0.25rem; }
        .seo-wrap { max-width: 860px; margin: 0 auto; padding: 3rem 1.5rem; }
        .seo-wrap h2 { font-size: 1.6rem; margin: 2.5rem 0 1rem; color: var(--text-primary); }
        .seo-wrap h3 { font-size: 1.15rem; margin: 1.5rem 0 0.5rem; color: var(--text-primary); }
        .seo-wrap p, .seo-wrap li { line-height: 1.75; color: var(--text-secondary); font-size: 1.02rem; }
        .seo-wrap ul, .seo-wrap ol { padding-left: 1.3rem; }
        .seo-wrap li { margin-bottom: 0.5rem; }
        .seo-wrap strong { color: var(--text-primary); }
        .seo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 1rem; margin: 1.5rem 0; }
        .seo-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.25rem; }
        .seo-card h3 { margin-top: 0; }
        .seo-card p { margin: 0; font-size: 0.97rem; }
        .seo-faq details { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 0.75rem; }
        .seo-faq summary { cursor: pointer; font-weight: 600; color: var(--text-primary); }
        .seo-faq details p { margin: 0.75rem 0 0; }
        .seo-cta { text-align: center; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 18px; padding: 2.25rem 1.5rem; margin: 3rem 0 1rem; }
        .seo-cta h2 { margin-top: 0; }
        .seo-meta { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem; }
        .seo-related a, .seo-wrap p a:not(.btn), .seo-wrap li a:not(.btn) { color: var(--primary-color); }
        [data-theme="dark"] .seo-related a, [data-theme="dark"] .seo-wrap p a:not(.btn), [data-theme="dark"] .seo-wrap li a:not(.btn) { color: #9ea2ff; }
        .seo-note { border-left: 4px solid var(--primary-color); background: var(--bg-secondary); padding: 1rem 1.25rem; border-radius: 8px; margin: 1.5rem 0; }
        .blog-list { display: grid; gap: 1.25rem; margin-top: 1.5rem; }
        .blog-item { display: block; text-decoration: none; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.5rem; }
        .blog-item:hover { border-color: var(--primary-color); }
        .blog-item h2 { margin: 0 0 0.5rem; font-size: 1.3rem; }
        .blog-item p { margin: 0; }
    </style>
'''

def page(path, title, description, h1, hero_html, body, schema=None, og_type='website', badge='', extra_head='', scripts=''):
    url = SITE + '/' + path.replace('index.html', '')
    schema_tags = ''
    for s in (schema or []):
        schema_tags += '    <script type="application/ld+json">\n' + json.dumps(s, ensure_ascii=False, indent=2) + '\n    </script>\n'
    doc = f'''<!DOCTYPE html>
<html lang="es">
<head>
{HEAD_TRACKING}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{html.escape(title)}</title>
    <meta name="description" content="{html.escape(description)}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    <link rel="canonical" href="{url}">
    <link rel="stylesheet" href="/css/styles.css">

    <meta property="og:type" content="{og_type}">
    <meta property="og:url" content="{url}">
    <meta property="og:site_name" content="StickyWork">
    <meta property="og:title" content="{html.escape(title)}">
    <meta property="og:description" content="{html.escape(description)}">
    <meta property="og:image" content="{SITE}/images/og-image.jpg">
    <meta property="og:locale" content="es_ES">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#0F16A3">
{schema_tags}{STYLE}{extra_head}</head>
<body>
{NAV}
    <header class="seo-hero">
        {f'<span class="seo-badge">{badge}</span>' if badge else ''}
        <h1>{h1}</h1>
        {hero_html}
    </header>

    <main class="seo-wrap">
{body}
    </main>

{FOOTER}{scripts}</body>
</html>
'''
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(doc)
    return url

def faq_schema(faqs):
    return {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]
    }

def faq_html(faqs):
    items = '\n'.join(f'''            <details>
                <summary>{html.escape(q)}</summary>
                <p>{html.escape(a)}</p>
            </details>''' for q, a in faqs)
    return f'''        <h2>Preguntas frecuentes</h2>
        <div class="seo-faq">
{items}
        </div>'''

CTA = '''        <div class="seo-cta">
            <h2>Pruébalo gratis en tu negocio</h2>
            <p>Plan gratuito para siempre con hasta 30 reservas al mes. Sin tarjeta de crédito y sin permanencia.</p>
            <a href="/registro.html" class="btn btn-primary">Crear mi cuenta gratis</a>
            <a href="/demo.html" class="btn btn-secondary">Ver la demo</a>
        </div>'''

HERO_BTNS = '<a href="/registro.html" class="btn btn-secondary">Empezar gratis</a> <a href="/demo.html" class="btn btn-outline">Ver la demo</a>'

def sector(slug, keyword_title, description, h1, intro, problems, features, how, faqs, related, extra='', badge='Plan gratuito · Sin tarjeta'):
    cards = '\n'.join(f'''            <div class="seo-card">
                <h3>{t}</h3>
                <p>{d}</p>
            </div>''' for t, d in features)
    probs = '\n'.join(f'            <li>{p}</li>' for p in problems)
    steps = '\n'.join(f'            <li>{s}</li>' for s in how)
    rel = ' · '.join(f'<a href="/{u}">{t}</a>' for t, u in related)
    body = f'''        <p>{intro}</p>
{extra}
        <h2>Lo que más quita tiempo en el día a día</h2>
        <ul>
{probs}
        </ul>

        <h2>Cómo te ayuda StickyWork</h2>
        <div class="seo-grid">
{cards}
        </div>

        <h2>Empezar es sencillo</h2>
        <ol>
{steps}
        </ol>

{faq_html(faqs)}

{CTA}

        <p class="seo-related">También para: {rel}. Más ideas en el <a href="/blog/">blog</a>.</p>'''
    return page(slug, keyword_title, description, h1,
                f'<p>{description}</p>\n        {HERO_BTNS}', body,
                schema=[faq_schema(faqs)], badge=badge)

COMMON_FAQ_PRICE = ('¿Cuánto cuesta?', 'Hay un plan gratuito para siempre con hasta 30 reservas al mes y 1 usuario. El plan Profesional cuesta 39 € al mes (reservas ilimitadas, 3 usuarios y un informe mensual con IA) y el Premium 79 € al mes. Los planes de pago tienen 7 días de prueba y no hay permanencia.')
COMMON_FAQ_WEB = ('¿Necesito tener página web?', 'No. Al registrarte tienes una página de reservas propia con un enlace que puedes compartir en Instagram, Google o WhatsApp, y un código QR para imprimir. Si tienes web, puedes añadir también el formulario de reservas copiando un pequeño código.')

urls = []

urls.append(sector(
    'reservas-online-nutricionistas.html',
    'Programa de citas online para nutricionistas | StickyWork',
    'Agenda online para consultas de nutrición y dietética: tus pacientes reservan la primera visita o el seguimiento a cualquier hora y reciben un recordatorio el día antes.',
    'Agenda y reservas online para nutricionistas',
    'Si tienes una consulta de nutrición, buena parte de la semana se va en coordinar citas: primeras visitas, revisiones cada dos semanas, pacientes que cambian la hora... StickyWork reúne todo eso en una agenda online que tus pacientes usan para reservar solos, sin llamadas ni mensajes a deshoras.',
    ['Pacientes que escriben por WhatsApp a cualquier hora para pedir o cambiar cita.',
     'Primeras consultas y seguimientos de distinta duración mezclados en la misma agenda.',
     'Revisiones periódicas que hay que volver a agendar una y otra vez.',
     'Pacientes que se olvidan de la cita o dejan de venir sin avisar.'],
    [('Primera visita y seguimientos', 'Crea cada tipo de consulta con su duración y precio. El sistema solo ofrece los huecos en los que cabe esa consulta.'),
     ('Revisiones que se repiten', 'Programa de una vez las revisiones semanales o quincenales de un paciente (hasta 12 citas) en lugar de apuntarlas una a una.'),
     ('Recordatorio el día antes', 'Cada paciente recibe un email el día anterior a su cita, y otro al reservar con la cita lista para añadir a su calendario.'),
     ('Tú decides qué citas aceptas', 'Si lo prefieres, cada reserva queda pendiente hasta que la confirmas, y el paciente recibe un email con tu respuesta.'),
     ('Pacientes que dejan de venir', 'Ve qué pacientes llevan tiempo sin reservar para escribirles y retomar el seguimiento.'),
     ('Opiniones y análisis', 'Envía una encuesta corta después de la consulta y, en los planes de pago, recibe un informe mensual con IA sobre cómo va tu consulta.')],
    ['Crea tu cuenta gratis y elige "Centro de Nutrición".',
     'Ajusta tus tipos de consulta, duraciones y horario.',
     'Comparte tu enlace de reservas o añade el formulario a tu web.',
     'Las citas llegan a tu panel y a tu email.'],
    [COMMON_FAQ_PRICE, COMMON_FAQ_WEB,
     ('¿Puedo aceptar cada cita antes de que sea definitiva?', 'Sí. Activa la confirmación manual: el paciente recibe un email de "solicitud recibida" que le pide no acudir todavía, y otro cuando confirmas o rechazas la cita desde tu panel.'),
     ('¿El paciente puede cancelar o cambiar la hora?', 'Sí. En el email de su reserva tiene un enlace para cancelarla o cambiar la hora ese mismo día, y tú recibes un aviso.')],
    [('Psicólogos', 'reservas-online-psicologos.html'), ('Fisioterapeutas', 'reservas-online-fisioterapeutas.html'), ('Peluquerías', 'reservas-online-peluquerias.html')]))

urls.append(sector(
    'reservas-online-peluquerias.html',
    'Programa de reservas online para peluquerías | StickyWork',
    'Reservas online para peluquerías y salones de belleza: tus clientas eligen servicio, día y hora desde Instagram, Google o tu web, sin llamadas ni mensajes.',
    'Reservas online para peluquerías y salones de belleza',
    'En una peluquería el teléfono suena con las manos ocupadas y los mensajes de "¿tienes hueco el sábado?" llegan a cualquier hora. Con StickyWork tus clientas ven los huecos libres y reservan solas, y cada servicio ocupa en la agenda justo el tiempo que necesita.',
    ['Llamadas y mensajes para pedir cita mientras atiendes a otra clienta.',
     'Servicios de duración muy distinta (corte, color, mechas) difíciles de encajar.',
     'Clientas que no se presentan y dejan un hueco que podrías haber llenado.',
     'Clientas habituales a las que te gustaría premiar.'],
    [('Cada servicio con su duración', 'Corte, tinte o mechas: indica la duración y el precio de cada uno. La agenda solo ofrece los huecos donde cabe.'),
     ('Varias clientas a la vez', 'Si sois varias personas en el salón, indica cuántas reservas aceptas a la misma hora.'),
     ('Recordatorios automáticos', 'Email al reservar y recordatorio el día antes. Además, un botón para escribir a cada clienta por WhatsApp con el mensaje ya preparado.'),
     ('Clientas que fallan', 'Marca a quien no se presenta: con tres faltas pasa automáticamente a "Riesgo" para que lo tengas en cuenta.'),
     ('Tarjeta de fidelización digital', 'Tarjeta de sellos por visitas con QR: al llegar al número que tú decidas, la clienta consigue un vale. <a href="/tarjeta-fidelizacion-digital.html">Cómo funciona</a>.'),
     ('Reservas desde Instagram', 'Pon tu enlace de reservas en la bio de Instagram y en Google, o imprime tu código QR para el mostrador.')],
    ['Crea tu cuenta gratis y elige "Peluquería / Salón de Belleza".',
     'Revisa los servicios de ejemplo: nombres, duración y precios.',
     'Pon tu enlace en Instagram y Google.',
     'Recibe las reservas en tu panel.'],
    [COMMON_FAQ_PRICE, COMMON_FAQ_WEB,
     ('¿Mis clientas tienen que descargarse una aplicación?', 'No. Reservan desde el navegador del móvil en tu enlace o en tu web, en un par de minutos.'),
     ('¿Qué pasa si una clienta quiere cambiar la cita?', 'Puede cambiar la hora o cancelar desde el enlace de su email, o puedes moverla tú desde el calendario y avisarla por email.')],
    [('Nutricionistas', 'reservas-online-nutricionistas.html'), ('Fisioterapeutas', 'reservas-online-fisioterapeutas.html'), ('Psicólogos', 'reservas-online-psicologos.html')],
    extra='''
        <div class="seo-note">
            <p><strong>Premia a tus clientas habituales sin tarjetas de cartón.</strong> Con la <a href="/tarjeta-fidelizacion-digital.html">tarjeta de fidelización digital</a> decides, por ejemplo, que cada 6 visitas completadas la clienta tenga un corte gratis. Ella escanea tu QR, escribe su email o teléfono y ve cuántas visitas lleva; al llegar a la meta recibe un vale con código que tú entregas desde el panel. Está incluida en todos los planes, también el Gratis.</p>
        </div>'''))

urls.append(sector(
    'reservas-online-psicologos.html',
    'Agenda online para psicólogos y gabinetes | StickyWork',
    'Agenda de citas online para psicólogos: tus pacientes reservan su sesión en tu enlace, reciben un recordatorio y tú decides qué solicitudes aceptas.',
    'Agenda de citas online para psicólogos',
    'En una consulta de psicología la agenda tiene que ser fiable y discreta: sesiones semanales que se repiten, primeras entrevistas, cambios de última hora. StickyWork te da una agenda online sencilla para que tus pacientes reserven sin tener que llamarte entre sesión y sesión.',
    ['Llamadas y mensajes para concertar citas que interrumpen las sesiones.',
     'Sesiones semanales o quincenales que hay que ir agendando.',
     'Primeras entrevistas que prefieres valorar antes de aceptar.',
     'Cancelaciones de última hora que dejan huecos en la agenda.'],
    [('Sesiones periódicas', 'Programa de una vez las sesiones semanales o quincenales de un paciente, hasta 12 citas.'),
     ('Revisa cada solicitud', 'Con la confirmación manual, ninguna cita es definitiva hasta que la aceptas; el paciente recibe un email con tu respuesta.'),
     ('Recordatorio el día antes', 'Email automático el día anterior a la sesión y archivo para añadirla al calendario.'),
     ('Cambios sin llamadas', 'El paciente puede cancelar o cambiar la hora desde el enlace de su email, y te llega un aviso.'),
     ('Horario partido', 'Configura turnos de mañana y tarde y la duración de tus sesiones.'),
     ('Tu propia página de reservas', 'Un enlace y un QR para compartir, aunque no tengas web.')],
    ['Crea tu cuenta gratis y elige "Clínica / Consultorio".',
     'Define tus tipos de sesión (primera entrevista, sesión individual, pareja...) y tu horario.',
     'Activa la confirmación manual si quieres revisar cada solicitud.',
     'Comparte tu enlace de reservas.'],
    [COMMON_FAQ_PRICE, COMMON_FAQ_WEB,
     ('¿Puedo revisar las solicitudes antes de aceptarlas?', 'Sí. Con la confirmación manual activada, las solicitudes aparecen en tu panel para confirmarlas o rechazarlas, y el paciente recibe un email en cada caso.'),
     ('¿Qué datos se piden al paciente?', 'Al reservar se piden nombre, email y teléfono, además del tipo de sesión, el día y la hora. Puede añadir una nota opcional.')],
    [('Nutricionistas', 'reservas-online-nutricionistas.html'), ('Fisioterapeutas', 'reservas-online-fisioterapeutas.html'), ('Peluquerías', 'reservas-online-peluquerias.html')]))

urls.append(sector(
    'reservas-online-fisioterapeutas.html',
    'Sistema de reservas para fisioterapia gratis | StickyWork',
    'Sistema de reservas para fisioterapia gratis: plan Gratis para siempre hasta 30 reservas al mes, sin tarjeta. Tratamientos en serie y recordatorios por email.',
    'Sistema de reservas para fisioterapia gratis: citas online para tu clínica',
    'Un tratamiento de fisioterapia suele ser una serie de sesiones, y cada ausencia es un hueco perdido. StickyWork te ayuda a llenar la agenda: tus pacientes reservan en tu enlace, programas las sesiones de un tratamiento de una vez y cada paciente recibe un recordatorio el día antes.',
    ['Tratamientos de varias sesiones que hay que ir agendando.',
     'Sesiones de distinta duración según la técnica o la zona.',
     'Pacientes que no acuden y dejan huecos en la agenda.',
     'Varios fisioterapeutas atendiendo a la vez.'],
    [('Tratamientos en serie', 'Programa las sesiones de un tratamiento de una vez: cada semana o cada dos, hasta 12 citas.'),
     ('Duración por tipo de sesión', 'Indica la duración y el precio de cada tipo de sesión; solo se ofrecen los huecos donde cabe.'),
     ('Varias camillas', 'Indica cuántas reservas aceptas a la vez si sois varios fisioterapeutas.'),
     ('Menos ausencias', 'Recordatorio por email el día antes y botón de WhatsApp para escribir al paciente. Los que faltan tres veces se marcan como "Riesgo".'),
     ('Tu equipo en el mismo panel', 'Da acceso a tus compañeros con su propio usuario (3 en el plan Profesional, 10 en el Premium).'),
     ('Opiniones de tus pacientes', 'Envía una encuesta corta después de la sesión para saber cómo valoran el tratamiento.')],
    ['Crea tu cuenta gratis y elige "Clínica / Consultorio".',
     'Define tus tipos de sesión y tu horario.',
     'Indica cuántos pacientes podéis atender a la vez.',
     'Comparte tu enlace o añade el formulario a tu web.'],
    [COMMON_FAQ_PRICE, COMMON_FAQ_WEB,
     ('¿Puedo programar todas las sesiones de un tratamiento?', 'Sí. Desde una reserva puedes repetirla cada 1 a 4 semanas, hasta 12 veces.'),
     ('¿Pueden trabajar varios fisioterapeutas en la misma cuenta?', 'Sí. Cada uno puede tener su propio usuario con permisos de administrador o de personal. El plan Gratis incluye 1 usuario, el Profesional 3 y el Premium 10.')],
    [('Nutricionistas', 'reservas-online-nutricionistas.html'), ('Psicólogos', 'reservas-online-psicologos.html'), ('Peluquerías', 'reservas-online-peluquerias.html')],
    extra='''
        <div class="seo-note">
            <p><strong>Un sistema de reservas para fisioterapia gratis, de verdad.</strong> El plan Gratis es para siempre: hasta 30 reservas al mes, 1 usuario y sin tarjeta de crédito. Te registras, configuras tus sesiones y empiezas a recibir citas; si tu clínica crece, puedes pasar a un plan de pago cuando quieras. Consulta los <a href="/planes.html">planes y precios</a>.</p>
        </div>
        <div class="seo-note">
            <p><strong>Pacientes de mantenimiento.</strong> Si tienes pacientes que vuelven con regularidad, puedes premiarlos con la <a href="/tarjeta-fidelizacion-digital.html">tarjeta de fidelización digital</a>: por ejemplo, un descuento en la sesión número 10. Cuenta las sesiones que marcas como completadas.</p>
        </div>''',
    badge='Gratis para siempre · Hasta 30 reservas al mes'))

# ======================= TARJETA DE FIDELIZACIÓN =======================
FIDE_FAQ = [
    ('¿Cuánto cuesta la tarjeta de fidelización digital?', 'Está incluida en todos los planes, también en el Gratis, sin coste adicional ni límite por plan. Eso sí, el plan Gratis tiene su propio tope de 30 reservas al mes. Consulta la página de planes y precios.'),
    ('¿Es una tarjeta de puntos por euros gastados?', 'No. Es una tarjeta de sellos por visitas: cada cita completada cuenta como una visita, da igual lo que haya gastado el cliente. Tú eliges cada cuántas visitas hay premio.'),
    ('¿Mis clientes tienen que descargarse una aplicación?', 'No. Es una página web: abren el QR o el enlace en el móvil, escriben su email o su teléfono y ven cuántas visitas llevan.'),
    ('¿Qué visitas cuentan?', 'Solo las citas que tú marcas como completadas en tu panel. Las citas canceladas o a las que el cliente no se presentó no suman.'),
    ('¿Cómo entrego el premio?', 'Cuando el cliente llega a la meta le aparece un vale con un código. Te lo enseña, lo localizas en tu panel y pulsas «Entregar premio» para que no pueda usarse dos veces. Después, la cuenta de visitas empieza de nuevo.'),
    ('¿Avisa StickyWork al cliente de que ha ganado el premio?', 'No de forma automática. El cliente lo ve cuando consulta su tarjeta, así que conviene recordárselo en el local o por mensaje.'),
    ('¿Qué premio puedo poner?', 'El que quieras, en texto libre: un corte gratis, un descuento en el siguiente servicio, un tratamiento extra, un producto... Tú decides y tú lo cumples.'),
]

FIDE_BODY = f'''        <p>Seguro que has tenido alguna vez una tarjeta de cartón con huecos para sellos: el café número diez gratis, el corte número seis de regalo. Es una buena idea que en la práctica falla mucho, y por eso cada vez más negocios con cita previa la pasan a formato digital. Aquí te explicamos cómo funciona la <strong>tarjeta de fidelización digital de StickyWork</strong> y cómo montar un programa que de verdad haga volver a tus clientes.</p>

        <h2>Por qué las tarjetas de sellos de cartón no funcionan bien</h2>
        <ul>
            <li><strong>Se pierden o se olvidan en casa.</strong> El cliente llega a la cita sin la tarjeta y el sello "se apunta la próxima vez", o no se apunta nunca.</li>
            <li><strong>Se pueden falsificar.</strong> Un sello de más, una tarjeta fotocopiada... y tú no tienes forma de comprobarlo.</li>
            <li><strong>Hay que acordarse de sellar.</strong> Con la agenda llena y las manos ocupadas, el sello es lo primero que se queda sin hacer.</li>
            <li><strong>No sabes nada de tus clientes.</strong> Una tarjeta de cartón no te dice quién está cerca del premio ni quién lleva meses sin venir.</li>
        </ul>

        <h2>Cómo funciona la tarjeta de sellos digital de StickyWork</h2>
        <p>Es una tarjeta <strong>por visitas</strong>, no por gasto: cada cita completada es un sello. Se configura en un par de minutos desde tu panel.</p>
        <ol>
            <li><strong>Eliges la regla.</strong> En <em>Clientes → Promociones</em> indicas cada cuántas visitas hay premio, qué premio es (texto libre, por ejemplo «corte gratis») y las fechas en las que el programa está activo.</li>
            <li><strong>Enseñas el QR.</strong> Imprímelo y ponlo en el mostrador, o comparte el enlace por Instagram o WhatsApp. El código QR y el enlace salen en la misma pestaña.</li>
            <li><strong>El cliente consulta sus sellos.</strong> Abre el enlace, escribe su email o su teléfono y ve algo como «llevas 4 de 6 visitas». No instala nada ni crea ninguna cuenta.</li>
            <li><strong>Tú marcas las citas como completadas.</strong> Solo cuentan las visitas completadas, así que no hay sellos regalados ni inventados.</li>
            <li><strong>Al llegar a la meta, vale con código.</strong> Al cliente le aparece un vale. Cuando te lo enseña, lo ves en tu panel y pulsas «Entregar premio». El vale queda canjeado y la cuenta de visitas empieza de cero.</li>
        </ol>

        <div class="seo-note">
            <p><strong>Incluida en todos los planes.</strong> La tarjeta de fidelización no tiene restricción por plan: la puedes usar desde el plan Gratis. Lo que sí cambia entre planes es el límite de reservas al mes. Mira los <a href="/planes.html">planes</a>.</p>
        </div>

        <h2>Ejemplos de premio según tu negocio</h2>
        <p>Estas son ideas para inspirarte; el premio es texto libre y lo defines tú.</p>
        <div class="seo-grid">
            <div class="seo-card">
                <h3>Peluquería</h3>
                <p>Cada 6 visitas, un corte gratis. O un tratamiento de hidratación como regalo a la décima visita. Más ideas en <a href="/reservas-online-peluquerias.html">peluquerías</a>.</p>
            </div>
            <div class="seo-card">
                <h3>Centro de estética</h3>
                <p>Cada 8 visitas, una limpieza facial o un masaje corto de regalo. Un premio de coste bajo para ti y alto valor para ella.</p>
            </div>
            <div class="seo-card">
                <h3>Manicura y uñas</h3>
                <p>Cada 5 visitas, un diseño de uñas decoradas gratis o un servicio de nail art incluido.</p>
            </div>
            <div class="seo-card">
                <h3>Peluquería canina</h3>
                <p>Cada 6 baños, el siguiente gratis. Las mascotas vuelven con mucha regularidad, así que la meta se alcanza pronto.</p>
            </div>
            <div class="seo-card">
                <h3>Fisioterapia</h3>
                <p>Cada 10 sesiones, un descuento en la siguiente o una sesión de estiramientos. Útil para pacientes de mantenimiento. Ver <a href="/reservas-online-fisioterapeutas.html">fisioterapeutas</a>.</p>
            </div>
        </div>

        <h2>Cómo elegir la meta y el premio</h2>
        <ul>
            <li><strong>Ajusta la meta a la frecuencia habitual.</strong> Si tus clientes vienen cada mes, una meta de 6 visitas son seis meses; si vienen cada semana, la meta puede ser más alta. Una meta inalcanzable desmotiva.</li>
            <li><strong>Que el premio cueste poco y se note mucho.</strong> Un servicio corto o un extra suele salir más barato para ti que un descuento grande y se siente como un regalo.</li>
            <li><strong>Haz las cuentas antes.</strong> Calcula cuánto te cuesta el premio frente a lo que ingresas en las visitas necesarias para ganarlo. Con la <a href="/herramientas/calculadora-citas-perdidas.html">calculadora de citas perdidas</a> puedes ver también cuánto te cuestan las ausencias.</li>
            <li><strong>Usa las fechas.</strong> Un programa con inicio y fin (una temporada, el segundo semestre) crea sensación de oportunidad y te deja cambiar el premio después.</li>
            <li><strong>Cuéntaselo a todos.</strong> El QR en el mostrador, un cartel y una frase al despedirte («ya llevas 3, te quedan 3») hacen más que cualquier configuración. Con la herramienta de <a href="/herramientas/generador-qr-reservas.html">cartel con QR</a> puedes preparar uno para las reservas.</li>
            <li><strong>Recuerda el premio tú.</strong> El sistema no envía un aviso automático cuando alguien lo gana, así que díselo en la siguiente cita.</li>
        </ul>

        <h2>Qué no es</h2>
        <p>Para que no haya sorpresas: no es un programa de puntos por euros gastados, no hay app que descargar y no se integra en Apple Wallet ni Google Wallet. Es una tarjeta de sellos por visitas, sencilla, en una página web. Si buscas un sistema que compare con la típica tarjeta de puntos o de sellos de cartón, la diferencia es que esta no se pierde, no se falsifica y no depende de que alguien se acuerde de sellar.</p>

        <p>Si todavía no tienes reservas online, empieza por ahí: la tarjeta cuenta las citas que ya gestionas en tu agenda. En la <a href="/demo.html">demo</a> puedes ver cómo se ve el panel antes de registrarte.</p>

{faq_html(FIDE_FAQ)}

{CTA}

        <p class="seo-related">Por sector: <a href="/reservas-online-peluquerias.html">Peluquerías</a> · <a href="/reservas-online-fisioterapeutas.html">Fisioterapeutas</a> · <a href="/reservas-online-psicologos.html">Psicólogos</a> · <a href="/reservas-online-nutricionistas.html">Nutricionistas</a>. Más ideas en el <a href="/blog/">blog</a>.</p>'''

FIDE_DESC = 'Tarjeta de fidelización digital para negocios con cita previa: sellos por visitas con QR, sin app y sin cartón. Incluida en todos los planes, también el Gratis.'
urls.append(page('tarjeta-fidelizacion-digital.html',
    'Tarjeta de fidelización digital para tu negocio | StickyWork',
    FIDE_DESC,
    'Tarjeta de fidelización digital para tu negocio',
    f'<p>{FIDE_DESC}</p>\n        {HERO_BTNS}',
    FIDE_BODY,
    schema=[faq_schema(FIDE_FAQ)], badge='Incluida en todos los planes'))

# ======================= BLOG =======================
def article(slug, title, description, h1, date, read_min, body, modified=None):
    modified = modified or date
    path = f'blog/{slug}.html'
    schema = {"@context": "https://schema.org", "@type": "Article", "headline": h1, "description": description,
              "datePublished": date, "dateModified": modified, "inLanguage": "es",
              "author": {"@type": "Organization", "name": "StickyWork"},
              "publisher": {"@type": "Organization", "name": "StickyWork", "url": SITE},
              "mainEntityOfPage": f"{SITE}/{path}"}
    full_body = f'''        <p class="seo-meta">Equipo StickyWork · {date[8:10]}/{date[5:7]}/{date[0:4]}{'' if modified == date else f' (actualizado el {modified[8:10]}/{modified[5:7]}/{modified[0:4]})'} · {read_min} min de lectura</p>
{body}

{CTA}

        <p class="seo-related"><a href="/blog/">← Volver al blog</a></p>'''
    return page(path, title, description, h1, f'<p>{description}</p>', full_body, schema=[schema], og_type='article', badge='Blog')

ARTICLES = []

ARTICLES.append(('como-reducir-citas-no-presentadas',
  'Cómo reducir no shows y ausencias en citas | StickyWork',
  'Qué es un no show y cómo evitar no shows en tu negocio: recordatorios, política de cancelación, señal, confirmación y lista de espera para reducir ausencias en citas.',
  'Cómo reducir los no shows y las ausencias en citas de tu negocio',
  '2026-11-11', 8, '''        <p>Un cliente que no se presenta no solo es una cita perdida: es un hueco que podrías haber dado a otra persona. En negocios con cita previa (peluquerías, consultas, clínicas, centros de estética) las ausencias sin avisar son uno de los problemas más frecuentes. No se pueden eliminar del todo, pero sí reducir mucho con unas pocas medidas. Aquí tienes las que mejor funcionan para <strong>evitar no shows en tu negocio</strong>.</p>

        <h2>Qué es un "no show" y por qué cuesta tanto</h2>
        <p>"No show" es el término en inglés para el cliente que tiene una cita reservada, no acude y tampoco avisa. En castellano lo llamamos ausencia sin aviso, plantón o cita no presentada. Es distinto de una cancelación: si el cliente cancela con tiempo, el hueco se puede volver a ocupar; si simplemente no viene, ya no hay margen.</p>
        <p>El coste va más allá del precio de la cita. Pierdes el tiempo de esa franja, a veces has preparado material o has rechazado a otra persona, y todo ello sin posibilidad de recuperarlo. Si quieres ponerle cifra a tu caso, usa la <a href="/herramientas/calculadora-citas-perdidas.html">calculadora de citas perdidas</a>: con tus propias citas y precios ves cuánto te cuestan al año.</p>

        <h2>Por qué no vienen los clientes</h2>
        <p>Conocer la causa ayuda a elegir la medida. Los motivos más habituales son:</p>
        <ul>
            <li><strong>Olvido.</strong> Sobre todo en citas reservadas con semanas de antelación.</li>
            <li><strong>Imprevistos</strong> que no avisan porque cancelar les resulta incómodo o complicado.</li>
            <li><strong>Vergüenza o evitación</strong>, por ejemplo cuando no han cumplido algo del tratamiento.</li>
            <li><strong>Reservas a la ligera</strong>, hechas sin compromiso real o en varios sitios a la vez.</li>
        </ul>
        <p>Los dos primeros son, con diferencia, los más fáciles de resolver con recordatorios y facilidades para cancelar.</p>

        <h2>1. Envía un recordatorio el día antes</h2>
        <p>La causa más habitual de una ausencia es el simple olvido. Un recordatorio el día anterior, con la fecha, la hora y la dirección, resuelve la mayoría de los casos. Lo ideal es que sea automático, para no depender de acordarte tú. Tienes ejemplos con texto en nuestro artículo sobre el <a href="/blog/mensaje-recordatorio-cita-plantillas.html">mensaje de recordatorio de cita</a> y en las <a href="/herramientas/plantillas-whatsapp-citas.html">plantillas de WhatsApp para citas</a>.</p>

        <h2>2. Pon fácil cancelar o cambiar la cita</h2>
        <p>Parece contradictorio, pero cuanto más fácil es cancelar, menos gente simplemente no aparece. Si para avisar hay que llamar en horario de apertura, muchos clientes no lo hacen. Un enlace en el email de la reserva para cancelar o cambiar la hora convierte una ausencia en un hueco libre que puedes volver a ocupar.</p>

        <h2>3. Que la cita esté en el calendario del cliente</h2>
        <p>Si la cita se queda en un mensaje de WhatsApp perdido, es más fácil olvidarla. Acompañar la confirmación de un archivo para añadirla a Google Calendar, Outlook o el calendario del móvil hace que su propio teléfono se la recuerde.</p>

        <h2>4. Confirma las reservas cuando tenga sentido</h2>
        <p>En negocios con citas largas o muy demandadas, revisar cada solicitud antes de aceptarla tiene ventajas: detectas reservas dudosas y el cliente sabe exactamente cuándo su cita es firme. La clave es responder rápido para no dejar a nadie esperando.</p>
        <p>Otra opción es pedir al cliente que confirme su asistencia. Un mensaje del tipo "responde SÍ para mantener tu cita" funciona bien con citas muy valiosas o con clientes que ya han fallado antes, pero supone trabajo manual, así que resérvalo para esos casos.</p>

        <h2>5. Define una política de cancelación clara</h2>
        <p>No hace falta cobrar penalizaciones. Basta con explicar con claridad cuánta antelación pides para cancelar (por ejemplo, 24 horas) en tu web, en tus redes y en el mensaje de confirmación. Que el cliente lo sepa de antemano cambia su comportamiento. Unas pautas para redactarla:</p>
        <ul>
            <li>Indica el plazo exacto ("hasta 24 horas antes") y cómo avisar.</li>
            <li>Explica qué ocurre si no se respeta, aunque sea solo "perderás tu hueco habitual".</li>
            <li>Usa un tono amable y breve: es una norma para que otros clientes puedan venir, no un castigo.</li>
            <li>Aplícala con criterio: una primera falta excepcional no tiene por qué tener consecuencias.</li>
        </ul>

        <h2>6. Valora pedir una señal o depósito</h2>
        <p>Pedir una pequeña señal al reservar es una práctica extendida en servicios largos, caros o de alta demanda (tratamientos de varias horas, primeras visitas, clases con aforo limitado). Quien ha pagado algo, se acuerda y avisa si no puede ir. Tiene contras: añade un paso a la reserva y puede echar atrás a clientes nuevos, así que úsala solo donde de verdad compense y explica con claridad si es reembolsable. Si la pides, decide de antemano cómo la cobras y la devuelves; si no te encaja, la política de cancelación y los recordatorios ya consiguen buena parte del efecto.</p>

        <h2>7. Lleva la cuenta de quién falla</h2>
        <p>La mayoría de los clientes faltan una vez de forma excepcional; unos pocos lo hacen a menudo. Apuntar las ausencias te permite tratar distinto a cada caso: por ejemplo, pedir confirmación previa solo a quien ya ha fallado varias veces, o reservarle solo huecos en horas menos demandadas.</p>

        <h2>8. Rellena los huecos: lista de espera manual</h2>
        <p>Si un cliente cancela con tiempo, ese hueco vuelve a estar disponible para quien reserve online. Cuanto antes se libere, más probable es que alguien lo aproveche. Además, puedes llevar una lista de espera sencilla: apunta a los clientes que querían un día concreto y, cuando surja un hueco, escríbeles en ese momento. No necesitas nada sofisticado: una nota con nombre, teléfono y franja deseada es suficiente.</p>

        <h2>Cómo reducir ausencias en citas con StickyWork</h2>
        <div class="seo-note">
            <ul>
                <li><strong>Recordatorio automático</strong> por email el día antes de la cita.</li>
                <li>Email de reserva con <strong>archivo para el calendario</strong> y botón <strong>Gestionar mi reserva</strong>, desde el que el cliente puede cancelar o cambiar la hora.</li>
                <li><strong>Confirmación manual</strong> opcional: tú aceptas o rechazas cada solicitud y el cliente recibe un email.</li>
                <li>Marca a quien <strong>no se presenta</strong>: con tres faltas pasa automáticamente a la categoría "Riesgo".</li>
                <li>Las cancelaciones <strong>liberan el hueco</strong> al momento en tu página de reservas, y te llega un aviso por email.</li>
                <li>En cada reserva hay un <strong>botón de WhatsApp</strong> que abre el mensaje ya escrito; lo envías tú con un toque (el envío automático es solo por email).</li>
            </ul>
        </div>
        <p>¿Tienes un negocio concreto? Mira cómo funciona para <a href="/reservas-online-peluquerias.html">peluquerías</a>, <a href="/reservas-online-nutricionistas.html">nutricionistas</a>, <a href="/reservas-online-psicologos.html">psicólogos</a> o <a href="/reservas-online-fisioterapeutas.html">fisioterapeutas</a>.</p>''', '2026-11-24'))

ARTICLES.append(('mensaje-recordatorio-cita-plantillas',
  'Recordatorio de cita: plantillas de mensaje para copiar | StickyWork',
  'Mensaje de recordatorio de cita para WhatsApp, SMS y email, por sector: peluquería, estética, fisio, psicología y dental. Cuándo enviarlo y qué incluir.',
  'Recordatorio de cita: plantillas de mensaje listas para copiar',
  '2026-11-24', 8, '''        <p>Un buen <strong>recordatorio de cita</strong> evita que el cliente se olvide, y cuesta unos segundos. Aquí tienes plantillas de mensaje de recordatorio por canal (WhatsApp, SMS y email) y por sector (peluquería, estética, fisioterapia, psicología y dental), además de cuándo enviarlo y qué tiene que llevar. Cópialas y cambia los datos entre corchetes.</p>

        <h2>Cuándo enviar el recordatorio de una cita</h2>
        <ul>
            <li><strong>24 horas antes</strong> es el momento más práctico: el cliente aún puede avisar de que no llega y tú puedes dar el hueco a otra persona.</li>
            <li><strong>Citas reservadas con mucha antelación</strong> (semanas): añade un primer aviso unos días antes, además del de la víspera.</li>
            <li><strong>Citas largas o de alto valor</strong> (tratamientos, primeras visitas): puedes sumar un aviso corto la mañana del mismo día.</li>
            <li><strong>Evita avisar demasiado tarde o demasiado pronto</strong>: un recordatorio a última hora no deja tiempo para reorganizar, y uno con una semana de antelación se olvida.</li>
        </ul>

        <h2>Qué debe incluir un mensaje de recordatorio</h2>
        <ol>
            <li><strong>Nombre del cliente</strong>, para que no parezca un mensaje masivo.</li>
            <li><strong>Día y hora</strong>, escritos de forma clara ("mañana, jueves 5, a las 17:30").</li>
            <li><strong>Servicio o tipo de cita</strong>, sobre todo si el cliente tiene varias.</li>
            <li><strong>Dirección</strong> o cómo llegar, si no es evidente.</li>
            <li><strong>Cómo cancelar o cambiar la cita</strong>: un enlace o un teléfono. Es la parte que más huecos libera.</li>
            <li>Si procede, <strong>indicaciones previas</strong>: llegar cinco minutos antes, venir sin maquillaje, traer pruebas, etc.</li>
        </ol>

        <h2>Plantillas de recordatorio por canal</h2>
        <h3>WhatsApp</h3>
        <p>Es el canal más cercano y el que más se lee. Mantén el mensaje corto y con tono natural.</p>
        <div class="seo-note"><p>Hola [nombre], te recordamos tu cita de mañana, [día], a las [hora] en [negocio] ([dirección]). Si no puedes venir, avísanos por aquí y te buscamos otro hueco. ¡Te esperamos!</p></div>
        <p>Si prefieres otras formulaciones, en las <a href="/herramientas/plantillas-whatsapp-citas.html">plantillas de WhatsApp para citas</a> tienes más mensajes (confirmación, hueco libre, petición de reseña) para copiar con un clic.</p>

        <h3>SMS</h3>
        <p>El SMS tiene poco espacio y no admite formato, así que ve directo al grano y evita enlaces largos.</p>
        <div class="seo-note"><p>[Negocio]: [nombre], recordatorio de tu cita mañana [día] a las [hora]. Para cambiarla o cancelarla, llama al [teléfono]. Gracias.</p></div>

        <h3>Email</h3>
        <p>El email permite más detalle y un botón para gestionar la cita. Cuida el asunto: tiene que decir lo esencial.</p>
        <div class="seo-note">
            <p><strong>Asunto:</strong> Recordatorio: tu cita mañana a las [hora] en [negocio]</p>
            <p>Hola [nombre],<br>
            te recordamos tu cita de [servicio] el [día] a las [hora] en [dirección].<br>
            Si necesitas cambiar la hora o cancelarla, puedes hacerlo aquí: [enlace]. Así podremos ofrecer ese hueco a otra persona.<br>
            Un saludo,<br>
            [negocio]</p>
        </div>

        <h2>Plantillas por sector</h2>
        <h3>Peluquería</h3>
        <div class="seo-note"><p>Hola [nombre], mañana a las [hora] tienes cita para [corte / color / mechas] en [peluquería]. Recuerda que el color lleva un buen rato, así que si te retrasas, avísanos. Si no puedes venir, dínoslo con tiempo y te cambiamos la cita.</p></div>

        <h3>Centro de estética</h3>
        <div class="seo-note"><p>Hola [nombre], te recordamos tu tratamiento de [tratamiento] mañana a las [hora] en [centro]. Si es depilación, recuerda venir con el vello de la longitud indicada; si es facial, mejor sin maquillaje. ¿Necesitas cambiar la cita? Respóndenos y lo vemos.</p></div>

        <h3>Fisioterapia</h3>
        <div class="seo-note"><p>Hola [nombre], mañana [día] a las [hora] tienes tu sesión de fisioterapia en [clínica]. Trae ropa cómoda y, si los tienes, tus informes o pruebas. Si no puedes venir, avísanos cuanto antes: otros pacientes esperan hueco.</p></div>

        <h3>Psicología o consulta</h3>
        <p>Aquí conviene un tono sobrio y discreto: no menciones el motivo de la consulta en el mensaje.</p>
        <div class="seo-note"><p>Hola [nombre], te recuerdo que mañana [día] a las [hora] tenemos tu cita en la consulta [dirección o enlace de la videollamada]. Si necesitas cambiarla, escríbeme con tiempo y buscamos otra hora.</p></div>

        <h3>Clínica dental</h3>
        <div class="seo-note"><p>Hola [nombre], le recordamos su cita en [clínica] el [día] a las [hora] con [doctor/a]. Si es la primera visita, venga cinco minutos antes para completar la ficha. Si no puede asistir, llámenos al [teléfono] para reprogramarla.</p></div>

        <h2>Errores típicos al enviar recordatorios</h2>
        <ul>
            <li><strong>No decir cómo cancelar.</strong> Un recordatorio sin salida invita a no responder y a no venir.</li>
            <li><strong>Mensajes fríos o autoritarios.</strong> "Se recuerda que..." no funciona igual que "te esperamos mañana".</li>
            <li><strong>Falta de datos.</strong> Si no pone el día o la hora, el cliente tiene que ir a buscarlos.</li>
            <li><strong>Enviarlos a deshoras.</strong> Evita la noche y el fin de semana para citas entre semana.</li>
            <li><strong>Olvidarse de enviarlos.</strong> Un recordatorio que depende de que te acuerdes cada día termina fallando; por eso conviene automatizarlo.</li>
            <li><strong>Incluir datos sensibles.</strong> Especialmente en salud: basta con día, hora y lugar.</li>
        </ul>

        <h2>Cómo automatizarlo con StickyWork</h2>
        <p>Si no quieres estar pendiente de enviar mensajes uno a uno, StickyWork manda cada mañana un <strong>recordatorio automático por email</strong> a los clientes que tienen cita al día siguiente, con un botón para cancelar o cambiar la hora. Además, cada reserva tiene un botón de WhatsApp que abre el mensaje ya escrito con los datos de la cita; <strong>lo envías tú</strong> pulsando enviar, porque los WhatsApp y los SMS no se mandan automáticamente. Puedes ver cómo se ve en la <a href="/demo.html">demo</a>.</p>
        <p>Y si quieres ir más allá del recordatorio, lee nuestra guía para <a href="/blog/como-reducir-citas-no-presentadas.html">reducir los no shows</a>: política de cancelación, confirmación y cómo rellenar huecos.</p>'''))

ARTICLES.append(('boton-reservas-instagram-google-whatsapp',
  'Cómo poner un enlace de reservas en Instagram, Google y WhatsApp | StickyWork',
  'Guía paso a paso para que tus clientes reserven cita desde Instagram, tu perfil de Google y WhatsApp Business con un único enlace de reservas.',
  'Cómo poner un enlace de reservas en Instagram, Google y WhatsApp',
  '2026-11-11', 5, '''        <p>Tus clientes ya te buscan en Instagram, en Google Maps y te escriben por WhatsApp. Si en cada uno de esos sitios tienen un enlace para reservar, te ahorras muchas conversaciones del tipo "¿tienes hueco el martes?". Lo único que necesitas es un <strong>enlace de reservas</strong>: una página donde se ven tus servicios y los huecos libres.</p>

        <div class="seo-note">
            <p>En StickyWork lo tienes en <strong>Configuración → Mi página</strong>. Tiene esta forma: <code>stickywork.com/reservar?n=tu-negocio</code>, y funciona aunque no tengas web.</p>
        </div>

        <h2>Instagram</h2>
        <h3>En la biografía</h3>
        <p>Es el sitio más visible de tu perfil. Ve a <strong>Editar perfil → Enlaces → Añadir enlace externo</strong>, pega tu enlace de reservas y ponle un título claro, como "Reservar cita". Si ya tienes otros enlaces, coloca este el primero.</p>
        <h3>En las historias</h3>
        <p>Al crear una historia, añade el <strong>sticker de enlace</strong> con tu enlace de reservas. Funciona muy bien cuando anuncias huecos libres para esa semana. Guarda esas historias en una historia destacada llamada "Reservas" para que estén siempre a mano.</p>
        <p>Instagram también tiene botones de acción como "Reservar", pero solo funcionan con algunos proveedores asociados. El enlace en la biografía y en las historias funciona con cualquier sistema.</p>

        <h2>Google (Perfil de Empresa en Google Maps)</h2>
        <p>Mucha gente encuentra tu negocio buscando en Google o en Maps. Desde tu Perfil de Empresa puedes añadir un enlace para pedir cita:</p>
        <ol>
            <li>Busca el nombre de tu negocio en Google con la sesión iniciada en la cuenta que gestiona el perfil.</li>
            <li>Entra en <strong>Editar perfil</strong> y busca el apartado de enlaces de <strong>reservas o citas</strong>.</li>
            <li>Pega tu enlace de reservas y guarda.</li>
        </ol>
        <p>Según la categoría de tu negocio, este campo puede aparecer con un nombre algo distinto. Si no lo encuentras, añade al menos el enlace en el campo de sitio web y menciónalo en las publicaciones de tu perfil.</p>

        <h2>WhatsApp Business</h2>
        <ul>
            <li><strong>En tu perfil:</strong> en Ajustes → Herramientas para la empresa → Perfil de empresa, añade el enlace de reservas en el campo de sitio web.</li>
            <li><strong>Mensaje de bienvenida y de ausencia:</strong> incluye una frase como "Puedes reservar tu cita aquí: [enlace]". Así, quien escriba fuera de horario puede reservar sin esperarte.</li>
            <li><strong>Respuestas rápidas:</strong> crea una con el enlace para responder en un segundo a "¿tienes hueco?".</li>
        </ul>

        <h2>Y en tu local: un código QR</h2>
        <p>Imprime el código QR de tu página de reservas y ponlo en el mostrador, en las tarjetas o en el escaparate. Quien pase por delante puede reservar al momento con el móvil. En StickyWork lo descargas en <strong>Configuración → Mi página</strong>.</p>

        <h2>Un último consejo</h2>
        <p>Usa siempre el mismo enlace en todas partes y pruébalo tú mismo haciendo una reserva de prueba. Así te aseguras de que lo que ven tus clientes es lo que esperas.</p>
        <p>Más ideas para tu sector: <a href="/reservas-online-peluquerias.html">peluquerías</a>, <a href="/reservas-online-nutricionistas.html">nutricionistas</a>, <a href="/reservas-online-psicologos.html">psicólogos</a> y <a href="/reservas-online-fisioterapeutas.html">fisioterapeutas</a>.</p>'''))

for a in ARTICLES:
    urls.append(article(*a))

# Índice del blog
items = '\n'.join(f'''            <a class="blog-item" href="/blog/{slug}.html">
                <h2>{html.escape(h1)}</h2>
                <p>{html.escape(desc)}</p>
            </a>''' for slug, _t, desc, h1, _d, _m, _b, *_x in ARTICLES)
urls.append(page('blog/index.html', 'Blog de StickyWork | Consejos para negocios con cita previa',
     'Consejos prácticos para peluquerías, consultas y clínicas: cómo llenar la agenda, reducir ausencias y recibir más reservas online.',
     'Blog: consejos para negocios con cita previa',
     '<p>Ideas prácticas para llenar tu agenda, reducir ausencias y recibir más reservas online.</p>',
     f'''        <div class="blog-list">
{items}
        </div>''', badge='Blog'))


# ======================= HERRAMIENTAS GRATIS =======================
# Páginas útiles por sí mismas (atraen visitas de Google) que terminan invitando a registrarse.
TOOL_STYLE = """    <style>
        .tool-box { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 18px; padding: 1.75rem; margin: 0 0 2.5rem; }
        .tool-box label { display: block; font-weight: 600; color: var(--text-primary); margin-bottom: 0.4rem; font-size: 0.95rem; }
        .tool-box input[type=text], .tool-box input[type=url], .tool-box input[type=number] { width: 100%; padding: 0.75rem 0.9rem; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); font-size: 1rem; box-sizing: border-box; }
        .tool-box input[type=range] { width: 100%; accent-color: var(--primary-color); }
        .tool-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr)); gap: 1.25rem; margin-bottom: 1.25rem; }
        .tool-hint { font-size: 0.85rem; color: var(--text-secondary); margin: 0.35rem 0 0; }
        .tool-results { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); gap: 1rem; margin-top: 1.5rem; }
        .tool-result { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.1rem; text-align: center; }
        .tool-result strong { display: block; font-size: 1.9rem; line-height: 1.2; color: var(--text-primary); }
        .tool-result span { font-size: 0.9rem; color: var(--text-secondary); }
        .tool-result.is-main { border-color: #ef4444; }
        .tool-result.is-main strong { color: #ef4444; }
        .tool-result.is-good { border-color: #22c55e; }
        .tool-result.is-good strong { color: #16a34a; }
        .tool-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.25rem; }
        .tool-actions .btn { cursor: pointer; }
        .tool-swatches { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .tool-swatches button { width: 36px; height: 36px; border-radius: 50%; border: 3px solid transparent; box-shadow: 0 0 0 1px var(--border-color); cursor: pointer; }
        .tool-swatches button[aria-pressed=true] { border-color: var(--text-primary); }
        .qr-preview { display: flex; justify-content: center; margin-top: 1.5rem; }
        .qr-preview canvas { width: min(100%, 360px); height: auto; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); background: #fff; }
        .tpl { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.1rem 1.25rem; margin-bottom: 1rem; }
        .tpl h3 { margin: 0 0 0.6rem; font-size: 1.05rem; }
        .tpl pre { white-space: pre-wrap; font-family: inherit; font-size: 0.98rem; line-height: 1.6; color: var(--text-secondary); margin: 0 0 0.9rem; background: var(--bg-secondary); padding: 0.9rem 1rem; border-radius: 10px; }
        .tpl .btn { padding: 0.5rem 1rem; font-size: 0.9rem; cursor: pointer; }
        .tool-app ul { text-align: left; max-width: 620px; margin: 0 auto 1.25rem; padding-left: 1.3rem; }
        .tool-app li { margin-bottom: 0.6rem; }
        .seo-badge-app { display: inline-block; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--primary-color); margin-bottom: 0.5rem; }
        .tool-note { display: flex; gap: 0.75rem; align-items: flex-start; border-left: 4px solid var(--primary-color); background: var(--bg-secondary); padding: 1rem 1.25rem; border-radius: 10px; margin: 0 0 1.5rem; }
        .tool-note p { margin: 0; }
        .tool-list { display: grid; gap: 1rem; margin: 1.5rem 0; }
        .tool-link { display: flex; gap: 1rem; align-items: flex-start; text-decoration: none; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.4rem; }
        .tool-link:hover { border-color: var(--primary-color); }
        .tool-link .tool-icon { font-size: 2rem; line-height: 1; }
        .tool-link h2 { margin: 0 0 0.35rem; font-size: 1.2rem; }
        .tool-link p { margin: 0; }
        @media print {
            body * { visibility: hidden; }
            #qrCanvas, #qrCanvas * { visibility: visible; }
            #qrCanvas { position: fixed; inset: 0; margin: auto; width: 100%; max-width: 18cm; box-shadow: none; }
        }
    </style>
"""

APP_TEXT = {
    'calculadora': ('Dentro de StickyWork, esto se hace solo', [
        'Cada cliente recibe <strong>la confirmación y un recordatorio por email el día antes</strong>, sin que tú escribas nada.',
        'En el email tiene un <strong>enlace para cancelar o cambiar la hora</strong>: te avisa en lugar de no venir y el hueco queda libre al momento.',
        'Tus clientes <strong>reservan solos a cualquier hora</strong> desde tu página de reservas o tu web.']),
    'qr': ('Dentro de StickyWork, tu QR ya viene hecho', [
        'Tienes tu <strong>propia página de reservas</strong> con un enlace para compartir, aunque no tengas web.',
        'Su <strong>código QR</strong> está listo para descargar en el panel, en <em>Configuración → Mi página</em>.',
        'Cada reserva que entra por el QR <strong>aparece directamente en tu agenda</strong> y el cliente recibe su confirmación.']),
    'whatsapp': ('Dentro de StickyWork, el mensaje ya viene escrito', [
        'Cada reserva tiene un <strong>botón de WhatsApp</strong> que abre la conversación con el <strong>nombre, el día, la hora y el servicio ya puestos</strong>. Tú solo pulsas enviar.',
        'Tu plantilla la escribes una vez en el panel, a tu manera.',
        'Y sin que hagas nada, el cliente recibe <strong>la confirmación y el recordatorio por email</strong> el día antes.']),
    'indice': ('Todo esto, hecho solo, dentro de StickyWork', [
        '<strong>Recordatorios automáticos</strong> por email el día antes, con enlace para cancelar o cambiar la hora.',
        'Tu <strong>página de reservas y su código QR</strong>, listos desde el primer día.',
        'Un <strong>botón de WhatsApp en cada reserva</strong> con el mensaje ya escrito.']),
}

def tool_cta(source):
    title, items = APP_TEXT[source]
    lis = ''.join(f'<li>{i}</li>' for i in items)
    return f"""        <div class="seo-cta tool-app">
            <span class="seo-badge-app">La app de StickyWork</span>
            <h2>{title}</h2>
            <ul>{lis}</ul>
            <p>Plan gratuito para siempre, sin tarjeta de crédito.</p>
            <a href="/registro.html?utm_source=herramientas&amp;utm_medium=cta&amp;utm_campaign={source}" class="btn btn-primary">Crear mi cuenta gratis</a>
            <a href="/demo.html" class="btn btn-secondary">Ver la app en acción</a>
        </div>"""

TOOLS_FOOT = """        <p class="seo-related">Más herramientas gratis: <a href="/herramientas/calculadora-citas-perdidas.html">calculadora de citas perdidas</a> · <a href="/herramientas/generador-qr-reservas.html">cartel con código QR</a> · <a href="/herramientas/plantillas-whatsapp-citas.html">plantillas de WhatsApp</a></p>"""

def tool_schema(name, path, description):
    return {"@context": "https://schema.org", "@type": "WebApplication", "name": name, "url": f"{SITE}/{path}",
            "description": description, "applicationCategory": "BusinessApplication", "operatingSystem": "Web",
            "inLanguage": "es", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
            "publisher": {"@type": "Organization", "name": "StickyWork", "url": SITE}}

# ---------- 1. Calculadora de citas perdidas ----------
CALC_FAQ = [
    ('¿Qué porcentaje de citas no se presentan normalmente?', 'Depende mucho del sector y de cómo se gestione la agenda. Lo más fiable es mirar tu propia agenda: cuenta las citas de las últimas semanas y cuántas fallaron sin avisar. Con ese porcentaje la calculadora te da una cifra realista para tu negocio.'),
    ('¿Los recordatorios de verdad reducen las ausencias?', 'La mayoría de las ausencias son olvidos, y un recordatorio el día antes ayuda a evitarlos. Además, si el cliente puede cancelar o cambiar la hora con un enlace, avisa antes y puedes dar ese hueco a otra persona. Cuánto bajan en tu caso solo lo sabrás probándolo, por eso la calculadora te deja elegir la mejora.'),
    ('¿Qué cuenta como cita perdida?', 'Una cita a la que el cliente no viene y no avisa con tiempo para que puedas ocupar el hueco. Si cancela con antelación y otro cliente ocupa ese hueco, no la cuentes.'),
]
CALC_BODY = """        <div class="tool-box">
            <div class="tool-row">
                <div>
                    <label for="c-citas">Citas a la semana</label>
                    <input type="number" id="c-citas" min="1" max="2000" value="40" inputmode="numeric">
                </div>
                <div>
                    <label for="c-precio">Precio medio de una cita (€)</label>
                    <input type="number" id="c-precio" min="1" max="5000" value="35" inputmode="decimal">
                </div>
            </div>
            <div class="tool-row">
                <div>
                    <label for="c-pct">Citas que fallan sin avisar: <span id="c-pct-v">8</span> %</label>
                    <input type="range" id="c-pct" min="1" max="30" value="8">
                    <p class="tool-hint">Mira tu agenda de las últimas semanas: de cada 100 citas, ¿cuántas no vinieron?</p>
                </div>
                <div>
                    <label for="c-mejora">Si consiguieras evitar el <span id="c-mejora-v">40</span> % de esas ausencias…</label>
                    <input type="range" id="c-mejora" min="10" max="80" step="5" value="40">
                    <p class="tool-hint">Una estimación tuya: por ejemplo, con recordatorios y un enlace para cancelar o cambiar la hora.</p>
                </div>
            </div>
            <div class="tool-results" aria-live="polite">
                <div class="tool-result"><strong id="r-citas">0</strong><span>citas perdidas al mes</span></div>
                <div class="tool-result is-main"><strong id="r-mes">0 €</strong><span>pierdes al mes</span></div>
                <div class="tool-result is-main"><strong id="r-anio">0 €</strong><span>pierdes al año</span></div>
                <div class="tool-result is-good"><strong id="r-recupera">0 €</strong><span>recuperarías al año</span></div>
            </div>
        </div>

        <h2>Cómo se calcula</h2>
        <p>Citas al mes = citas a la semana × 4,33. A eso se le aplica el porcentaje de ausencias para saber cuántas citas se pierden, y se multiplica por el precio medio. La última cifra es el dinero que recuperarías si evitaras la parte de ausencias que hayas elegido.</p>
        <p>Es una estimación: no incluye el tiempo que pierdes esperando ni lo que cuesta llamar a otro cliente para llenar el hueco, así que la pérdida real suele ser algo mayor.</p>

        <h2>Qué puedes hacer para que fallen menos citas</h2>
        <ul>
            <li><strong>Recordatorio el día antes.</strong> La mayoría de las ausencias son olvidos. Un mensaje la víspera los evita.</li>
            <li><strong>Que cancelar sea fácil.</strong> Si el cliente puede cancelar o cambiar la hora con un clic, te avisa en lugar de no venir, y puedes dar ese hueco a otra persona.</li>
            <li><strong>Confirmación al reservar.</strong> Con la fecha, la hora y la dirección, y un archivo para añadirla a su calendario.</li>
            <li><strong>Reservas a cualquier hora.</strong> Quien reserva cuando le viene bien elige una hora que de verdad puede cumplir.</li>
        </ul>
        <p>Lo explicamos con más detalle en <a href="/blog/como-reducir-citas-no-presentadas.html">cómo reducir las citas a las que no se presenta el cliente</a>. Si prefieres recordar las citas tú mismo, tienes <a href="/herramientas/plantillas-whatsapp-citas.html">plantillas de WhatsApp listas para copiar</a>.</p>
"""
CALC_JS = """    <script>
    (function () {
        const $ = id => document.getElementById(id);
        const eur = n => Math.round(n).toLocaleString('es-ES') + ' €';
        function calc() {
            const citas = Math.max(0, Number($('c-citas').value) || 0);
            const precio = Math.max(0, Number($('c-precio').value) || 0);
            const pct = Number($('c-pct').value);
            const mejora = Number($('c-mejora').value);
            $('c-pct-v').textContent = pct;
            $('c-mejora-v').textContent = mejora;
            const perdidasMes = citas * 4.33 * pct / 100;
            $('r-citas').textContent = Math.round(perdidasMes).toLocaleString('es-ES');
            $('r-mes').textContent = eur(perdidasMes * precio);
            $('r-anio').textContent = eur(perdidasMes * precio * 12);
            $('r-recupera').textContent = eur(perdidasMes * precio * 12 * mejora / 100);
        }
        ['c-citas', 'c-precio', 'c-pct', 'c-mejora'].forEach(id => $(id).addEventListener('input', calc));
        calc();
    })();
    </script>
"""
CALC_DESC = 'Calcula gratis cuánto dinero pierde tu negocio al mes y al año por las citas a las que el cliente no se presenta, y cuánto recuperarías reduciéndolas.'
urls.append(page('herramientas/calculadora-citas-perdidas.html',
    'Calculadora de citas perdidas: cuánto te cuestan los clientes que no vienen | StickyWork',
    CALC_DESC,
    '¿Cuánto dinero pierdes con las citas a las que no viene nadie?',
    '<p>Pon tus números y mira lo que te cuestan al año las ausencias sin avisar. Gratis, sin registro.</p>',
    CALC_BODY + faq_html(CALC_FAQ) + '\n' + tool_cta('calculadora') + '\n' + TOOLS_FOOT,
    schema=[tool_schema('Calculadora de citas perdidas', 'herramientas/calculadora-citas-perdidas.html', CALC_DESC), faq_schema(CALC_FAQ)],
    badge='Herramienta gratis', extra_head=TOOL_STYLE, scripts=CALC_JS))

# ---------- 2. Cartel con código QR ----------
QR_FAQ = [
    ('¿El código QR caduca?', 'No. El código QR solo contiene el enlace que escribas, así que funcionará mientras ese enlace funcione. No pasa por ningún servidor nuestro.'),
    ('¿Qué enlace pongo?', 'El de la página donde tus clientes piden cita: tu página de reservas, tu web, tu perfil de Google o tu WhatsApp (wa.me/34600000000). Comprueba el código con la cámara del móvil antes de imprimirlo.'),
    ('¿Qué tamaño debe tener para que se lea bien?', 'Para un mostrador o una puerta, un folio A4 o A5 es suficiente. Como regla general, el código debería medir al menos 3 × 3 cm, y más si se va a escanear desde lejos.'),
]
QR_BODY = """        <div class="tool-box">
            <div class="tool-row">
                <div>
                    <label for="q-url">Enlace donde tus clientes reservan</label>
                    <input type="url" id="q-url" value="https://stickywork.com/demo.html" placeholder="https://..." autocomplete="url">
                    <p class="tool-hint">Tu página de reservas, tu web o tu WhatsApp (https://wa.me/34600000000).</p>
                </div>
                <div>
                    <label for="q-name">Nombre de tu negocio</label>
                    <input type="text" id="q-name" value="Tu negocio" maxlength="40">
                </div>
            </div>
            <div class="tool-row">
                <div>
                    <label for="q-title">Texto principal</label>
                    <input type="text" id="q-title" value="Reserva tu cita aquí" maxlength="32">
                </div>
                <div>
                    <label>Color</label>
                    <div class="tool-swatches" id="q-colors">
                        <button type="button" style="background:#3b82f6" data-c="#3b82f6" aria-pressed="true" aria-label="Azul"></button>
                        <button type="button" style="background:#8b5cf6" data-c="#8b5cf6" aria-pressed="false" aria-label="Morado"></button>
                        <button type="button" style="background:#e91e63" data-c="#e91e63" aria-pressed="false" aria-label="Rosa"></button>
                        <button type="button" style="background:#10b981" data-c="#10b981" aria-pressed="false" aria-label="Verde"></button>
                        <button type="button" style="background:#f97316" data-c="#f97316" aria-pressed="false" aria-label="Naranja"></button>
                        <button type="button" style="background:#111827" data-c="#111827" aria-pressed="false" aria-label="Negro"></button>
                    </div>
                </div>
            </div>
            <div class="qr-preview"><canvas id="qrCanvas" width="1240" height="1754" aria-label="Vista previa del cartel con el código QR"></canvas></div>
            <div class="tool-actions" style="justify-content:center">
                <button class="btn btn-primary" id="q-download" type="button">⬇️ Descargar imagen</button>
                <button class="btn btn-secondary" id="q-print" type="button">🖨️ Imprimir</button>
            </div>
            <div id="qrTmp" hidden></div>
        </div>

        <h2>Dónde poner tu código QR</h2>
        <ul>
            <li><strong>En el mostrador o la recepción:</strong> el cliente reserva la próxima cita antes de irse, sin esperar a que le atiendas.</li>
            <li><strong>En el escaparate o la puerta:</strong> quien pasa por delante con el local cerrado puede reservar igualmente.</li>
            <li><strong>En tarjetas, folletos y tickets:</strong> se llevan tu agenda en el bolsillo.</li>
        </ul>
        <p>Si aún no tienes una página donde tus clientes puedan reservar solos, con StickyWork la tienes gratis en dos minutos: un enlace propio para compartir y su código QR listo para imprimir. Mira también <a href="/blog/boton-reservas-instagram-google-whatsapp.html">cómo poner un botón de reservas en Instagram, Google y WhatsApp</a>.</p>
"""
QR_JS = """    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script>
    (function () {
        const $ = id => document.getElementById(id);
        const canvas = $('qrCanvas'), ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        let color = '#3b82f6', timer;

        function roundRect(x, y, w, h, r) {
            ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
        }
        function fitText(text, maxW, size, weight) {
            do { ctx.font = weight + ' ' + size + 'px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'; size -= 4; } while (ctx.measureText(text).width > maxW && size > 20);
        }
        function draw() {
            const url = $('q-url').value.trim() || 'https://stickywork.com';
            const tmp = $('qrTmp'); tmp.innerHTML = '';
            new QRCode(tmp, { text: url, width: 760, height: 760, colorDark: '#111111', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
            const qr = tmp.querySelector('canvas');

            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = color; ctx.fillRect(0, 0, W, 420);
            ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            fitText($('q-title').value || 'Reserva tu cita', W - 160, 110, '800');
            ctx.fillText($('q-title').value || 'Reserva tu cita', W / 2, 190);
            ctx.globalAlpha = 0.9; fitText('Escanea con la cámara del móvil', W - 160, 52, '500');
            ctx.fillText('Escanea con la cámara del móvil', W / 2, 300); ctx.globalAlpha = 1;

            ctx.fillStyle = color; roundRect(W / 2 - 430, 520, 860, 860, 40); ctx.fill();
            ctx.fillStyle = '#ffffff'; roundRect(W / 2 - 410, 540, 820, 820, 28); ctx.fill();
            if (qr) ctx.drawImage(qr, W / 2 - 380, 570, 760, 760);

            ctx.fillStyle = '#111827'; fitText($('q-name').value || '', W - 160, 84, '700');
            ctx.fillText($('q-name').value || '', W / 2, 1490);
            ctx.fillStyle = '#6b7280'; fitText('Reserva a cualquier hora, en un minuto', W - 160, 44, '500');
            ctx.fillText('Reserva a cualquier hora, en un minuto', W / 2, 1580);
            ctx.fillStyle = '#9ca3af'; ctx.font = '500 26px system-ui, sans-serif';
            ctx.fillText('Cartel creado gratis en stickywork.com', W / 2, H - 50);
        }
        function schedule() { clearTimeout(timer); timer = setTimeout(draw, 150); }
        // Desde el panel de StickyWork se abre con el enlace y el nombre del negocio ya puestos
        (function () {
            const q = new URLSearchParams(location.search);
            const u = q.get('url'), n = q.get('name');
            if (u && /^https:\/\/stickywork\.com\//.test(u)) $('q-url').value = u.slice(0, 200);
            if (n) $('q-name').value = n.slice(0, 40);
        })();
        ['q-url', 'q-name', 'q-title'].forEach(id => $(id).addEventListener('input', schedule));
        $('q-colors').addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            color = b.dataset.c;
            $('q-colors').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
            draw();
        });
        $('q-download').addEventListener('click', () => {
            const a = document.createElement('a');
            a.download = 'cartel-reservas-qr.png'; a.href = canvas.toDataURL('image/png'); a.click();
            if (window.gtag) gtag('event', 'tool_qr_download');
        });
        $('q-print').addEventListener('click', () => window.print());
        if (window.QRCode) draw(); else window.addEventListener('load', draw);
    })();
    </script>
"""
QR_DESC = 'Crea gratis un cartel con código QR para que tus clientes reserven cita desde el móvil. Escribe tu enlace, elige el color y descárgalo listo para imprimir.'
urls.append(page('herramientas/generador-qr-reservas.html',
    'Generador de código QR para reservas: cartel gratis para imprimir | StickyWork',
    QR_DESC,
    'Cartel con código QR para que te reserven desde el móvil',
    '<p>Escribe tu enlace, elige el color y descarga el cartel listo para imprimir. Gratis y sin registro.</p>',
    QR_BODY + faq_html(QR_FAQ) + '\n' + tool_cta('qr') + '\n' + TOOLS_FOOT,
    schema=[tool_schema('Generador de cartel con código QR para reservas', 'herramientas/generador-qr-reservas.html', QR_DESC), faq_schema(QR_FAQ)],
    badge='Herramienta gratis', extra_head=TOOL_STYLE, scripts=QR_JS))

# ---------- 3. Plantillas de WhatsApp ----------
WA_TEMPLATES = [
    ('⏰ Recordatorio el día antes', 'Hola [nombre] 👋 Te recordamos tu cita mañana [día] a las [hora] en {negocio}. Si no puedes venir, avísanos y se la damos a otra persona. ¡Te esperamos!'),
    ('✅ Confirmación de la cita', 'Hola [nombre], tu cita en {negocio} queda confirmada para el [día] a las [hora]. Si necesitas cambiarla, escríbenos por aquí. ¡Hasta pronto!'),
    ('🙋 Pedir que confirme asistencia', 'Hola [nombre], ¿nos confirmas que vienes a tu cita del [día] a las [hora] en {negocio}? Responde SÍ para confirmar o NO si necesitas cambiarla. ¡Gracias!'),
    ('📅 Respuesta a «¿tienes hueco?»', '¡Hola! Gracias por escribir a {negocio} 😊 Puedes ver las horas libres y reservar directamente aquí: {enlace}'),
    ('🌙 Mensaje de ausencia (fuera de horario)', 'Hola, ahora mismo {negocio} está cerrado. Te respondemos en cuanto abramos. Si quieres pedir cita, puedes reservar a cualquier hora aquí: {enlace}'),
    ('🔔 Hueco libre de última hora', 'Hola [nombre], se nos ha quedado libre un hueco [día] a las [hora] en {negocio}. ¿Te viene bien? Si lo quieres, respóndenos y es tuyo.'),
    ('😔 Cuando el cliente no vino', 'Hola [nombre], hoy te esperábamos a las [hora] en {negocio}. Esperamos que todo esté bien. Cuando quieras, puedes volver a reservar aquí: {enlace}'),
    ('⭐ Pedir una reseña', 'Hola [nombre], gracias por venir a {negocio} 😊 Si te gustó, nos ayudaría muchísimo que dejaras tu opinión en Google: [enlace a tus reseñas]. ¡Gracias!'),
]
WA_FAQ = [
    ('¿Puedo usar estas plantillas en WhatsApp Business?', 'Sí. Lo más práctico es guardarlas como respuestas rápidas (Ajustes → Herramientas para la empresa → Respuestas rápidas) y el mensaje de ausencia en su apartado. Así las envías en un segundo.'),
    ('¿Qué pongo en [nombre], [día] y [hora]?', 'Los datos de cada cita. Las palabras entre corchetes son las que tienes que cambiar en cada mensaje; el nombre de tu negocio y tu enlace se rellenan solos con los datos de arriba.'),
    ('¿Hay alguna forma de no tener que enviarlos a mano?', 'Sí. Con un sistema de reservas online como StickyWork, la confirmación y el recordatorio del día antes se envían solos por email, con un enlace para cancelar o cambiar la hora.'),
]
wa_items = '\n'.join(f"""            <div class="tpl">
                <h3>{html.escape(t)}</h3>
                <pre data-tpl="{html.escape(body)}"></pre>
                <div class="tool-actions" style="margin-top:0">
                    <button class="btn btn-primary" type="button" data-copy>📋 Copiar</button>
                    <a class="btn btn-secondary" target="_blank" rel="noopener" data-wa>💬 Abrir en WhatsApp</a>
                </div>
            </div>""" for t, body in WA_TEMPLATES)
WA_BODY = f"""        <div class="tool-box">
            <div class="tool-row">
                <div>
                    <label for="w-name">Nombre de tu negocio</label>
                    <input type="text" id="w-name" value="" placeholder="Ej: Peluquería Marta" maxlength="60">
                </div>
                <div>
                    <label for="w-link">Tu enlace de reservas (opcional)</label>
                    <input type="url" id="w-link" value="" placeholder="https://..." autocomplete="url">
                </div>
            </div>
            <p class="tool-hint" style="margin:0">Se rellenan solos en las plantillas. Lo que va entre [corchetes] lo cambias en cada mensaje.</p>
        </div>

        <h2>Plantillas listas para copiar</h2>
        <div class="tool-note"><span aria-hidden="true">💡</span><p><strong>Cómo se usan:</strong> pulsa «Copiar» y pégalo en el chat del cliente, o «Abrir en WhatsApp» para elegir a quién enviarlo. Cambia lo que va entre [corchetes]. <strong>En la app de StickyWork no hace falta:</strong> cada reserva tiene su botón de WhatsApp con el nombre, el día y la hora ya puestos.</p></div>
{wa_items}

        <h2>Consejos para que funcionen</h2>
        <ul>
            <li><strong>Envía el recordatorio la tarde anterior.</strong> Si el cliente no puede venir, aún tienes tiempo de dar el hueco a otra persona.</li>
            <li><strong>Pon siempre una salida fácil.</strong> «Si no puedes venir, avísanos» hace que te avisen en lugar de no presentarse.</li>
            <li><strong>Mensajes cortos y con el nombre.</strong> Se leen más y suenan menos a mensaje automático.</li>
            <li><strong>Guárdalas como respuestas rápidas</strong> en WhatsApp Business para enviarlas en un segundo.</li>
        </ul>
        <p>¿Quieres saber cuánto te cuestan las citas que fallan? Pruébalo en la <a href="/herramientas/calculadora-citas-perdidas.html">calculadora de citas perdidas</a>. Y si buscas más ejemplos por sector y por canal, mira el artículo sobre el <a href="/blog/mensaje-recordatorio-cita-plantillas.html">mensaje de recordatorio de cita</a>.</p>
"""
WA_JS = """    <script>
    (function () {
        const $ = id => document.getElementById(id);
        function fill() {
            const name = $('w-name').value.trim() || '[tu negocio]';
            const link = $('w-link').value.trim() || '[tu enlace de reservas]';
            document.querySelectorAll('.tpl').forEach(box => {
                const pre = box.querySelector('pre');
                const text = pre.dataset.tpl.split('{negocio}').join(name).split('{enlace}').join(link);
                pre.textContent = text;
                box.querySelector('[data-wa]').href = 'https://wa.me/?text=' + encodeURIComponent(text);
            });
        }
        document.addEventListener('click', async e => {
            const btn = e.target.closest('[data-copy]'); if (!btn) return;
            const text = btn.closest('.tpl').querySelector('pre').textContent;
            try { await navigator.clipboard.writeText(text); } catch (err) {
                const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
            }
            const old = btn.textContent; btn.textContent = '✅ Copiado'; setTimeout(() => btn.textContent = old, 1800);
            if (window.gtag) gtag('event', 'tool_whatsapp_copy');
        });
        ['w-name', 'w-link'].forEach(id => $(id).addEventListener('input', fill));
        fill();
    })();
    </script>
"""
WA_DESC = 'Plantillas de WhatsApp gratis para negocios con cita previa: recordatorio de cita, confirmación, hueco libre, mensaje de ausencia y petición de reseña. Listas para copiar.'
urls.append(page('herramientas/plantillas-whatsapp-citas.html',
    'Plantillas de WhatsApp para recordar citas a tus clientes (gratis) | StickyWork',
    WA_DESC,
    'Plantillas de WhatsApp para recordar citas y llenar la agenda',
    '<p>Mensajes listos para copiar y pegar en tu WhatsApp: recordatorios, confirmaciones, huecos libres y reseñas. Gratis y sin registro.</p>',
    WA_BODY + faq_html(WA_FAQ) + '\n' + tool_cta('whatsapp') + '\n' + TOOLS_FOOT,
    schema=[tool_schema('Plantillas de WhatsApp para citas', 'herramientas/plantillas-whatsapp-citas.html', WA_DESC), faq_schema(WA_FAQ)],
    badge='Herramienta gratis', extra_head=TOOL_STYLE, scripts=WA_JS))

# ---------- Índice de herramientas ----------
urls.append(page('herramientas/index.html',
    'Herramientas gratis para negocios con cita previa | StickyWork',
    'Herramientas gratuitas para peluquerías, clínicas y consultas: calcula lo que pierdes con las citas que fallan, crea un cartel con QR para reservas y copia plantillas de WhatsApp.',
    'Herramientas gratis de StickyWork para negocios con cita previa',
    '<p>Úsalas sin registrarte. Son una muestra de lo que la app de StickyWork hace sola por tu negocio.</p>',
    """        <div class="tool-list">
            <a class="tool-link" href="/herramientas/calculadora-citas-perdidas.html">
                <span class="tool-icon">🧮</span>
                <div><h2>Calculadora de citas perdidas</h2><p>Descubre cuánto dinero pierdes al mes y al año por los clientes que no se presentan.</p></div>
            </a>
            <a class="tool-link" href="/herramientas/generador-qr-reservas.html">
                <span class="tool-icon">🔳</span>
                <div><h2>Cartel con código QR para reservas</h2><p>Crea un cartel para tu mostrador o escaparate y que te reserven desde el móvil.</p></div>
            </a>
            <a class="tool-link" href="/herramientas/plantillas-whatsapp-citas.html">
                <span class="tool-icon">💬</span>
                <div><h2>Plantillas de WhatsApp para citas</h2><p>Recordatorios, confirmaciones, huecos libres y reseñas, listos para copiar.</p></div>
            </a>
        </div>
""" + tool_cta('indice'),
    badge='Gratis', extra_head=TOOL_STYLE))

print('\n'.join(urls))
