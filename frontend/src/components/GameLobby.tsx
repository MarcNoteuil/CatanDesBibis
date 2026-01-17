import { useState, useEffect } from 'react';
import { GameState, BotLevel } from '@catan/shared';
import { BotSelector } from './BotSelector';

interface GameLobbyProps {
  onGameStart: (game: GameState, playerId: string) => void;
  token: string;
  user: any;
  onLogout: () => void;
}

export function GameLobby({ onGameStart, token, user, onLogout }: GameLobbyProps) {
  const [gameId, setGameId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [selectedBots, setSelectedBots] = useState<Array<{ level: BotLevel }>>([]);

  useEffect(() => {
    loadGames();
    const interval = setInterval(loadGames, 5000); // Rafraîchir toutes les 5 secondes
    return () => clearInterval(interval);
  }, []);

  const loadGames = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/game?status=waiting', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const games = await response.json();
        setAvailableGames(games);
      }
    } catch (error) {
      console.error('Erreur chargement parties:', error);
    }
  };

  const createGame = async () => {
    const totalPlayers = 1 + selectedBots.length;
    if (totalPlayers < 2 || totalPlayers > 8) {
      alert('Une partie doit avoir entre 2 et 8 joueurs');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('http://localhost:3000/api/game/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bots: selectedBots }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }

      const data = await response.json();
      const gameResponse = await fetch(`http://localhost:3000/api/game/${data.gameId}`);
      const game: GameState = await gameResponse.json();
      
      onGameStart(game, data.playerId);
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(error.message || 'Erreur lors de la création de la partie');
    } finally {
      setIsCreating(false);
    }
  };

  const joinGame = async (targetGameId?: string) => {
    const id = targetGameId || gameId;
    if (!id.trim()) {
      alert('Veuillez entrer l\'ID de la partie');
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch('http://localhost:3000/api/game/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gameId: id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la connexion');
      }

      const data = await response.json();
      const gameResponse = await fetch(`http://localhost:3000/api/game/${id}`);
      const game: GameState = await gameResponse.json();
      
      onGameStart(game, data.playerId);
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(error.message || 'Erreur lors de la connexion à la partie');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec profil */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">🎲 Catan Multijoueur</h1>
              <p className="text-gray-600">Bienvenue, {user.username}!</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right mr-4">
                <div className="text-sm text-gray-600">Points: <span className="font-bold">{user.points}</span></div>
                <div className="text-sm text-gray-600">Victoires: {user.gamesWon} | Défaites: {user.gamesLost}</div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:3000/api/game/all', {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    if (response.ok) {
                      alert('Toutes les parties ont été supprimées');
                      loadGames();
                    }
                  } catch (error) {
                    console.error('Erreur lors de la suppression des parties:', error);
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
              >
                🗑️ Supprimer toutes les parties
              </button>
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Créer une partie */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4">Créer une partie</h2>
            
            <BotSelector
              selectedBots={selectedBots}
              onBotsChange={setSelectedBots}
              maxPlayers={8}
              currentPlayers={0}
            />

            <button
              onClick={createGame}
              disabled={isCreating || isJoining || (1 + selectedBots.length < 2)}
              className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isCreating ? 'Création...' : `Créer une partie (${1 + selectedBots.length} joueur${1 + selectedBots.length > 1 ? 's' : ''})`}
            </button>
          </div>

          {/* Rejoindre une partie */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4">Rejoindre une partie</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="ID de la partie"
              />
              <button
                onClick={() => joinGame()}
                disabled={isCreating || isJoining}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isJoining ? 'Connexion...' : 'Rejoindre'}
              </button>
            </div>
          </div>
        </div>

        {/* Parties disponibles */}
        <div className="bg-white rounded-lg shadow-xl p-6 mt-4">
          <h2 className="text-xl font-bold mb-4">Parties en attente</h2>
          {availableGames.length === 0 ? (
            <p className="text-gray-600 text-center py-4">Aucune partie en attente</p>
          ) : (
            <div className="space-y-2">
              {availableGames.map((game) => (
                <div
                  key={game.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div>
                    <div className="font-semibold">Partie {game.id.slice(0, 8)}...</div>
                    <div className="text-sm text-gray-600">
                      {game.playerCount}/8 joueurs • {game.players.join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={() => joinGame(game.id)}
                    disabled={isJoining}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    Rejoindre
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-300">
          Jusqu'à 8 joueurs peuvent participer à chaque partie
        </p>
      </div>
    </div>
  );
}

