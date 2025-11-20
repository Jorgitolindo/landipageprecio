# Configuración Rápida

## Paso 1: Crear archivo .env

Crea un archivo llamado `.env` en la raíz del proyecto con el siguiente contenido:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=precios
DB_USERNAME=root
DB_PASSWORD=
PORT=3000
```

**Nota:** Si tu MySQL tiene contraseña, agrega el valor en `DB_PASSWORD=tu_contraseña`

## Paso 2: Instalar dependencias

```bash
npm install
```

## Paso 3: Crear base de datos

Ejecuta el script SQL en MySQL:

```bash
mysql -u root -p < database.sql
```

O copia y pega el contenido de `database.sql` en tu cliente MySQL.

## Paso 4: Iniciar el servidor

```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Agregar Conocimiento a la IA

Puedes agregar conocimiento de dos formas:

### Opción 1: Usando el script
```bash
node add-knowledge.js
```

### Opción 2: Usando la API
```bash
curl -X POST http://localhost:3000/api/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Título",
    "content": "Contenido del conocimiento",
    "category": "manual_usuario"
  }'
```

Las categorías disponibles son:
- `manual_usuario` - Para información del manual de usuario
- `manual_empresa` - Para información del manual de empresa
- `general` - Para información general

