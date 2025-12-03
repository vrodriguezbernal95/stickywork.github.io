/**
 * Stat Card Component
 * Componente reutilizable para tarjetas de estadísticas
 */

function createStatCard(options) {
    const {
        icon,
        value,
        label,
        sublabel = '',
        iconBg = 'rgba(59, 130, 246, 0.1)',
        gradient = null
    } = options;

    // Determinar estilo del icono
    const iconStyle = gradient
        ? `background: ${gradient};`
        : `background: ${iconBg};`;

    return `
        <div class="stat-card">
            <div class="stat-icon" style="${iconStyle}">
                ${icon}
            </div>
            <div class="stat-content">
                <div class="stat-value">${value}</div>
                <div class="stat-label">${label}</div>
                ${sublabel ? `<div class="stat-sublabel">${sublabel}</div>` : ''}
            </div>
        </div>
    `;
}

// Exportar función
window.createStatCard = createStatCard;
