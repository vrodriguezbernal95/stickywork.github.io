// Precio fundador: contador de plazas en la portada y en planes.
// El HTML ya trae la oferta; si el servidor dice que no está activa (sin plazas o sin precio en Stripe),
// se vuelve al precio normal del plan Profesional.
(function () {
    const API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? '' : 'https://api.stickywork.com';

    const st = document.createElement('style');
    st.textContent = `
        .fund-old { font-size: 0.55em; font-weight: 600; color: var(--text-secondary); text-decoration: line-through; margin-right: 0.3em; vertical-align: middle; }
        [data-fundador] .fund-note { margin: 0 0 0.6rem; font-size: 0.92rem; color: var(--text-primary); }
        .fund-bar { height: 8px; border-radius: 999px; background: var(--border-color); overflow: hidden; margin: 0.4rem auto 0.35rem; max-width: 240px; }
        .fund-bar > span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #f59e0b, #ef4444); transition: width 0.6s; }
        [data-fundador] .fund-left { margin: 0 0 0.9rem; font-size: 0.85rem; color: var(--text-secondary); }
        .fund-left strong { color: #f97316; }
    `;
    document.head.appendChild(st);

    function pintar(d) {
        document.querySelectorAll('[data-fundador]').forEach(el => {
            if (!d.activo) { el.classList.add('fund-off'); return; }
            el.querySelectorAll('[data-fundador-quedan]').forEach(x => { x.textContent = d.quedan; });
            el.querySelectorAll('[data-fundador-plazas]').forEach(x => { x.textContent = d.plazas; });
            el.querySelectorAll('.fund-bar > span').forEach(x => { x.style.width = Math.max(4, Math.round(100 * d.ocupadas / d.plazas)) + '%'; });
        });
    }

    fetch(API + '/api/public/plazas-fundador')
        .then(r => r.ok ? r.json() : null)
        .then(r => { if (r && r.success) pintar(r.data); })
        .catch(() => { /* sin conexión: se queda la oferta tal cual; el pago decide el precio real */ });
})();
