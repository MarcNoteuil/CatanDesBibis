import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { gameRouter } from './routes/game.js';
import { authRouter } from './routes/auth.js';
import { socketHandler } from './sockets/socketHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/game', gameRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io
socketHandler(io);

// Démarrage du serveur
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur Catan démarré sur le port ${PORT}`);
  console.log(`📡 WebSocket disponible sur ws://localhost:${PORT}`);
});

