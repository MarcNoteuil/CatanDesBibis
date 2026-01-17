import { v4 as uuidv4 } from 'uuid';
import { GameState, Player, GamePhase, GameAction } from '@catan/shared';
import { PLAYER_COLORS } from '@catan/shared';
import { Game } from './Game.js';
import { GameLogic } from './services/GameLogic.js';
import { DevelopmentCardDeck } from './services/DevelopmentCardDeck.js';

export class GameManager {
  private static instance: GameManager;
  private games: Map<string, Game> = new Map();
  private decks: Map<string, DevelopmentCardDeck> = new Map();

  private constructor() {}

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * Crée un jeu depuis un état existant (pour charger depuis la DB)
   */
  createGameFromState(gameState: GameState): Game {
    const game = new Game(gameState.id, gameState);
    this.games.set(gameState.id, game);
    return game;
  }

  /**
   * Définit un jeu dans le cache
   */
  setGame(gameId: string, game: Game): void {
    this.games.set(gameId, game);
  }

  /**
   * Traite une action et retourne le nouvel état
   */
  processAction(gameId: string, action: GameAction): GameState {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Partie non trouvée');
    }

    // S'assurer que le deck est disponible
    if (!this.decks.has(gameId)) {
      this.decks.set(gameId, new DevelopmentCardDeck());
    }
    GameLogic.setDevelopmentCardDeck(this.decks.get(gameId)!);

    return game.processAction(action);
  }

  createGame(playerName: string): GameState {
    const gameId = uuidv4();
    const game = new Game(gameId);
    
    // Ajouter le premier joueur (créateur)
    const player: Player = {
      id: uuidv4(),
      name: playerName,
      color: PLAYER_COLORS[0],
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
    };

    game.addPlayer(player);
    this.games.set(gameId, game);
    
    return game.getState();
  }

  joinGame(gameId: string, playerName: string): Player {
    const game = this.games.get(gameId);
    
    if (!game) {
      throw new Error('Partie non trouvée');
    }

    if (game.getState().players.length >= 8) {
      throw new Error('La partie est complète (8 joueurs maximum)');
    }

    const playerIndex = game.getState().players.length;
    const player: Player = {
      id: uuidv4(),
      name: playerName,
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
    };

    game.addPlayer(player);
    return player;
  }

  getGame(gameId: string): GameState | null {
    const game = this.games.get(gameId);
    return game ? game.getState() : null;
  }

  getGameInstance(gameId: string): Game | null {
    return this.games.get(gameId) || null;
  }

  listGames(): Game[] {
    return Array.from(this.games.values());
  }

  removeGame(gameId: string): void {
    this.games.delete(gameId);
  }
}

