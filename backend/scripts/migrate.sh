#!/bin/sh
# Script pour créer les migrations Prisma depuis Docker

echo "Création des migrations Prisma depuis le conteneur Docker..."

# Démarrer le conteneur backend s'il n'est pas en cours d'exécution
docker-compose -f ../docker-compose.dev.yml up -d backend

# Attendre que le conteneur soit prêt
sleep 5

# Créer les migrations
docker exec catan-backend-dev sh -c "cd /app/backend && npx prisma migrate dev --name $1"

# Copier les migrations vers le système de fichiers local
docker cp catan-backend-dev:/app/backend/prisma/migrations ./prisma/

echo "Migrations créées avec succès !"

