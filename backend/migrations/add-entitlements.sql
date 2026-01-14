-- Migración: Sistema de Entitlements (Planes y Límites)
-- Fecha: 2026-01-14
-- Descripción: Añade sistema de planes de suscripción y validación de límites

-- 1. Agregar columnas para planes y límites a businesses
ALTER TABLE businesses
ADD COLUMN plan VARCHAR(50) DEFAULT 'free'
COMMENT 'Plan de suscripción: free, founders, professional, premium',
ADD COLUMN plan_limits JSON
COMMENT 'Límites y features según el plan de suscripción';

-- 2. Actualizar negocios existentes con configuración por defecto
-- Plan FREE para todos (por ahora)
UPDATE businesses SET
    plan = 'free',
    plan_limits = JSON_OBJECT(
        'maxBookingsPerMonth', NULL,
        'maxServices', NULL,
        'maxUsers', 1,
        'features', JSON_OBJECT(
            'aiReports', FALSE,
            'aiReportsPerMonth', 0,
            'whatsapp', TRUE,
            'feedback', TRUE,
            'zones', TRUE,
            'api', FALSE,
            'whiteLabel', FALSE,
            'landingPage', FALSE
        )
    )
WHERE plan_limits IS NULL;

-- 3. Upgrade La Famiglia a plan FOUNDERS (testing)
UPDATE businesses SET
    plan = 'founders',
    plan_limits = JSON_OBJECT(
        'maxBookingsPerMonth', NULL,
        'maxServices', NULL,
        'maxUsers', 5,
        'features', JSON_OBJECT(
            'aiReports', TRUE,
            'aiReportsPerMonth', 1,
            'whatsapp', TRUE,
            'feedback', TRUE,
            'zones', TRUE,
            'api', FALSE,
            'whiteLabel', FALSE,
            'landingPage', FALSE
        )
    )
WHERE id = 9;

-- 4. Crear tabla para tracking de uso (opcional, para futuro)
CREATE TABLE IF NOT EXISTS usage_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,

    -- Período
    month INT NOT NULL COMMENT 'Mes (1-12)',
    year INT NOT NULL COMMENT 'Año (ej: 2026)',

    -- Contadores de uso
    bookings_count INT DEFAULT 0,
    services_count INT DEFAULT 0,
    users_count INT DEFAULT 0,
    ai_reports_generated INT DEFAULT 0,
    api_calls_count INT DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices y constraints
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usage (business_id, month, year),
    INDEX idx_business_date (business_id, year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracking de uso mensual para validación de límites';
