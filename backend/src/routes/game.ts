import { Router } from 'express';
import { GameService } from '../services/GameService.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { GameManager } from '../game/GameManager.js';
import { BotManager } from '../bots/BotManager.js';
import { BotLevel } from '@catan/shared';
import prisma from '../db/prisma.js';

const router = Router();
const gameManager = GameManager.getInstance();

// Créer une nouvelle partie (nécessite authentification)
router.post('/create', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { bots } = req.body; // Array de { level: 'amateur' | 'intermediate' | 'difficult' }
    const botConfigs = (bots || []).map((b: any) => ({ level: b.level as BotLevel }));
    
    const result = await GameService.createGame(req.userId, botConfigs);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Rejoindre une partie (nécessite authentification)
router.post('/join', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { gameId } = req.body;
    if (!gameId || !req.userId) {
      return res.status(400).json({ error: 'gameId requis et authentification nécessaire' });
    }

    const result = await GameService.joinGame(gameId, req.userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Démarrer une partie
router.post('/:gameId/start', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { gameId } = req.params;
    await GameService.startGame(gameId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir l'état d'une partie
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await GameService.loadGame(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    res.json(game);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Traiter une action de jeu
router.post('/:gameId/action', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { gameId } = req.params;
    const { action } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Charger la partie depuis la DB
    let gameState = await GameService.loadGame(gameId);
    if (!gameState) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    // Trouver le GamePlayer ID correspondant à l'utilisateur
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    });

    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    const gamePlayer = game.players.find((p: any) => p.userId === req.userId);
    if (!gamePlayer) {
      return res.status(403).json({ error: 'Vous n\'êtes pas dans cette partie' });
    }

    // Créer une instance de jeu temporaire pour la logique
    let gameInstance = gameManager.getGameInstance(gameId);
    if (!gameInstance) {
      gameInstance = gameManager.createGameFromState(gameState);
      gameManager.setGame(gameId, gameInstance);
    }

    // Traiter l'action avec le bon playerId (GamePlayer ID)
    const updatedState = gameManager.processAction(gameId, {
      ...action,
      playerId: gamePlayer.id, // Utiliser le GamePlayer ID, pas le User ID
    });

    // Sauvegarder en DB
    await GameService.saveGameState(updatedState);

    // Vérifier si la partie est terminée
    if (updatedState.phase === 'finished') {
      await GameService.finishGame(gameId);
    }

    res.json(updatedState);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Lister les parties disponibles
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const status = req.query.status as string | undefined;
    const excludeUserId = req.userId || undefined; // Exclure les parties où l'utilisateur a quitté
    const games = await GameService.listGames(status, excludeUserId);
    res.json(games);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Quitter une partie
router.post('/:gameId/leave', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { gameId } = req.params;
    if (!req.userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Retirer le joueur de la partie (ou supprimer la partie si c'est le créateur)
    await GameService.leaveGame(gameId, req.userId);
    
    // Retirer la partie du GameManager si elle existe
    gameManager.removeGame(gameId);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer toutes les parties (pour les tests)
router.delete('/all', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Supprimer toutes les parties et leurs données associées
    // Les GameState et GamePlayer seront supprimés automatiquement grâce à onDelete: Cascade
    await prisma.game.deleteMany({});
    
    // Nettoyer le GameManager
    const gameIds = Array.from(gameManager['games'].keys());
    gameIds.forEach(gameId => {
      gameManager.removeGame(gameId);
    });
    
    res.json({ success: true, message: 'Toutes les parties ont été supprimées' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as gameRouter };

