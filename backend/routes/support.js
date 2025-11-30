const express = require('express');
const router = express.Router();
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { supportLimiter } = require('../middleware/rate-limit');

// Permitir inyección de la base de datos
let db = require('../../config/database');

function setDatabase(database) {
    db = database;
}

router.setDatabase = setDatabase;

/**
 * GET /api/support/can-send-message
 * Verifica si el cliente puede enviar un mensaje
 */
router.get('/can-send-message', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;

        // Buscar mensaje pendiente o respondido recientemente
        const existingMessage = await db.query(`
            SELECT
                id,
                status,
                created_at,
                can_send_again_at,
                TIMESTAMPDIFF(HOUR, created_at, NOW()) as hours_since_created
            FROM support_messages
            WHERE business_id = ?
            AND status IN ('pending', 'answered')
            ORDER BY created_at DESC
            LIMIT 1
        `, [businessId]);

        if (existingMessage && existingMessage.length > 0) {
            const msg = existingMessage[0];

            // Si está pendiente
            if (msg.status === 'pending') {
                const now = new Date();
                const canSendAgainAt = msg.can_send_again_at ? new Date(msg.can_send_again_at) : null;

                // Si han pasado 72h, puede enviar otro
                if (canSendAgainAt && now >= canSendAgainAt) {
                    return res.json({
                        success: true,
                        canSend: true,
                        reason: 'timeout_72h',
                        message: 'Han pasado 72 horas sin respuesta. Puedes enviar otro mensaje.'
                    });
                }

                // Aún está esperando respuesta
                const hoursLeft = Math.ceil((canSendAgainAt - now) / (1000 * 60 * 60));
                return res.json({
                    success: true,
                    canSend: false,
                    reason: 'pending_response',
                    message: `Tienes un mensaje pendiente de respuesta. Podrás enviar otro en ${hoursLeft} horas si no recibes respuesta.`,
                    existingMessage: {
                        id: msg.id,
                        created_at: msg.created_at
                    }
                });
            }

            // Si ya fue respondido, puede enviar otro
            if (msg.status === 'answered') {
                return res.json({
                    success: true,
                    canSend: true,
                    reason: 'previous_answered',
                    message: 'Tu mensaje anterior fue respondido. Puedes enviar otro.'
                });
            }
        }

        // No tiene mensajes previos, puede enviar
        res.json({
            success: true,
            canSend: true,
            reason: 'no_previous_messages',
            message: 'Puedes enviar un mensaje al equipo de StickyWork.'
        });

    } catch (error) {
        console.error('Error checking message status:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar estado de mensajes'
        });
    }
});

/**
 * POST /api/support/messages
 * Crear un nuevo mensaje de soporte (cliente)
 */
router.post('/messages', requireAuth, supportLimiter, async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { category, message } = req.body;

        // Validaciones
        if (!category || !message) {
            return res.status(400).json({
                success: false,
                message: 'Categoría y mensaje son obligatorios'
            });
        }

        const validCategories = ['bug', 'question', 'suggestion', 'call_request', 'email_request'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Categoría inválida'
            });
        }

        // Contar palabras
        const words = message.trim().split(/\s+/);
        const wordCount = words.length;

        if (wordCount > 150) {
            return res.status(400).json({
                success: false,
                message: `El mensaje excede el límite de 150 palabras (${wordCount} palabras). Por favor, resume tu mensaje o solicita una llamada/email para casos más complejos.`
            });
        }

        if (wordCount < 5) {
            return res.status(400).json({
                success: false,
                message: 'El mensaje es demasiado corto. Por favor, proporciona más detalles.'
            });
        }

        // Verificar si puede enviar mensaje
        const canSendCheck = await db.query(`
            SELECT id, status, can_send_again_at
            FROM support_messages
            WHERE business_id = ?
            AND status = 'pending'
            ORDER BY created_at DESC
            LIMIT 1
        `, [businessId]);

        if (canSendCheck && canSendCheck.length > 0) {
            const pendingMsg = canSendCheck[0];
            const now = new Date();
            const canSendAgainAt = pendingMsg.can_send_again_at ? new Date(pendingMsg.can_send_again_at) : null;

            if (!canSendAgainAt || now < canSendAgainAt) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya tienes un mensaje pendiente de respuesta. Por favor, espera a que te respondamos.'
                });
            }
        }

        // Calcular can_send_again_at (72 horas desde ahora)
        const canSendAgainAt = new Date();
        canSendAgainAt.setHours(canSendAgainAt.getHours() + 72);

        // Crear mensaje
        const result = await db.query(`
            INSERT INTO support_messages (
                business_id,
                category,
                message,
                word_count,
                status,
                can_send_again_at
            ) VALUES (?, ?, ?, ?, 'pending', ?)
        `, [businessId, category, message, wordCount, canSendAgainAt]);

        // Obtener el mensaje creado
        const newMessage = await db.query(
            'SELECT * FROM support_messages WHERE id = ?',
            [result.insertId]
        );

        // TODO: Enviar email de notificación al super-admin

        res.json({
            success: true,
            message: 'Mensaje enviado correctamente. Te responderemos lo antes posible.',
            data: newMessage[0]
        });

    } catch (error) {
        console.error('Error creating support message:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar mensaje'
        });
    }
});

/**
 * GET /api/support/messages/my-messages
 * Obtener mensajes del cliente actual
 */
router.get('/messages/my-messages', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;

        const messages = await db.query(`
            SELECT *
            FROM support_messages
            WHERE business_id = ?
            ORDER BY created_at DESC
        `, [businessId]);

        res.json({
            success: true,
            data: messages
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mensajes'
        });
    }
});

// NOTE: Las rutas de respond y close están en super-admin.js
// porque requieren privilegios de super-admin

module.exports = router;
