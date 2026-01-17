import { useState } from 'react';
import { GameState, ActionType, HexCoordinate, Tile, Intersection, DevelopmentCardType } from '@catan/shared';
import { useGameSocket } from '../hooks/useGameSocket';
import { Board } from './Board';
import { PlayerPanel } from './PlayerPanel';
import { GameActions } from './GameActions';
import { DevelopmentCardModal } from './DevelopmentCardModal';

interface GameBoardProps {
  gameState: GameState;
  playerId: string;
  token: string;
  onLogout: () => void;
  onLeaveGame: () => void;
}

export function GameBoard({ gameState: initialGameState, playerId, token, onLeaveGame }: GameBoardProps) {
  const { gameState, error, sendAction } = useGameSocket(initialGameState.id, playerId);
  const [selectedIntersection, setSelectedIntersection] = useState<HexCoordinate | null>(null);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<{ from: HexCoordinate; to: HexCoordinate } | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);

  const currentGameState = gameState || initialGameState;
  const currentPlayer = currentGameState.players.find(p => p.id === playerId);

  const handleAction = (action: { type: ActionType; payload?: any }) => {
    sendAction(action);
    // Réinitialiser les sélections après certaines actions
    if (
      action.type === ActionType.PLACE_SETTLEMENT ||
      action.type === ActionType.PLACE_CITY ||
      action.type === ActionType.PLACE_ROAD
    ) {
      setSelectedIntersection(null);
      setSelectedTile(null);
      setSelectedRoad(null);
    }
  };

  const handlePlayCard = (cardType: DevelopmentCardType, data?: any) => {
    handleAction({
      type: ActionType.PLAY_DEVELOPMENT_CARD,
      payload: { cardType, data },
    });
  };

  const handleTileClick = (tile: Tile) => {
    if (currentGameState.diceRoll?.value === 7) {
      setSelectedTile(tile.id);
    }
  };

  const handleIntersectionClick = (intersection: Intersection) => {
    // Si l'intersection a déjà un bâtiment du joueur actuel, proposer l'upgrade
    if (intersection.building && intersection.building.playerId === playerId) {
      if (intersection.building.type === 'settlement') {
        // Proposer d'upgrader en ville
        handleAction({
          type: ActionType.PLACE_CITY,
          payload: { coordinate: intersection.coordinate },
        });
        return;
      }
    }
    
    setSelectedIntersection(intersection.coordinate);
    setSelectedTile(null);
    setSelectedRoad(null);
  };

  const handleRoadClick = (from: HexCoordinate, to: HexCoordinate) => {
    setSelectedRoad({ from, to });
    setSelectedIntersection(null);
    setSelectedTile(null);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (currentGameState.phase === 'finished') {
    const winner = currentGameState.players.reduce((prev, current) =>
      current.victoryPoints > prev.victoryPoints ? current : prev
    );

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4">🎉 Partie terminée!</h1>
          <div className="mb-6">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 border-4 border-gray-800"
              style={{ backgroundColor: winner.color }}
            ></div>
            <p className="text-2xl font-bold">{winner.name} a gagné!</p>
            <p className="text-gray-600 mt-2">{winner.victoryPoints} points de victoire</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">🎲 Catan Multijoueur</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Tour: {currentGameState.turnNumber} | Phase: {currentGameState.phase}
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`http://localhost:3000/api/game/${currentGameState.id}/leave`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    if (response.ok) {
                      onLeaveGame();
                    }
                  } catch (error) {
                    console.error('Erreur lors de la sortie de la partie:', error);
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Quitter la partie
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Colonne principale - Plateau */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-xl p-4 mb-4">
              <h2 className="text-xl font-bold mb-4">Plateau de jeu</h2>
              <Board
                gameState={currentGameState}
                onTileClick={handleTileClick}
                onIntersectionClick={handleIntersectionClick}
                onRoadClick={handleRoadClick}
                selectedIntersection={selectedIntersection}
                selectedTile={selectedTile}
                selectedRoad={selectedRoad}
              />
            </div>

            {/* Panneaux des joueurs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentGameState.players.map((player) => (
                <PlayerPanel
                  key={player.id}
                  player={player}
                  isCurrentPlayer={
                    currentGameState.players[currentGameState.currentPlayerIndex]?.id === player.id
                  }
                  isMyPlayer={player.id === playerId}
                />
              ))}
            </div>
          </div>

          {/* Colonne latérale - Actions */}
          <div className="lg:col-span-1 space-y-4">
            <GameActions
              gameState={currentGameState}
              playerId={playerId}
              onAction={handleAction}
              selectedIntersection={selectedIntersection}
              selectedTile={selectedTile}
              selectedRoad={selectedRoad}
            />

            {/* Informations du joueur actuel */}
            {currentPlayer && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="font-bold mb-3">Vos informations</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Points de victoire:</span>{' '}
                    {currentPlayer.victoryPoints}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Cartes développement:</span>
                    <button
                      onClick={() => setShowCardModal(true)}
                      className="text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      {currentPlayer.developmentCards.length} 🎴
                    </button>
                  </div>
                  <div>
                    <span className="font-semibold">Total ressources:</span>{' '}
                    {Object.values(currentPlayer.resources).reduce((a, b) => a + b, 0)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal des cartes développement */}
        {currentPlayer && (
          <DevelopmentCardModal
            player={currentPlayer}
            isOpen={showCardModal}
            onClose={() => setShowCardModal(false)}
            onPlayCard={handlePlayCard}
          />
        )}
      </div>
    </div>
  );
}

