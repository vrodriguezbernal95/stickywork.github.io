-- ================================================================
-- Migración: Añadir campos para WhatsApp Click-to-Chat
-- Fecha: 2026-01-05
-- Descripción: Añade columnas para configuración de WhatsApp en
--              businesses y consentimiento en bookings
-- ================================================================

-- ====================
-- 1. Actualizar tabla businesses
-- ====================

ALTER TABLE businesses
ADD COLUMN whatsapp_number VARCHAR(20) DEFAULT NULL COMMENT 'Número de WhatsApp del negocio (formato internacional sin +)',
ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT FALSE COMMENT 'Indica si las notificaciones por WhatsApp están activadas',
ADD COLUMN whatsapp_template TEXT DEFAULT NULL COMMENT 'Plantilla personalizada del mensaje de WhatsApp';

-- Actualizar con plantilla por defecto para todos los negocios
UPDATE businesses
SET whatsapp_template = 'Hola {nombre}!

Tu reserva en {negocio} ha sido confirmada:

Fecha: {fecha}
Hora: {hora}
Servicio: {servicio}

Te esperamos!

{nombre_negocio}'
WHERE whatsapp_template IS NULL;

-- ====================
-- 2. Actualizar tabla bookings
-- ====================

ALTER TABLE bookings
ADD COLUMN whatsapp_consent BOOLEAN DEFAULT FALSE COMMENT 'Indica si el cliente dio consentimiento para recibir notificaciones por WhatsApp';

-- ====================
-- 3. Verificación
-- ====================

-- Para verificar que las columnas se crearon correctamente:
-- SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'businesses' AND COLUMN_NAME LIKE 'whatsapp%';

-- SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'bookings' AND COLUMN_NAME = 'whatsapp_consent';
