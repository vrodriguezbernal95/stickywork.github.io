/**
 * Asistente de ayuda del panel (sin IA)
 * Botón flotante "?" → buscador + preguntas frecuentes + categorías, con botones que
 * llevan a cada pantalla y salida a soporte. El contenido está en help-content.js.
 */
(function () {
    const STOPWORDS = new Set(['como', 'cómo', 'que', 'qué', 'para', 'por', 'con', 'una', 'uno', 'los', 'las', 'del', 'mis', 'mi', 'puedo', 'hago', 'donde', 'dónde', 'esta', 'está', 'quiero', 'hay', 'cual', 'cuál', 'tengo', 'hacer', 'sobre']);
    const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, ' ');
    // Raíz aproximada para que "cancelo" encuentre "cancelar" y "reservas" encuentre "reserva"
    const stem = (w) => (w.length > 5 ? w.slice(0, w.length - 2) : w);

    let searchTimer = null;
    let lastMissed = '';

    const help = {
        open: false,

        init() {
            if (document.getElementById('helpFab')) return;
            const fab = document.createElement('button');
            fab.id = 'helpFab';
            fab.className = 'help-fab';
            fab.setAttribute('aria-label', 'Ayuda');
            fab.innerHTML = '?';
            fab.onclick = () => help.toggle();

            const panel = document.createElement('div');
            panel.id = 'helpPanel';
            panel.className = 'help-panel';
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-label', 'Centro de ayuda');
            panel.innerHTML = `
                <div class="help-head">
                    <div>
                        <strong>¿En qué te ayudamos?</strong>
                        <span>Busca o elige un tema</span>
                    </div>
                    <button class="help-close" onclick="helpAssistant.toggle(false)" aria-label="Cerrar">✕</button>
                </div>
                <div class="help-search">
                    <input type="search" id="helpSearch" placeholder="Ej: cambiar una cita, horario, enlace..." autocomplete="off">
                </div>
                <div class="help-body" id="helpBody"></div>
                <div class="help-foot">
                    ¿No encuentras lo que buscas?
                    <a href="#" onclick="helpAssistant.go('support'); return false;">Escríbenos</a>
                </div>
            `;
            document.body.appendChild(fab);
            document.body.appendChild(panel);

            document.getElementById('helpSearch').addEventListener('input', (e) => {
                clearTimeout(searchTimer);
                const value = e.target.value;
                searchTimer = setTimeout(() => help.search(value), 150);
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && help.open) help.toggle(false);
            });

            help.renderHome();
        },

        toggle(force) {
            help.open = typeof force === 'boolean' ? force : !help.open;
            document.getElementById('helpPanel').classList.toggle('open', help.open);
            const fab = document.getElementById('helpFab');
            fab.classList.toggle('active', help.open);
            fab.textContent = help.open ? '✕' : '?';
            if (help.open) setTimeout(() => document.getElementById('helpSearch').focus(), 50);
        },

        setBody(html) {
            const body = document.getElementById('helpBody');
            body.innerHTML = html;
            body.scrollTop = 0;
        },

        topicButton(t) {
            return `<button class="help-item" onclick="helpAssistant.showTopic('${t.id}')">${t.q}</button>`;
        },

        renderHome() {
            const popular = window.HELP_TOPICS.filter(t => t.popular);
            help.setBody(`
                <div class="help-label">Preguntas frecuentes</div>
                ${popular.map(help.topicButton).join('')}
                <div class="help-label">Temas</div>
                <div class="help-cats">
                    ${window.HELP_CATEGORIES.map(c => `
                        <button class="help-cat" onclick="helpAssistant.showCategory('${c.id}')">
                            <span>${c.icon}</span>${utils.escapeHtml(c.title)}
                        </button>`).join('')}
                </div>
            `);
        },

        showCategory(catId) {
            const cat = window.HELP_CATEGORIES.find(c => c.id === catId);
            const topics = window.HELP_TOPICS.filter(t => t.cat === catId);
            help.setBody(`
                <button class="help-back" onclick="helpAssistant.renderHome()">← Volver</button>
                <div class="help-label">${cat.icon} ${utils.escapeHtml(cat.title)}</div>
                ${topics.map(help.topicButton).join('')}
            `);
        },

        showTopic(id) {
            const t = window.HELP_TOPICS.find(x => x.id === id);
            if (!t) return;
            const related = window.HELP_TOPICS.filter(x => x.cat === t.cat && x.id !== t.id).slice(0, 3);
            help.setBody(`
                <button class="help-back" onclick="helpAssistant.backFromTopic()">← Volver</button>
                <h4 class="help-q">${t.q}</h4>
                <div class="help-a">${t.a}</div>
                ${t.actions?.length ? `
                    <div class="help-actions">
                        ${t.actions.map(a => `<button class="help-action" onclick="helpAssistant.go('${a.go}')">${a.label} →</button>`).join('')}
                    </div>` : ''}
                <div class="help-notfound">
                    ¿No era esto? <a href="#" onclick="helpAssistant.go('support'); return false;">Escríbenos y te ayudamos</a>
                </div>
                ${related.length ? `
                    <div class="help-label">Relacionado</div>
                    ${related.map(help.topicButton).join('')}` : ''}
            `);
        },

        backFromTopic() {
            const q = document.getElementById('helpSearch').value.trim();
            if (q) help.search(q); else help.renderHome();
        },

        search(raw) {
            const query = raw.trim();
            if (query.length < 2) { help.renderHome(); return; }

            const words = normalize(query).split(/[^a-z0-9ñ]+/).filter(w => w.length > 2 && !STOPWORDS.has(w)).map(stem);
            if (words.length === 0) { help.renderHome(); return; }

            // Coincidencia por inicio de palabra ("cuesta" no debe encontrar "encuesta")
            const tokens = (text) => normalize(text).split(/[^a-z0-9ñ]+/).filter(Boolean);
            const has = (list, w) => list.some(tok => tok.startsWith(w));

            const results = window.HELP_TOPICS.map(t => {
                const q = tokens(t.q), k = tokens(t.keywords), a = tokens(stripHtml(t.a));
                let score = 0, matched = 0;
                words.forEach(w => {
                    let hit = 0;
                    if (has(q, w)) hit += 3;
                    if (has(k, w)) hit += 2;
                    if (has(a, w)) hit += 1;
                    if (hit) matched++;
                    score += hit;
                });
                // Premiar los temas que cubren todas las palabras buscadas
                if (matched === words.length) score += 2;
                return { t, score };
            })
                // Mínimo: alguna palabra en la pregunta o en las palabras clave (no basta con aparecer en la respuesta)
                .filter(r => r.score >= 2)
                .sort((x, y) => y.score - x.score).slice(0, 8);

            if (results.length === 0) {
                help.logMissed(query);
                help.setBody(`
                    <div class="help-empty">
                        <p>No hemos encontrado nada sobre <strong>"${query.replace(/</g, '&lt;')}"</strong>.</p>
                        <p>Prueba con otras palabras o escríbenos y te respondemos.</p>
                        <button class="help-action" onclick="helpAssistant.go('support')">Escribir a soporte →</button>
                    </div>
                    <div class="help-label">Preguntas frecuentes</div>
                    ${window.HELP_TOPICS.filter(t => t.popular).slice(0, 5).map(help.topicButton).join('')}
                `);
                return;
            }
            help.setBody(`
                <div class="help-label">Resultados</div>
                ${results.map(r => help.topicButton(r.t)).join('')}
            `);
        },

        // Apunta en el servidor las búsquedas sin respuesta (para saber qué falta en la guía)
        logMissed(query) {
            if (query === lastMissed) return;
            lastMissed = query;
            if (window.api) api.post('/api/help/missed', { query }).catch(() => {});
        },

        // go: 'seccion' | 'settings:pestaña' | 'clients:pestaña'
        async go(target) {
            const [section, tab] = target.split(':');
            if (window.innerWidth < 768) help.toggle(false);
            await app.navigateTo(section);
            if (tab && section === 'settings' && window.settings) settings.switchTab(tab);
            if (tab && section === 'clients' && window.clients) clients.switchTab(tab);
        }
    };

    window.helpAssistant = help;

    const style = document.createElement('style');
    style.textContent = `
        .help-fab {
            position: fixed; right: 20px; bottom: 20px; z-index: 9000;
            width: 52px; height: 52px; border-radius: 50%; border: none; cursor: pointer;
            background: var(--primary-color); color: #fff; font-size: 1.5rem; font-weight: 700;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); transition: transform 0.2s ease;
        }
        .help-fab:hover { transform: scale(1.06); }
        .help-fab.active { font-size: 1.2rem; }
        .help-panel {
            position: fixed; right: 20px; bottom: 84px; z-index: 9001;
            width: 380px; max-width: calc(100vw - 32px); height: 560px; max-height: calc(100vh - 110px);
            display: none; flex-direction: column; overflow: hidden;
            background: var(--bg-secondary); color: var(--text-primary);
            border: 1px solid var(--border-color); border-radius: 16px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }
        .help-panel.open { display: flex; }
        .help-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 1rem 1rem 0.5rem; }
        .help-head strong { display: block; font-size: 1.05rem; }
        .help-head span { color: var(--text-secondary); font-size: 0.85rem; }
        .help-close { background: none; border: none; color: var(--text-secondary); font-size: 1.1rem; cursor: pointer; }
        .help-search { padding: 0.5rem 1rem; }
        .help-search input {
            width: 100%; box-sizing: border-box; padding: 0.65rem 0.8rem; border-radius: 10px;
            border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); font-size: 0.95rem;
        }
        .help-body { flex: 1; overflow-y: auto; padding: 0.25rem 1rem 1rem; }
        .help-label { margin: 0.9rem 0 0.4rem; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-secondary); }
        .help-item {
            display: block; width: 100%; text-align: left; padding: 0.6rem 0.75rem; margin-bottom: 0.35rem;
            background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color);
            border-radius: 10px; cursor: pointer; font-size: 0.9rem; line-height: 1.35;
        }
        .help-item:hover, .help-cat:hover { border-color: var(--primary-color); }
        .help-cats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
        .help-cat {
            display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem; text-align: left;
            background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color);
            border-radius: 10px; cursor: pointer; font-size: 0.85rem; line-height: 1.25;
        }
        .help-back { background: none; border: none; color: var(--primary-color); cursor: pointer; padding: 0.5rem 0; font-size: 0.9rem; }
        .help-q { margin: 0.25rem 0 0.5rem; font-size: 1rem; }
        .help-a { font-size: 0.9rem; line-height: 1.55; color: var(--text-primary); }
        .help-a p { margin: 0 0 0.6rem; }
        .help-a ul, .help-a ol { margin: 0 0 0.6rem; padding-left: 1.2rem; }
        .help-a li { margin-bottom: 0.3rem; }
        .help-a code { background: var(--bg-primary); padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.85em; overflow-wrap: anywhere; }
        .help-actions { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.75rem 0; }
        .help-action {
            background: var(--primary-color); color: #fff; border: none; border-radius: 8px;
            padding: 0.5rem 0.85rem; font-weight: 600; cursor: pointer; font-size: 0.85rem;
        }
        .help-notfound { font-size: 0.85rem; color: var(--text-secondary); margin: 0.5rem 0; }
        .help-notfound a, .help-foot a { color: var(--primary-color); font-weight: 600; }
        .help-empty { font-size: 0.9rem; line-height: 1.5; margin-top: 0.5rem; }
        .help-foot { padding: 0.7rem 1rem; border-top: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-secondary); }
        @media (max-width: 480px) {
            .help-panel { right: 16px; left: 16px; width: auto; max-width: none; bottom: 80px; height: calc(100vh - 100px); }
            .help-fab { right: 16px; bottom: 16px; }
        }
    `;
    document.head.appendChild(style);
})();
