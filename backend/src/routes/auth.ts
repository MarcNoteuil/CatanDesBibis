import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';

const router = Router();

// Inscription
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, mot de passe et pseudo requis' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email ou pseudo déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        points: true,
        gamesWon: true,
        gamesLost: true,
      },
    });

    // Générer le token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET non configuré');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user,
      token,
    });
  } catch (error: any) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'inscription' });
  }
});

// Connexion
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET non configuré');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        points: user.points,
        gamesWon: user.gamesWon,
        gamesLost: user.gamesLost,
      },
      token,
    });
  } catch (error: any) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la connexion' });
  }
});

// Obtenir le profil utilisateur
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Configuration serveur invalide' });
    }

    const decoded: any = jwt.verify(token, jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        points: true,
        gamesWon: true,
        gamesLost: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(401).json({ error: 'Token invalide' });
  }
});

// Classement des joueurs
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const users = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: limit,
      select: {
        id: true,
        username: true,
        points: true,
        gamesWon: true,
        gamesLost: true,
      },
    });

    res.json(users);
  } catch (error: any) {
    console.error('Erreur classement:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du classement' });
  }
});

export { router as authRouter };

