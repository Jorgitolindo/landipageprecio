# Dockerfile para Precio Verdadero
# Usa Node 20 LTS
FROM node:20-alpine

# Crear y usar directorio de trabajo
WORKDIR /usr/src/app

# Copiar ficheros de dependencias primero para aprovechar cache de Docker
COPY package.json package-lock.json* ./

# Instalar dependencias (solo producción)
RUN npm ci --production || npm install --production

# Copiar el resto del código
COPY . .

# Exponer el puerto en el que corre la app
EXPOSE 3000

# Variables de entorno por defecto (puedes sobreescribirlas en Render)
ENV NODE_ENV=production
ENV PORT=3000

# Comando por defecto
CMD ["node", "server.js"]
