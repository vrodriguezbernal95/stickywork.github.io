// Super Admin - Seguridad: verificación en dos pasos (app de autenticación + códigos de respaldo)
const superSeguridad = {
    async load() {
        document.getElementById('pageTitle').textContent = 'Seguridad';
        superUI.injectStyles();
        const area = document.getElementById('contentArea');
        area.innerHTML = '<div class="loading">Cargando...</div>';
        try {
            const st = (await superApi.get('/api/super-admin/2fa/status')).data;
            area.innerHTML = `
                <div class="sa-card" style="max-width: 720px;">
                    <h3>🔐 Verificación en dos pasos</h3>
                    ${st.enabled ? `
                        <p><span class="sa-pill ok">✓ Activada</span></p>
                        <p class="sa-note">Para entrar en el super admin hace falta tu contraseña y un código de tu app de autenticación. Te quedan <strong>${st.backupLeft}</strong> códigos de respaldo${st.backupLeft <= 3 ? ' — conviene generar otros nuevos' : ''}.</p>
                        <div class="sa-section">
                            <h4>Generar códigos de respaldo nuevos o desactivar</h4>
                            <p class="sa-note">Por seguridad, pide tu contraseña y un código de la app.</p>
                            <div class="sa-form">
                                <input type="password" id="segPass" placeholder="Tu contraseña" autocomplete="current-password">
                                <input type="text" id="segCode" placeholder="Código de la app" inputmode="numeric" maxlength="8" autocomplete="one-time-code">
                            </div>
                            <div class="sa-actions" style="margin-top:0.6rem;">
                                <button class="sa-btn" onclick="superSeguridad.newCodes()">🔄 Generar códigos de respaldo nuevos</button>
                                <button class="sa-btn danger" onclick="superSeguridad.disable()">Desactivar la verificación</button>
                            </div>
                        </div>
                        <div id="segOut"></div>`
                    : `
                        <p><span class="sa-pill warn">Desactivada</span></p>
                        <p class="sa-note">Ahora mismo basta tu contraseña para entrar en el super admin, y desde aquí se controla toda la plataforma. Actívala: además de la contraseña, te pedirá un código que cambia cada 30 segundos en tu móvil.</p>
                        <ol class="sa-note">
                            <li>Instala en el móvil <strong>Google Authenticator</strong> o <strong>Authy</strong> (gratis).</li>
                            <li>Pulsa «Activar» y escanea el código QR con la app.</li>
                            <li>Escribe el código de 6 dígitos que te muestra para confirmar.</li>
                            <li>Guarda los códigos de respaldo en un sitio seguro (por si pierdes el móvil).</li>
                        </ol>
                        <button class="sa-btn primary" onclick="superSeguridad.start()">Activar</button>
                        <div id="segOut"></div>`}
                </div>`;
        } catch (e) {
            area.innerHTML = `<div class="sa-empty">Error: ${superUI.esc(e.message)}</div>`;
        }
    },

    async start() {
        const out = document.getElementById('segOut');
        try {
            const d = (await superApi.post('/api/super-admin/2fa/setup', {})).data;
            out.innerHTML = `
                <div class="sa-section">
                    <h4>1. Escanea este código con la app</h4>
                    <img src="${superUI.esc(d.qrCode)}" alt="Código QR" style="width:200px;height:200px;background:#fff;padding:8px;border-radius:12px;">
                    <p class="sa-note">¿No puedes escanear? Escribe esta clave en la app: <code style="user-select:all;">${superUI.esc(d.manualEntry)}</code></p>
                    <h4>2. Escribe el código de 6 dígitos que aparece</h4>
                    <div class="sa-form">
                        <input type="text" id="segConfirm" inputmode="numeric" maxlength="6" placeholder="123456" autocomplete="one-time-code">
                        <input type="password" id="segConfirmPass" placeholder="Tu contraseña" autocomplete="current-password">
                        <button class="sa-btn primary" onclick="superSeguridad.confirm()">Confirmar y activar</button>
                    </div>
                    <p class="sa-note">Por seguridad te pedimos también tu contraseña.</p>
                </div>`;
            document.getElementById('segConfirm').focus();
        } catch (e) { alert(e.message); }
    },

    async confirm() {
        const code = document.getElementById('segConfirm').value.trim();
        const password = document.getElementById('segConfirmPass').value;
        try {
            const d = (await superApi.post('/api/super-admin/2fa/confirm', { code, password })).data;
            this.showCodes(d.backupCodes, '✅ Verificación activada');
        } catch (e) { alert(e.message); }
    },

    showCodes(codes, title) {
        const area = document.getElementById('contentArea');
        area.innerHTML = `
            <div class="sa-card" style="max-width: 720px;">
                <h3>${title}</h3>
                <p class="sa-note"><strong>Guarda estos códigos de respaldo ahora</strong> (en tu gestor de contraseñas o en papel). Cada uno sirve una sola vez para entrar si no tienes el móvil. No se volverán a mostrar.</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:0.5rem;font-family:monospace;font-size:1.05rem;margin:1rem 0;">
                    ${codes.map(c => `<div class="sa-pill" style="text-align:center;padding:0.5rem;">${superUI.esc(c)}</div>`).join('')}
                </div>
                <div class="sa-actions">
                    <button class="sa-btn" onclick="navigator.clipboard.writeText(${superUI.esc(JSON.stringify(codes.join('\n')))}).then(()=>alert('Copiados'))">📋 Copiar códigos</button>
                    <button class="sa-btn primary" onclick="superSeguridad.load()">Ya los he guardado</button>
                </div>
            </div>`;
    },

    creds() {
        return { password: document.getElementById('segPass').value, code: document.getElementById('segCode').value.trim() };
    },

    async newCodes() {
        try {
            const d = (await superApi.post('/api/super-admin/2fa/backup-codes', this.creds())).data;
            this.showCodes(d.backupCodes, '🔄 Códigos de respaldo nuevos');
        } catch (e) { alert(e.message); }
    },

    async disable() {
        if (!confirm('¿Desactivar la verificación en dos pasos? Volverá a bastar la contraseña para entrar.')) return;
        try {
            await superApi.post('/api/super-admin/2fa/disable', this.creds());
            this.load();
        } catch (e) { alert(e.message); }
    }
};
window.superSeguridad = superSeguridad;
