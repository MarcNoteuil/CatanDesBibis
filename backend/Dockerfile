FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

# Installer les dépendances
RUN npm install

# Copier le code source
COPY shared ./shared
COPY backend ./backend

# Build shared
WORKDIR /app/shared
RUN npm run build

# Build backend
WORKDIR /app/backend
RUN npm run build

# Production
FROM node:20-alpine

# Installer OpenSSL pour Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

# Installer les dépendances de production
RUN npm ci --only=production

# Copier les fichiers compilés
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/dist ./backend/dist

# Copier Prisma
COPY --from=builder /app/backend/prisma ./backend/prisma

WORKDIR /app/backend

EXPOSE 3000

CMD ["npm", "start"]

