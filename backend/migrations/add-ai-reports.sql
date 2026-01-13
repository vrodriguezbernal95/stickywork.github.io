-- Migración: Sistema de Reportes IA
-- Fecha: 2026-01-12
-- Descripción: Añade soporte para reportes mensuales generados por IA

-- 1. Agregar columna para habilitar/deshabilitar reportes IA por negocio
ALTER TABLE businesses
ADD COLUMN ai_reports_enabled BOOLEAN DEFAULT FALSE
COMMENT 'Habilitar reportes mensuales con IA (plan Premium)';

-- 2. Crear tabla para almacenar reportes generados
CREATE TABLE IF NOT EXISTS ai_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,

    -- Período del reporte
    month INT NOT NULL COMMENT 'Mes (1-12)',
    year INT NOT NULL COMMENT 'Año (ej: 2026)',

    -- Datos estadísticos (JSON)
    stats JSON NOT NULL COMMENT 'Estadísticas calculadas del mes',

    -- Análisis de IA
    ai_executive_summary TEXT COMMENT 'Resumen ejecutivo generado por IA',
    ai_insights JSON COMMENT 'Array de insights clave detectados por IA',
    ai_strengths JSON COMMENT 'Fortalezas detectadas',
    ai_weaknesses JSON COMMENT 'Áreas de mejora detectadas',
    ai_feedback_analysis TEXT COMMENT 'Análisis de encuestas/feedback',
    ai_recommendations JSON COMMENT 'Recomendaciones priorizadas',
    ai_economic_impact TEXT COMMENT 'Estimación de impacto económico',
    ai_action_plan JSON COMMENT 'Plan de acción con prioridades',

    -- Metadata
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(50) DEFAULT 'claude-sonnet-4' COMMENT 'Modelo de IA usado',
    tokens_used INT COMMENT 'Tokens consumidos en generación',
    generation_time_ms INT COMMENT 'Tiempo de generación en milisegundos',

    -- PDF
    pdf_generated BOOLEAN DEFAULT FALSE,
    pdf_path VARCHAR(255) COMMENT 'Ruta al PDF generado',

    -- Índices y constraints
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_report (business_id, month, year),
    INDEX idx_business_date (business_id, year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Reportes mensuales generados por IA';

-- 3. Insertar datos de ejemplo (opcional, para testing)
-- Habilitar reportes IA para La Famiglia (business_id = 9)
UPDATE businesses SET ai_reports_enabled = TRUE WHERE id = 9;

-- Habilitar reportes IA para Buen Sabor (business_id = 2)
UPDATE businesses SET ai_reports_enabled = TRUE WHERE id = 2;
