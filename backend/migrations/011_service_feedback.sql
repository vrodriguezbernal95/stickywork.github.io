-- Migración 011: Sistema de Feedback Post-Servicio
-- Crear tabla service_feedback para almacenar opiniones de clientes

CREATE TABLE IF NOT EXISTS service_feedback (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  business_id INT NOT NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  rating INT NOT NULL COMMENT 'Calificación de 1-5 estrellas',
  comment TEXT,
  questions JSON COMMENT 'Respuestas a preguntas específicas (limpieza, puntualidad, etc.)',
  feedback_token VARCHAR(255) UNIQUE COMMENT 'Token único para validar acceso',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,

  INDEX idx_business_rating (business_id, rating),
  INDEX idx_booking (booking_id),
  INDEX idx_created_at (created_at),
  INDEX idx_token (feedback_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
