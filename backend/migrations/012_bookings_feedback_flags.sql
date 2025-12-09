-- Migración 012: Añadir flags de feedback a tabla bookings
-- Permite rastrear si ya se envió solicitud de feedback

ALTER TABLE bookings
ADD COLUMN feedback_sent BOOLEAN DEFAULT FALSE COMMENT 'Si se envió email de feedback',
ADD COLUMN feedback_sent_at TIMESTAMP NULL COMMENT 'Fecha/hora de envío del email',
ADD COLUMN feedback_token VARCHAR(255) UNIQUE COMMENT 'Token único para link de feedback',
ADD INDEX idx_feedback_sent (feedback_sent),
ADD INDEX idx_feedback_token (feedback_token);
