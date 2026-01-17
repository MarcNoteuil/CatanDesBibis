# Logique de Jeu Catan

## Architecture

La logique de jeu est organisée en plusieurs services :

### Services Principaux

1. **GameLogic** (`services/GameLogic.ts`)
   - Point d'entrée principal pour toutes les actions de jeu
   - Gère le flux de jeu et la validation des actions
   - Coordonne les autres services

2. **DiceService** (`services/DiceService.ts`)
   - Gestion du lancer de dés
   - Détection du voleur (7)

3. **ResourceManager** (`services/ResourceManager.ts`)
   - Gestion des ressources des joueurs
   - Distribution des ressources selon les dés
   - Gestion du voleur et du vol de ressources
   - Échanges de ressources

4. **BuildingValidator** (`services/BuildingValidator.ts`)
   - Validation des placements de colonies, villes et routes
   - Vérification des règles de distance
   - Vérification de la connexion des routes

5. **DevelopmentCardDeck** (`services/DevelopmentCardDeck.ts`)
   - Gestion du deck de cartes développement
   - Distribution aléatoire des cartes

## Actions Implémentées

### ✅ Roll Dice
- Lance deux dés (1-6 chacun)
- Détecte le 7 (voleur)
- Distribue les ressources aux joueurs adjacents

### ✅ Place Settlement
- Vérifie les ressources (bois, brique, mouton, blé)
- Valide la distance (pas de colonie adjacente)
- Valide la connexion (route ou phase setup)
- Donne les ressources initiales en phase setup

### ✅ Place City
- Vérifie les ressources (2 blé, 3 minerai)
- Vérifie qu'une colonie existe
- Améliore la colonie en ville (+1 point de victoire)

### ✅ Place Road
- Vérifie les ressources (bois, brique)
- Valide la connexion (route ou bâtiment du joueur)
- Met à jour la route la plus longue

### ✅ Buy Development Card
- Vérifie les ressources (mouton, blé, minerai)
- Pioche une carte du deck
- Ajoute automatiquement les points de victoire si c'est une carte VP

### ✅ Play Development Card
- **Chevalier** : Déplace le voleur et vole une ressource
- **Route Gratuite** : Permet de placer 2 routes
- **Année d'Abondance** : Prend 2 ressources de son choix
- **Monopole** : Prend toutes les ressources d'un type de tous les joueurs

### ✅ Move Robber
- Déplace le voleur sur une nouvelle tuile
- Peut voler une ressource d'un joueur adjacent

### ✅ Trade
- Échange avec un autre joueur
- Échange avec la banque (4:1 ou 2:1 avec port)

### ✅ End Turn
- Passe au joueur suivant
- Réinitialise le lancer de dés
- Vérifie les conditions de victoire

## Règles Implémentées

- ✅ Distance minimale entre colonies (2 intersections)
- ✅ Connexion des routes et bâtiments
- ✅ Distribution des ressources selon les dés
- ✅ Gestion du voleur (7)
- ✅ Défausse si > 7 ressources lors du 7
- ✅ Plus grande armée (3+ chevaliers)
- ✅ Points de victoire automatiques
- ✅ Condition de victoire (10 points par défaut)

## À Améliorer

- [ ] Calcul de la route la plus longue (algorithme de graphe)
- [ ] Gestion des ports (2:1 et 3:1)
- [ ] Phase de setup complète (placement initial)
- [ ] Validation des échanges avec ports
- [ ] Gestion de l'état spécial "Route Gratuite"

