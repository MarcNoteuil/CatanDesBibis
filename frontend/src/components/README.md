# Composants de l'Interface Utilisateur

## Architecture

L'interface utilisateur est organisée en plusieurs composants réutilisables :

### Composants Principaux

1. **GameBoard** (`GameBoard.tsx`)
   - Composant principal du plateau de jeu
   - Gère l'état local et la communication Socket.io
   - Coordonne tous les sous-composants

2. **Board** (`Board.tsx`)
   - Affiche le plateau hexagonal en SVG
   - Gère le rendu des tuiles, intersections et routes
   - Calcul des positions hexagonales

3. **HexTile** (`HexTile.tsx`)
   - Affiche une tuile hexagonale individuelle
   - Couleurs selon le type de terrain
   - Affiche le numéro de la tuile et le voleur

4. **Intersection** (`Intersection.tsx`)
   - Affiche une intersection (point de placement)
   - Affiche les colonies et villes
   - Gère les interactions (clics)

5. **PlayerPanel** (`PlayerPanel.tsx`)
   - Affiche les informations d'un joueur
   - Ressources, bâtiments, points de victoire
   - Indicateur de tour actif

6. **GameActions** (`GameActions.tsx`)
   - Panneau d'actions du joueur
   - Boutons pour toutes les actions possibles
   - Validation contextuelle

7. **DevelopmentCardModal** (`DevelopmentCardModal.tsx`)
   - Modal pour voir et jouer les cartes développement
   - Liste toutes les cartes du joueur

### Hooks

- **useGameSocket** (`hooks/useGameSocket.ts`)
  - Gère la connexion Socket.io
  - Synchronise l'état du jeu
  - Envoie les actions au serveur

### Utilitaires

- **hexUtils** (`utils/hexUtils.ts`)
  - Conversion coordonnées hexagonales ↔ pixels
  - Calculs géométriques pour le rendu hexagonal

## Fonctionnalités Visuelles

### ✅ Plateau Hexagonal
- Rendu SVG précis des tuiles
- Couleurs distinctes par type de terrain
- Numéros de tuiles avec codes couleur (6 et 8 en rouge)
- Affichage du voleur

### ✅ Intersections
- Cercles cliquables pour les placements
- Affichage des colonies (petit cercle)
- Affichage des villes (triangle)
- Couleurs selon le joueur propriétaire

### ✅ Routes
- Lignes colorées entre intersections
- Couleur selon le joueur propriétaire
- Rendu en arrière-plan

### ✅ Interface Utilisateur
- Design moderne avec Tailwind CSS
- Responsive (mobile et desktop)
- Indicateurs visuels clairs
- Feedback utilisateur (sélections, hover)

### ✅ Actions de Jeu
- Boutons contextuels selon l'état
- Validation avant envoi
- Messages d'erreur clairs
- Confirmation pour actions importantes

## Interactions

### Clics sur le Plateau
- **Tuile** : Sélectionne la tuile (pour déplacer le voleur)
- **Intersection** : Sélectionne l'intersection (pour placer un bâtiment)
- **Route** : À implémenter (sélection entre deux intersections)

### Actions Disponibles
- 🎲 Lancer les dés
- 🏘️ Placer une colonie
- 🏛️ Placer une ville
- 🛣️ Placer une route
- 🎴 Acheter/Jouer une carte développement
- 👹 Déplacer le voleur (si 7)
- ✓ Terminer le tour

## Améliorations Futures

- [ ] Animation des dés
- [ ] Effets de transition pour les actions
- [ ] Tooltips informatifs
- [ ] Zoom et pan sur le plateau
- [ ] Historique des actions
- [ ] Chat entre joueurs
- [ ] Indicateurs de validité des placements
- [ ] Mode spectateur

