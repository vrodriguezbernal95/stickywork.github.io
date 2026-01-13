// Script para ejecutar migración de Reportes IA en Railway
// Ejecutar: node run-migration-railway.js

const fetch = require('node-fetch');

async function runMigrationOnRailway() {
    console.log('🚀 Ejecutando migración de Reportes IA en Railway...\n');

    const SQL_MIGRATION = `
-- 1. Agregar columna para habilitar/deshabilitar reportes IA
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS ai_reports_enabled BOOLEAN DEFAULT FALSE;

-- 2. Crear tabla para reportes
CREATE TABLE IF NOT EXISTS ai_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    stats JSON NOT NULL,
    ai_executive_summary TEXT,
    ai_insights JSON,
    ai_strengths JSON,
    ai_weaknesses JSON,
    ai_feedback_analysis TEXT,
    ai_recommendations JSON,
    ai_economic_impact TEXT,
    ai_action_plan JSON,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(50) DEFAULT 'claude-sonnet-4',
    tokens_used INT,
    generation_time_ms INT,
    pdf_generated BOOLEAN DEFAULT FALSE,
    pdf_path VARCHAR(255),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_report (business_id, month, year),
    INDEX idx_business_date (business_id, year, month)
);

-- 3. Habilitar reportes para negocios demo
UPDATE businesses SET ai_reports_enabled = TRUE WHERE id IN (2, 9);
`;

    console.log('📋 SQL a ejecutar:');
    console.log(SQL_MIGRATION);
    console.log('\n' + '='.repeat(60));
    console.log('\n⚠️  INSTRUCCIONES PARA EJECUTAR EN RAILWAY:');
    console.log('\n1. Ve a Railway dashboard: https://railway.app');
    console.log('2. Selecciona tu proyecto StickyWork');
    console.log('3. Click en el servicio MySQL');
    console.log('4. Tab "Data"');
    console.log('5. Copia el SQL de arriba y ejecuta');
    console.log('\n' + '='.repeat(60));
    console.log('\nO si tienes acceso a MySQL CLI:');
    console.log('mysql -h [HOST] -u [USER] -p[PASSWORD] [DATABASE] < backend/migrations/add-ai-reports.sql');
    console.log('\n' + '='.repeat(60));
}

runMigrationOnRailway();
