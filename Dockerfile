# Dockerfile para autoSERP Backend
FROM node:18-alpine AS base

# Instalar dependências necessárias para o sistema
RUN apk add --no-cache python3 make g++ curl postgresql-client redis

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Stage de desenvolvimento (opcional)
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage de produção
FROM base AS production

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copiar código da aplicação
COPY --chown=nodejs:nodejs . .

# Tornar o script de entrada executável
RUN chmod +x docker-entrypoint.sh

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Health check (comentado temporariamente para debug)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Comando para iniciar a aplicação
CMD ["./docker-entrypoint.sh"] 