/**
 * Script para crear las tablas en PostgreSQL
 * Ejecutar: node setup-database.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'dpg-d4fd6n15pdvs73adlqdg-a.oregon-postgres.render.com',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'sw2precio',
    password: process.env.DB_PASSWORD || 'C6zWxNSFIgit2ZzR0SFy0nmU5tC4POUK',
    database: process.env.DB_DATABASE || 'sw2precio',
    ssl: process.env.DB_SSL === 'disable' ? false : { rejectUnauthorized: false }
};

async function setupDatabase() {
    const pool = new Pool(dbConfig);

    try {
        console.log('🔌 Conectando a PostgreSQL...');
        const client = await pool.connect();
        console.log('✅ Conectado a PostgreSQL\n');

        // Crear tabla de comentarios
        console.log('📝 Creando tabla "comments"...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_comments_created_at
            ON comments (created_at);
        `);
        console.log('✅ Tabla "comments" creada\n');

        // Crear tabla de conocimiento para la IA
        console.log('🧠 Creando tabla "ai_knowledge"...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS ai_knowledge (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (category IN ('manual_usuario', 'manual_empresa', 'general')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_ai_knowledge_category
            ON ai_knowledge (category);
        `);
        console.log('✅ Tabla "ai_knowledge" creada\n');

        // Crear tabla de conversaciones
        console.log('💬 Creando tabla "chat_conversations"...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_conversations (
                id SERIAL PRIMARY KEY,
                user_message TEXT NOT NULL,
                ai_response TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at
            ON chat_conversations (created_at);
        `);
        console.log('✅ Tabla "chat_conversations" creada\n');

        // Insertar datos de ejemplo si no existen
        const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM ai_knowledge');
        if (rows[0].count === 0) {
            console.log('📚 Insertando datos de ejemplo en "ai_knowledge"...');
            await client.query(`
                INSERT INTO ai_knowledge (title, content, category) VALUES
                ('Bienvenida', 'Precio Verdadero es una plataforma innovadora que ayuda a los usuarios a encontrar precios justos y transparentes. Nuestro objetivo es eliminar las sorpresas en los precios y proporcionar información clara y confiable.', 'manual_empresa'),
                ('Servicios Principales', 'Ofrecemos comparación de precios en tiempo real, análisis de tendencias de precios, alertas de precios, y un sistema de calificación de proveedores basado en transparencia y honestidad.', 'manual_empresa'),
                ('Cómo usar la plataforma', 'Para usar Precio Verdadero, simplemente busca el producto o servicio que necesitas. Nuestro sistema te mostrará una comparación de precios de diferentes proveedores, incluyendo información sobre impuestos y costos ocultos.', 'manual_usuario'),
                ('Política de Transparencia', 'En Precio Verdadero, creemos firmemente en la transparencia total. Todos los precios mostrados incluyen todos los costos, sin cargos ocultos. Si encuentras alguna discrepancia, por favor repórtala y la investigaremos inmediatamente.', 'manual_empresa');
            `);
            console.log('✅ Datos de ejemplo insertados\n');
        } else {
            console.log('ℹ️ Ya existen datos en "ai_knowledge", omitiendo inserción de ejemplos\n');
        }

        client.release();

        console.log('🎉 ¡Base de datos configurada exitosamente!');
        console.log('\n📊 Resumen:');
        console.log(`   - Base de datos: ${dbConfig.database}`);
        console.log('   - Tabla: comments');
        console.log('   - Tabla: ai_knowledge');
        console.log('   - Tabla: chat_conversations');
    } catch (error) {
        console.error('❌ Error configurando la base de datos:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

console.log('🚀 Configurando base de datos...\n');
setupDatabase();

