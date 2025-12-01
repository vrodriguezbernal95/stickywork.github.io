-- Migración 010: Two-Factor Authentication (2FA)
-- Fecha: 2025-12-01

-- Agregar columnas de 2FA a admin_users
ALTER TABLE admin_users
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE COMMENT 'Indica si el usuario tiene 2FA activado',
ADD COLUMN two_factor_secret VARCHAR(255) NULL COMMENT 'Secret TOTP para generar códigos',
ADD COLUMN two_factor_backup_codes JSON NULL COMMENT 'Códigos de backup de emergencia',
ADD COLUMN two_factor_enabled_at TIMESTAMP NULL COMMENT 'Fecha de activación de 2FA';
