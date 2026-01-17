import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification manquant' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ error: 'Configuration serveur invalide' });
  }

  jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide ou expiré' });
    }

    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };
    next();
  });
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next();
  }

  jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
    if (!err && decoded) {
      req.userId = decoded.userId;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username,
      };
    }
    next();
  });
}

