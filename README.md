# Precio Verdadero - Landing Page con Asistente Virtual IA

Landing page moderna para Precio Verdadero con asistente virtual integrado usando Gemini AI y sistema de comentarios con MySQL.

## 🚀 Características

- **Landing Page Moderna**: Diseño responsive con Tailwind CSS
- **Asistente Virtual IA**: Integrado con Google Gemini AI
- **Sistema de Comentarios**: Los usuarios pueden dejar comentarios que se guardan en MySQL
- **Base de Conocimiento**: Sistema para enseñar a la IA sobre manuales de usuario y empresa
- **API RESTful**: Backend completo con Express.js

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MySQL (v5.7 o superior)
- npm o yarn

## 🔧 Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar base de datos:**
   - Asegúrate de que MySQL esté corriendo
   - Crea la base de datos ejecutando el script `database.sql`:
   ```bash
   mysql -u root -p < database.sql
   ```
   O ejecuta el contenido del archivo en tu cliente MySQL.

4. **Configurar variables de entorno:**
   - El archivo `.env` ya está configurado con los valores por defecto
   - Ajusta los valores si es necesario:
     ```
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_DATABASE=precios
     DB_USERNAME=root
     DB_PASSWORD=tu_password
     PORT=3000
     ```

5. **Iniciar el servidor:**
```bash
npm start
```

Para desarrollo con auto-reload:
```bash
npm run dev
```

6. **Abrir en el navegador:**
   - Abre `http://localhost:3000` en tu navegador

## 📁 Estructura del Proyecto

```
.
├── index.html          # Landing page principal
├── app.js              # Lógica del frontend (chat y comentarios)
├── server.js           # Servidor Express con API y conexión MySQL

## 🚢 Despliegue con Docker / Render

Se incluye un `Dockerfile` y un `.dockerignore` para construir una imagen Docker del proyecto. También hay un `render.yaml` de ejemplo como referencia (no incluye secretos).

Pasos rápidos para desplegar en Render usando Docker:

1. Conecta tu repositorio en Render y crea un nuevo servicio tipo **Web Service** con entorno **Docker**.
2. En el panel de la web service, configura las variables de entorno necesarias (no subas el archivo `.env` al repo):
   - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
   - `AI_PROVIDER` (`grok` o `groq`)
   - `GROK_API_KEY` o `GROQ_API_KEY`
   - (Opcional) `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
3. Render detectará el `Dockerfile` y construirá la imagen automáticamente. El servicio usará la variable `PORT` que Render provee; la app soporta `PORT=3000` por defecto.

Probar localmente con Docker:

```bash
# Construir imagen
docker build -t precio-verdadero:latest .

# Ejecutar contenedor, cargando variables desde tu .env local
docker run --rm -p 3000:3000 --env-file .env precio-verdadero:latest
```

Si necesitas que prepare un `docker-compose.yml` para desarrollo local (MySQL + app), dímelo y lo creo.
├── package.json        # Dependencias del proyecto
├── .env               # Variables de entorno
├── database.sql       # Script SQL para crear tablas
└── README.md         # Este archivo
```

## 🗄️ Base de Datos

El proyecto crea automáticamente las siguientes tablas:

- **comments**: Almacena los comentarios de los usuarios
- **ai_knowledge**: Base de conocimiento para entrenar a la IA
- **chat_conversations**: Historial de conversaciones con la IA

## 🤖 Asistente Virtual

El asistente virtual usa Google Gemini AI y puede aprender de:
- **Archivo de entrenamiento**: `prompt-entrenamiento.txt` - Manual completo con instrucciones, políticas, FAQs, etc.
- **Base de datos**: Tabla `ai_knowledge` - Conocimiento adicional que puedes agregar dinámicamente
- **Manual del usuario** y **Manual de la empresa** - Categorías en la base de datos

### Archivo de Entrenamiento

El archivo `prompt-entrenamiento.txt` contiene el manual completo para entrenar a la IA. Puedes editarlo directamente y luego recargarlo sin reiniciar el servidor:

```bash
POST /api/reload-prompt
```

Este archivo incluye:
- Instrucciones generales para el asistente
- Información sobre la empresa
- Servicios principales
- Políticas y procedimientos
- Preguntas frecuentes
- Manual del usuario
- Casos de uso comunes
- Tono y estilo de comunicación

### Agregar Conocimiento a la Base de Datos

Para agregar conocimiento adicional a la IA, puedes usar la API:

```bash
POST /api/knowledge
Content-Type: application/json

{
  "title": "Título del conocimiento",
  "content": "Contenido detallado...",
  "category": "manual_usuario" | "manual_empresa" | "general"
}
```

Las categorías disponibles son:
- `manual_usuario` - Para información del manual de usuario
- `manual_empresa` - Para información del manual de empresa
- `general` - Para información general

## 📡 API Endpoints

- `POST /api/chat` - Enviar mensaje al asistente virtual
- `GET /api/comments` - Obtener todos los comentarios
- `POST /api/comments` - Crear un nuevo comentario
- `GET /api/knowledge` - Obtener conocimiento de la IA
- `POST /api/knowledge` - Agregar conocimiento a la IA

## 🎨 Tecnologías Utilizadas

- **Frontend**: HTML5, JavaScript (Vanilla), Tailwind CSS
- **Backend**: Node.js, Express.js
- **Base de Datos**: MySQL
- **IA**: Google Gemini AI
- **Iconos**: Font Awesome

## 📝 Notas

- La API key de Gemini está incluida en el código. En producción, deberías moverla a variables de entorno.
- El servidor debe estar corriendo para que el frontend funcione correctamente.
- Asegúrate de que MySQL esté corriendo antes de iniciar el servidor.

## 🔒 Seguridad

Para producción, considera:
- Mover la API key de Gemini a variables de entorno
- Implementar validación más estricta de inputs
- Agregar rate limiting
- Implementar autenticación para endpoints de administración
- Usar HTTPS

## 📞 Soporte

Si tienes problemas:
1. Verifica que MySQL esté corriendo
2. Verifica que el puerto 3000 esté disponible
3. Revisa los logs del servidor para errores
4. Asegúrate de que todas las dependencias estén instaladas

## 🆕 Actualización: Integración de IA (Grok / Groq)

Este proyecto recientemente cambió la integración de IA para usar Grok (X.ai) por defecto. El servidor también soporta proveedores estilo OpenAI/Groq.

- Variables principales en `.env`:
   - `GROK_API_KEY` — clave para Grok (X.ai)
   - `GROQ_API_KEY` — clave para proveedores estilo Groq/OpenAI (opcional)
   - `AI_PROVIDER` — `grok` o `groq` (por defecto `grok`)

- Endpoints útiles:
   - `GET /api/ai/validate` — valida si la API key está correcta (sin exponer la clave)
   - `POST /api/chat` — endpoint principal; acepta `{ stream: true }` para recibir respuesta vía SSE

- Prueba rápida desde tu máquina (reemplaza `<YOUR_KEY>` si pruebas directo):

```powershell
# Validar usando el endpoint local del servidor (más seguro):
curl http://localhost:3000/api/ai/validate

# Probar directamente Grok (reemplaza <YOUR_KEY> si lo ejecutas localmente):
curl -X POST https://api.x.ai/v1/chat/completions `
   -H "Content-Type: application/json" `
   -H "Authorization: Bearer <YOUR_KEY>" `
   -d '{"model":"grok-4-latest","messages":[{"role":"user","content":"ping"}]}'
```

Si obtienes errores del tipo `Incorrect API key provided` o `401`, revisa la clave en https://console.x.ai/ y asegúrate de que esté correctamente copiada en tu `.env`.

## 📞 Soporte 24/7 (WhatsApp/SMS)

Puedes configurar el servidor para que el asistente inicie una sesión de soporte y envíe un mensaje a tu WhatsApp/SMS usando Twilio. Para ello debes configurar las siguientes variables en tu `.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+1415XXXXXXX
```

Endpoint para iniciar la sesión de soporte:

```
POST /api/support-session
Content-Type: application/json

{
   "number": "+54911xxxxxxx",    # número en formato E.164
   "message": "Necesito ayuda"   # opcional, por defecto 'Necesito ayuda'
}
```

Ejemplo `curl`:

```bash
curl -X POST http://localhost:3000/api/support-session \
   -H "Content-Type: application/json" \
   -d '{"number":"+54911xxxxxxx","message":"Necesito ayuda"}'
```

Notas:
- El envío se realiza a través de la API de Twilio; verifica que tu cuenta permite WhatsApp y que `TWILIO_WHATSAPP_FROM` esté habilitado.
- El servidor validará el número en formato E.164 y responderá con el SID del mensaje si el envío fue aceptado por Twilio.

