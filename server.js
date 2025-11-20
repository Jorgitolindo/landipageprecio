const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Headers para PWA
app.use((req, res, next) => {
    // Asegurar que el manifest y service worker se sirvan correctamente
    if (req.path === '/manifest.json') {
        res.setHeader('Content-Type', 'application/manifest+json');
    }
    if (req.path === '/sw.js') {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Service-Worker-Allowed', '/');
    }
    next();
});

// Configuración de Gemini AI
const GEMINI_API_KEY = 'AIzaSyDSCu2qZoxIXUzx00GWYN783pA-pkBakfo';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Configuración para Twilio (WhatsApp/SMS)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || ''; // e.g. 'whatsapp:+1415XXXXXXX'

// Configuración de PostgreSQL
const dbConfig = {
    host: process.env.DB_HOST || 'dpg-d4fd6n15pdvs73adlqdg-a.oregon-postgres.render.com',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'sw2precio',
    password: process.env.DB_PASSWORD || 'C6zWxNSFIgit2ZzR0SFy0nmU5tC4POUK',
    database: process.env.DB_DATABASE || 'sw2precio',
    ssl: process.env.DB_SSL === 'disable' ? false : { rejectUnauthorized: false },
    max: Number(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT) || 30000
};

let pool;

// Inicializar pool de conexiones
async function initializeDatabase() {
    try {
        pool = new Pool(dbConfig);

        // Verificar conexión
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        console.log('✅ Conexión a PostgreSQL establecida correctamente');
        client.release();
        
        // Crear tablas si no existen
        await createTables();
    } catch (error) {
        console.error('❌ Error al conectar con PostgreSQL:', error.message);
        process.exit(1);
    }
}

// Crear tablas
async function createTables() {
    try {
        // Tabla de comentarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_comments_created_at
            ON comments (created_at);
        `);

        // Tabla de conocimiento para la IA
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_knowledge (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (category IN ('manual_usuario', 'manual_empresa', 'general')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_ai_knowledge_category
            ON ai_knowledge (category);
        `);

        // Tabla de conversaciones (opcional, para historial)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_conversations (
                id SERIAL PRIMARY KEY,
                user_message TEXT NOT NULL,
                ai_response TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at
            ON chat_conversations (created_at);
        `);

        console.log('✅ Tablas creadas/verificadas correctamente');
    } catch (error) {
        console.error('❌ Error al crear tablas:', error.message);
    }
}

// Función para obtener el contexto del conocimiento
async function getKnowledgeContext() {
    try {
        const { rows } = await pool.query(`
            SELECT title, content, category 
            FROM ai_knowledge 
            ORDER BY category, created_at DESC
        `);

        if (rows.length === 0) {
            return '';
        }

        let context = '\n\nINFORMACIÓN DE LA EMPRESA Y MANUALES:\n';
        context += '==========================================\n\n';

        rows.forEach(row => {
            context += `[${row.category.toUpperCase()}] ${row.title}:\n`;
            context += `${row.content}\n\n`;
        });

        return context;
    } catch (error) {
        console.error('Error al obtener conocimiento:', error);
        return '';
    }
}

// Función para cargar el prompt de entrenamiento desde archivo
async function loadTrainingPrompt() {
    try {
        const promptPath = path.join(__dirname, 'prompt-entrenamiento.txt');
        const trainingPrompt = await fs.readFile(promptPath, 'utf-8');
        return trainingPrompt;
    } catch (error) {
        console.warn('⚠️ No se pudo cargar prompt-entrenamiento.txt, usando prompt por defecto');
        return '';
    }
}

// Prompt base para la IA (se complementará con el archivo de entrenamiento)
let BASE_PROMPT = `Eres un asistente virtual amigable y profesional para la empresa "Precio Verdadero". 
Tu objetivo es ayudar a los usuarios a encontrar precios justos y transparentes.

INSTRUCCIONES:
- Sé cortés, profesional y útil
- Responde en español
- Si no sabes algo, admítelo honestamente
- Proporciona información basada en el conocimiento de la empresa cuando sea relevante
- Mantén las respuestas concisas pero informativas

CONTEXTO DE LA EMPRESA:
Precio Verdadero es una plataforma dedicada a proporcionar transparencia en los precios, 
ayudando a los usuarios a encontrar el precio real de productos y servicios sin sorpresas.

`;

// Cargar prompt de entrenamiento al iniciar
let TRAINING_PROMPT = '';
loadTrainingPrompt().then(prompt => {
    TRAINING_PROMPT = prompt;
    if (TRAINING_PROMPT) {
        console.log('✅ Prompt de entrenamiento cargado exitosamente');
    }
}).catch(err => {
    console.warn('⚠️ Error al cargar prompt de entrenamiento:', err.message);
});

// ========== RUTAS API ==========

// Helper: enviar WhatsApp via Twilio REST API
async function sendWhatsAppViaTwilio(toNumber, bodyText) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
        throw new Error('Twilio no configurado (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM)');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const params = new URLSearchParams();
    // Twilio WhatsApp requires 'whatsapp:' prefix
    params.append('From', TWILIO_WHATSAPP_FROM);
    params.append('To', `whatsapp:${toNumber}`);
    params.append('Body', bodyText);

    const basic = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });

    const data = await res.json();
    if (!res.ok) {
        const err = new Error(`Twilio API error: ${res.status} ${res.statusText} - ${JSON.stringify(data)}`);
        err.status = res.status;
        throw err;
    }

    return data;
}

// Ruta para el chat con IA
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.json({ success: false, message: 'El mensaje no puede estar vacío' });
        }

        // Obtener contexto del conocimiento de la base de datos
        const knowledgeContext = await getKnowledgeContext();
        
        // Recargar prompt de entrenamiento si es necesario (por si se actualizó)
        if (!TRAINING_PROMPT) {
            TRAINING_PROMPT = await loadTrainingPrompt();
        }
        
        // Construir prompt completo: base + entrenamiento + conocimiento DB + pregunta
        let fullPrompt = BASE_PROMPT;
        
        if (TRAINING_PROMPT) {
            fullPrompt += '\n\n=== MANUAL DE ENTRENAMIENTO ===\n' + TRAINING_PROMPT + '\n';
        }
        
        if (knowledgeContext) {
            fullPrompt += '\n\n=== CONOCIMIENTO ADICIONAL DE LA BASE DE DATOS ===\n' + knowledgeContext;
        }
        
        fullPrompt += `\n\n=== PREGUNTA DEL USUARIO ===\n${message}\n\n=== RESPUESTA ===\nResponde de manera útil y profesional:`;

        // Generar respuesta usando Gemini
        console.log('📤 Enviando solicitud a Gemini...');
        console.log('🔑 API Key configurada:', GEMINI_API_KEY ? 'Sí (longitud: ' + GEMINI_API_KEY.length + ')' : 'No');
        
        let response;
        try {
            response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: fullPrompt
            });
            console.log('✅ Respuesta recibida de Gemini');
        } catch (apiError) {
            console.error('❌ Error de la API de Gemini:');
            console.error('   Mensaje:', apiError.message);
            console.error('   Código:', apiError.code);
            console.error('   Status:', apiError.status);
            console.error('   Tipo:', typeof apiError);
            console.error('   Error completo:', JSON.stringify(apiError, Object.getOwnPropertyNames(apiError)).substring(0, 500));
            
            // Extraer mensaje de error
            let errorMsg = apiError.message || apiError.toString() || 'Error desconocido';
            
            // Mensajes de error más descriptivos
            if (errorMsg.includes('API key') || errorMsg.includes('authentication') || errorMsg.includes('401')) {
                errorMsg = 'Error de autenticación: La API key puede ser inválida o no tener permisos suficientes. Verifica tu API key en Google AI Studio (https://aistudio.google.com/app/apikey).';
            } else if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || apiError.status === 429) {
                errorMsg = '⚠️ Se ha excedido la cuota de la API de Gemini.\n\n' +
                    'Posibles causas:\n' +
                    '• La API key es nueva y necesita activación\n' +
                    '• Se alcanzó el límite de solicitudes por minuto\n' +
                    '• El proyecto de Google Cloud no tiene cuota habilitada\n\n' +
                    'Solución: Ve a https://aistudio.google.com/app/apikey y verifica el estado de tu API key. Espera unos minutos antes de intentar de nuevo.';
            } else {
                errorMsg = 'Error al comunicarse con Gemini API: ' + errorMsg;
            }
            
            throw new Error(errorMsg);
        }

        // Acceder al texto usando el getter text (según documentación oficial)
        let aiResponse = response.text;
        
        if (!aiResponse) {
            console.error('⚠️ La respuesta no contiene texto');
            console.error('Estructura de respuesta completa:', JSON.stringify({
                candidates: response.candidates,
                promptFeedback: response.promptFeedback,
                usageMetadata: response.usageMetadata
            }, null, 2));
            
            // Intentar extraer de candidates manualmente
            if (response.candidates && response.candidates[0] && response.candidates[0].content) {
                const parts = response.candidates[0].content.parts;
                if (parts && parts[0] && parts[0].text) {
                    aiResponse = parts[0].text;
                    console.log('✅ Texto extraído de candidates manualmente');
                }
            }
            
            if (!aiResponse) {
                // Verificar si hay feedback de bloqueo
                if (response.promptFeedback && response.promptFeedback.blockReason) {
                    throw new Error('El contenido fue bloqueado por: ' + response.promptFeedback.blockReason);
                }
                throw new Error('La respuesta de Gemini no contiene texto. Puede ser un problema de contenido filtrado o de configuración.');
            }
        }
        
        console.log('✅ Respuesta procesada exitosamente:', aiResponse.substring(0, 100) + '...');

        // Guardar conversación en la base de datos (opcional)
        try {
            await pool.query(
                'INSERT INTO chat_conversations (user_message, ai_response) VALUES ($1, $2)',
                [message, aiResponse]
            );
        } catch (dbError) {
            console.error('Error al guardar conversación:', dbError);
            // No fallar si no se puede guardar
        }

        res.json({ success: true, response: aiResponse });
    } catch (error) {
        console.error('❌ Error en chat:', error);
        console.error('Stack trace:', error.stack);
        console.error('Detalles del error:', {
            message: error.message,
            code: error.code,
            status: error.status,
            name: error.name
        });
        
        // Extraer mensaje de error de diferentes formatos
        let errorMessage = 'Error al procesar la solicitud con la IA';
        
        // Intentar obtener el mensaje de error de diferentes formas
        if (error && error.message) {
            errorMessage = String(error.message);
        } else if (error && typeof error === 'string') {
            errorMessage = error;
        } else if (error && error.toString && error.toString() !== '[object Object]') {
            errorMessage = error.toString();
        }
        
        // Limpiar el mensaje de error (remover caracteres especiales de JSON si los hay)
        try {
            // Si el mensaje parece ser JSON, intentar parsearlo
            if (errorMessage.startsWith('{')) {
                const parsed = JSON.parse(errorMessage);
                if (parsed.error && parsed.error.message) {
                    errorMessage = parsed.error.message;
                } else if (parsed.message) {
                    errorMessage = parsed.message;
                }
            }
        } catch (e) {
            // No es JSON, usar el mensaje tal cual
        }
        
        // Log detallado para debugging
        console.log('📤 Enviando respuesta de error al cliente:');
        console.log('   success: false');
        console.log('   message:', errorMessage);
        console.log('   statusCode: 500');
        
        // Asegurarse de que el mensaje no esté vacío
        if (!errorMessage || errorMessage.trim() === '') {
            errorMessage = 'Error al procesar la solicitud con la IA. Por favor verifica la consola del servidor para más detalles.';
        }
        
        res.status(500).json({ 
            success: false, 
            message: errorMessage
        });
    }
});

// Ruta para obtener comentarios
app.get('/api/comments', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT id, name, email, text, created_at 
            FROM comments 
            ORDER BY created_at DESC 
            LIMIT 50
        `);

        res.json({ success: true, comments: rows });
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener comentarios' 
        });
    }
});

// Ruta para crear comentario
app.post('/api/comments', async (req, res) => {
    try {
        const { name, email, text } = req.body;

        if (!name || !email || !text) {
            return res.json({ 
                success: false, 
                message: 'Todos los campos son requeridos' 
            });
        }

        // Validar email básico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.json({ 
                success: false, 
                message: 'Email inválido' 
            });
        }

        await pool.query(
            'INSERT INTO comments (name, email, text) VALUES ($1, $2, $3)',
            [name, email, text]
        );

        res.json({ success: true, message: 'Comentario guardado exitosamente' });
    } catch (error) {
        console.error('Error al crear comentario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al guardar el comentario' 
        });
    }
});

// Ruta para agregar conocimiento a la IA (para administradores)
app.post('/api/knowledge', async (req, res) => {
    try {
        const { title, content, category } = req.body;

        if (!title || !content) {
            return res.json({ 
                success: false, 
                message: 'Título y contenido son requeridos' 
            });
        }

        const validCategory = category || 'general';
        
        await pool.query(
            'INSERT INTO ai_knowledge (title, content, category) VALUES ($1, $2, $3)',
            [title, content, validCategory]
        );

        res.json({ success: true, message: 'Conocimiento agregado exitosamente' });
    } catch (error) {
        console.error('Error al agregar conocimiento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al agregar conocimiento' 
        });
    }
});

// Ruta para obtener conocimiento
app.get('/api/knowledge', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT id, title, content, category, created_at, updated_at 
            FROM ai_knowledge 
            ORDER BY category, created_at DESC
        `);

        res.json({ success: true, knowledge: rows });
    } catch (error) {
        console.error('Error al obtener conocimiento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener conocimiento' 
        });
    }
});

// Ruta para recargar el prompt de entrenamiento desde el archivo
app.post('/api/reload-prompt', async (req, res) => {
    try {
        const newPrompt = await loadTrainingPrompt();
        if (newPrompt) {
            TRAINING_PROMPT = newPrompt;
            console.log('✅ Prompt de entrenamiento recargado exitosamente');
            res.json({ 
                success: true, 
                message: 'Prompt de entrenamiento recargado exitosamente',
                length: newPrompt.length
            });
        } else {
            res.json({ 
                success: false, 
                message: 'No se pudo cargar el prompt de entrenamiento' 
            });
        }
    } catch (error) {
        console.error('Error al recargar prompt:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al recargar el prompt de entrenamiento' 
        });
    }
});

// Endpoint para iniciar una sesión de soporte y enviar un mensaje WhatsApp/SMS via Twilio
app.post('/api/support-session', async (req, res) => {
    try {
        const { number, message } = req.body;

        if (!number || typeof number !== 'string') {
            return res.status(400).json({ success: false, message: 'Se requiere el campo `number` en formato E.164 (ej. +54911xxxxxxx).' });
        }

        const textToSend = (message && message.trim()) ? message.trim() : 'Necesito ayuda';

        // Validación mínima: número debe comenzar con + y tener al menos 8 dígitos
        if (!/^\+\d{8,15}$/.test(number)) {
            return res.status(400).json({ success: false, message: 'Número inválido. Debe estar en formato E.164, por ejemplo: +54911xxxxxxx' });
        }

        // Verificar configuración de Twilio
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
            return res.status(500).json({ success: false, message: 'Twilio no está configurado. Revisa TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM en .env' });
        }

        // Enviar mensaje vía Twilio API (WhatsApp)
        const sendResult = await sendWhatsAppViaTwilio(number, textToSend);

        return res.json({ success: true, provider: 'twilio', result: { sid: sendResult.sid || null } });
    } catch (err) {
        console.error('Error en /api/support-session:', err);
        let msg = err && err.message ? err.message : 'Error enviando mensaje de soporte';
        return res.status(500).json({ success: false, message: msg });
    }
});

// Ruta raíz
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Iniciar servidor
async function startServer() {
    try {
        console.log('🔌 Iniciando servidor...');
        console.log('📦 Conectando a la base de datos...');
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(50));
            console.log('✅ SERVIDOR INICIADO CORRECTAMENTE');
            console.log('='.repeat(50));
            console.log(`🌐 Servidor corriendo en: http://localhost:${PORT}`);
            console.log(`📝 API disponible en: http://localhost:${PORT}/api`);
            console.log(`🤖 Asistente Virtual: http://localhost:${PORT}`);
            console.log('='.repeat(50));
            console.log('💡 Presiona Ctrl+C para detener el servidor\n');
        });
    } catch (error) {
        console.error('\n❌ Error al iniciar el servidor:');
        console.error(error);
        process.exit(1);
    }
}

startServer().catch((error) => {
    console.error('\n❌ Error fatal al iniciar:');
    console.error(error);
    process.exit(1);
});

