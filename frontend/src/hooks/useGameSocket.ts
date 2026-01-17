import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, GameAction } from '@catan/shared';

export function useGameSocket(gameId: string, playerId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      auth: {
        token: localStorage.getItem('token'),
      },
    });
    setSocket(newSocket);

    newSocket.emit('join-game', { gameId, playerId });

    newSocket.on('game-state', (newState: GameState) => {
      setGameState(newState);
      setError(null);
    });

    newSocket.on('error', (errorData: { message: string }) => {
      setError(errorData.message);
    });

    newSocket.on('player-joined', () => {
      // Rafraîchir l'état si nécessaire
    });

    return () => {
      newSocket.disconnect();
    };
  }, [gameId, playerId]);

  const sendAction = (action: Omit<GameAction, 'playerId'>) => {
    if (!socket) return;

    const gameAction: GameAction = {
      ...action,
      playerId,
    };

    socket.emit('game-action', { gameId, action: gameAction });
  };

  return {
    socket,
    gameState,
    error,
    sendAction,
  };
}

