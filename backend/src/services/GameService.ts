import prisma from '../db/prisma.js';
import { GameState, Player, GamePhase, BotLevel } from '@catan/shared';
import { PLAYER_COLORS } from '@catan/shared';
import { BoardGenerator } from '../game/BoardGenerator.js';
import { PointsService } from './PointsService.js';
import { BotManager } from '../bots/BotManager.js';

export class GameService {
  /**
   * Crée une nouvelle partie en base de données
   */
  static async createGame(userId: string, botConfigs: Array<{ level: BotLevel }> = []): Promise<{ gameId: string; playerId: string }> {
    const totalPlayers = 1 + botConfigs.length; // 1 joueur humain + bots
    
    if (totalPlayers < 2 || totalPlayers > 8) {
      throw new Error('Une partie doit avoir entre 2 et 8 joueurs');
    }

    const boardGenerator = new BoardGenerator();
    const board = boardGenerator.generateBoard(totalPlayers);

    // Créer les joueurs (humain + bots)
    const playersData = [
      {
        userId,
        playerIndex: 0,
        color: PLAYER_COLORS[0],
        isBot: false,
      },
      ...botConfigs.map((config, index) => {
        const bot = BotManager.createBot(config.level, index + 1);
        return {
          userId: null as any, // Les bots n'ont pas de userId
          playerIndex: index + 1,
          color: bot.color,
          isBot: true,
          botLevel: config.level,
          botName: bot.name,
        };
      }),
    ];

    // Créer la partie en base
    const game = await prisma.game.create({
      data: {
        status: 'waiting',
        phase: 'setup',
        gameState: {
          create: {
            boardData: board as any,
            bank: {
              wood: 19,
              brick: 19,
              sheep: 19,
              wheat: 19,
              ore: 19,
            },
          },
        },
        players: {
          create: playersData.map((p: any, idx: number) => {
            const bot = p.isBot ? BotManager.createBot(p.botLevel as BotLevel, p.playerIndex) : null;
            return {
              userId: p.userId,
              playerIndex: p.playerIndex,
              color: p.color,
              isBot: p.isBot || false,
              botLevel: p.botLevel || null,
              botName: bot?.name || null,
              resources: {
                wood: 0,
                brick: 0,
                sheep: 0,
                wheat: 0,
                ore: 0,
              },
              buildings: {
                settlements: 0,
                cities: 0,
                roads: 0,
              },
              developmentCards: [],
              playedDevelopmentCards: [],
            };
          }),
        },
      },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        gameState: true,
      },
    });

    // Mettre à jour les noms des bots
    for (let i = 0; i < botConfigs.length; i++) {
      const bot = BotManager.createBot(botConfigs[i].level, i + 1);
      await prisma.gamePlayer.update({
        where: { id: game.players[i + 1].id },
        data: {
          // On stockera le nom du bot dans une colonne dédiée ou dans les métadonnées
          // Pour l'instant, on utilise le système existant
        },
      });
    }

    return {
      gameId: game.id,
      playerId: game.players[0].id,
    };
  }

  /**
   * Rejoint une partie
   */
  static async joinGame(gameId: string, userId: string): Promise<{ playerId: string }> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: true,
      },
    });

    if (!game) {
      throw new Error('Partie non trouvée');
    }

    if (game.status !== 'waiting') {
      throw new Error('La partie a déjà commencé');
    }

    if (game.players.length >= 8) {
      throw new Error('La partie est complète (8 joueurs maximum)');
    }

    // Vérifier si l'utilisateur n'est pas déjà dans la partie
    const existingPlayer = game.players.find((p: any) => p.userId === userId);
    if (existingPlayer) {
      return { playerId: existingPlayer.id };
    }

    const playerIndex = game.players.length;
    const player = await prisma.gamePlayer.create({
      data: {
        gameId,
        userId,
        playerIndex,
        color: PLAYER_COLORS[playerIndex],
        resources: {
          wood: 0,
          brick: 0,
          sheep: 0,
          wheat: 0,
          ore: 0,
        },
        buildings: {
          settlements: 0,
          cities: 0,
          roads: 0,
        },
      },
    });

    return { playerId: player.id };
  }

  /**
   * Charge une partie depuis la base de données
   */
  static async loadGame(gameId: string): Promise<GameState | null> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: {
            playerIndex: 'asc',
          },
        },
        gameState: true,
      },
    });

    if (!game) return null;

    // Convertir en GameState
    const players: Player[] = game.players.map((gp: any) => ({
      id: gp.id,
      name: gp.isBot ? (gp.botName || `Bot ${gp.botLevel}`) : (gp.user?.username || 'Joueur'),
      color: gp.color,
      resources: gp.resources as any,
      developmentCards: gp.developmentCards as any,
      playedDevelopmentCards: gp.playedDevelopmentCards as any,
      buildings: gp.buildings as any,
      victoryPoints: gp.victoryPoints,
      longestRoad: gp.longestRoad,
      largestArmy: gp.largestArmy,
      isActive: true,
      isBot: gp.isBot,
      botLevel: gp.botLevel || undefined,
    }));

    const gameState: GameState = {
      id: game.id,
      players,
      currentPlayerIndex: game.currentPlayerIndex,
      board: game.gameState?.boardData as any,
      diceRoll: game.gameState?.diceRoll as any,
      phase: game.phase as GamePhase,
      turnNumber: game.turnNumber,
      bank: game.gameState?.bank as any,
    };

    return gameState;
  }

  /**
   * Sauvegarde l'état d'une partie
   */
  static async saveGameState(gameState: GameState): Promise<void> {
    await prisma.game.update({
      where: { id: gameState.id },
      data: {
        phase: gameState.phase,
        turnNumber: gameState.turnNumber,
        currentPlayerIndex: gameState.currentPlayerIndex,
        gameState: {
          update: {
            boardData: gameState.board as any,
            diceRoll: gameState.diceRoll as any,
            bank: gameState.bank as any,
          },
        },
        players: {
          updateMany: gameState.players.map((player, index) => ({
            where: { id: player.id },
            data: {
              victoryPoints: player.victoryPoints,
              resources: player.resources as any,
              buildings: player.buildings as any,
              developmentCards: player.developmentCards as any,
              playedDevelopmentCards: player.playedDevelopmentCards as any,
              longestRoad: player.longestRoad,
              largestArmy: player.largestArmy,
            },
          })),
        },
      },
    });
  }

  /**
   * Démarre une partie
   */
  static async startGame(gameId: string): Promise<void> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    });

    if (!game) {
      throw new Error('Partie non trouvée');
    }

    if (game.players.length < 2) {
      throw new Error('Au moins 2 joueurs sont nécessaires pour démarrer');
    }

    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'playing',
        phase: 'playing',
        turnNumber: 1,
      },
    });
  }

  /**
   * Finalise une partie et calcule les points
   */
  static async finishGame(gameId: string): Promise<void> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            user: true,
          },
          orderBy: {
            victoryPoints: 'desc',
          },
        },
      },
    });

    if (!game) {
      throw new Error('Partie non trouvée');
    }

    // Assigner les rangs et points
    const updates = game.players.map((player: any, index: number) => {
      const rank = index + 1;
      const pointsEarned = PointsService.getPointsForRank(rank);
      const isWinner = rank === 1;

      return prisma.gamePlayer.update({
        where: { id: player.id },
        data: {
          finalRank: rank,
          pointsEarned,
        },
      }).then(() => {
        // Mettre à jour les statistiques de l'utilisateur
        return prisma.user.update({
          where: { id: player.userId },
          data: {
            points: {
              increment: pointsEarned,
            },
            gamesWon: isWinner ? { increment: 1 } : undefined,
            gamesLost: !isWinner ? { increment: 1 } : undefined,
          },
        });
      });
    });

    await Promise.all(updates);

    // Marquer la partie comme terminée
    const winner = game.players[0];
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'finished',
        phase: 'finished',
        finishedAt: new Date(),
        winnerId: winner.userId,
      },
    });
  }

  /**
   * Liste les parties disponibles
   */
  static async listGames(status?: string) {
    const games = await prisma.game.findMany({
      where: status ? { status } : undefined,
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Filtrer les parties où l'utilisateur n'est pas présent (a quitté)
    const filteredGames = excludeUserId
      ? games.filter((game: any) => {
          return game.players.some((p: any) => p.userId === excludeUserId);
        })
      : games;

    return filteredGames.map((game: any) => ({
      id: game.id,
      playerCount: game.players.length,
      maxPlayers: 8,
      phase: game.phase,
      status: game.status,
      players: game.players.map((p: any) => p.user?.username || p.botName || 'Joueur'),
    }));
  }

  /**
   * Quitte une partie
   */
  static async leaveGame(gameId: string, userId: string): Promise<void> {
    // Trouver le joueur dans la partie
    const gamePlayer = await prisma.gamePlayer.findFirst({
      where: {
        gameId,
        userId,
      },
    });

    if (gamePlayer) {
      // Marquer le joueur comme ayant quitté (on ne supprime pas, on marque juste)
      // Pour l'instant, on supprime le joueur, mais on pourrait ajouter un champ "leftAt"
      await prisma.gamePlayer.delete({
        where: { id: gamePlayer.id },
      });

      // Vérifier s'il reste des joueurs humains dans la partie
      const remainingHumanPlayers = await prisma.gamePlayer.count({
        where: { 
          gameId,
          isBot: false,
        },
      });

      // Si plus de joueurs humains, supprimer la partie
      if (remainingHumanPlayers === 0) {
        await prisma.game.delete({
          where: { id: gameId },
        });
      }
    }
  }
}

