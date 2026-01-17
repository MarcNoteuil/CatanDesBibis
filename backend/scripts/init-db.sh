#!/bin/sh
# Script d'initialisation de la base de données

echo "🔧 Génération du client Prisma..."
npx prisma generate

echo "📦 Application des migrations..."
npx prisma migrate deploy

echo "✅ Base de données initialisée !"

