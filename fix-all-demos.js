/**
 * Script para arreglar todos los demos restantes
 */
const { withConnection } = require('./db-helper');

async function fixAllDemos() {
    console.log('🔧 Arreglando todos los demos restantes...\n');

    await withConnection(async (connection) => {

        // 2. Restaurante El Buen Sabor (ID 2) - NO necesita profesionales
        console.log('🍽️ Restaurante El Buen Sabor (ID 2):');
        await connection.query(`
            UPDATE businesses SET widget_settings = ? WHERE id = 2
        `, [JSON.stringify({
            primaryColor: '#FF5722',
            secondaryColor: '#FFC107',
            language: 'es',
            showPrices: true,
            showDuration: true
        })]);
        console.log('  ✓ Colores actualizados (naranja/amarillo)\n');

        // 4. NutriVida (ID 4)
        console.log('🥗 NutriVida - Centro de Nutrición (ID 4):');
        const nutriProfessionals = [
            { name: 'Dra. Carmen Flores', email: 'carmen@nutrivida.demo', role: 'Nutricionista Clínica' },
            { name: 'Dr. Roberto Vega', email: 'roberto@nutrivida.demo', role: 'Nutricionista Deportivo' }
        ];
        for (const prof of nutriProfessionals) {
            await connection.query(`
                INSERT INTO professionals (business_id, name, email, role, is_active, display_order)
                VALUES (?, ?, ?, ?, TRUE, 0)
            `, [4, prof.name, prof.email, prof.role]);
            console.log(`  ✓ ${prof.name} - ${prof.role}`);
        }
        await connection.query(`
            UPDATE businesses SET widget_settings = ? WHERE id = 4
        `, [JSON.stringify({
            primaryColor: '#4CAF50',
            secondaryColor: '#8BC34A',
            language: 'es',
            showPrices: true,
            showDuration: true
        })]);
        console.log('  ✓ Colores actualizados (verde)\n');

        // 5. PowerFit Gym (ID 5)
        console.log('💪 PowerFit Gym & Training (ID 5):');
        const gymProfessionals = [
            { name: 'Marcos Ruiz', email: 'marcos@powerfit.demo', role: 'Entrenador Personal' },
            { name: 'Elena Torres', email: 'elena@powerfit.demo', role: 'Instructora de Yoga y Pilates' },
            { name: 'David Moreno', email: 'david@powerfit.demo', role: 'Coach de CrossFit' }
        ];
        for (const prof of gymProfessionals) {
            await connection.query(`
                INSERT INTO professionals (business_id, name, email, role, is_active, display_order)
                VALUES (?, ?, ?, ?, TRUE, 0)
            `, [5, prof.name, prof.email, prof.role]);
            console.log(`  ✓ ${prof.name} - ${prof.role}`);
        }
        await connection.query(`
            UPDATE businesses SET widget_settings = ? WHERE id = 5
        `, [JSON.stringify({
            primaryColor: '#FF5722',
            secondaryColor: '#FFC107',
            language: 'es',
            showPrices: true,
            showDuration: true
        })]);
        console.log('  ✓ Colores actualizados (naranja/amarillo)\n');

        // 6. Estética Bella & Bella (ID 6)
        console.log('💅 Estética Bella & Bella (ID 6):');
        const estProfessionals = [
            { name: 'Patricia Gómez', email: 'patricia@bellabella.demo', role: 'Esteticista Senior' },
            { name: 'Silvia Ramírez', email: 'silvia@bellabella.demo', role: 'Especialista en Uñas' },
            { name: 'Cristina Ortiz', email: 'cristina@bellabella.demo', role: 'Especialista Facial' }
        ];
        for (const prof of estProfessionals) {
            await connection.query(`
                INSERT INTO professionals (business_id, name, email, role, is_active, display_order)
                VALUES (?, ?, ?, ?, TRUE, 0)
            `, [6, prof.name, prof.email, prof.role]);
            console.log(`  ✓ ${prof.name} - ${prof.role}`);
        }
        await connection.query(`
            UPDATE businesses SET widget_settings = ? WHERE id = 6
        `, [JSON.stringify({
            primaryColor: '#E91E63',
            secondaryColor: '#9C27B0',
            language: 'es',
            showPrices: true,
            showDuration: true
        })]);
        console.log('  ✓ Colores actualizados (rosa/morado)\n');

        // 7. Despacho Lex & Partners (ID 7)
        console.log('⚖️ Despacho Jurídico Lex & Partners (ID 7):');
        const lawProfessionals = [
            { name: 'Letrado Miguel Ángel Pérez', email: 'miguel@lexpartners.demo', role: 'Abogado Civilista' },
            { name: 'Letrada Isabel Fernández', email: 'isabel@lexpartners.demo', role: 'Abogada Mercantilista' },
            { name: 'Letrado Antonio Castro', email: 'antonio@lexpartners.demo', role: 'Abogado Penalista' }
        ];
        for (const prof of lawProfessionals) {
            await connection.query(`
                INSERT INTO professionals (business_id, name, email, role, is_active, display_order)
                VALUES (?, ?, ?, ?, TRUE, 0)
            `, [7, prof.name, prof.email, prof.role]);
            console.log(`  ✓ ${prof.name} - ${prof.role}`);
        }
        await connection.query(`
            UPDATE businesses SET widget_settings = ? WHERE id = 7
        `, [JSON.stringify({
            primaryColor: '#1976D2',
            secondaryColor: '#424242',
            language: 'es',
            showPrices: true,
            showDuration: true
        })]);
        console.log('  ✓ Colores actualizados (azul/gris)\n');

        console.log('✅ ¡Todos los demos actualizados exitosamente!');
    });
}

// Ejecutar
fixAllDemos()
    .then(() => {
        console.log('\n✅ Script completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script falló:', error.message);
        process.exit(1);
    });
