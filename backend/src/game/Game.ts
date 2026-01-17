import { GameState, Player, GamePhase, ActionType, GameAction } from '@catan/shared';
import { BoardGenerator } from './BoardGenerator.js';
import { GameLogic } from './services/GameLogic.js';
import { DevelopmentCardDeck } from './services/DevelopmentCardDeck.js';

export class Game {
  private state: GameState;
  private boardGenerator: BoardGenerator;
  private developmentCardDeck: DevelopmentCardDeck;

  constructor(gameId: string, initialState?: GameState, playerCount?: number) {
    this.boardGenerator = new BoardGenerator();
    this.developmentCardDeck = new DevelopmentCardDeck();

    if (initialState) {
      this.state = initialState;
    } else {
      const board = this.boardGenerator.generateBoard(playerCount || 4);
      this.state = {
        id: gameId,
        players: [],
        currentPlayerIndex: 0,
        board,
        phase: GamePhase.SETUP,
        turnNumber: 0,
        bank: {
          wood: 19,
          brick: 19,
          sheep: 19,
          wheat: 19,
          ore: 19,
        } as GameState['bank'],
        setupRound: 1, // Premier tour (ordre normal)
        setupSettlementsPlaced: 0,
      };
    }
  }

  getDevelopmentCardDeck(): DevelopmentCardDeck {
    return this.developmentCardDeck;
  }

  addPlayer(player: Player): void {
    this.state.players.push(player);
  }

  getState(): GameState {
    return JSON.parse(JSON.stringify(this.state)); // Deep copy
  }

  processAction(action: GameAction): GameState {
    try {
      // S'assurer que le deck est disponible pour GameLogic
      GameLogic.setDevelopmentCardDeck(this.developmentCardDeck);
      this.state = GameLogic.processAction(this.state, action);
      return this.getState();
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors du traitement de l\'action');
    }
  }

  startGame(): void {
    if (this.state.players.length < 2) {
      throw new Error('Au moins 2 joueurs sont nécessaires pour démarrer');
    }
    if (this.state.players.length > 8) {
      throw new Error('Maximum 8 joueurs autorisés');
    }
    this.state.phase = GamePhase.PLAYING;
    this.state.turnNumber = 1;
  }
}

