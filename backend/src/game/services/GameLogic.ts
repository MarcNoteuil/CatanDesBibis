import {
  GameState,
  GameAction,
  ActionType,
  BuildingType,
  ResourceType,
  DevelopmentCardType,
  GamePhase,
  Player,
} from '@catan/shared';
import { BOARD_CONFIG } from '@catan/shared';
import { DiceService } from './DiceService.js';
import { ResourceManager } from './ResourceManager.js';
import { BuildingValidator } from './BuildingValidator.js';
import { DevelopmentCardDeck } from './DevelopmentCardDeck.js';
import { v4 as uuidv4 } from 'uuid';

export class GameLogic {
  private static developmentCardDeck: DevelopmentCardDeck | null = null;

  /**
   * Définit le deck de cartes développement
   */
  static setDevelopmentCardDeck(deck: DevelopmentCardDeck): void {
    this.developmentCardDeck = deck;
  }

  /**
   * Traite une action de jeu
   */
  static processAction(gameState: GameState, action: GameAction): GameState {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // Vérifier que c'est le tour du joueur
    if (currentPlayer.id !== action.playerId) {
      throw new Error("Ce n'est pas votre tour");
    }

    switch (action.type) {
      case ActionType.ROLL_DICE:
        return this.handleRollDice(gameState, action.playerId);

      case ActionType.PLACE_SETTLEMENT:
        return this.handlePlaceSettlement(gameState, action.playerId, action.payload);

      case ActionType.PLACE_CITY:
        return this.handlePlaceCity(gameState, action.playerId, action.payload);

      case ActionType.PLACE_ROAD:
        return this.handlePlaceRoad(gameState, action.playerId, action.payload);

      case ActionType.BUY_DEVELOPMENT_CARD:
        return this.handleBuyDevelopmentCard(gameState, action.playerId);

      case ActionType.PLAY_DEVELOPMENT_CARD:
        return this.handlePlayDevelopmentCard(gameState, action.playerId, action.payload);

      case ActionType.MOVE_ROBBER:
        return this.handleMoveRobber(gameState, action.playerId, action.payload);

      case ActionType.TRADE:
        return this.handleTrade(gameState, action.playerId, action.payload);

      case ActionType.END_TURN:
        return this.handleEndTurn(gameState);

      default:
        throw new Error(`Action non reconnue: ${action.type}`);
    }
  }

  /**
   * Lance les dés
   */
  private static handleRollDice(gameState: GameState, playerId: string): GameState {
    if (gameState.diceRoll) {
      throw new Error('Les dés ont déjà été lancés ce tour');
    }

    const diceValue = DiceService.rollDice();
    gameState.diceRoll = { value: diceValue, playerId };

    if (DiceService.isRobber(diceValue)) {
      // Le voleur est activé, pas de distribution de ressources
      // Le joueur doit déplacer le voleur
    } else {
      // Distribuer les ressources
      ResourceManager.distributeResources(gameState, diceValue);
    }

    return gameState;
  }

  /**
   * Place une colonie
   */
  private static handlePlaceSettlement(
    gameState: GameState,
    playerId: string,
    payload: { coordinate: { q: number; r: number } }
  ): GameState {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) throw new Error('Joueur non trouvé');

    const isSetupPhase = gameState.phase === GamePhase.SETUP;
    
    // En phase de setup, les placements sont gratuits
    // En phase de test, permettre le placement même sans ressources
    if (!isSetupPhase) {
      // Vérifier les ressources (mais permettre en mode test)
      const cost = BOARD_CONFIG.COSTS.SETTLEMENT;
      if (!ResourceManager.canAfford(player, cost)) {
        // En mode test, permettre quand même (commenter pour activer la vérification)
        // throw new Error('Ressources insuffisantes');
        console.log('⚠️ Mode test: placement de colonie sans ressources');
      }
    }

    // Vérifier la validité du placement
    const validation = BuildingValidator.canPlaceSettlement(
      payload.coordinate,
      playerId,
      gameState.board.intersections,
      gameState.board.roads,
      isSetupPhase
    );

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    // Placer la colonie
    const intersection = gameState.board.intersections.find(
      i => i.coordinate.q === payload.coordinate.q && i.coordinate.r === payload.coordinate.r
    );

    if (intersection) {
      intersection.building = {
        type: BuildingType.SETTLEMENT,
        playerId,
      };
      player.buildings.settlements++;
      player.victoryPoints++;

      // Déduire les ressources seulement si pas en setup
      if (!isSetupPhase) {
        const cost = BOARD_CONFIG.COSTS.SETTLEMENT;
        ResourceManager.deductResources(player, cost);
      } else {
        // En setup, incrémenter le compteur
        gameState.setupSettlementsPlaced = (gameState.setupSettlementsPlaced || 0) + 1;
        
        // Si c'est la dernière colonie du deuxième tour, donner les ressources
        const totalPlayers = gameState.players.length;
        const expectedSettlements = totalPlayers * 2; // 2 colonies par joueur
        
        if (gameState.setupSettlementsPlaced === expectedSettlements) {
          // C'est la dernière colonie, donner les ressources
          this.giveInitialResources(gameState, payload.coordinate, player);
        }
      }
    }

    return gameState;
  }

  /**
   * Place une ville (améliore une colonie)
   */
  private static handlePlaceCity(
    gameState: GameState,
    playerId: string,
    payload: { coordinate: { q: number; r: number } }
  ): GameState {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) throw new Error('Joueur non trouvé');

    // Vérifier les ressources
    const cost = BOARD_CONFIG.COSTS.CITY;
    if (!ResourceManager.canAfford(player, cost)) {
      throw new Error('Ressources insuffisantes');
    }

    // Vérifier la validité
    const validation = BuildingValidator.canUpgradeToCity(
      payload.coordinate,
      playerId,
      gameState.board.intersections
    );

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    // Améliorer en ville
    const intersection = gameState.board.intersections.find(
      i => i.coordinate.q === payload.coordinate.q && i.coordinate.r === payload.coordinate.r
    );

    if (intersection && intersection.building) {
      intersection.building.type = BuildingType.CITY;
      player.buildings.settlements--;
      player.buildings.cities++;
      player.victoryPoints++; // +1 point (colonie = 1, ville = 2, donc +1)

      // Déduire les ressources
      ResourceManager.deductResources(player, cost);
    }

    return gameState;
  }

  /**
   * Place une route
   */
  private static handlePlaceRoad(
    gameState: GameState,
    playerId: string,
    payload: { from: { q: number; r: number }; to: { q: number; r: number } }
  ): GameState {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) throw new Error('Joueur non trouvé');

    const isSetupPhase = gameState.phase === GamePhase.SETUP;
    
    // En phase de setup, les placements sont gratuits
    if (!isSetupPhase) {
      // Vérifier les ressources
      const cost = BOARD_CONFIG.COSTS.ROAD;
      if (!ResourceManager.canAfford(player, cost)) {
        throw new Error('Ressources insuffisantes');
      }
    }

    // Vérifier la validité
    const validation = BuildingValidator.canPlaceRoad(
      payload.from,
      payload.to,
      playerId,
      gameState.board.intersections,
      gameState.board.roads,
      isSetupPhase
    );

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    // Placer la route
    const road = {
      id: uuidv4(),
      from: payload.from,
      to: payload.to,
      playerId,
    };

    gameState.board.roads.push(road);
    player.buildings.roads++;

    // Déduire les ressources seulement si pas en setup
    if (!isSetupPhase) {
      const cost = BOARD_CONFIG.COSTS.ROAD;
      ResourceManager.deductResources(player, cost);
    }

    // Vérifier la route la plus longue
    this.updateLongestRoad(gameState);

    return gameState;
  }

  /**
   * Achète une carte développement
   */
  private static handleBuyDevelopmentCard(
    gameState: GameState,
    playerId: string
  ): GameState {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) throw new Error('Joueur non trouvé');

    // Vérifier les ressources
    const cost = BOARD_CONFIG.COSTS.DEVELOPMENT_CARD;
    if (!ResourceManager.canAfford(player, cost)) {
      throw new Error('Ressources insuffisantes');
    }

    // Vérifier qu'il reste des cartes
    if (!this.developmentCardDeck || this.developmentCardDeck.getRemainingCount() === 0) {
      throw new Error('Plus de cartes développement disponibles');
    }

    // Déduire les ressources
    ResourceManager.deductResources(player, cost);

    // Piocher une carte
    const card = this.developmentCardDeck.draw();
    if (card) {
      player.developmentCards.push(card);

      // Si c'est une carte point de victoire, l'ajouter immédiatement
      if (card === DevelopmentCardType.VICTORY_POINT) {
        player.victoryPoints++;
      }
    }

    return gameState;
  }

  /**
   * Joue une carte développement
   */
  private static handlePlayDevelopmentCard(
    gameState: GameState,
    playerId: string,
    payload: { cardType: DevelopmentCardType; data?: any }
  ): GameState {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) throw new Error('Joueur non trouvé');

    // Vérifier que le joueur a la carte
    const cardIndex = player.developmentCards.indexOf(payload.cardType);
    if (cardIndex === -1) {
      throw new Error("Vous n'avez pas cette carte");
    }

    // Retirer la carte
    player.developmentCards.splice(cardIndex, 1);
    player.playedDevelopmentCards.push(payload.cardType);

    // Appliquer l'effet de la carte
    switch (payload.cardType) {
      case DevelopmentCardType.KNIGHT:
        // Déplacer le voleur
        if (payload.data?.tileId && payload.data?.targetPlayerId) {
          const stolenResource = ResourceManager.handleRobber(
            gameState,
            payload.data.targetPlayerId,
            payload.data.tileId
          );
          if (stolenResource) {
            ResourceManager.addResources(player, { [stolenResource]: 1 });
          }
        }
        // Vérifier la plus grande armée
        this.updateLargestArmy(gameState, playerId);
        break;

      case DevelopmentCardType.ROAD_BUILDING:
        // Permet de placer 2 routes gratuitement
        // TODO: Implémenter l'état spécial pour cette action
        break;

      case DevelopmentCardType.YEAR_OF_PLENTY:
        // Prendre 2 ressources de son choix
        if (payload.data?.resources) {
          ResourceManager.addResources(player, payload.data.resources);
        }
        break;

      case DevelopmentCardType.MONOPOLY:
        // Prendre toutes les ressources d'un type de tous les joueurs
        if (payload.data?.resourceType) {
          const resourceType = payload.data.resourceType as keyof Player['resources'];
          gameState.players.forEach(p => {
            if (p.id !== playerId && p.resources[resourceType] > 0) {
              const amount = p.resources[resourceType];
              ResourceManager.deductResources(p, { [resourceType]: amount } as any);
              ResourceManager.addResources(player, { [resourceType]: amount } as any);
            }
          });
        }
        break;
    }

    return gameState;
  }

  /**
   * Déplace le voleur
   */
  private static handleMoveRobber(
    gameState: GameState,
    playerId: string,
    payload: { tileId: string; targetPlayerId?: string }
  ): GameState {
    // Déplacer le voleur
    gameState.board.tiles.forEach(tile => {
      tile.hasRobber = tile.id === payload.tileId;
    });

    // Voler une ressource si un joueur est ciblé
    if (payload.targetPlayerId) {
      const player = gameState.players.find(p => p.id === playerId);
      const stolenResource = ResourceManager.handleRobber(
        gameState,
        payload.targetPlayerId,
        payload.tileId
      );
      if (stolenResource && player) {
        ResourceManager.addResources(player, { [stolenResource]: 1 } as any);
      }
    }

    return gameState;
  }

  /**
   * Échange de ressources
   */
  private static handleTrade(
    gameState: GameState,
    playerId: string,
    payload: {
      give: Partial<Player['resources']>;
      receive: Partial<Player['resources']>;
      targetPlayerId?: string; // Si défini, échange avec un joueur
    }
  ): GameState {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) throw new Error('Joueur non trouvé');

    // Vérifier que le joueur a les ressources à donner
    for (const [resource, amount] of Object.entries(payload.give)) {
      const resourceKey = resource as keyof Player['resources'];
      if ((player.resources[resourceKey] || 0) < (amount || 0)) {
        throw new Error('Ressources insuffisantes pour l\'échange');
      }
    }

    // Échange avec un autre joueur
    if (payload.targetPlayerId) {
      const targetPlayer = gameState.players.find(p => p.id === payload.targetPlayerId);
      if (!targetPlayer) throw new Error('Joueur cible non trouvé');

      // Vérifier que le joueur cible a les ressources
      for (const [resource, amount] of Object.entries(payload.receive)) {
        const resourceKey = resource as keyof Player['resources'];
        if ((targetPlayer.resources[resourceKey] || 0) < (amount || 0)) {
          throw new Error('Le joueur cible n\'a pas assez de ressources');
        }
      }

      // Effectuer l'échange
      ResourceManager.deductResources(player, payload.give as Partial<Player['resources']>);
      ResourceManager.addResources(player, payload.receive);
      ResourceManager.deductResources(targetPlayer, payload.receive as Partial<Player['resources']>);
      ResourceManager.addResources(targetPlayer, payload.give);
    } else {
      // Échange avec la banque (ratio 4:1 par défaut, ou 2:1 avec port)
      // TODO: Vérifier les ports du joueur
      ResourceManager.deductResources(player, payload.give as Partial<Player['resources']>);
      ResourceManager.addResources(player, payload.receive);
    }

    return gameState;
  }

  /**
   * Termine le tour
   */
  private static handleEndTurn(gameState: GameState): GameState {
    // Réinitialiser le lancer de dés
    gameState.diceRoll = undefined;

    // Passer au joueur suivant
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    gameState.turnNumber++;

    // Vérifier les conditions de victoire
    this.checkWinCondition(gameState);

    return gameState;
  }

  /**
   * Donne les ressources initiales lors du placement en phase setup
   * Trouve les tuiles adjacentes à l'intersection et donne les ressources correspondantes
   */
  private static giveInitialResources(
    gameState: GameState,
    coordinate: { q: number; r: number },
    player: any
  ): void {
    // Trouver les tuiles adjacentes à cette intersection
    const adjacentTiles = this.getAdjacentTiles(coordinate, gameState.board.tiles);
    
    // Donner une ressource de chaque tuile adjacente (sauf désert)
    adjacentTiles.forEach(tile => {
      if (tile.resource && tile.resource !== ResourceType.DESERT) {
        ResourceManager.addResources(player, { [tile.resource]: 1 } as any);
      }
    });
  }

  /**
   * Trouve les tuiles adjacentes à une intersection
   * Une intersection est au coin de 3 tuiles hexagonales
   * Les coordonnées d'une intersection sont générées avec les offsets des tuiles
   */
  private static getAdjacentTiles(
    intersectionCoord: { q: number; r: number },
    tiles: any[]
  ): any[] {
    const adjacentTiles: any[] = [];
    
    // Une intersection est créée à partir des offsets d'une tuile
    // Les offsets utilisés dans BoardGenerator sont :
    // { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 }, { q: -1, r: 0 }, { q: -1, r: 1 }
    // Donc une intersection à (q, r) peut être adjacente à des tuiles à :
    // - (q, r) si offset était (0, 0)
    // - (q-1, r) si offset était (1, 0)
    // - (q-1, r+1) si offset était (1, -1)
    // - (q, r+1) si offset était (0, -1)
    // - (q+1, r) si offset était (-1, 0)
    // - (q+1, r-1) si offset était (-1, 1)
    
    const possibleTileCoords = [
      { q: intersectionCoord.q, r: intersectionCoord.r },
      { q: intersectionCoord.q - 1, r: intersectionCoord.r },
      { q: intersectionCoord.q - 1, r: intersectionCoord.r + 1 },
      { q: intersectionCoord.q, r: intersectionCoord.r + 1 },
      { q: intersectionCoord.q + 1, r: intersectionCoord.r },
      { q: intersectionCoord.q + 1, r: intersectionCoord.r - 1 },
    ];
    
    // Pour chaque coordonnée possible, chercher une tuile
    possibleTileCoords.forEach(tileCoord => {
      const tile = tiles.find(
        t => t.coordinate.q === tileCoord.q && t.coordinate.r === tileCoord.r
      );
      
      if (tile && !adjacentTiles.find(t => t.id === tile.id)) {
        adjacentTiles.push(tile);
      }
    });
    
    // Une intersection devrait avoir exactement 3 tuiles adjacentes
    // Mais on retourne toutes celles qu'on trouve (peut être moins si on est au bord)
    return adjacentTiles;
  }

  /**
   * Met à jour la route la plus longue
   */
  private static updateLongestRoad(gameState: GameState): void {
    // TODO: Implémenter l'algorithme de calcul de la route la plus longue
    // Pour l'instant, on laisse vide
  }

  /**
   * Met à jour la plus grande armée
   */
  private static updateLargestArmy(gameState: GameState, playerId: string): void {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;

    const knightCount = player.playedDevelopmentCards.filter(
      c => c === DevelopmentCardType.KNIGHT
    ).length;

    if (knightCount >= 3) {
      // Retirer le bonus des autres joueurs
      gameState.players.forEach(p => {
        if (p.id !== playerId) {
          if (p.largestArmy) {
            p.largestArmy = false;
            p.victoryPoints -= BOARD_CONFIG.VICTORY_POINTS.LARGEST_ARMY;
          }
        }
      });

      // Vérifier si ce joueur a plus de chevaliers que les autres
      const maxKnightCount = Math.max(
        ...gameState.players.map(p =>
          p.playedDevelopmentCards.filter(c => c === DevelopmentCardType.KNIGHT).length
        )
      );

      if (knightCount === maxKnightCount && !player.largestArmy) {
        player.largestArmy = true;
        player.victoryPoints += BOARD_CONFIG.VICTORY_POINTS.LARGEST_ARMY;
      }
    }
  }

  /**
   * Vérifie les conditions de victoire
   */
  private static checkWinCondition(gameState: GameState): void {
    gameState.players.forEach(player => {
      if (player.victoryPoints >= BOARD_CONFIG.VICTORY_POINTS.WIN_CONDITION) {
        gameState.phase = GamePhase.FINISHED;
      }
    });
  }
}

