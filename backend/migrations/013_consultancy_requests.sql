-- Migration: Sistema de consultorías para clientes Premium
-- Fecha: 2026-01-22

-- Tabla de solicitudes de consultoría
CREATE TABLE IF NOT EXISTS consultancy_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    user_id INT NOT NULL,

    -- Información de la solicitud
    topic VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    preferred_date_1 DATE NOT NULL,
    preferred_date_2 DATE NULL,
    preferred_date_3 DATE NULL,
    preferred_time_slot ENUM('morning', 'afternoon', 'evening') DEFAULT 'morning',

    -- Estado y gestión
    status ENUM('pending', 'scheduled', 'completed', 'canceled') DEFAULT 'pending',
    scheduled_date DATE NULL,
    scheduled_time TIME NULL,
    meeting_link VARCHAR(500) NULL,
    admin_notes TEXT NULL,

    -- Control de límite mensual (mes/año de la solicitud)
    request_month INT NOT NULL,
    request_year INT NOT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,

    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE,

    -- Índices
    INDEX idx_business_requests (business_id, status),
    INDEX idx_status (status),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_monthly_limit (business_id, request_month, request_year)
);

-- Índice único para garantizar máximo 1 solicitud por negocio por mes
-- (Solo para solicitudes no canceladas)
-- Nota: MySQL no soporta índices parciales, así que el control se hará en el código
