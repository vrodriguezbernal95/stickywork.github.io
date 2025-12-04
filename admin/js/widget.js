// Widget Management Module

const widget = {
    selectedType: 'embedded',

    // Load widget section
    async load() {
        const contentArea = document.getElementById('contentArea');
        document.getElementById('pageTitle').textContent = 'Widget de Reservas';

        this.render();
    },

    // Render the widget interface
    render() {
        const contentArea = document.getElementById('contentArea');
        const businessId = auth.getBusinessId();
        const apiUrl = window.API_URL || api.baseURL;

        contentArea.innerHTML = `
            <div class="widget-section">
                <!-- Header -->
                <div style="margin-bottom: 2rem;">
                    <h2 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">Integra tu sistema de reservas</h2>
                    <p style="color: var(--text-secondary); margin: 0;">Elige el tipo de widget que mejor se adapte a tu página web y copia el código</p>
                </div>

                <!-- Widget Type Selector -->
                <div class="widget-type-selector" style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
                    <button class="widget-type-btn active" data-type="embedded" onclick="widget.selectType('embedded')">
                        📋 Formulario Embebido
                    </button>
                    <button class="widget-type-btn" data-type="floating" onclick="widget.selectType('floating')">
                        💬 Botón Flotante
                    </button>
                    <button class="widget-type-btn" data-type="qr" onclick="widget.selectType('qr')">
                        📱 Código QR
                    </button>
                </div>

                <!-- Widget Code Container -->
                <div id="widgetCodeContainer">
                    ${this.renderWidgetCode(businessId, apiUrl)}
                </div>

                <!-- Preview Section -->
                <div class="stat-card" style="margin-top: 2rem;">
                    <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">
                        📖 Guía de Integración
                    </h3>
                    <div id="widgetGuide">
                        ${this.renderGuide()}
                    </div>
                </div>

                <!-- Widget Settings Link -->
                <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(59, 130, 246, 0.1); border-radius: 10px; border: 1px solid rgba(59, 130, 246, 0.3);">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="font-size: 2rem;">⚙️</div>
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">Personaliza tu widget</h4>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                Cambia colores, textos y configuración desde la sección de Configuración
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .widget-type-btn {
                    padding: 0.75rem 1.5rem;
                    border: 2px solid var(--border-color);
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }

                .widget-type-btn:hover {
                    border-color: var(--primary-color);
                    transform: translateY(-2px);
                }

                .widget-type-btn.active {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                    color: white;
                }

                .widget-code-box {
                    background: #1e293b;
                    color: #e0e0e0;
                    padding: 1.5rem;
                    border-radius: 10px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.85rem;
                    overflow-x: auto;
                    position: relative;
                    line-height: 1.6;
                }

                .copy-btn {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                }

                .copy-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .guide-step {
                    padding: 1rem;
                    background: var(--bg-primary);
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    border-left: 4px solid var(--primary-color);
                }

                .guide-step h4 {
                    margin: 0 0 0.5rem 0;
                    color: var(--text-primary);
                    font-size: 1rem;
                }

                .guide-step p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
            </style>
        `;
    },

    // Render widget code based on type
    renderWidgetCode(businessId, apiUrl) {
        let code = '';
        let title = '';
        let description = '';

        switch(this.selectedType) {
            case 'embedded':
                title = '📋 Código del Formulario Embebido';
                description = 'Copia y pega este código en tu página HTML donde quieras que aparezca el formulario';
                code = `<!-- StickyWork Widget Embebido -->
<div id="stickywork-widget"></div>
<script src="${apiUrl}/widget/stickywork-widget.js"></script>
<script>
  StickyWork.init({
    businessId: ${businessId},
    mode: 'embedded',
    apiUrl: '${apiUrl}'
  });
</script>`;
                break;

            case 'floating':
                title = '💬 Código del Botón Flotante';
                description = 'Copia y pega este código antes del cierre del &lt;/body&gt; en tu página web';
                code = `<!-- StickyWork Widget Flotante -->
<script src="${apiUrl}/widget/stickywork-widget.js"></script>
<script>
  StickyWork.init({
    businessId: ${businessId},
    mode: 'floating',
    apiUrl: '${apiUrl}',
    position: 'bottom-right',
    buttonText: 'Reservar',
    buttonColor: '#3b82f6'
  });
</script>`;
                break;

            case 'qr':
                title = '📱 Código QR para Imprimir o Compartir';
                description = 'Descarga la imagen QR o úsala en tu web para que tus clientes reserven fácilmente';
                code = `<!-- Imagen QR de StickyWork -->
<img src="${apiUrl}/api/qr/${businessId}"
     alt="Reserva con nosotros"
     style="max-width: 300px;" />

<!-- O descarga directamente -->
<a href="${apiUrl}/api/qr/${businessId}?download=true"
   download="reservas-qr.png">
  Descargar QR
</a>`;
                break;
        }

        return `
            <div class="stat-card">
                <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">
                    ${title}
                </h3>
                <p style="margin: 0 0 1rem 0; color: var(--text-secondary); font-size: 0.9rem;">
                    ${description}
                </p>
                <div style="position: relative;">
                    <pre class="widget-code-box">${this.escapeHtml(code)}</pre>
                    <button class="copy-btn" onclick="widget.copyCode()">
                        📋 Copiar código
                    </button>
                </div>
                ${this.selectedType === 'qr' ? `
                    <div style="margin-top: 1.5rem; text-align: center;">
                        <img src="${apiUrl}/api/qr/${businessId}" alt="QR Code" style="max-width: 300px; border-radius: 10px; border: 2px solid var(--border-color);" />
                        <p style="margin-top: 1rem; color: var(--text-secondary);">
                            <a href="${apiUrl}/api/qr/${businessId}?download=true" download="reservas-qr.png" style="color: var(--primary-color); text-decoration: none; font-weight: 500;">
                                ⬇️ Descargar imagen QR
                            </a>
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    },

    // Render integration guide
    renderGuide() {
        let steps = [];

        switch(this.selectedType) {
            case 'embedded':
                steps = [
                    { title: '1. Copia el código', text: 'Haz clic en el botón "Copiar código" de arriba' },
                    { title: '2. Abre tu página web', text: 'Edita el archivo HTML de tu sitio web' },
                    { title: '3. Pega el código', text: 'Pégalo donde quieras que aparezca el formulario de reservas' },
                    { title: '4. Guarda y publica', text: '¡Listo! Tus clientes ya pueden hacer reservas online' }
                ];
                break;

            case 'floating':
                steps = [
                    { title: '1. Copia el código', text: 'Haz clic en el botón "Copiar código" de arriba' },
                    { title: '2. Abre tu página web', text: 'Edita el archivo HTML de tu sitio web' },
                    { title: '3. Pega antes del &lt;/body&gt;', text: 'Pégalo justo antes de la etiqueta de cierre &lt;/body&gt;' },
                    { title: '4. Personaliza (opcional)', text: 'Cambia buttonText, buttonColor o position según tus preferencias' }
                ];
                break;

            case 'qr':
                steps = [
                    { title: '1. Descarga la imagen', text: 'Haz clic en "Descargar imagen QR" para obtener el código QR' },
                    { title: '2. Imprímelo', text: 'Ponlo en tu local, folletos, cartas o cualquier material físico' },
                    { title: '3. Compártelo', text: 'También puedes compartirlo en redes sociales o WhatsApp' },
                    { title: '4. Escanear y reservar', text: 'Tus clientes escanean el QR y acceden directamente al formulario' }
                ];
                break;
        }

        return steps.map(step => `
            <div class="guide-step">
                <h4>${step.title}</h4>
                <p>${step.text}</p>
            </div>
        `).join('');
    },

    // Select widget type
    selectType(type) {
        this.selectedType = type;

        // Update active button
        document.querySelectorAll('.widget-type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            }
        });

        // Re-render code container
        const businessId = auth.getBusinessId();
        const apiUrl = api.baseURL;
        document.getElementById('widgetCodeContainer').innerHTML = this.renderWidgetCode(businessId, apiUrl);
        document.getElementById('widgetGuide').innerHTML = this.renderGuide();
    },

    // Copy code to clipboard
    async copyCode() {
        const codeBox = document.querySelector('.widget-code-box');
        const copyBtn = document.querySelector('.copy-btn');
        const originalText = copyBtn.innerHTML;

        try {
            await navigator.clipboard.writeText(codeBox.textContent);
            copyBtn.innerHTML = '✓ ¡Copiado!';
            copyBtn.style.background = '#10b981';

            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = '';
            }, 2000);
        } catch (err) {
            console.error('Error al copiar:', err);
            copyBtn.innerHTML = '❌ Error';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        }
    },

    // Escape HTML for display
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
};

// Export to window
window.widget = widget;
