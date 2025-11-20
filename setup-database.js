/**
 * Script para crear las tablas en MySQL
 * Ejecutar: node setup-database.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
};

async function setupDatabase() {
    let connection;
    
    try {
        console.log('🔌 Conectando a MySQL...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado a MySQL\n');

        // Crear base de datos
        console.log('📦 Creando base de datos "precios"...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS precios CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log('✅ Base de datos creada/verificada\n');

        // Usar la base de datos
        await connection.query('USE precios');

        // Crear tabla de comentarios
        console.log('📝 Creando tabla "comments"...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabla "comments" creada\n');

        // Crear tabla de conocimiento para la IA
        console.log('🧠 Creando tabla "ai_knowledge"...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ai_knowledge (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category ENUM('manual_usuario', 'manual_empresa', 'general') DEFAULT 'general',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabla "ai_knowledge" creada\n');

        // Crear tabla de conversaciones
        console.log('💬 Creando tabla "chat_conversations"...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS chat_conversations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_message TEXT NOT NULL,
                ai_response TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabla "chat_conversations" creada\n');

        // Verificar si ya hay datos de ejemplo
        const [existing] = await connection.query('SELECT COUNT(*) as count FROM ai_knowledge');
        
        if (existing[0].count === 0) {
            console.log('📚 Insertando datos de ejemplo en "ai_knowledge"...');
            await connection.query(`
                INSERT INTO ai_knowledge (title, content, category) VALUES
                ('Bienvenida', 'Precio Verdadero es una plataforma innovadora que ayuda a los usuarios a encontrar precios justos y transparentes. Nuestro objetivo es eliminar las sorpresas en los precios y proporcionar información clara y confiable.', 'manual_empresa'),
                ('Servicios Principales', 'Ofrecemos comparación de precios en tiempo real, análisis de tendencias de precios, alertas de precios, y un sistema de calificación de proveedores basado en transparencia y honestidad.', 'manual_empresa'),
                ('Cómo usar la plataforma', 'Para usar Precio Verdadero, simplemente busca el producto o servicio que necesitas. Nuestro sistema te mostrará una comparación de precios de diferentes proveedores, incluyendo información sobre impuestos y costos ocultos.', 'manual_usuario'),
                ('Política de Transparencia', 'En Precio Verdadero, creemos firmemente en la transparencia total. Todos los precios mostrados incluyen todos los costos, sin cargos ocultos. Si encuentras alguna discrepancia, por favor repórtala y la investigaremos inmediatamente.', 'manual_empresa');
            `);
            console.log('✅ Datos de ejemplo insertados\n');
        } else {
            console.log('ℹ️  Ya existen datos en "ai_knowledge", omitiendo inserción de ejemplos\n');
        }

        console.log('🎉 ¡Base de datos configurada exitosamente!');
        console.log('\n📊 Resumen:');
        console.log('   - Base de datos: precios');
        console.log('   - Tabla: comments');
        console.log('   - Tabla: ai_knowledge');
        console.log('   - Tabla: chat_conversations');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Asegúrate de que MySQL esté corriendo');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Verifica las credenciales en el archivo .env');
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

console.log('🚀 Configurando base de datos...\n');
setupDatabase();

