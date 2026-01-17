import { useState, useEffect } from 'react';
import { GameLobby } from './components/GameLobby';
import { GameBoard } from './components/GameBoard';
import { Auth } from './components/Auth';
import { GameState } from '@catan/shared';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      // Vérifier le token
      fetch('http://localhost:3000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        });
    }
  }, [token]);

  const handleAuth = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setGameState(null);
    setPlayerId(null);
    localStorage.removeItem('token');
  };

  const handleGameStart = (game: GameState, pId: string) => {
    setGameState(game);
    setPlayerId(pId);
  };

  if (!token || !user) {
    return <Auth onAuth={handleAuth} />;
  }

  const handleLeaveGame = () => {
    setGameState(null);
    setPlayerId(null);
  };

  if (gameState && playerId) {
    return <GameBoard gameState={gameState} playerId={playerId} token={token} onLogout={handleLogout} onLeaveGame={handleLeaveGame} />;
  }

  return <GameLobby onGameStart={handleGameStart} token={token} user={user} onLogout={handleLogout} />;
}

export default App;

