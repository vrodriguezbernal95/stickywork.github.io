/**
 * Migración: Agregar columna widget_customization a tabla businesses
 * Fecha: 2026-01-07
 */

const mysql = require('mysql2/promise');

async function up(db) {
    console.log('📝 Agregando columna widget_customization a businesses...');

    await db.query(`
        ALTER TABLE businesses
        ADD COLUMN widget_customization JSON DEFAULT NULL
        COMMENT 'Personalización visual del widget (colores, fuentes, estilos)'
    `);

    console.log('✅ Columna widget_customization agregada exitosamente');
}

async function down(db) {
    console.log('📝 Eliminando columna widget_customization de businesses...');

    await db.query(`
        ALTER TABLE businesses
        DROP COLUMN widget_customization
    `);

    console.log('✅ Columna widget_customization eliminada');
}

module.exports = { up, down };
