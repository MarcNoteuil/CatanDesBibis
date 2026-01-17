# Guide Docker pour Catan

## 🐳 Démarrage Rapide

### Production

```bash
# Construire et démarrer tous les services
docker-compose up -d --build

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v
```

### Développement

```bash
# Démarrer seulement PostgreSQL
docker-compose -f docker-compose.dev.yml up postgres -d

# Installer les dépendances localement
npm run install:all

# Générer le client Prisma
cd backend
npx prisma generate

# Créer et appliquer les migrations
npx prisma migrate dev --name init

# Démarrer le backend
npm run dev

# Dans un autre terminal, démarrer le frontend
cd frontend
npm run dev
```

## 📦 Services Docker

### PostgreSQL
- **Port**: 5432
- **User**: catan
- **Password**: catan_password
- **Database**: catan_db

### Backend
- **Port**: 3000
- **Health check**: http://localhost:3000/health

### Frontend
- **Port**: 80 (production)
- **Port**: 5173 (développement)

## 🔧 Commandes Utiles

### Voir les logs
```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Accéder aux conteneurs
```bash
# Backend
docker exec -it catan-backend sh

# PostgreSQL
docker exec -it catan-postgres psql -U catan -d catan_db
```

### Rebuild
```bash
# Rebuild sans cache
docker-compose build --no-cache

# Rebuild un service spécifique
docker-compose build backend
```

### Nettoyer
```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# Supprimer aussi les volumes
docker-compose down -v

# Supprimer les images
docker-compose down --rmi all
```

## 🗄️ Base de Données

### Migrations Prisma

Dans le conteneur backend, les migrations sont appliquées automatiquement au démarrage.

Pour les appliquer manuellement :

```bash
docker exec -it catan-backend sh
cd /app/backend
npx prisma migrate deploy
```

### Accès direct à PostgreSQL

```bash
docker exec -it catan-postgres psql -U catan -d catan_db
```

### Sauvegarder la base de données

```bash
docker exec catan-postgres pg_dump -U catan catan_db > backup.sql
```

### Restaurer la base de données

```bash
docker exec -i catan-postgres psql -U catan catan_db < backup.sql
```

## 🔐 Variables d'Environnement

Les variables d'environnement sont définies dans `docker-compose.yml` :

- `DATABASE_URL`: URL de connexion PostgreSQL
- `JWT_SECRET`: Clé secrète pour JWT (⚠️ changer en production)
- `FRONTEND_URL`: URL du frontend pour CORS
- `NODE_ENV`: Environnement (development/production)

## 🐛 Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier que PostgreSQL est prêt
docker-compose ps postgres
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Vérifier les logs PostgreSQL
docker-compose logs postgres

# Tester la connexion
docker exec -it catan-postgres psql -U catan -d catan_db -c "SELECT 1;"
```

### Les migrations ne s'appliquent pas

```bash
# Appliquer manuellement
docker exec -it catan-backend sh
cd /app/backend
npx prisma migrate deploy
npx prisma generate
```

### Port déjà utilisé

Si le port 3000 ou 80 est déjà utilisé, modifier `docker-compose.yml` :

```yaml
ports:
  - "3001:3000"  # Utiliser le port 3001 au lieu de 3000
```

## 📊 Monitoring

### Utilisation des ressources

```bash
docker stats
```

### Espace disque

```bash
docker system df
```

### Nettoyer l'espace disque

```bash
# Supprimer les conteneurs arrêtés
docker container prune

# Supprimer les images non utilisées
docker image prune

# Tout nettoyer (⚠️ attention)
docker system prune -a
```

