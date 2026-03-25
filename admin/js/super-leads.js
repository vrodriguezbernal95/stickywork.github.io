// Super Admin - Leads (Nuevos Clientes Potenciales)
const superLeads = {
    leads: [],

    DEFAULT_WA_TEMPLATE: `Hola! 👋 Me llamo Víctor, de StickyWork.

He visto que {{nombre}} no tiene sistema de reservas online y me gustaría contarte cómo podemos ayudarte a gestionar tus reservas de forma sencilla y sin coste inicial.

¿Tienes 5 minutos esta semana para que te lo cuente? 🙏`,

    getTemplate() {
        return localStorage.getItem('sw_leads_wa_template') || this.DEFAULT_WA_TEMPLATE;
    },

    buildWaMessage(businessName) {
        return this.getTemplate().replace(/\{\{nombre\}\}/g, businessName);
    },

    async load() {
        document.getElementById('pageTitle').textContent = 'Nuevos Clientes';
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="leads-page">
                <div class="leads-header">
                    <div>
                        <h2 style="margin:0;font-size:1.3rem;">Clientes Potenciales</h2>
                        <p style="margin:0.25rem 0 0;color:var(--text-secondary);font-size:0.85rem;">
                            Negocios sin sistema de reservas que podrías convertir en clientes
                        </p>
                    </div>
                    <div style="display:flex;gap:0.5rem;">
                        <button class="btn-secondary" onclick="superLeads.openTemplateModal()" title="Editar mensaje predefinido de WhatsApp">💬 Plantilla WA</button>
                        <button class="btn-primary" onclick="superLeads.openAddModal()">+ Añadir lead</button>
                    </div>
                </div>

                <div class="leads-stats" id="leadsStats"></div>

                <div class="card" style="padding:0;overflow:hidden;">
                    <div id="leadsTableContainer"><div class="loading" style="padding:2rem;">Cargando...</div></div>
                </div>
            </div>

            <!-- Modal plantilla WA -->
            <div id="leadTemplateModal" class="modal" style="display:none;">
                <div class="modal-content" style="max-width:520px;">
                    <div class="modal-header">
                        <h3>💬 Plantilla de mensaje WhatsApp</h3>
                        <button class="modal-close" onclick="superLeads.closeTemplateModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin:0 0 0.75rem;font-size:0.85rem;color:var(--text-secondary);">
                            Usa <code style="background:var(--bg-secondary);padding:0.1rem 0.3rem;border-radius:4px;">{{nombre}}</code> para insertar el nombre del negocio automáticamente.
                        </p>
                        <textarea id="waTemplateText" class="form-control" rows="8"
                            style="resize:vertical;font-family:inherit;line-height:1.5;"></textarea>
                        <p style="margin:0.6rem 0 0;font-size:0.78rem;color:var(--text-secondary);">
                            La plantilla se guarda en este navegador.
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="superLeads.resetTemplate()">Restaurar por defecto</button>
                        <button class="btn-primary" onclick="superLeads.saveTemplate()">Guardar plantilla</button>
                    </div>
                </div>
            </div>

            <!-- Modal añadir/editar -->
            <div id="leadModal" class="modal" style="display:none;">
                <div class="modal-content" style="max-width:480px;">
                    <div class="modal-header">
                        <h3 id="leadModalTitle">Nuevo Lead</h3>
                        <button class="modal-close" onclick="superLeads.closeModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Nombre del negocio *</label>
                            <input type="text" id="leadName" placeholder="Ej: Peluquería López" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Teléfono de contacto</label>
                            <input type="text" id="leadPhone" placeholder="Ej: 612345678" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Página web</label>
                            <input type="text" id="leadWebsite" placeholder="Ej: www.peluquerialopez.com" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Notas</label>
                            <textarea id="leadNotes" placeholder="Dirección, tipo de negocio, observaciones..." class="form-control" rows="3" style="resize:vertical;"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="superLeads.closeModal()">Cancelar</button>
                        <button class="btn-primary" onclick="superLeads.saveLead()">Guardar</button>
                    </div>
                </div>
            </div>
        `;

        await this.fetchLeads();
    },

    async fetchLeads() {
        try {
            const data = await superApi.get('/api/super-admin/leads');
            this.leads = data.data || [];
            this.renderStats();
            this.renderTable();
        } catch (error) {
            document.getElementById('leadsTableContainer').innerHTML =
                `<p style="padding:2rem;color:#ef4444;">Error al cargar leads: ${error.message}</p>`;
        }
    },

    renderStats() {
        const total   = this.leads.length;
        const valid   = this.leads.filter(l => l.status === 'valid').length;
        const invalid = this.leads.filter(l => l.status === 'invalid').length;
        const pending = this.leads.filter(l => l.status === 'pending').length;

        document.getElementById('leadsStats').innerHTML = `
            <div class="leads-stat-card"><span class="stat-num">${total}</span><span class="stat-label">Total</span></div>
            <div class="leads-stat-card pending"><span class="stat-num">${pending}</span><span class="stat-label">Sin contactar</span></div>
            <div class="leads-stat-card valid"><span class="stat-num">${valid}</span><span class="stat-label">Válidos</span></div>
            <div class="leads-stat-card invalid"><span class="stat-num">${invalid}</span><span class="stat-label">Descartados</span></div>
        `;
    },

    renderTable() {
        const container = document.getElementById('leadsTableContainer');
        if (this.leads.length === 0) {
            container.innerHTML = `
                <div style="padding:3rem;text-align:center;color:var(--text-secondary);">
                    <div style="font-size:2.5rem;margin-bottom:0.75rem;">🎯</div>
                    <p style="margin:0;font-weight:600;">Aún no hay leads</p>
                    <p style="margin:0.25rem 0 0;font-size:0.85rem;">Añade negocios potenciales para hacer seguimiento</p>
                </div>`;
            return;
        }

        container.innerHTML = `
            <table class="leads-table">
                <thead>
                    <tr>
                        <th>Negocio</th>
                        <th>Contacto</th>
                        <th>Web</th>
                        <th style="text-align:center;">Estado</th>
                        <th style="text-align:center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.leads.map(lead => this.renderRow(lead)).join('')}
                </tbody>
            </table>
        `;
    },

    renderRow(lead) {
        const phone = lead.contact_phone || '';
        let waPhone = phone.replace(/\D/g, '');
        if (waPhone.length === 9 && /^[6789]/.test(waPhone)) waPhone = '34' + waPhone;

        const waMsg = encodeURIComponent(this.buildWaMessage(lead.business_name));
        const waBtn = phone
            ? `<a href="https://wa.me/${waPhone}?text=${waMsg}" target="_blank" class="lead-wa-btn" title="Abrir WhatsApp con mensaje predefinido">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                   ${phone}
               </a>`
            : '<span style="color:var(--text-secondary);font-size:0.8rem;">—</span>';

        const website = lead.website || '';
        const webBtn = website
            ? `<a href="${website.startsWith('http') ? website : 'https://' + website}" target="_blank" class="lead-web-link">${website.replace(/^https?:\/\//, '')}</a>`
            : '<span style="color:var(--text-secondary);font-size:0.8rem;">—</span>';

        return `
            <tr id="lead-row-${lead.id}">
                <td>
                    <div class="lead-name">${this._esc(lead.business_name)}</div>
                    ${lead.notes ? `<div class="lead-notes">${this._esc(lead.notes)}</div>` : ''}
                </td>
                <td>${waBtn}</td>
                <td>${webBtn}</td>
                <td style="text-align:center;">
                    <button class="triple-switch status-${lead.status}"
                            onclick="superLeads.cycleStatus(${lead.id}, '${lead.status}')"
                            title="Click para cambiar estado">
                        ${this._statusIcon(lead.status)}
                    </button>
                </td>
                <td style="text-align:center;">
                    <div style="display:flex;gap:0.4rem;justify-content:center;">
                        <button class="btn-icon" onclick="superLeads.openEditModal(${lead.id})" title="Editar">✏️</button>
                        <button class="btn-icon btn-icon-danger" onclick="superLeads.deleteLead(${lead.id})" title="Borrar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    },

    _statusIcon(status) {
        if (status === 'valid')   return '<span class="status-icon valid">✓</span>';
        if (status === 'invalid') return '<span class="status-icon invalid">✗</span>';
        return '<span class="status-icon pending">—</span>';
    },

    _statusOrder: { pending: 'valid', valid: 'invalid', invalid: 'pending' },

    async cycleStatus(id, currentStatus) {
        const nextStatus = this._statusOrder[currentStatus] || 'pending';
        try {
            await superApi.patch(`/api/super-admin/leads/${id}`, { status: nextStatus });
            const lead = this.leads.find(l => l.id === id);
            if (lead) lead.status = nextStatus;
            // Actualizar solo la fila para no hacer refetch
            const row = document.getElementById(`lead-row-${id}`);
            if (row) row.outerHTML = this.renderRow({ ...lead, status: nextStatus });
            this.renderStats();
        } catch (e) {
            alert('Error al cambiar estado: ' + e.message);
        }
    },

    _editingId: null,

    openAddModal() {
        this._editingId = null;
        document.getElementById('leadModalTitle').textContent = 'Nuevo Lead';
        document.getElementById('leadName').value = '';
        document.getElementById('leadPhone').value = '';
        document.getElementById('leadWebsite').value = '';
        document.getElementById('leadNotes').value = '';
        document.getElementById('leadModal').style.display = 'flex';
    },

    openEditModal(id) {
        const lead = this.leads.find(l => l.id === id);
        if (!lead) return;
        this._editingId = id;
        document.getElementById('leadModalTitle').textContent = 'Editar Lead';
        document.getElementById('leadName').value    = lead.business_name || '';
        document.getElementById('leadPhone').value   = lead.contact_phone || '';
        document.getElementById('leadWebsite').value = lead.website || '';
        document.getElementById('leadNotes').value   = lead.notes || '';
        document.getElementById('leadModal').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('leadModal').style.display = 'none';
    },

    async saveLead() {
        const business_name = document.getElementById('leadName').value.trim();
        if (!business_name) { alert('El nombre del negocio es obligatorio'); return; }

        const payload = {
            business_name,
            contact_phone: document.getElementById('leadPhone').value.trim() || null,
            website:       document.getElementById('leadWebsite').value.trim() || null,
            notes:         document.getElementById('leadNotes').value.trim() || null,
        };

        try {
            if (this._editingId) {
                await superApi.patch(`/api/super-admin/leads/${this._editingId}`, payload);
            } else {
                await superApi.post('/api/super-admin/leads', payload);
            }
            this.closeModal();
            await this.fetchLeads();
        } catch (e) {
            alert('Error al guardar: ' + e.message);
        }
    },

    async deleteLead(id) {
        const lead = this.leads.find(l => l.id === id);
        if (!confirm(`¿Borrar "${lead?.business_name}"?`)) return;
        try {
            await superApi.delete(`/api/super-admin/leads/${id}`);
            await this.fetchLeads();
        } catch (e) {
            alert('Error al borrar: ' + e.message);
        }
    },

    openTemplateModal() {
        document.getElementById('waTemplateText').value = this.getTemplate();
        document.getElementById('leadTemplateModal').style.display = 'flex';
    },

    closeTemplateModal() {
        document.getElementById('leadTemplateModal').style.display = 'none';
    },

    saveTemplate() {
        const text = document.getElementById('waTemplateText').value.trim();
        if (!text) return;
        localStorage.setItem('sw_leads_wa_template', text);
        this.closeTemplateModal();
        // Re-renderizar tabla para actualizar los links de WA
        this.renderTable();
    },

    resetTemplate() {
        document.getElementById('waTemplateText').value = this.DEFAULT_WA_TEMPLATE;
    },

    _esc(str) {
        return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
};

// ── Estilos ──────────────────────────────────────────────────────────────────
(function() {
    const style = document.createElement('style');
    style.textContent = `
        .leads-page { display: flex; flex-direction: column; gap: 1.25rem; }

        .leads-header {
            display: flex; align-items: center; justify-content: space-between;
            gap: 1rem; flex-wrap: wrap;
        }

        .leads-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.75rem;
        }
        @media (max-width: 600px) { .leads-stats { grid-template-columns: repeat(2, 1fr); } }

        .leads-stat-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 0.9rem 1rem;
            display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
        }
        .leads-stat-card .stat-num { font-size: 1.6rem; font-weight: 700; line-height: 1; }
        .leads-stat-card .stat-label { font-size: 0.75rem; color: var(--text-secondary); }
        .leads-stat-card.valid   { border-color: #22c55e33; }
        .leads-stat-card.valid   .stat-num { color: #22c55e; }
        .leads-stat-card.invalid { border-color: #ef444433; }
        .leads-stat-card.invalid .stat-num { color: #ef4444; }
        .leads-stat-card.pending .stat-num { color: var(--text-secondary); }

        .leads-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .leads-table th {
            background: var(--bg-secondary);
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.78rem;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 1px solid var(--border-color);
        }
        .leads-table td {
            padding: 0.85rem 1rem;
            border-bottom: 1px solid var(--border-color);
            vertical-align: middle;
        }
        .leads-table tr:last-child td { border-bottom: none; }
        .leads-table tr:hover td { background: var(--bg-secondary); }

        .lead-name { font-weight: 600; }
        .lead-notes { font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.2rem; white-space: pre-line; }

        .lead-wa-btn {
            display: inline-flex; align-items: center; gap: 0.4rem;
            color: #25d366; font-weight: 500; font-size: 0.85rem;
            text-decoration: none; white-space: nowrap;
        }
        .lead-wa-btn:hover { text-decoration: underline; }

        .lead-web-link {
            color: var(--primary-color); font-size: 0.85rem;
            text-decoration: none; word-break: break-all;
        }
        .lead-web-link:hover { text-decoration: underline; }

        /* Triple switch */
        .triple-switch {
            border: none; background: none; cursor: pointer;
            padding: 0.3rem; border-radius: 50%; width: 36px; height: 36px;
            display: inline-flex; align-items: center; justify-content: center;
            transition: background 0.15s;
        }
        .triple-switch:hover { background: var(--bg-secondary); }

        .status-icon {
            display: inline-flex; align-items: center; justify-content: center;
            width: 26px; height: 26px; border-radius: 50%;
            font-weight: 700; font-size: 0.95rem;
        }
        .status-icon.valid   { background: #22c55e22; color: #22c55e; border: 2px solid #22c55e; }
        .status-icon.invalid { background: #ef444422; color: #ef4444; border: 2px solid #ef4444; }
        .status-icon.pending { background: var(--bg-secondary); color: var(--text-secondary); border: 2px solid var(--border-color); }

        .btn-icon {
            background: none; border: 1px solid var(--border-color);
            border-radius: 6px; padding: 0.3rem 0.5rem;
            cursor: pointer; font-size: 0.85rem; transition: background 0.15s;
        }
        .btn-icon:hover { background: var(--bg-secondary); }
        .btn-icon-danger:hover { background: #ef444422; border-color: #ef4444; }
    `;
    document.head.appendChild(style);
})();
