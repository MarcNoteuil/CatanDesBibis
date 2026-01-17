import { Server, Socket } from 'socket.io';
import { GameManager } from '../game/GameManager.js';
import { GameService } from '../services/GameService.js';
import { BotManager } from '../bots/BotManager.js';

// Fonction récursive pour traiter les actions des bots
async function processBotAction(
  gameId: string,
  gameState: any,
  botPlayerId: string,
  gameManager: GameManager,
  io: Server
): Promise<void> {
  const botAction = BotManager.processBotTurn(gameState);
  if (!botAction) {
    return;
  }

  try {
    // Recharger l'état à jour
    const updatedState = await GameService.loadGame(gameId);
    if (!updatedState) {
      return;
    }

    const gameInstance = gameManager.getGameInstance(gameId) || gameManager.createGameFromState(updatedState);
    gameManager.setGame(gameId, gameInstance);
    
    const finalState = gameManager.processAction(gameId, {
      ...botAction,
      playerId: botPlayerId,
    });
    
    await GameService.saveGameState(finalState);
    
    if (finalState.phase === 'finished') {
      await GameService.finishGame(gameId);
    }
    
    io.to(`game:${gameId}`).emit('game-state', finalState);

    // Si après l'action du bot, c'est encore le tour d'un bot, continuer
    const nextPlayer = finalState.players[finalState.currentPlayerIndex];
    if (nextPlayer.isBot) {
      setTimeout(async () => {
        await processBotAction(gameId, finalState, nextPlayer.id, gameManager, io);
      }, 1000);
    }
  } catch (error: any) {
    console.error('Erreur lors du traitement de l\'action du bot:', error);
  }
}

export function socketHandler(io: Server) {
  const gameManager = GameManager.getInstance();

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connecté: ${socket.id}`);

    // Rejoindre une partie
    socket.on('join-game', async ({ gameId, playerId }) => {
      socket.join(`game:${gameId}`);
      console.log(`👤 Joueur ${playerId} a rejoint la partie ${gameId}`);
      
      const game = await GameService.loadGame(gameId);
      if (game) {
        // Charger dans le cache pour les actions
        const gameInstance = gameManager.createGameFromState(game);
        gameManager.setGame(gameId, gameInstance);
        
        socket.emit('game-state', game);
        socket.to(`game:${gameId}`).emit('player-joined', { playerId });

        // Si c'est le tour d'un bot au moment de la connexion, le faire jouer
        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.isBot) {
          setTimeout(async () => {
            await processBotAction(gameId, game, currentPlayer.id, gameManager, io);
          }, 1000);
        }
      }
    });

    // Quitter une partie
    socket.on('leave-game', ({ gameId }) => {
      socket.leave(`game:${gameId}`);
      console.log(`👋 Client ${socket.id} a quitté la partie ${gameId}`);
    });

    // Action de jeu
    socket.on('game-action', async ({ gameId, action }) => {
      try {
        // Charger depuis la DB si pas en cache
        let gameState = await GameService.loadGame(gameId);
        if (!gameState) {
          socket.emit('error', { message: 'Partie non trouvée' });
          return;
        }

        // S'assurer que le jeu est en cache
        let gameInstance = gameManager.getGameInstance(gameId);
        if (!gameInstance) {
          gameInstance = gameManager.createGameFromState(gameState);
          gameManager.setGame(gameId, gameInstance);
        }

        // Note: Le playerId dans l'action doit être le GamePlayer.id, pas le User.id
        // Cette conversion devrait être faite côté client ou dans un middleware
        const newState = gameManager.processAction(gameId, action);

        // Sauvegarder en DB
        await GameService.saveGameState(newState);

        // Vérifier si la partie est terminée
        if (newState.phase === 'finished') {
          await GameService.finishGame(gameId);
        }

        // Diffuser le nouvel état
        io.to(`game:${gameId}`).emit('game-state', newState);

        // Si c'est le tour d'un bot, générer son action après un délai
        const currentPlayer = newState.players[newState.currentPlayerIndex];
        if (currentPlayer.isBot) {
          setTimeout(async () => {
            await processBotAction(gameId, newState, currentPlayer.id, gameManager, io);
          }, 1000); // Délai de 1 seconde pour le bot
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Déconnexion
    socket.on('disconnect', () => {
      console.log(`🔌 Client déconnecté: ${socket.id}`);
    });
  });
}

