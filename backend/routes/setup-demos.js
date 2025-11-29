const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

// Permitir inyección de la base de datos
let db = require('../../config/database');

console.log('📦 [SETUP-DEMOS] Module loaded, db config:', { hasQuery: !!db.query });

function setDatabase(database) {
    db = database;
}

router.setDatabase = setDatabase;

/**
 * POST /api/setup/create-demo-businesses
 * Crea los 7 negocios de demo con sus servicios, profesionales y usuarios admin
 * NOTA: Este endpoint debería protegerse o eliminarse después del primer uso
 */
router.post('/api/setup/create-demo-businesses', async (req, res) => {
    try {
        console.log('🎨 Iniciando creación de negocios demo...');

        const results = {
            businesses: [],
            errors: []
        };

        // Password hash común para todos los demos
        const passwordHash = await bcrypt.hash('demo123', 10);

        // Calcular fecha de fin de trial (365 días)
        const trialEnds = new Date();
        trialEnds.setDate(trialEnds.getDate() + 365);

        // Configuración de negocios
        const businesses = [
            {
                name: 'Salón Bella Vista',
                slug: 'salon-bella-vista-demo',
                type_key: 'salon',
                type: 'Peluquería/Salón',
                email: 'contacto@bellavista.demo',
                phone: '+34 912 345 678',
                address: 'Calle Mayor 123, Madrid',
                website: 'https://stickywork.com/demos/peluqueria.html',
                description: 'Salón de belleza profesional especializado en cortes, tintes y tratamientos capilares.',
                primaryColor: '#E91E63',
                secondaryColor: '#9C27B0',
                adminEmail: 'admin@bellavista.demo',
                services: [
                    { name: 'Corte de Cabello', description: 'Corte profesional personalizado', duration: 30, price: 25.00, category: 'Corte', color: '#E91E63' },
                    { name: 'Tinte Completo', description: 'Tinte de raíces y puntas', duration: 120, price: 65.00, category: 'Color', color: '#9C27B0' },
                    { name: 'Mechas', description: 'Mechas californianas o balayage', duration: 150, price: 85.00, category: 'Color', color: '#FF9800' },
                    { name: 'Tratamiento Capilar', description: 'Hidratación profunda', duration: 45, price: 35.00, category: 'Tratamientos', color: '#4CAF50' },
                    { name: 'Peinado para Eventos', description: 'Recogido profesional', duration: 60, price: 45.00, category: 'Peinados', color: '#2196F3' }
                ],
                professionals: [
                    { name: 'Ana García', email: 'ana@bellavista.demo', role: 'Estilista Senior' },
                    { name: 'Carlos Ruiz', email: 'carlos@bellavista.demo', role: 'Colorista Experto' },
                    { name: 'María López', email: 'maria@bellavista.demo', role: 'Especialista en Tratamientos' }
                ]
            },
            {
                name: 'Restaurante El Buen Sabor',
                slug: 'restaurante-buen-sabor-demo',
                type_key: 'restaurant',
                type: 'Restaurante/Bar',
                email: 'reservas@buensabor.demo',
                phone: '+34 915 678 901',
                address: 'Plaza España 45, Madrid',
                website: 'https://stickywork.com/demos/restaurante.html',
                description: 'Restaurante de cocina mediterránea con ambiente acogedor.',
                primaryColor: '#FF5722',
                secondaryColor: '#FFC107',
                adminEmail: 'admin@buensabor.demo',
                services: [
                    { name: 'Almuerzo', description: 'Reserva para almuerzo', duration: 120, price: 0.00, category: 'Comidas', color: '#FF5722' },
                    { name: 'Cena', description: 'Reserva para cena', duration: 120, price: 0.00, category: 'Comidas', color: '#FFC107' }
                ],
                professionals: []
            },
            {
                name: 'Centro de Psicología Mente Clara',
                slug: 'psicologo-mente-clara-demo',
                type_key: 'clinic',
                type: 'Psicólogo/Terapeuta',
                email: 'contacto@menteclara.demo',
                phone: '+34 913 456 789',
                address: 'Calle Serrano 89, Madrid',
                website: 'https://stickywork.com/demos/psicologo.html',
                description: 'Centro de psicología especializado en terapia cognitivo-conductual.',
                primaryColor: '#4A90E2',
                secondaryColor: '#7B68EE',
                adminEmail: 'admin@menteclara.demo',
                services: [
                    { name: 'Primera Consulta', description: 'Evaluación inicial', duration: 60, price: 60.00, category: 'Evaluación', color: '#4A90E2' },
                    { name: 'Terapia Individual', description: 'Sesión de terapia individual', duration: 50, price: 50.00, category: 'Terapia', color: '#7B68EE' },
                    { name: 'Terapia de Pareja', description: 'Sesión para parejas', duration: 60, price: 70.00, category: 'Terapia', color: '#9B59B6' },
                    { name: 'Terapia Infantil', description: 'Sesión para niños', duration: 45, price: 55.00, category: 'Terapia', color: '#3498DB' },
                    { name: 'Terapia Online', description: 'Sesión por videollamada', duration: 50, price: 45.00, category: 'Online', color: '#1ABC9C' }
                ],
                professionals: [
                    { name: 'Dra. Laura Martínez', email: 'laura@menteclara.demo', role: 'Psicóloga General Sanitaria' },
                    { name: 'Dr. Javier Sánchez', email: 'javier@menteclara.demo', role: 'Psicólogo Clínico' }
                ]
            },
            {
                name: 'NutriVida - Centro de Nutrición',
                slug: 'nutrivida-demo',
                type_key: 'nutrition',
                type: 'Centro de Nutrición',
                email: 'info@nutrivida.demo',
                phone: '+34 914 567 890',
                address: 'Avenida América 234, Madrid',
                website: 'https://stickywork.com/demos/nutricion.html',
                description: 'Centro especializado en nutrición deportiva y pérdida de peso.',
                primaryColor: '#4CAF50',
                secondaryColor: '#8BC34A',
                adminEmail: 'admin@nutrivida.demo',
                services: [
                    { name: 'Primera Consulta Nutricional', description: 'Valoración inicial con bioimpedancia', duration: 60, price: 50.00, category: 'Consulta', color: '#4CAF50' },
                    { name: 'Seguimiento Mensual', description: 'Revisión del plan', duration: 30, price: 35.00, category: 'Seguimiento', color: '#8BC34A' },
                    { name: 'Nutrición Deportiva', description: 'Plan para deportistas', duration: 60, price: 60.00, category: 'Especialidad', color: '#2196F3' },
                    { name: 'Plan Pérdida de Peso', description: 'Programa de adelgazamiento', duration: 45, price: 55.00, category: 'Especialidad', color: '#FF9800' },
                    { name: 'Nutrición Infantil', description: 'Consulta para niños', duration: 45, price: 50.00, category: 'Especialidad', color: '#E91E63' }
                ],
                professionals: [
                    { name: 'Dra. Carmen Flores', email: 'carmen@nutrivida.demo', role: 'Nutricionista Clínica' },
                    { name: 'Dr. Roberto Vega', email: 'roberto@nutrivida.demo', role: 'Nutricionista Deportivo' }
                ]
            },
            {
                name: 'PowerFit Gym & Training',
                slug: 'powerfit-gym-demo',
                type_key: 'gym',
                type: 'Gimnasio/Entrenador Personal',
                email: 'reservas@powerfit.demo',
                phone: '+34 915 678 012',
                address: 'Calle Bravo Murillo 456, Madrid',
                website: 'https://stickywork.com/demos/gimnasio.html',
                description: 'Centro de fitness con entrenamiento personalizado.',
                primaryColor: '#FF5722',
                secondaryColor: '#FFC107',
                adminEmail: 'admin@powerfit.demo',
                services: [
                    { name: 'Entrenamiento Personal', description: 'Sesión individual', duration: 60, price: 40.00, category: 'Personal', color: '#FF5722' },
                    { name: 'Yoga Grupal', description: 'Clase de yoga', duration: 60, price: 15.00, category: 'Clases', color: '#9C27B0' },
                    { name: 'Spinning', description: 'Ciclismo indoor', duration: 45, price: 12.00, category: 'Clases', color: '#F44336' },
                    { name: 'CrossFit', description: 'Entrenamiento funcional', duration: 60, price: 18.00, category: 'Clases', color: '#FF9800' },
                    { name: 'Pilates', description: 'Clase de pilates', duration: 50, price: 20.00, category: 'Clases', color: '#4CAF50' }
                ],
                professionals: [
                    { name: 'Marcos Ruiz', email: 'marcos@powerfit.demo', role: 'Entrenador Personal' },
                    { name: 'Elena Torres', email: 'elena@powerfit.demo', role: 'Instructora de Yoga y Pilates' },
                    { name: 'David Moreno', email: 'david@powerfit.demo', role: 'Coach de CrossFit' }
                ]
            },
            {
                name: 'Estética Bella & Bella',
                slug: 'estetica-bella-demo',
                type_key: 'spa',
                type: 'Centro de Estética',
                email: 'citas@bellabella.demo',
                phone: '+34 916 789 123',
                address: 'Calle Goya 178, Madrid',
                website: 'https://stickywork.com/demos/estetica.html',
                description: 'Centro de estética especializado en tratamientos faciales.',
                primaryColor: '#E91E63',
                secondaryColor: '#9C27B0',
                adminEmail: 'admin@bellabella.demo',
                services: [
                    { name: 'Manicura Completa', description: 'Arreglo y esmaltado', duration: 45, price: 25.00, category: 'Manicura', color: '#E91E63' },
                    { name: 'Pedicura Spa', description: 'Tratamiento para pies', duration: 60, price: 35.00, category: 'Pedicura', color: '#9C27B0' },
                    { name: 'Uñas de Gel', description: 'Aplicación de gel', duration: 90, price: 45.00, category: 'Manicura', color: '#FF4081' },
                    { name: 'Tratamiento Facial Hidratante', description: 'Limpieza e hidratación', duration: 60, price: 50.00, category: 'Facial', color: '#AB47BC' },
                    { name: 'Tratamiento Anti-Edad', description: 'Tratamiento rejuvenecedor', duration: 75, price: 70.00, category: 'Facial', color: '#7B1FA2' },
                    { name: 'Depilación Láser Facial', description: 'Depilación definitiva', duration: 30, price: 40.00, category: 'Depilación', color: '#E040FB' }
                ],
                professionals: [
                    { name: 'Patricia Gómez', email: 'patricia@bellabella.demo', role: 'Esteticista Senior' },
                    { name: 'Silvia Ramírez', email: 'silvia@bellabella.demo', role: 'Especialista en Uñas' },
                    { name: 'Cristina Ortiz', email: 'cristina@bellabella.demo', role: 'Especialista Facial' }
                ]
            },
            {
                name: 'Despacho Jurídico Lex & Partners',
                slug: 'despacho-lex-partners-demo',
                type_key: 'lawyer',
                type: 'Despacho de Abogados',
                email: 'consultas@lexpartners.demo',
                phone: '+34 917 890 234',
                address: 'Paseo de la Castellana 95, Madrid',
                website: 'https://stickywork.com/demos/abogados.html',
                description: 'Despacho de abogados especializado en derecho civil y mercantil.',
                primaryColor: '#1976D2',
                secondaryColor: '#424242',
                adminEmail: 'admin@lexpartners.demo',
                services: [
                    { name: 'Consulta Inicial', description: 'Primera consulta sin compromiso', duration: 30, price: 0.00, category: 'Consultas', color: '#1976D2' },
                    { name: 'Asesoramiento Civil', description: 'Consulta derecho civil', duration: 60, price: 0.00, category: 'Derecho Civil', color: '#2196F3' },
                    { name: 'Asesoramiento Mercantil', description: 'Consulta derecho mercantil', duration: 60, price: 0.00, category: 'Derecho Mercantil', color: '#1565C0' },
                    { name: 'Asesoramiento Laboral', description: 'Consulta derecho laboral', duration: 60, price: 0.00, category: 'Derecho Laboral', color: '#0D47A1' },
                    { name: 'Defensa Penal', description: 'Consulta procesos penales', duration: 60, price: 0.00, category: 'Derecho Penal', color: '#424242' },
                    { name: 'Derecho de Familia', description: 'Divorcios y custodias', duration: 60, price: 0.00, category: 'Derecho Familia', color: '#0288D1' }
                ],
                professionals: [
                    { name: 'Letrado Miguel Ángel Pérez', email: 'miguel@lexpartners.demo', role: 'Abogado Civilista' },
                    { name: 'Letrada Isabel Fernández', email: 'isabel@lexpartners.demo', role: 'Abogada Mercantilista' },
                    { name: 'Letrado Antonio Castro', email: 'antonio@lexpartners.demo', role: 'Abogado Penalista' }
                ]
            }
        ];

        // Crear cada negocio
        for (const biz of businesses) {
            try {
                // Verificar si ya existe
                const existing = await db.query('SELECT id FROM businesses WHERE slug = ?', [biz.slug]);

                if (existing && existing.length > 0) {
                    results.errors.push(`${biz.name} ya existe (ID: ${existing[0].id})`);
                    continue;
                }

                // Crear negocio
                const bizResult = await db.query(`
                    INSERT INTO businesses (
                        name, slug, type_key, type, email, phone, address, website,
                        subscription_status, trial_ends_at, onboarding_completed,
                        widget_settings, booking_settings, description
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, TRUE, ?, ?, ?)
                `, [
                    biz.name, biz.slug, biz.type_key, biz.type, biz.email, biz.phone, biz.address, biz.website,
                    trialEnds,
                    JSON.stringify({ primaryColor: biz.primaryColor, secondaryColor: biz.secondaryColor, language: 'es', showPrices: true, showDuration: true }),
                    JSON.stringify({ workDays: [1, 2, 3, 4, 5, 6], workHoursStart: '09:00', workHoursEnd: '20:00', slotDuration: 30, minAdvanceHours: 2, maxAdvanceDays: 30 }),
                    biz.description
                ]);

                const businessId = bizResult.insertId;

                // Crear servicios
                for (const service of biz.services) {
                    await db.query(`
                        INSERT INTO services (business_id, name, description, duration, price, capacity, is_active, category, color)
                        VALUES (?, ?, ?, ?, ?, 1, TRUE, ?, ?)
                    `, [businessId, service.name, service.description, service.duration, service.price, service.category, service.color]);
                }

                // Crear profesionales
                for (const prof of biz.professionals) {
                    await db.query(`
                        INSERT INTO professionals (business_id, name, email, role, is_active)
                        VALUES (?, ?, ?, ?, TRUE)
                    `, [businessId, prof.name, prof.email, prof.role]);
                }

                // Crear usuario admin
                await db.query(`
                    INSERT INTO admin_users (business_id, email, password_hash, full_name, role, is_active)
                    VALUES (?, ?, ?, ?, 'owner', TRUE)
                `, [businessId, biz.adminEmail, passwordHash, `Admin ${biz.name}`, 'owner']);

                results.businesses.push({
                    id: businessId,
                    name: biz.name,
                    email: biz.adminEmail,
                    services: biz.services.length,
                    professionals: biz.professionals.length
                });

            } catch (error) {
                results.errors.push(`Error al crear ${biz.name}: ${error.message}`);
            }
        }

        res.json({
            success: true,
            message: `Creados ${results.businesses.length} de ${businesses.length} negocios demo`,
            data: results
        });

    } catch (error) {
        console.error('Error en setup de demos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/setup/add-business-controls
 * Agrega columnas is_active y free_access a la tabla businesses
 * NOTA: Este endpoint debería protegerse o eliminarse después del primer uso
 */
router.post('/api/setup/add-business-controls', async (req, res) => {
    try {
        console.log('🔄 Starting migration: Add business control columns...');

        const results = {
            actions: [],
            errors: []
        };

        // Check if columns already exist
        const columns = await db.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'businesses'
        `);

        const existingColumns = columns.map(c => c.COLUMN_NAME);
        console.log(`Found ${existingColumns.length} columns in businesses table`);

        // Add is_active column if it doesn't exist
        if (!existingColumns.includes('is_active')) {
            await db.query(`
                ALTER TABLE businesses
                ADD COLUMN is_active BOOLEAN DEFAULT TRUE
                COMMENT 'Manual control by super-admin to activate/deactivate business'
            `);
            results.actions.push('is_active column added');
            console.log('✅ is_active column added');
        } else {
            results.actions.push('is_active column already exists');
            console.log('⏭️ is_active column already exists');
        }

        // Add free_access column if it doesn't exist
        if (!existingColumns.includes('free_access')) {
            await db.query(`
                ALTER TABLE businesses
                ADD COLUMN free_access BOOLEAN DEFAULT FALSE
                COMMENT 'Permanent free access for sponsored projects, NGOs, special cases'
            `);
            results.actions.push('free_access column added');
            console.log('✅ free_access column added');
        } else {
            results.actions.push('free_access column already exists');
            console.log('⏭️ free_access column already exists');
        }

        // Set all existing businesses to active by default
        const updateResult = await db.query(`
            UPDATE businesses
            SET is_active = TRUE
            WHERE is_active IS NULL
        `);
        results.actions.push(`Updated ${updateResult.affectedRows || 0} businesses to active`);
        console.log(`✅ Updated ${updateResult.affectedRows || 0} businesses to active`);

        // Verify the changes
        const newColumns = await db.query(`
            SHOW COLUMNS FROM businesses
            WHERE Field IN ('is_active', 'free_access')
        `);

        res.json({
            success: true,
            message: 'Migration completed successfully',
            data: {
                actions: results.actions,
                columns: newColumns
            }
        });

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

/**
 * POST /api/setup/create-support-messages-table
 * Crea la tabla support_messages para el sistema de mensajes de soporte
 */
router.post('/api/setup/create-support-messages-table', async (req, res) => {
    try {
        console.log('🔄 [ENDPOINT HIT] Creating support_messages table...');
        console.log('🔄 [DB CHECK] db object:', { hasQuery: !!db.query, hasCreatePool: !!db.createPool });

        await db.query(`
            CREATE TABLE IF NOT EXISTS support_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_id INT NOT NULL,
                category ENUM('bug', 'question', 'suggestion', 'call_request', 'email_request') NOT NULL DEFAULT 'question',
                message TEXT NOT NULL,
                word_count INT NOT NULL,
                status ENUM('pending', 'answered', 'closed') NOT NULL DEFAULT 'pending',
                admin_response TEXT NULL,
                answered_by VARCHAR(255) NULL COMMENT 'Email del super-admin que respondió',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                answered_at TIMESTAMP NULL,
                can_send_again_at TIMESTAMP NULL COMMENT 'Fecha después de la cual puede enviar otro mensaje si no hay respuesta',
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
                INDEX idx_business_id (business_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='Mensajes de soporte de clientes a super-admin'
        `);

        console.log('✅ support_messages table created');

        const columns = await db.query('SHOW COLUMNS FROM support_messages');

        res.json({
            success: true,
            message: 'Tabla support_messages creada correctamente',
            data: {
                columns: columns
            }
        });

    } catch (error) {
        console.error('❌ Error creating table:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
