# Gestion des Migrations Prisma

## État Actuel

Les tables de la base de données ont été créées avec `prisma db push` lors du démarrage du conteneur Docker backend. Les tables suivantes existent :

- `User` - Utilisateurs avec authentification
- `Game` - Parties de jeu
- `GamePlayer` - Joueurs dans les parties (humains et bots)
- `GameState` - État des parties

## Création de Migrations

### Option 1 : Depuis Docker (Recommandé)

Les migrations sont créées automatiquement au démarrage du backend avec `prisma db push` dans `docker-compose.dev.yml`.

### Option 2 : Créer des Migrations Manuelles

Si vous devez créer des migrations depuis Windows :

1. **Démarrer le conteneur backend** :
   ```powershell
   docker-compose -f docker-compose.dev.yml up backend -d
   ```

2. **Créer la migration depuis le conteneur** :
   ```powershell
   docker exec -it catan-backend-dev sh
   cd /app/backend
   npx prisma migrate dev --name nom_de_la_migration
   exit
   ```

3. **Copier les migrations vers votre machine locale** :
   ```powershell
   docker cp catan-backend-dev:/app/backend/prisma/migrations ./backend/prisma/
   ```

### Option 3 : Utiliser le Script PowerShell

Un script est disponible dans `backend/scripts/migrate.ps1` :

```powershell
cd backend
.\scripts\migrate.ps1 -MigrationName "nom_de_la_migration"
```

## Problème d'Authentification depuis Windows

Si vous obtenez l'erreur `P1000: Authentication failed` en exécutant Prisma depuis Windows :

**Cause** : Prisma ne peut pas s'authentifier correctement depuis Windows vers Docker PostgreSQL.

**Solution** : Utilisez toujours les commandes Prisma depuis le conteneur Docker :

```powershell
docker exec catan-backend-dev sh -c "cd /app/backend && npx prisma [commande]"
```

## Commandes Utiles

### Générer le Client Prisma
```powershell
# Depuis Windows (fonctionne car ne nécessite pas de connexion DB)
cd backend
npx prisma generate
```

### Voir le statut des migrations
```powershell
docker exec catan-backend-dev sh -c "cd /app/backend && npx prisma migrate status"
```

### Appliquer les migrations (production)
```powershell
docker exec catan-backend-dev sh -c "cd /app/backend && npx prisma migrate deploy"
```

### Ouvrir Prisma Studio
```powershell
docker exec -it catan-backend-dev sh -c "cd /app/backend && npx prisma studio"
# Puis accéder à http://localhost:5555 depuis votre navigateur
```

## Notes

- `prisma db push` est utilisé pour le développement (création rapide du schéma)
- `prisma migrate dev` crée des fichiers de migration pour un historique
- `prisma migrate deploy` est utilisé en production pour appliquer les migrations

