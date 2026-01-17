import { GameState, Player, BotLevel } from '@catan/shared';
import { PLAYER_COLORS } from '@catan/shared';
import { BotStrategy, BotAction } from './BotStrategy.js';
import { v4 as uuidv4 } from 'uuid';

export class BotManager {
  private static botNames: Record<BotLevel, string[]> = {
    [BotLevel.AMATEUR]: ['Bot Amateur 1', 'Bot Amateur 2', 'Bot Amateur 3'],
    [BotLevel.INTERMEDIATE]: ['Bot Intermédiaire 1', 'Bot Intermédiaire 2', 'Bot Intermédiaire 3'],
    [BotLevel.DIFFICULT]: ['Bot Difficile 1', 'Bot Difficile 2', 'Bot Difficile 3'],
  };

  /**
   * Crée un joueur bot
   */
  static createBot(level: BotLevel, playerIndex: number): Player {
    const names = this.botNames[level];
    const nameIndex = playerIndex % names.length;

    return {
      id: uuidv4(),
      name: names[nameIndex],
      color: PLAYER_COLORS[playerIndex],
      resources: {
        wood: 0,
        brick: 0,
        sheep: 0,
        wheat: 0,
        ore: 0,
      },
      developmentCards: [],
      playedDevelopmentCards: [],
      buildings: {
        settlements: 0,
        cities: 0,
        roads: 0,
      },
      victoryPoints: 0,
      longestRoad: false,
      largestArmy: false,
      isActive: true,
      isBot: true,
      botLevel: level,
    };
  }

  /**
   * Génère une action pour un bot
   */
  static generateBotAction(gameState: GameState, botPlayer: Player): BotAction | null {
    if (!botPlayer.isBot || !botPlayer.botLevel) {
      return null;
    }

    return BotStrategy.generateAction(gameState, botPlayer, botPlayer.botLevel as BotLevel);
  }

  /**
   * Vérifie si c'est le tour d'un bot et génère son action
   */
  static processBotTurn(gameState: GameState): BotAction | null {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (!currentPlayer.isBot) {
      return null;
    }

    return this.generateBotAction(gameState, currentPlayer);
  }
}

