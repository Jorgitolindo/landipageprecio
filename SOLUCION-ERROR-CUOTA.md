# Solución: Error de Cuota en Gemini API

## Problema

El asistente virtual muestra el error: "Lo siento, hubo un error al procesar tu mensaje"

El error real es: **Error 429 - Quota Exceeded** (Cuota excedida)

## Causa

La API key de Gemini tiene una cuota de 0, lo que significa que:
- La API key puede ser nueva y necesitar activación
- El proyecto de Google Cloud no tiene cuota habilitada
- Hay restricciones en la API key

## Soluciones

### Solución 1: Verificar y Activar la API Key

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Verifica que tu API key esté activa y visible
4. Si no tienes una API key, crea una nueva:
   - Haz clic en "Create API Key"
   - Selecciona o crea un proyecto de Google Cloud
   - Copia la nueva API key

### Solución 2: Verificar el Proyecto de Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona el proyecto asociado a tu API key
3. Ve a "APIs & Services" > "Enabled APIs"
4. Busca "Generative Language API" o "Gemini API"
5. Si no está habilitada, haz clic en "Enable API"
6. Verifica que no haya restricciones que bloqueen el uso

### Solución 3: Verificar Cuotas y Límites

1. En Google Cloud Console, ve a "APIs & Services" > "Quotas"
2. Busca "Generative Language API"
3. Verifica que las cuotas estén habilitadas y no estén en 0
4. Si es necesario, solicita un aumento de cuota

### Solución 4: Crear una Nueva API Key

Si la API key actual no funciona:

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crea una nueva API key
3. Actualiza la clave en `server.js` línea 18:
   ```javascript
   const GEMINI_API_KEY = 'TU_NUEVA_API_KEY_AQUI';
   ```
4. Reinicia el servidor

### Solución 5: Esperar y Reintentar

A veces el problema es temporal:
- Espera 5-10 minutos
- Vuelve a intentar
- Los límites de cuota se resetean periódicamente

## Verificar que Funciona

Después de aplicar una solución, prueba la conexión:

```bash
node -e "const {GoogleGenAI} = require('@google/genai'); const ai = new GoogleGenAI({apiKey: 'TU_API_KEY'}); ai.models.generateContent({model: 'gemini-pro', contents: 'Hola'}).then(r => console.log('✅ Funciona:', r.text)).catch(e => console.error('❌ Error:', e.message));"
```

## Notas Importantes

- **Nunca compartas tu API key públicamente**
- **No subas tu API key a repositorios públicos**
- Las API keys gratuitas tienen límites de cuota
- Para uso en producción, considera un plan de pago

## Contacto

Si el problema persiste después de intentar estas soluciones:
- Revisa la [documentación oficial de Gemini API](https://ai.google.dev/gemini-api/docs)
- Consulta el [foro de soporte de Google AI](https://support.google.com/aistudio)

