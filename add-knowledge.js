/**
 * Script para agregar conocimiento a la IA
 * Uso: node add-knowledge.js
 */

const readline = require('readline');
const mysql = require('mysql2/promise');
require('dotenv').config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'precios'
};

async function addKnowledge() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado a la base de datos\n');

        const title = await question('Título del conocimiento: ');
        const category = await question('Categoría (manual_usuario/manual_empresa/general) [general]: ') || 'general';
        
        console.log('\nEscribe el contenido (presiona Enter dos veces para terminar):');
        const content = await multilineInput();

        await connection.query(
            'INSERT INTO ai_knowledge (title, content, category) VALUES (?, ?, ?)',
            [title, content, category]
        );

        console.log('\n✅ Conocimiento agregado exitosamente!');
        await connection.end();
        rl.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        rl.close();
        process.exit(1);
    }
}

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function multilineInput() {
    return new Promise((resolve) => {
        const lines = [];
        let emptyCount = 0;

        const handler = (line) => {
            if (line.trim() === '') {
                emptyCount++;
                if (emptyCount >= 2) {
                    rl.removeListener('line', handler);
                    resolve(lines.join('\n'));
                } else {
                    lines.push('');
                }
            } else {
                emptyCount = 0;
                lines.push(line);
            }
        };

        rl.on('line', handler);
    });
}

console.log('📚 Agregar Conocimiento a la IA\n');
addKnowledge();

