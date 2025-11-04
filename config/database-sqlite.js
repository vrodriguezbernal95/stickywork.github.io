const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Ruta de la base de datos SQLite
const DB_PATH = path.join(__dirname, '..', 'stickywork.db');

let db = null;

// Crear conexión a SQLite
function createConnection() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('✗ Error al conectar con SQLite:', err.message);
                reject(err);
            } else {
                console.log('✓ Conexión a SQLite exitosa');
                resolve(db);
            }
        });
    });
}

// Ejecutar query
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('No hay conexión a la base de datos'));
            return;
        }

        // Determinar si es SELECT o no
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        } else {
            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ insertId: this.lastID, affectedRows: this.changes });
                }
            });
        }
    });
}

// Crear pool (compatibilidad con la interfaz MySQL)
async function createPool() {
    try {
        await createConnection();
        await initializeTables();
        console.log('✓ Base de datos SQLite inicializada');
        return db;
    } catch (error) {
        console.error('✗ Error al crear base de datos SQLite:', error.message);
        throw error;
    }
}

// Inicializar tablas
async function initializeTables() {
    // Tabla businesses
    await query(`
        CREATE TABLE IF NOT EXISTS businesses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            widget_settings TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabla services
    await query(`
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            duration INTEGER NOT NULL,
            price REAL,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
        )
    `);

    // Tabla bookings
    await query(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id INTEGER NOT NULL,
            service_id INTEGER,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            booking_date DATE NOT NULL,
            booking_time TIME NOT NULL,
            notes TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
        )
    `);

    // Tabla contact_messages (mensajes del formulario de contacto)
    await query(`
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            business_name TEXT,
            business_type TEXT,
            interest TEXT,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'unread',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Insertar datos de ejemplo si no existen
    const businesses = await query('SELECT COUNT(*) as count FROM businesses');
    if (businesses[0].count === 0) {
        await insertSampleData();
    }
}

// Insertar datos de ejemplo
async function insertSampleData() {
    // Insertar negocio demo
    const businessResult = await query(`
        INSERT INTO businesses (name, type, email, phone, address, widget_settings)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        'Peluquería Demo',
        'Peluquería',
        'demo@stickywork.com',
        '+34 900 000 000',
        'Calle Principal 123, Madrid',
        '{"primaryColor": "#3b82f6", "language": "es"}'
    ]);

    const businessId = businessResult.insertId;

    // Insertar servicios
    await query(`
        INSERT INTO services (business_id, name, description, duration, price)
        VALUES (?, ?, ?, ?, ?)
    `, [businessId, 'Corte de Cabello', 'Corte profesional con lavado incluido', 30, 20.00]);

    await query(`
        INSERT INTO services (business_id, name, description, duration, price)
        VALUES (?, ?, ?, ?, ?)
    `, [businessId, 'Tinte Completo', 'Tinte profesional con tratamiento', 90, 50.00]);

    await query(`
        INSERT INTO services (business_id, name, description, duration, price)
        VALUES (?, ?, ?, ?, ?)
    `, [businessId, 'Peinado Especial', 'Peinado para eventos', 45, 35.00]);

    console.log('✓ Datos de ejemplo insertados');
}

// Obtener conexión (compatibilidad)
async function getConnection() {
    if (!db) {
        await createConnection();
    }
    return {
        execute: async (sql, params) => {
            const result = await query(sql, params);
            return [result];
        },
        release: () => {}
    };
}

// Test de conexión
async function testConnection() {
    try {
        if (!db) {
            await createConnection();
        }
        await query('SELECT 1');
        console.log('✓ Test de conexión SQLite exitoso');
        return true;
    } catch (error) {
        console.error('✗ Error de conexión SQLite:', error.message);
        return false;
    }
}

module.exports = {
    createPool,
    getConnection,
    query,
    testConnection,
    pool: () => db
};
