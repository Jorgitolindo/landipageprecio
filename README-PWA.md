# PWA - Progressive Web App

Esta aplicación está configurada como una Progressive Web App (PWA), lo que significa que los usuarios pueden instalarla en sus dispositivos móviles y de escritorio.

## 🚀 Características PWA

- ✅ **Instalable**: Los usuarios pueden instalar la app en su dispositivo
- ✅ **Offline**: Funciona sin conexión a internet (con cache)
- ✅ **Responsive**: Adaptada para todos los tamaños de pantalla
- ✅ **App-like**: Se comporta como una aplicación nativa

## 📱 Cómo Instalar la App

### En Android (Chrome):
1. Abre la página en Chrome
2. Verás un banner "Agregar a pantalla de inicio" o un menú con "Instalar app"
3. Toca "Instalar" o "Agregar"
4. La app aparecerá en tu pantalla de inicio

### En iOS (Safari):
1. Abre la página en Safari
2. Toca el botón de compartir (cuadrado con flecha)
3. Selecciona "Agregar a pantalla de inicio"
4. Personaliza el nombre si lo deseas
5. Toca "Agregar"

### En Desktop (Chrome/Edge):
1. Abre la página en Chrome o Edge
2. Busca el icono de instalación en la barra de direcciones (o menú)
3. Haz clic en "Instalar"
4. La app se abrirá en una ventana propia

## 🎨 Iconos

Actualmente se están usando iconos SVG básicos. Para producción:

1. **Crea iconos PNG reales** con un diseñador gráfico
2. **Tamaños necesarios**:
   - 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
3. **Herramientas recomendadas**:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://www.pwabuilder.com/

## 📝 Archivos PWA

- `manifest.json` - Configuración de la PWA
- `sw.js` - Service Worker para funcionalidad offline
- `icon-*.svg` - Iconos de la aplicación

## 🔧 Verificar PWA

Puedes verificar que la PWA funciona correctamente usando:

1. **Chrome DevTools**:
   - Abre DevTools (F12)
   - Ve a la pestaña "Application"
   - Revisa "Manifest" y "Service Workers"

2. **Lighthouse**:
   - Abre DevTools (F12)
   - Ve a la pestaña "Lighthouse"
   - Ejecuta una auditoría PWA

## 🐛 Solución de Problemas

### La app no se puede instalar:
- Verifica que estés usando HTTPS (o localhost para desarrollo)
- Asegúrate de que el manifest.json esté accesible
- Verifica que el service worker esté registrado

### Los iconos no aparecen:
- Verifica que los archivos de iconos existan
- Revisa las rutas en manifest.json
- En producción, usa iconos PNG en lugar de SVG

### El service worker no funciona:
- Verifica la consola del navegador para errores
- Asegúrate de que sw.js esté en la raíz del proyecto
- Verifica los headers del servidor

## 📚 Recursos

- [MDN - Progressive Web Apps](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)

