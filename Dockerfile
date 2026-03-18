# ── Etapa 1: Dependencias ──────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copia solo los archivos de dependencias primero (mejor cache)
COPY package*.json ./

# Instala solo dependencias de producción
RUN npm ci --only=production

# ── Etapa 2: Imagen final ───────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Crea un usuario no-root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copia dependencias de la etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia el código fuente
COPY . .

# Usa el usuario no-root
USER appuser

# Cloud Run siempre usa el puerto 8080
EXPOSE 8080

# Variable de entorno para que tu app use el puerto correcto
ENV PORT=8080
ENV NODE_ENV=production

# Comando de inicio (ajusta "index.js" si tu entry point es diferente)
CMD ["node", "index.js"]