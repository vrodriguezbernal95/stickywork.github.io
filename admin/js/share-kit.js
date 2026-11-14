// Kit para compartir el enlace de reservas: textos listos para copiar y pasos sencillos.
// Lo usan el panel del negocio (Primeros pasos → paso 4) y el super admin (Captación y Negocios → «Kit de bienvenida»).
const shareKit = {
    esc(v) {
        return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    items(name, url) {
        const negocio = (name || 'tu negocio').trim();
        const qr = `https://stickywork.com/herramientas/generador-qr-reservas.html?url=${encodeURIComponent(url)}&name=${encodeURIComponent(negocio.slice(0, 40))}`;
        return [
            {
                key: 'whatsapp',
                icon: '💬',
                title: 'Respuesta automática de WhatsApp Business',
                why: 'Es lo que más reservas trae: quien te escribe por primera vez, o fuera de tu horario, recibe tu enlace al momento aunque estés trabajando.',
                text: `¡Hola! 👋 Gracias por escribir a ${negocio}.\nPara pedir cita, puedes reservar tú mismo aquí en un minuto: ${url}\nSi tienes cualquier otra duda, te respondo en cuanto pueda.`,
                steps: [
                    'Abre WhatsApp Business → ⚙️ Ajustes (o ⋮ → Herramientas para la empresa).',
                    'Entra en «Mensaje de bienvenida» y actívalo con el texto de arriba (WhatsApp lo envía a quien te escribe por primera vez o tras 14 días sin hablar).',
                    'Haz lo mismo en «Mensaje de ausencia», con tu horario, para que también lo reciba quien escribe cuando estás cerrado.'
                ]
            },
            {
                key: 'instagram',
                icon: '📸',
                title: 'Bio de Instagram',
                why: 'Ahí te buscan muchos clientes: que puedan reservar desde tu perfil sin escribirte.',
                text: `📅 Reserva tu cita online 👇\n${url}`,
                steps: [
                    'En Instagram, ve a tu perfil → «Editar perfil».',
                    'Pega el texto en «Presentación» y añade tu enlace en «Enlaces».',
                    'Opcional: crea una historia destacada «Reservas» con el enlace.'
                ]
            },
            {
                key: 'google',
                icon: '📍',
                title: 'Tu ficha de Google (Maps)',
                why: 'Mucha gente te busca en Google y reserva desde ahí mismo.',
                text: url,
                steps: [
                    'Busca tu negocio en Google con la sesión de la cuenta que gestiona la ficha.',
                    'Pulsa «Editar perfil» → «Reservas» (o «Enlace de citas»).',
                    'Pega tu enlace y guarda. Google tarda unos días en mostrar el botón.'
                ]
            },
            {
                key: 'cartel',
                icon: '🖨️',
                title: 'Cartel con código QR',
                why: 'Para el mostrador, la puerta o el espejo: tus clientes lo escanean y reservan la próxima cita antes de irse.',
                link: qr,
                linkLabel: 'Crear mi cartel',
                steps: [
                    'Pulsa «Crear mi cartel»: se abre con tu enlace y tu nombre ya puestos.',
                    'Elige el color y descárgalo o imprímelo en A4.'
                ]
            },
            {
                key: 'clientes',
                icon: '👥',
                title: 'Mensaje para tus clientes habituales',
                why: 'Tus clientes de siempre son los primeros que se acostumbran a reservar solos.',
                text: `¡Hola! Te escribo de ${negocio} 😊\nA partir de ahora puedes pedir tu cita cuando quieras desde este enlace, sin esperar a que te conteste: ${url}\nTe llegará la confirmación y un recordatorio el día antes. ¡Nos vemos pronto!`,
                steps: [
                    'Envíalo por WhatsApp a tus clientes habituales, de uno en uno o con una lista de difusión.',
                    'Solo a clientes que ya te han dado su número para hablar contigo.'
                ]
            }
        ];
    },

    // HTML del kit. onCopyJs: código JS (string) que se ejecuta al copiar algo (p. ej. marcar el paso como hecho)
    render(name, url, { forOwner = true } = {}) {
        const items = this.items(name, url);
        return `
            <div class="kit">
                <p class="kit-intro">${forOwner
                    ? 'Tu enlace de reservas solo funciona si tus clientes lo encuentran. Ponlo en estos sitios: copia, pega y listo.'
                    : `Textos listos para enviar a <strong>${this.esc(name)}</strong> y ayudarle a ponerlo en marcha.`}</p>
                <div class="kit-url"><span>${this.esc(url)}</span><button class="kit-btn" data-copy="${this.esc(url)}" onclick="shareKit.copy(this)">Copiar enlace</button></div>
                ${items.map(it => `
                    <div class="kit-item">
                        <div class="kit-item-head">${it.icon} <strong>${this.esc(it.title)}</strong></div>
                        <p class="kit-why">${this.esc(it.why)}</p>
                        ${it.text ? `
                            <div class="kit-text">${this.esc(it.text).replace(/\n/g, '<br>')}</div>
                            <button class="kit-btn" data-copy="${this.esc(it.text)}" onclick="shareKit.copy(this)">📋 Copiar texto</button>` : ''}
                        ${it.link ? `<a class="kit-btn primary" href="${this.esc(it.link)}" target="_blank" rel="noopener" onclick="shareKit.onUse && shareKit.onUse()">${this.esc(it.linkLabel)}</a>` : ''}
                        <ol class="kit-steps">${it.steps.map(s => `<li>${this.esc(s)}</li>`).join('')}</ol>
                    </div>`).join('')}
            </div>`;
    },

    // Se puede asignar desde fuera: se llama cuando el negocio copia algo o abre el cartel
    onUse: null,

    async copy(btn) {
        const text = btn.getAttribute('data-copy') || '';
        try {
            await navigator.clipboard.writeText(text);
            const prev = btn.textContent;
            btn.textContent = '✓ Copiado';
            setTimeout(() => { btn.textContent = prev; }, 1500);
        } catch (e) {
            window.prompt('Copia este texto:', text);
        }
        if (typeof this.onUse === 'function') this.onUse();
    },

    // Ventana con el kit (sirve en el panel y en el super admin)
    open(name, url, opts = {}) {
        this.injectStyles();
        document.querySelectorAll('#kitModal').forEach(m => m.remove());
        const wrap = document.createElement('div');
        wrap.id = 'kitModal';
        wrap.className = 'kit-modal';
        wrap.innerHTML = `<div class="kit-box"><button class="kit-close" aria-label="Cerrar">✕</button>
            <h2>📣 ${opts.forOwner === false ? 'Kit de bienvenida' : 'Kit para compartir tu enlace'}</h2>${this.render(name, url, opts)}</div>`;
        wrap.addEventListener('click', e => { if (e.target === wrap || e.target.classList.contains('kit-close')) wrap.remove(); });
        document.body.appendChild(wrap);
    },

    injectStyles() {
        if (document.getElementById('kit-styles')) return;
        const st = document.createElement('style');
        st.id = 'kit-styles';
        st.textContent = `
            .kit-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 2000; display: flex; align-items: flex-start; justify-content: center; padding: 4vh 1rem; overflow-y: auto; }
            .kit-box { position: relative; width: 100%; max-width: 680px; background: var(--bg-primary, var(--bg-secondary, #fff)); color: var(--text-primary, #111); border: 1px solid var(--border-color, #e5e7eb); border-radius: 16px; padding: 1.4rem; }
            .kit-box h2 { margin: 0 2.5rem 0.5rem 0; font-size: 1.25rem; }
            .kit-close { position: absolute; top: 0.8rem; right: 0.8rem; width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-color, #e5e7eb); background: var(--bg-secondary, #f3f4f6); color: var(--text-primary, #111); cursor: pointer; }
            .kit-intro { color: var(--text-secondary, #6b7280); line-height: 1.5; margin: 0 0 1rem; }
            .kit-url { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; justify-content: space-between; padding: 0.7rem 0.9rem; border-radius: 10px; background: var(--bg-secondary, #f3f4f6); border: 1px solid var(--border-color, #e5e7eb); margin-bottom: 1rem; word-break: break-all; font-weight: 600; }
            .kit-item { padding: 1rem 0; border-top: 1px solid var(--border-color, #e5e7eb); }
            .kit-item-head { font-size: 1rem; }
            .kit-why { color: var(--text-secondary, #6b7280); font-size: 0.9rem; margin: 0.3rem 0 0.6rem; line-height: 1.5; }
            .kit-text { white-space: normal; background: var(--bg-secondary, #f3f4f6); border: 1px solid var(--border-color, #e5e7eb); border-radius: 10px; padding: 0.75rem; font-size: 0.92rem; line-height: 1.5; margin-bottom: 0.5rem; word-break: break-word; }
            .kit-btn { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.45rem 0.8rem; border-radius: 9px; border: 1px solid var(--border-color, #e5e7eb); background: var(--bg-secondary, #f3f4f6); color: var(--text-primary, #111); cursor: pointer; font-size: 0.86rem; text-decoration: none; font-family: inherit; }
            .kit-btn:hover { border-color: var(--primary-color, #3b82f6); }
            .kit-btn.primary { background: var(--primary-color, #3b82f6); border-color: var(--primary-color, #3b82f6); color: #fff; }
            .kit-steps { margin: 0.6rem 0 0; padding-left: 1.2rem; color: var(--text-secondary, #6b7280); font-size: 0.88rem; line-height: 1.6; }
        `;
        document.head.appendChild(st);
    }
};
window.shareKit = shareKit;
