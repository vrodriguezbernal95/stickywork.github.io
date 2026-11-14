// Utilidades y estilos comunes de las pantallas del super admin (Dashboard, Negocios, Consultorías)
const superUI = {
    esc(v) {
        return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    // Fechas en hora local, sin toISOString
    fecha(d) {
        if (!d) return '—';
        const s = String(d);
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [y, m, dd] = s.split('-'); return `${dd}/${m}/${y}`; }
        const f = new Date(d);
        if (isNaN(f)) return '—';
        return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`;
    },
    fechaHora(d) {
        if (!d) return '—';
        const f = new Date(d);
        if (isNaN(f)) return '—';
        return `${this.fecha(f)} ${String(f.getHours()).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')}`;
    },
    hace(d) {
        if (!d) return 'nunca';
        const dias = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
        if (dias <= 0) return 'hoy';
        if (dias === 1) return 'ayer';
        if (dias < 30) return `hace ${dias} días`;
        const meses = Math.floor(dias / 30);
        return meses === 1 ? 'hace 1 mes' : `hace ${meses} meses`;
    },
    PLANES: { free: 'Gratis', founders: 'Founders', professional: 'Profesional', premium: 'Premium' },
    PRECIO: { founders: 25, professional: 39, premium: 79 },

    // Cómo está el plan de un negocio, en una etiqueta: pagando, prueba, regalo, cortesía o gratis
    estadoPlan(b) {
        const sub = b.sub_status || (b.subscription && b.subscription.status);
        const pago = !!this.PRECIO[b.plan];
        if (['active', 'past_due'].includes(sub)) return { cls: 'ok', txt: sub === 'past_due' ? '⚠️ Pago pendiente' : '💳 Pagando' };
        if (sub === 'trialing') return { cls: 'info', txt: '⏳ En prueba (Stripe)' };
        if (b.plan_bonus_until) return { cls: 'gift', txt: `🎁 Regalo hasta ${this.fecha(b.plan_bonus_until)}` };
        if (pago) return { cls: 'muted', txt: '🤝 Cortesía (no paga)' };
        return { cls: 'muted', txt: 'Gratis' };
    },

    injectStyles() {
        if (document.getElementById('sa-styles')) return;
        const st = document.createElement('style');
        st.id = 'sa-styles';
        st.textContent = `
            .sa-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
            .sa-card { background: var(--bg-primary, var(--bg-secondary)); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.1rem 1.2rem; }
            .sa-card h3 { margin: 0 0 0.75rem; font-size: 1.02rem; color: var(--text-primary); }
            .sa-kpi-label { color: var(--text-secondary); font-size: 0.85rem; }
            .sa-kpi-value { font-size: 2rem; font-weight: 800; color: var(--text-primary); line-height: 1.2; margin: 0.2rem 0; }
            .sa-kpi-sub { color: var(--text-secondary); font-size: 0.82rem; }
            .sa-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
            .sa-list-row { display: flex; justify-content: space-between; align-items: center; padding: 0.55rem 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary); font-size: 0.92rem; }
            .sa-list-row:last-child { border-bottom: none; }
            .sa-list-row a, .sa-link { color: var(--primary-color); text-decoration: none; cursor: pointer; }
            .sa-pill { display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.78rem; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-secondary); white-space: nowrap; }
            .sa-pill.ok { border-color: rgba(16,185,129,0.5); color: #10b981; }
            .sa-pill.info { border-color: rgba(59,130,246,0.5); color: #3b82f6; }
            .sa-pill.gift { border-color: rgba(168,85,247,0.5); color: #a855f7; }
            .sa-pill.warn { border-color: rgba(245,158,11,0.6); color: #f59e0b; }
            .sa-pill.danger { border-color: rgba(239,68,68,0.55); color: #ef4444; }
            .sa-pill.plan { font-weight: 700; color: var(--text-primary); }
            .sa-count { font-weight: 800; font-size: 1.1rem; }
            .sa-count.alert { color: #f59e0b; }
            .sa-bars { display: flex; align-items: flex-end; gap: 0.75rem; height: 160px; padding-top: 0.5rem; }
            .sa-bar { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.35rem; height: 100%; justify-content: flex-end; color: var(--text-secondary); font-size: 0.8rem; }
            .sa-bar-fill { width: 100%; max-width: 46px; background: var(--primary-color); border-radius: 8px 8px 0 0; min-height: 3px; }
            .sa-bar-n { color: var(--text-primary); font-weight: 700; }
            .sa-note { color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; }
            .sa-toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 1rem; }
            .sa-toolbar input[type=search], .sa-toolbar select, .sa-form input, .sa-form select, .sa-form textarea {
                background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem 0.65rem; font-size: 0.9rem; font-family: inherit; }
            .sa-toolbar input[type=search] { flex: 1; min-width: 220px; }
            .sa-toolbar label { color: var(--text-secondary); font-size: 0.88rem; display: flex; gap: 0.35rem; align-items: center; }
            .sa-table-wrap { overflow-x: auto; }
            .sa-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
            .sa-table th, .sa-table td { text-align: left; padding: 0.65rem 0.7rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); vertical-align: top; }
            .sa-table th { color: var(--text-secondary); font-weight: 600; font-size: 0.8rem; }
            .sa-table tbody tr.click { cursor: pointer; }
            .sa-table tbody tr.click:hover { background: var(--bg-secondary); }
            .sa-sub { color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.15rem; }
            .sa-btn { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.5rem 0.85rem; border-radius: 9px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; font-size: 0.86rem; font-family: inherit; text-decoration: none; }
            .sa-btn:hover { border-color: var(--primary-color); }
            .sa-btn.primary { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
            .sa-btn.danger { border-color: rgba(239,68,68,0.55); color: #ef4444; }
            .sa-btn.small { padding: 0.35rem 0.6rem; font-size: 0.8rem; }
            .sa-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 4vh 1rem; overflow-y: auto; }
            .sa-modal-box { position: relative; width: 100%; max-width: 760px; background: var(--bg-primary, var(--bg-secondary)); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.4rem; color: var(--text-primary); }
            .sa-modal-close { position: absolute; top: 0.8rem; right: 0.8rem; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; width: 32px; height: 32px; cursor: pointer; }
            .sa-section { margin-top: 1.2rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
            .sa-section h4 { margin: 0 0 0.6rem; font-size: 0.95rem; }
            .sa-dl { display: grid; grid-template-columns: 160px 1fr; gap: 0.4rem 0.8rem; font-size: 0.9rem; }
            .sa-dl dt { color: var(--text-secondary); } .sa-dl dd { margin: 0; word-break: break-word; }
            .sa-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
            .sa-form { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-top: 0.6rem; }
            .sa-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
            .sa-tab { padding: 0.5rem 0.95rem; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; font-size: 0.9rem; }
            .sa-tab.active { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
            .sa-empty { text-align: center; padding: 2.5rem 1rem; color: var(--text-secondary); }
            @media (max-width: 640px) { .sa-dl { grid-template-columns: 1fr; } .sa-kpi-value { font-size: 1.6rem; } }
        `;
        document.head.appendChild(st);
    }
};
window.superUI = superUI;
