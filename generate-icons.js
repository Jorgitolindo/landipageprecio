/**
 * Script para generar iconos básicos para PWA
 * Nota: En producción, deberías usar iconos reales diseñados profesionalmente
 */

const fs = require('fs');
const path = require('path');

// Crear directorio si no existe
const iconsDir = __dirname;

// Función para crear un SVG simple como icono
function createSVGIcon(size, filename) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">PV</text>
</svg>`;
    
    fs.writeFileSync(path.join(iconsDir, filename), svg);
    console.log(`✅ Creado: ${filename}`);
}

// Tamaños de iconos necesarios
const iconSizes = [
    { size: 72, name: 'icon-72x72.png' },
    { size: 96, name: 'icon-96x96.png' },
    { size: 128, name: 'icon-128x128.png' },
    { size: 144, name: 'icon-144x144.png' },
    { size: 152, name: 'icon-152x152.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 384, name: 'icon-384x384.png' },
    { size: 512, name: 'icon-512x512.png' }
];

console.log('🎨 Generando iconos SVG básicos para PWA...\n');

// Crear iconos SVG (nota: en producción necesitarás convertirlos a PNG)
iconSizes.forEach(icon => {
    createSVGIcon(icon.size, icon.name.replace('.png', '.svg'));
});

console.log('\n⚠️  NOTA: Estos son iconos SVG básicos.');
console.log('Para producción, crea iconos PNG reales con un diseñador gráfico.');
console.log('Puedes usar herramientas como:');
console.log('  - https://realfavicongenerator.net/');
console.log('  - https://www.pwabuilder.com/imageGenerator');
console.log('\n✅ Iconos SVG creados. El navegador los usará como fallback.');

