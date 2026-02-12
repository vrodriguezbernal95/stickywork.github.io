/**
 * Status Badge Component
 * Componente reutilizable para badges de estado
 */

function createStatusBadge(status, type = 'message') {
    // Configuración de estilos para cada tipo y estado
    const config = {
        message: {
            unread: {
                bg: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                label: 'No leído',
                icon: '📬'
            },
            read: {
                bg: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                label: 'Leído',
                icon: '📭'
            },
            replied: {
                bg: 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                label: 'Respondido',
                icon: '✅'
            }
        },
        booking: {
            pending: {
                bg: 'rgba(234, 179, 8, 0.1)',
                color: '#eab308',
                label: 'Pendiente',
                icon: '⏳'
            },
            confirmed: {
                bg: 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                label: 'Confirmada',
                icon: '✅'
            },
            cancelled: {
                bg: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                label: 'Cancelada',
                icon: '❌'
            },
            completed: {
                bg: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                label: 'Completada',
                icon: '✓'
            },
            no_show: {
                bg: 'rgba(139, 92, 246, 0.1)',
                color: '#8b5cf6',
                label: 'No se presentó',
                icon: '🚫'
            }
        },
        support: {
            pending: {
                bg: 'rgba(234, 179, 8, 0.1)',
                color: '#eab308',
                label: 'Pendiente',
                icon: '⏳'
            },
            answered: {
                bg: 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                label: 'Respondido',
                icon: '✅'
            },
            closed: {
                bg: 'rgba(139, 92, 246, 0.1)',
                color: '#8b5cf6',
                label: 'Cerrado',
                icon: '🔒'
            }
        },
        business: {
            active: {
                bg: 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                label: 'Activo',
                icon: '✓'
            },
            inactive: {
                bg: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                label: 'Inactivo',
                icon: '○'
            },
            suspended: {
                bg: 'rgba(234, 179, 8, 0.1)',
                color: '#eab308',
                label: 'Suspendido',
                icon: '⏸'
            }
        }
    };

    // Obtener configuración para el tipo y estado
    const typeConfig = config[type];
    if (!typeConfig) {
        console.warn(`Status badge type "${type}" not found`);
        return '';
    }

    const statusConfig = typeConfig[status];
    if (!statusConfig) {
        console.warn(`Status "${status}" not found for type "${type}"`);
        return '';
    }

    return `
        <span class="status-badge status-${status}" style="
            background: ${statusConfig.bg};
            color: ${statusConfig.color};
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        ">
            <span>${statusConfig.icon}</span>
            ${statusConfig.label}
        </span>
    `;
}

/**
 * Obtiene el color de borde para un estado
 * Útil para cards con bordes de colores según estado
 */
function getStatusColor(status, type = 'message') {
    const colors = {
        message: {
            unread: '#ef4444',
            read: '#3b82f6',
            replied: '#22c55e'
        },
        booking: {
            pending: '#eab308',
            confirmed: '#22c55e',
            cancelled: '#ef4444',
            completed: '#3b82f6',
            no_show: '#8b5cf6'
        },
        support: {
            pending: '#eab308',
            answered: '#22c55e',
            closed: '#8b5cf6'
        },
        business: {
            active: '#22c55e',
            inactive: '#ef4444',
            suspended: '#eab308'
        }
    };

    return colors[type]?.[status] || '#9ca3af';
}

/**
 * Obtiene el label en español para un estado
 */
function getStatusLabel(status, type = 'message') {
    const labels = {
        message: {
            unread: 'No leído',
            read: 'Leído',
            replied: 'Respondido'
        },
        booking: {
            pending: 'Pendiente',
            confirmed: 'Confirmada',
            cancelled: 'Cancelada',
            completed: 'Completada',
            no_show: 'No se presentó'
        },
        support: {
            pending: 'Pendiente',
            answered: 'Respondido',
            closed: 'Cerrado'
        },
        business: {
            active: 'Activo',
            inactive: 'Inactivo',
            suspended: 'Suspendido'
        }
    };

    return labels[type]?.[status] || status;
}

// Exportar funciones
window.createStatusBadge = createStatusBadge;
window.getStatusColor = getStatusColor;
window.getStatusLabel = getStatusLabel;
