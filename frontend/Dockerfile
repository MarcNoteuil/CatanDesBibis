FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

# Installer les dépendances
RUN npm install

# Copier le code source
COPY shared ./shared
COPY frontend ./frontend

# Build shared
WORKDIR /app/shared
RUN npm run build

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Production avec Nginx
FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

