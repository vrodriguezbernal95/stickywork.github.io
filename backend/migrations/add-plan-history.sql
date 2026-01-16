-- Migración: Histórico de Cambios de Plan
-- Fecha: 2026-01-14
-- Descripción: Tabla para registrar cambios de plan de negocios

CREATE TABLE IF NOT EXISTS plan_changes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,

    -- Plan anterior y nuevo
    old_plan VARCHAR(50),
    new_plan VARCHAR(50) NOT NULL,

    -- Límites anteriores y nuevos (JSON)
    old_limits JSON,
    new_limits JSON NOT NULL,

    -- Quién hizo el cambio
    changed_by VARCHAR(100) COMMENT 'Email del super-admin o "system"',
    change_reason TEXT COMMENT 'Razón del cambio (opcional)',

    -- Metadata
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Índices y constraints
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    INDEX idx_business_date (business_id, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Histórico de cambios de plan de suscripción';
