-- Migración: Sistema de Talleres/Eventos Grupales
-- Fecha: 2026-01-26
-- Descripción: Tabla para gestionar talleres, clases grupales y eventos con capacidad limitada

-- Tabla principal de talleres
CREATE TABLE IF NOT EXISTS workshops (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    workshop_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL DEFAULT 10,
    price DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    INDEX idx_workshop_business (business_id),
    INDEX idx_workshop_date (workshop_date),
    INDEX idx_workshop_active (is_active)
);

-- Tabla de reservas de talleres (separada de bookings normales)
CREATE TABLE IF NOT EXISTS workshop_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workshop_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    num_people INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('pending', 'confirmed', 'cancelled', 'attended', 'no_show') DEFAULT 'confirmed',
    notes TEXT,
    whatsapp_consent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE,
    INDEX idx_wb_workshop (workshop_id),
    INDEX idx_wb_email (customer_email),
    INDEX idx_wb_status (status)
);

-- Vista para obtener talleres con plazas disponibles
CREATE OR REPLACE VIEW workshops_with_availability AS
SELECT
    w.*,
    COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS booked_spots,
    w.capacity - COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS available_spots
FROM workshops w
LEFT JOIN workshop_bookings wb ON w.id = wb.workshop_id
GROUP BY w.id;
