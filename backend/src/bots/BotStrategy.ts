import { GameState, Player, ActionType, HexCoordinate, BuildingType, ResourceType, DevelopmentCardType } from '@catan/shared';
import { BotLevel } from '@catan/shared';
import { BuildingValidator } from '../game/services/BuildingValidator.js';
import { ResourceManager } from '../game/services/ResourceManager.js';
import { BOARD_CONFIG } from '@catan/shared';

export interface BotAction {
  type: ActionType;
  payload?: any;
}

export class BotStrategy {
  /**
   * Génère une action pour un bot selon son niveau
   */
  static generateAction(gameState: GameState, botPlayer: Player, level: BotLevel): BotAction | null {
    switch (level) {
      case BotLevel.AMATEUR:
        return this.amateurStrategy(gameState, botPlayer);
      case BotLevel.INTERMEDIATE:
        return this.intermediateStrategy(gameState, botPlayer);
      case BotLevel.DIFFICULT:
        return this.difficultStrategy(gameState, botPlayer);
      default:
        return null;
    }
  }

  /**
   * Stratégie amateur : actions simples et aléatoires
   */
  private static amateurStrategy(gameState: GameState, botPlayer: Player): BotAction | null {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (currentPlayer.id !== botPlayer.id) {
      return null; // Ce n'est pas le tour du bot
    }

    // Si pas de dés lancés, lancer les dés
    if (!gameState.diceRoll) {
      return { type: ActionType.ROLL_DICE };
    }

    // Si 7, déplacer le voleur
    if (gameState.diceRoll.value === 7) {
      const availableTiles = gameState.board.tiles.filter(t => !t.hasRobber);
      if (availableTiles.length > 0) {
        const randomTile = availableTiles[Math.floor(Math.random() * availableTiles.length)];
        return {
          type: ActionType.MOVE_ROBBER,
          payload: { tileId: randomTile.id },
        };
      }
    }

    // Essayer de placer une colonie si possible
    const settlementAction = this.tryPlaceSettlement(gameState, botPlayer);
    if (settlementAction) return settlementAction;

    // Essayer de placer une route si possible
    const roadAction = this.tryPlaceRoad(gameState, botPlayer);
    if (roadAction) return roadAction;

    // Terminer le tour
    return { type: ActionType.END_TURN };
  }

  /**
   * Stratégie intermédiaire : meilleure gestion des ressources
   */
  private static intermediateStrategy(gameState: GameState, botPlayer: Player): BotAction | null {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (currentPlayer.id !== botPlayer.id) {
      return null;
    }

    if (!gameState.diceRoll) {
      return { type: ActionType.ROLL_DICE };
    }

    if (gameState.diceRoll.value === 7) {
      const bestTile = this.findBestRobberTile(gameState, botPlayer);
      if (bestTile) {
        return {
          type: ActionType.MOVE_ROBBER,
          payload: { tileId: bestTile.id },
        };
      }
    }

    // Prioriser les colonies sur les routes
    const settlementAction = this.tryPlaceSettlement(gameState, botPlayer);
    if (settlementAction) return settlementAction;

    // Essayer d'améliorer une colonie en ville
    const cityAction = this.tryUpgradeToCity(gameState, botPlayer);
    if (cityAction) return cityAction;

    const roadAction = this.tryPlaceRoad(gameState, botPlayer);
    if (roadAction) return roadAction;

    // Acheter une carte développement si on a assez de ressources
    if (ResourceManager.canAfford(botPlayer, BOARD_CONFIG.COSTS.DEVELOPMENT_CARD)) {
      return { type: ActionType.BUY_DEVELOPMENT_CARD };
    }

    return { type: ActionType.END_TURN };
  }

  /**
   * Stratégie difficile : stratégie optimale
   */
  private static difficultStrategy(gameState: GameState, botPlayer: Player): BotAction | null {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (currentPlayer.id !== botPlayer.id) {
      return null;
    }

    if (!gameState.diceRoll) {
      return { type: ActionType.ROLL_DICE };
    }

    if (gameState.diceRoll.value === 7) {
      const bestTile = this.findBestRobberTile(gameState, botPlayer);
      if (bestTile) {
        // Trouver le meilleur joueur à voler
        const targetPlayer = this.findBestPlayerToRob(gameState, botPlayer);
        return {
          type: ActionType.MOVE_ROBBER,
          payload: {
            tileId: bestTile.id,
            targetPlayerId: targetPlayer?.id,
          },
        };
      }
    }

    // Jouer une carte développement si avantageuse
    const cardAction = this.tryPlayDevelopmentCard(gameState, botPlayer);
    if (cardAction) return cardAction;

    // Prioriser les villes (plus de points)
    const cityAction = this.tryUpgradeToCity(gameState, botPlayer);
    if (cityAction) return cityAction;

    const settlementAction = this.tryPlaceSettlement(gameState, botPlayer);
    if (settlementAction) return settlementAction;

    const roadAction = this.tryPlaceRoad(gameState, botPlayer);
    if (roadAction) return roadAction;

    // Acheter une carte développement
    if (ResourceManager.canAfford(botPlayer, BOARD_CONFIG.COSTS.DEVELOPMENT_CARD)) {
      return { type: ActionType.BUY_DEVELOPMENT_CARD };
    }

    return { type: ActionType.END_TURN };
  }

  /**
   * Essaie de placer une colonie
   */
  private static tryPlaceSettlement(gameState: GameState, botPlayer: Player): BotAction | null {
    if (!ResourceManager.canAfford(botPlayer, BOARD_CONFIG.COSTS.SETTLEMENT)) {
      return null;
    }

    const availableIntersections = gameState.board.intersections.filter(i => !i.building);
    const isSetupPhase = gameState.phase === 'setup';

    for (const intersection of availableIntersections) {
      const validation = BuildingValidator.canPlaceSettlement(
        intersection.coordinate,
        botPlayer.id,
        gameState.board.intersections,
        gameState.board.roads,
        isSetupPhase
      );

      if (validation.valid) {
        return {
          type: ActionType.PLACE_SETTLEMENT,
          payload: { coordinate: intersection.coordinate },
        };
      }
    }

    return null;
  }

  /**
   * Essaie de placer une route
   */
  private static tryPlaceRoad(gameState: GameState, botPlayer: Player): BotAction | null {
    if (!ResourceManager.canAfford(botPlayer, BOARD_CONFIG.COSTS.ROAD)) {
      return null;
    }

    const availableIntersections = gameState.board.intersections;
    const isSetupPhase = gameState.phase === 'setup';

    // Trouver deux intersections adjacentes valides
    for (let i = 0; i < availableIntersections.length; i++) {
      for (let j = i + 1; j < availableIntersections.length; j++) {
        const from = availableIntersections[i].coordinate;
        const to = availableIntersections[j].coordinate;

        const validation = BuildingValidator.canPlaceRoad(
          from,
          to,
          botPlayer.id,
          gameState.board.intersections,
          gameState.board.roads,
          isSetupPhase
        );

        if (validation.valid) {
          return {
            type: ActionType.PLACE_ROAD,
            payload: { from, to },
          };
        }
      }
    }

    return null;
  }

  /**
   * Essaie d'améliorer une colonie en ville
   */
  private static tryUpgradeToCity(gameState: GameState, botPlayer: Player): BotAction | null {
    if (!ResourceManager.canAfford(botPlayer, BOARD_CONFIG.COSTS.CITY)) {
      return null;
    }

    const botSettlements = gameState.board.intersections.filter(
      i => i.building?.playerId === botPlayer.id && i.building.type === BuildingType.SETTLEMENT
    );

    if (botSettlements.length > 0) {
      const settlement = botSettlements[0];
      return {
        type: ActionType.PLACE_CITY,
        payload: { coordinate: settlement.coordinate },
      };
    }

    return null;
  }

  /**
   * Trouve la meilleure tuile pour déplacer le voleur
   */
  private static findBestRobberTile(gameState: GameState, botPlayer: Player): any {
    const availableTiles = gameState.board.tiles.filter(t => !t.hasRobber);
    
    // Trouver la tuile qui gêne le plus les adversaires
    let bestTile = availableTiles[0];
    let maxOpponentResources = 0;

    for (const tile of availableTiles) {
      // Compter les ressources des adversaires sur cette tuile
      let opponentResources = 0;
      const adjacentIntersections = this.getAdjacentIntersections(tile.coordinate, gameState.board.intersections);
      
      adjacentIntersections.forEach(intersection => {
        if (intersection.building && intersection.building.playerId !== botPlayer.id) {
          const amount = intersection.building.type === BuildingType.CITY ? 2 : 1;
          opponentResources += amount;
        }
      });

      if (opponentResources > maxOpponentResources) {
        maxOpponentResources = opponentResources;
        bestTile = tile;
      }
    }

    return bestTile;
  }

  /**
   * Trouve le meilleur joueur à voler
   */
  private static findBestPlayerToRob(gameState: GameState, botPlayer: Player): Player | null {
    const opponents = gameState.players.filter(p => p.id !== botPlayer.id);
    
    // Trouver le joueur avec le plus de ressources
    return opponents.reduce((best, current) => {
      const bestTotal = Object.values(best.resources).reduce((a, b) => a + b, 0);
      const currentTotal = Object.values(current.resources).reduce((a, b) => a + b, 0);
      return currentTotal > bestTotal ? current : best;
    }, opponents[0]) || null;
  }

  /**
   * Essaie de jouer une carte développement
   */
  private static tryPlayDevelopmentCard(gameState: GameState, botPlayer: Player): BotAction | null {
    if (botPlayer.developmentCards.length === 0) {
      return null;
    }

    // Jouer un chevalier si on a moins de 3 chevaliers joués
    const knightCount = botPlayer.playedDevelopmentCards.filter(c => c === DevelopmentCardType.KNIGHT).length;
    if (knightCount < 3 && botPlayer.developmentCards.includes(DevelopmentCardType.KNIGHT)) {
      const bestTile = this.findBestRobberTile(gameState, botPlayer);
      const targetPlayer = this.findBestPlayerToRob(gameState, botPlayer);
      
      return {
        type: ActionType.PLAY_DEVELOPMENT_CARD,
        payload: {
          cardType: DevelopmentCardType.KNIGHT,
          data: {
            tileId: bestTile?.id,
            targetPlayerId: targetPlayer?.id,
          },
        },
      };
    }

    // Jouer monopole si on a peu de ressources
    const totalResources = Object.values(botPlayer.resources).reduce((a, b) => a + b, 0);
    if (totalResources < 3 && botPlayer.developmentCards.includes(DevelopmentCardType.MONOPOLY)) {
      // Prendre la ressource la plus rare
      const resourceTypes: ResourceType[] = [ResourceType.WOOD, ResourceType.BRICK, ResourceType.SHEEP, ResourceType.WHEAT, ResourceType.ORE];
      const rarestResource = resourceTypes.reduce((rarest, current) => {
        const currentCount = botPlayer.resources[current as keyof typeof botPlayer.resources] || 0;
        const rarestCount = botPlayer.resources[rarest as keyof typeof botPlayer.resources] || 0;
        return currentCount < rarestCount ? current : rarest;
      });

      return {
        type: ActionType.PLAY_DEVELOPMENT_CARD,
        payload: {
          cardType: DevelopmentCardType.MONOPOLY,
          data: { resourceType: rarestResource },
        },
      };
    }

    return null;
  }

  /**
   * Trouve les intersections adjacentes à une tuile
   */
  private static getAdjacentIntersections(tileCoord: HexCoordinate, intersections: any[]): any[] {
    const offsets = [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
    ];

    return intersections.filter(intersection => {
      return offsets.some(offset => {
        const expectedCoord = {
          q: tileCoord.q + offset.q,
          r: tileCoord.r + offset.r,
        };
        return (
          intersection.coordinate.q === expectedCoord.q &&
          intersection.coordinate.r === expectedCoord.r
        );
      });
    });
  }
}

