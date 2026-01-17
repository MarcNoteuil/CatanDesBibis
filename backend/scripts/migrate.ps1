# Script PowerShell pour créer les migrations Prisma depuis Docker

param(
    [string]$MigrationName = "init"
)

Write-Host "Création des migrations Prisma depuis le conteneur Docker..." -ForegroundColor Cyan

# Démarrer le conteneur backend s'il n'est pas en cours d'exécution
docker-compose -f ../docker-compose.dev.yml up -d backend

# Attendre que le conteneur soit prêt
Start-Sleep -Seconds 5

# Créer les migrations
docker exec catan-backend-dev sh -c "cd /app/backend && npx prisma migrate dev --name $MigrationName"

# Copier les migrations vers le système de fichiers local
docker cp catan-backend-dev:/app/backend/prisma/migrations ./prisma/

Write-Host "Migrations créées avec succès !" -ForegroundColor Green

