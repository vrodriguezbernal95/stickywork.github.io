// Guiones de llamada por tipo de negocio para la Captación del super admin.
// Están escritos para leerse en mitad de una llamada: bloques cortos, qué decir y qué escuchar.
// Se personalizan con los datos de cada ficha (nombre, zona, cómo dan cita, herramienta que usan).
// Solo prometen lo que StickyWork hace de verdad (ver admin/js/help-content.js).
const callScripts = {
    esc(v) {
        return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    grupo(sector) {
        if (['peluqueria', 'canina'].includes(sector)) return 'pelu';
        if (['estetica', 'tatuajes'].includes(sector)) return 'estetica';
        if (['fisioterapia', 'podologia', 'dental', 'optica'].includes(sector)) return 'salud';
        if (['psicologia', 'nutricion'].includes(sector)) return 'consulta';
        return 'general';
    },

    // Textos por tipo de negocio. {n} = nombre del negocio
    SECTOR: {
        pelu: {
            plural: 'las peluquerías',
            quien: 'peluquería',
            dolor: 'los WhatsApp para pedir cita a cualquier hora, mientras tienes las manos ocupadas con un cliente',
            preguntas: [
                ['Ahora mismo, ¿cómo os piden cita la mayoría: por WhatsApp, llamando o pasando por aquí?', 'Si dice WhatsApp o teléfono → ese es el dolor: interrupciones mientras corta.'],
                ['¿Y te pasa que te escriben por la noche o cuando estás con un cliente y no puedes contestar?', 'Si dice que sí → «justo para eso lo hice».'],
                ['¿Se os queda algún hueco vacío porque alguien no viene o avisa tarde?', 'Si dice que sí → recordatorio el día antes con botón para cancelar o cambiar la hora.'],
                ['¿Tenéis tarjeta de sellos o algo para los clientes que repiten?', 'Si es de cartón → «también va incluida una tarjeta digital: escanean un QR, ven cuántas visitas llevan y al llegar a la meta les sale el vale. No se pierde ni hay que sellar nada». Incluida en todos los planes, también el gratis.']
            ],
            puente: 'Lo que hago es que tus clientes vean tus huecos libres y reserven ellos solos desde un enlace, como si te escribieran por WhatsApp pero sin que tengas que contestar. Les llega la confirmación al momento y un recordatorio el día antes por email, y si no pueden venir cancelan o cambian la hora desde ahí, así que el hueco queda libre para otro.',
            extra: 'Y puedes poner el enlace en tu Instagram y en la respuesta automática de WhatsApp Business: quien te escriba, recibe el enlace solo.'
        },
        estetica: {
            plural: 'los centros de estética',
            quien: 'centro de estética',
            dolor: 'contestar mensajes para cuadrar citas en vez de estar con tus clientas',
            preguntas: [
                ['¿Cómo os piden cita ahora: por Instagram, WhatsApp, teléfono…?', 'Si dice Instagram/WhatsApp → el enlace va en la bio y en la respuesta automática.'],
                ['¿Cuánto rato al día se te va en cuadrar citas por mensajes?', 'Escucha: si dice «mucho» → ese es el argumento.'],
                ['¿Os pasa que alguien no se presenta y os quedáis con el hueco vacío?', 'Si dice que sí → recordatorio el día antes con botón para cancelar o cambiar.'],
                ['¿Hacéis algo para premiar a las clientas que repiten, tipo tarjeta de sellos?', 'Si es de cartón o no tienen → «va incluida una tarjeta digital: escanean un QR, ven sus visitas y al llegar a la meta les sale el vale (por ejemplo, una manicura gratis)». Incluida en todos los planes, también el gratis.']
            ],
            puente: 'Lo que hago es que tus clientas reserven solas desde un enlace que pones en tu Instagram: ven tus tratamientos, el precio y los huecos libres, y eligen. Les llega la confirmación al momento y un recordatorio el día antes por email, con un botón por si tienen que cambiar la hora.',
            extra: 'Para las que repiten, puedes dejarles la cita repetida cada pocas semanas en un momento.'
        },
        salud: {
            plural: 'las consultas',
            quien: 'consulta',
            dolor: 'cogerle el teléfono a pacientes en mitad de una sesión, o perder la llamada',
            preguntas: [
                ['¿Cómo os piden cita los pacientes ahora: por teléfono, WhatsApp…?', 'Si dice teléfono → «¿y si estás en sesión?».'],
                ['¿Muchos pacientes vienen varias semanas seguidas?', 'Si dice que sí → reservas repetidas (cada 1 a 4 semanas, hasta 12 sesiones de una vez).'],
                ['¿Os pasa que alguien se olvida de la cita y no viene?', 'Si dice que sí → recordatorio por email el día antes, con botón para cancelar o cambiar.']
            ],
            puente: 'Lo que hago es que los pacientes puedan pedir cita solos desde un enlace, con tus horarios reales, sin que tengas que coger el teléfono en mitad de una sesión. Les llega la confirmación y un recordatorio el día antes por email, y si un paciente viene cada semana le dejas todas las sesiones reservadas de una vez.',
            extra: 'Si prefieres revisar cada cita antes de darla por buena, puedes activar la confirmación manual: el paciente ve que está pendiente hasta que tú la aceptas.'
        },
        consulta: {
            plural: 'los profesionales que pasan consulta',
            quien: 'consulta',
            dolor: 'gestionar las citas tú solo, entre sesión y sesión, contestando mensajes',
            preguntas: [
                ['¿Cómo te piden cita ahora tus pacientes: por WhatsApp, por teléfono, por email…?', 'Si lo lleva todo él/ella solo/a → ese es el dolor: tiempo entre sesiones.'],
                ['¿Tus pacientes suelen venir de forma periódica, cada semana o cada quince días?', 'Si dice que sí → reservas repetidas: le dejas las próximas sesiones en un momento.'],
                ['¿Te pasa que alguien se olvida o cancela tarde?', 'Si dice que sí → recordatorio por email el día antes con botón para cancelar o cambiar.']
            ],
            puente: 'Lo que hago es que tus pacientes pidan su cita solos desde un enlace, con tus horarios, sin tener que escribirte. Les llega la confirmación y un recordatorio el día antes por email, y si un paciente viene cada semana le dejas las próximas sesiones reservadas de una vez.',
            extra: 'Y si prefieres decidir tú cada cita, activas la confirmación manual: no se da por buena hasta que la aceptas.'
        },
        general: {
            plural: 'los negocios con cita previa',
            quien: 'negocio',
            dolor: 'cuadrar citas por teléfono y por mensajes',
            preguntas: [
                ['¿Cómo os piden cita ahora vuestros clientes?', 'Escucha si es por teléfono o WhatsApp: ese es el dolor.'],
                ['¿Os escriben o llaman cuando no podéis atender?', 'Si dice que sí → el enlace reserva solo, a cualquier hora.'],
                ['¿Os pasa que alguien no se presenta?', 'Si dice que sí → recordatorio el día antes con botón para cancelar o cambiar.']
            ],
            puente: 'Lo que hago es que tus clientes reserven solos desde un enlace, viendo tus huecos libres. Les llega la confirmación y un recordatorio el día antes por email, y si no pueden venir, cancelan o cambian la hora desde ahí.',
            extra: ''
        }
    },

    // Guion para centros de formación (FP de estética, peluquería, dietética…)
    buildFormacion(p) {
        const e = v => this.esc(v);
        const n = e(p.name || 'el centro');
        const saludo = new Date().getHours() < 14 ? 'buenos días' : 'buenas tardes';
        const cerca = /sabadell|terrassa|sant quirze|castellar|barber[aà]|badia|cerdanyola|ripollet|sant cugat/i.test(`${p.city || ''} ${p.address || ''}`);
        const ciclo = /dietet|nutri/i.test(`${p.hook || ''} ${p.notes || ''}`) ? 'dietética' : /perruq|pelu/i.test(`${p.hook || ''} ${p.notes || ''}`) ? 'peluquería' : 'estética';
        const objeciones = [
            ['«Lo tengo que consultar con dirección»', 'Claro, es lo normal. ¿Te mando un resumen corto por email para que lo puedas enseñar? Así lo veis con calma y, si os encaja, os lo dejo montado.'],
            ['«No tenemos presupuesto / no podemos contratar nada»', 'No tiene ningún coste para el centro. Os lo dejo con todas las funciones sin pagar nada: lo que me interesa es que los alumnos lo conozcan.'],
            ['«¿Y la protección de datos?»', 'El cliente que reserva solo deja nombre, email y teléfono para la cita, y solo lo ve el centro en su panel. No hace falta ningún dato de los alumnos.'],
            ['«Mándalo a secretaría por email»', 'Perfecto. ¿Me podrías decir el nombre de la persona que coordina el ciclo, para que le llegue a ella directamente? Y así le llamo yo después para resolver dudas.'],
            ['«Ahora estamos con exámenes / prácticas / mucho lío»', '¿Cuándo os vendría mejor? Te llamo esa semana.  →  «Llamar otro día» con la fecha.'],
            ['«Ya usamos otra herramienta»', '¡Genial! ¿Cuál? … Si os va bien, perfecto. Si queréis, os la enseño igualmente para que los alumnos vean otra opción: muchos acabarán montando su propio negocio.'],
            ['«¿Por qué lo regalas?»', 'Porque los alumnos de hoy son los profesionales de dentro de dos años. Si aprenden con StickyWork, es probable que lo usen cuando abran su negocio. Y vuestro salón de prácticas gana un sistema de citas sin coste.']
        ];
        return `
        <div class="cs">
            <div class="cs-block cs-prep">
                <div class="cs-h">🎯 Antes de llamar <span>10 segundos</span></div>
                <ul>
                    <li><strong>Con quién quieres hablar:</strong> coordinador/a del ciclo de ${ciclo} o jefe/a del departamento. Lo normal es que primero coja secretaría.</li>
                    <li><strong>Objetivo:</strong> conseguir el email o el teléfono directo del coordinador y permiso para mandarle la propuesta${cerca ? ', o una visita de 15 minutos' : ''}.</li>
                    <li><strong>Lo que sabemos:</strong> ${p.hook ? e(p.hook) : 'que imparten ciclos de imagen personal o dietética.'}</li>
                </ul>
            </div>

            <div class="cs-block">
                <div class="cs-h">1. Secretaría <span>quién atiende primero</span></div>
                <p class="cs-say">«Hola, ${saludo}. ¿Es <strong>${n}</strong>? … Soy Víctor, de Sabadell. Quería hablar con la persona que coordina el ciclo de ${ciclo}: es para proponerle una herramienta gratuita para el salón de prácticas y para los alumnos. ¿Con quién podría hablar?»</p>
                <p class="cs-if"><b>Si no está:</b> «¿Me podrías decir su nombre y cuándo es mejor llamarle? ¿O un email donde escribirle?» → apúntalo en las notas y «Llamar otro día».</p>
                <p class="cs-if"><b>Si piden que lo mandes por email:</b> pide el email del coordinador (no el general) y di que llamarás después.</p>
            </div>

            <div class="cs-block">
                <div class="cs-h">2. Con el coordinador/a <span>presentación</span></div>
                <p class="cs-say">«Hola, soy Víctor, de Sabadell. He creado StickyWork, una herramienta para que los negocios con cita previa —peluquerías, centros de estética, consultas— reciban reservas online. Te llamo porque creo que os puede servir en el centro de dos formas, y sin ningún coste. ¿Tienes un par de minutos?»</p>
            </div>

            <div class="cs-block">
                <div class="cs-h">3. Preguntas</div>
                <p class="cs-say">«¿Tenéis salón o servicio de prácticas abierto al público, donde la gente pide cita?»</p>
                <p class="cs-hint">👂 Si dice que sí → «¿y cómo gestionáis ahora esas citas?» (libreta, teléfono, secretaría…). Ese es el gancho principal.</p>
                <p class="cs-say">«¿En algún módulo trabajáis la gestión del negocio o el emprendimiento con los alumnos?»</p>
                <p class="cs-hint">👂 Si dice que sí → les sirve para practicar con una herramienta real.</p>
            </div>

            <div class="cs-block">
                <div class="cs-h">4. Propuesta</div>
                <p class="cs-say">«Os propongo dos cosas. Una: el salón de prácticas tiene su propia página de reservas y la gente pide cita online; les llega la confirmación y un recordatorio el día antes por email, y desde ahí pueden cancelar o cambiar la hora. Dos: los alumnos aprenden a gestionar una agenda de citas como lo harán en su propio negocio. Os lo dejo montado y con todas las funciones, <strong>gratis para el centro</strong>.»</p>
                ${cerca ? `<p class="cs-say">«Si queréis, vengo un día y lo enseño en 15 minutos en clase.»</p>` : ''}
            </div>

            <div class="cs-block">
                <div class="cs-h">5. Cierre</div>
                <p class="cs-say">«¿Te mando un resumen por email o por WhatsApp para que lo veáis con calma? ¿A qué dirección?»</p>
                <p class="cs-if"><b>Si dice que sí:</b> apunta el email o pulsa <strong>✅ Permiso WhatsApp</strong> si es por WhatsApp. «Perfecto, te lo mando hoy y te llamo la semana que viene para ver qué os ha parecido.»</p>
                <p class="cs-if"><b>Si dice que no:</b> «Perfecto, muchas gracias por tu tiempo. ¡Buen curso!» → «No le interesa».</p>
            </div>

            <details class="cs-block cs-obj" open>
                <summary class="cs-h">💬 Si te dice… <span>${objeciones.length} objeciones</span></summary>
                ${objeciones.map(([o, r]) => `<div class="cs-o"><div class="cs-o-q">${o}</div><div class="cs-o-a">${r}</div></div>`).join('')}
            </details>

            <div class="cs-block cs-sos">
                <div class="cs-h">🆘 Me he quedado en blanco</div>
                <p class="cs-say">«Perdona, que me enrollo. Una pregunta: ¿cómo gestionáis ahora las citas del salón de prácticas?»</p>
                <p class="cs-say">«En resumen: una página de reservas para vuestro salón y una herramienta real para los alumnos, gratis para el centro.»</p>
                <p class="cs-say">«¿Te mando un resumen por email y lo hablamos con calma?»</p>
            </div>
        </div>`;
    },

    build(p) {
        if (p.sector === 'formacion' || p.segment === 'formacion') return this.buildFormacion(p);
        const e = v => this.esc(v);
        const g = this.grupo(p.sector);
        const s = this.SECTOR[g];
        const n = e(p.name || 'el negocio');
        const cerca = /sabadell|terrassa|sant quirze|castellar|barber[aà]|badia|cerdanyola|ripollet|sant cugat/i.test(`${p.city || ''} ${p.address || ''}`);
        const tool = (p.booking_tool || '').trim();
        const usaMarket = p.booking_method === 'marketplace' || /treatwell|fresha|booksy/i.test(tool);
        const usaSoft = p.booking_method === 'software' || /doctoralia|koibox|flowww|gesden/i.test(tool);

        // Frase de apertura según lo que sabemos de cómo dan cita hoy
        let gancho;
        if (usaMarket) gancho = `He visto que estáis en ${e(tool || 'Treatwell')}, y quería contaros algo que os puede ahorrar comisiones con vuestros clientes de siempre.`;
        else if (usaSoft) gancho = `He visto que dais cita por ${e(tool || 'una plataforma')}, y quería preguntarte una cosa rápida sobre cómo os funciona.`;
        else if (p.booking_method === 'sin_web') gancho = `He visto que la cita se pide llamando, y quería contarte algo que te puede quitar trabajo con el teléfono.`;
        else if (p.booking_method === 'whatsapp_telefono') gancho = `He visto que la cita se pide por WhatsApp o por teléfono, y quería contarte algo que te puede quitar trabajo con eso.`;
        else gancho = `Te llamo porque trabajo con negocios como el vuestro y quería hacerte una pregunta rápida.`;

        const objeciones = [
            usaMarket ? ['«Ya uso Treatwell / Fresha / Booksy»', `Perfecto, puedes seguir usándolo para captar clientes nuevos. Pero tus clientes de siempre, los que ya te conocen, ¿también te los cobran con comisión? Con tu propio enlace reservan contigo directamente, sin comisiones. Mucha gente usa las dos cosas a la vez.${/booksy/i.test(tool) ? ' (Booksy cobra una cuota al mes; el plan Gratis de StickyWork no cuesta nada.)' : ''}`] : null,
            ['«Me va bien con la libreta / con el WhatsApp»', 'Lo entiendo, y no tienes que dejarlo. Puedes seguir apuntando en tu agenda a quien te llame; el enlace es para los que prefieren reservar solos, sobre todo fuera de horario. Son citas que entran sin que tengas que coger el móvil.'],
            ['«No tengo tiempo para esto»', 'Por eso te lo monto yo: en 10 minutos lo dejo funcionando con tus servicios y tu horario. Tú no tienes que hacer nada más que poner el enlace donde te escriben.'],
            ['«Mis clientes son mayores, prefieren llamar»', 'Seguro que muchos sí, y pueden seguir llamando. Pero sus hijos, los más jóvenes o los que te escriben a las once de la noche agradecen poder reservar solos. No sustituye al teléfono: suma.'],
            ['«¿Cuánto cuesta? / ¿Dónde está la trampa?»', 'El plan Gratis es gratis para siempre, sin tarjeta, hasta 30 reservas al mes. Si un día te quedas corto, el Profesional son 39 € al mes, pero no tienes que decidirlo ahora. Pruébalo gratis y ves si te sirve.'],
            ['«Mándame información por email»', 'Claro. ¿Te parece si te lo mando por WhatsApp a este número? Así lo ves desde el móvil, con un ejemplo de cómo lo vería un cliente.  →  si dice que sí, ES el permiso: márcalo.'],
            ['«Ya tengo web»', 'Genial, entonces es todavía más fácil: el formulario de reservas se pone dentro de tu web, o pones un botón que abre tu página de reservas. Y el enlace también sirve para Instagram y WhatsApp.'],
            ['«No me fío / ¿quién eres?»', `Normal. Soy Víctor, de Sabadell; lo he creado yo para negocios pequeños como el tuyo. ${cerca ? 'Si quieres, me paso un momento por ahí y te lo enseño en persona, sin compromiso.' : 'Si quieres, te mando por WhatsApp un ejemplo para que lo veas tú con calma.'}`],
            g === 'consulta' || g === 'salud' ? ['«¿Y los datos de mis pacientes?»', 'El paciente solo deja su nombre, email y teléfono para la cita, y solo los ves tú en tu panel. No pide ningún dato de salud.'] : null,
            ['«Ahora no es buen momento»', '¿Te va mejor que te llame otro día? ¿Qué día y a qué hora te pillo más tranquilo?  →  pulsa «Llamar otro día» y apunta la hora.']
        ].filter(Boolean);

        return `
        <div class="cs">
            <div class="cs-block cs-prep">
                <div class="cs-h">🎯 Antes de llamar <span>10 segundos</span></div>
                <ul>
                    <li><strong>Objetivo:</strong> que te deje mandarle un WhatsApp con el enlace (o una visita${cerca ? ': está cerca' : ''}). No hace falta vender en la llamada.</li>
                    <li><strong>Lo que sabemos:</strong> ${p.hook ? e(p.hook) : 'nada especial: pregunta.'}</li>
                    <li>Sonríe al hablar (se nota), ve despacio y deja que hable él/ella.</li>
                </ul>
            </div>

            <div class="cs-block">
                <div class="cs-h">1. Apertura <span>15 segundos</span></div>
                <p class="cs-say">«Hola, ${new Date().getHours() < 14 ? 'buenos días' : 'buenas tardes'}, ¿hablo con <strong>${n}</strong>? … Soy Víctor, de Sabadell. ${gancho} ¿Tienes un minuto o te pillo mal?»</p>
                <p class="cs-if"><b>Si está liado:</b> «Sin problema, ¿cuándo te va mejor que te llame? ¿Mañana a esta hora?» → «Llamar otro día».</p>
                <p class="cs-if"><b>Si pregunta de dónde sacaste el número:</b> «De vuestra ficha pública${p.source && /censo|registro|generalitat/i.test(p.source) ? ' y del registro oficial de negocios' : ''}. Si prefieres que no te vuelva a llamar, lo apunto y no te molesto más.»</p>
            </div>

            <div class="cs-block">
                <div class="cs-h">2. Preguntas <span>que hable él/ella</span></div>
                ${s.preguntas.map(([q, hint]) => `<p class="cs-say">«${q}»</p><p class="cs-hint">👂 ${hint}</p>`).join('')}
            </div>

            <div class="cs-block">
                <div class="cs-h">3. Puente <span>conecta su problema con la solución</span></div>
                <p class="cs-say">«Te pregunto porque lo que más me cuentan ${s.plural} es lo de ${s.dolor}. ${s.puente}${s.extra ? ' ' + s.extra : ''}»</p>
            </div>

            <div class="cs-block">
                <div class="cs-h">4. Oferta y cierre</div>
                <p class="cs-say">«Tiene un plan gratis para siempre, sin tarjeta, y si quieres <strong>te lo dejo montado yo en 10 minutos</strong> con tus servicios y tu horario. ¿Te mando por WhatsApp un enlace para que lo veas con calma? ¿Es este número?»</p>
                <p class="cs-if"><b>Si dice que sí:</b> pulsa <strong>✅ Permiso WhatsApp</strong> y envíaselo al colgar: «Perfecto, te lo mando ahora mismo. ¡Gracias, ${n}!»</p>
                ${cerca ? `<p class="cs-if"><b>Alternativa:</b> «Si te va mejor, me paso un día por ahí y te lo enseño en 10 minutos. ¿Qué día te viene bien?»</p>` : ''}
                <p class="cs-if"><b>Si dice que no:</b> «Perfecto, gracias por tu tiempo. No te vuelvo a llamar. ¡Que vaya muy bien!» → «No le interesa» (o «No contactar» si lo pide).</p>
            </div>

            <details class="cs-block cs-obj" open>
                <summary class="cs-h">💬 Si te dice… <span>${objeciones.length} objeciones</span></summary>
                ${objeciones.map(([o, r]) => `<div class="cs-o"><div class="cs-o-q">${o}</div><div class="cs-o-a">${r}</div></div>`).join('')}
            </details>

            <div class="cs-block cs-sos">
                <div class="cs-h">🆘 Me he quedado en blanco</div>
                <p class="cs-say">«Perdona, que me enrollo. Te pregunto solo una cosa: ¿ahora mismo cómo os piden cita?»</p>
                <p class="cs-say">«Lo más fácil es que lo veas tú: ¿te mando un ejemplo por WhatsApp y lo miras cuando puedas?»</p>
                <p class="cs-say">«En resumen: tus clientes reservan solos desde un enlace y les llega un recordatorio. Es gratis y te lo monto yo.»</p>
            </div>
        </div>`;
    },

    // Ventana grande para tenerlo delante durante la llamada
    open(p) {
        this.injectStyles();
        document.querySelectorAll('#csModal').forEach(m => m.remove());
        const wrap = document.createElement('div');
        wrap.id = 'csModal';
        wrap.className = 'cs-modal';
        wrap.innerHTML = `<div class="cs-box"><button class="cs-close" aria-label="Cerrar">✕</button>
            <div class="cs-top"><div><h2>📞 ${this.esc(p.name)}</h2><div class="cs-sub">${this.esc([p.district, p.city].filter(Boolean).join(', '))}</div></div>
            ${p.phone ? `<a class="cs-phone" href="tel:${p.phone_norm ? '+34' + this.esc(p.phone_norm) : this.esc(p.phone)}">${this.esc(p.phone)}</a>` : ''}</div>
            ${this.build(p)}</div>`;
        wrap.addEventListener('click', e => { if (e.target === wrap || e.target.classList.contains('cs-close')) wrap.remove(); });
        document.body.appendChild(wrap);
    },

    injectStyles() {
        if (document.getElementById('cs-styles')) return;
        const st = document.createElement('style');
        st.id = 'cs-styles';
        st.textContent = `
            .cs { display: grid; gap: 0.7rem; margin: 0.6rem 0; }
            .cs-block { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 0.8rem 0.95rem; color: var(--text-primary); }
            .cs-h { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.45rem; display: flex; gap: 0.5rem; align-items: baseline; flex-wrap: wrap; cursor: default; }
            .cs-h span { font-weight: 400; font-size: 0.78rem; color: var(--text-secondary); }
            details.cs-block > summary.cs-h { cursor: pointer; list-style: none; margin-bottom: 0; }
            details[open].cs-block > summary.cs-h { margin-bottom: 0.45rem; }
            .cs-say { margin: 0.35rem 0; font-size: 0.95rem; line-height: 1.55; padding-left: 0.6rem; border-left: 3px solid var(--primary-color); }
            .cs-hint { margin: 0 0 0.5rem 0.6rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45; }
            .cs-if { margin: 0.3rem 0; font-size: 0.86rem; color: var(--text-secondary); line-height: 1.5; }
            .cs-if b { color: var(--text-primary); }
            .cs-prep ul { margin: 0; padding-left: 1.1rem; font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary); }
            .cs-prep li strong { color: var(--text-primary); }
            .cs-o { padding: 0.5rem 0; border-top: 1px solid var(--border-color); }
            .cs-o:first-of-type { border-top: none; }
            .cs-o-q { font-weight: 600; font-size: 0.9rem; }
            .cs-o-a { font-size: 0.88rem; line-height: 1.55; margin-top: 0.2rem; }
            .cs-sos { border-color: rgba(245,158,11,0.55); }
            .cs-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; align-items: flex-start; justify-content: center; padding: 3vh 1rem; overflow-y: auto; }
            .cs-box { position: relative; width: 100%; max-width: 820px; background: var(--bg-primary, var(--bg-secondary)); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.3rem 1.4rem; color: var(--text-primary); }
            .cs-box .cs-say { font-size: 1.08rem; }
            .cs-close { position: absolute; top: 0.8rem; right: 0.8rem; width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; }
            .cs-top { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-right: 2.5rem; flex-wrap: wrap; }
            .cs-top h2 { margin: 0; font-size: 1.3rem; }
            .cs-sub { color: var(--text-secondary); font-size: 0.9rem; }
            .cs-phone { font-size: 1.3rem; font-weight: 800; color: var(--primary-color); text-decoration: none; }
        `;
        document.head.appendChild(st);
    }
};
window.callScripts = callScripts;
