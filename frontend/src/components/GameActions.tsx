import { GameState, ActionType, HexCoordinate } from '@catan/shared';

interface GameActionsProps {
  gameState: GameState;
  playerId: string;
  onAction: (action: { type: ActionType; payload?: any }) => void;
  selectedIntersection?: HexCoordinate | null;
  selectedTile?: string | null;
  selectedRoad?: { from: HexCoordinate; to: HexCoordinate } | null;
}

export function GameActions({
  gameState,
  playerId,
  onAction,
  selectedIntersection,
  selectedTile,
  selectedRoad,
}: GameActionsProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer.id === playerId;
  const hasRolledDice = !!gameState.diceRoll;
  const isSetupPhase = gameState.phase === 'setup';
  const setupRound = gameState.setupRound || 1;

  if (!isMyTurn) {
    const setupInfo = isSetupPhase ? (
      <p className="text-sm text-blue-600 mt-2">
        Phase de setup - Tour {setupRound} ({setupRound === 1 ? 'ordre normal' : 'ordre inverse'})
      </p>
    ) : null;
    
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p className="text-gray-600">En attente du tour de {currentPlayer.name}...</p>
        {setupInfo}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-3">
      <h3 className="font-bold text-lg mb-4">Actions</h3>

      {/* Phase de setup */}
      {isSetupPhase && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <p className="text-sm font-semibold text-yellow-800">Phase de Setup</p>
          <p className="text-xs text-yellow-700 mt-1">
            Tour {setupRound} - {setupRound === 1 ? 'Ordre normal' : 'Ordre inverse'}
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Placez une colonie et une route (gratuit)
          </p>
        </div>
      )}

      {/* Lancer les dés */}
      {!hasRolledDice && !isSetupPhase && (
        <button
          onClick={() => onAction({ type: ActionType.ROLL_DICE })}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          🎲 Lancer les dés
        </button>
      )}

      {hasRolledDice && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-600">Dés lancés:</p>
          <p className="text-2xl font-bold text-blue-700">{gameState.diceRoll?.value}</p>
        </div>
      )}

      {/* Gestion du voleur si 7 */}
      {hasRolledDice && gameState.diceRoll?.value === 7 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-sm font-semibold text-red-700 mb-2">⚠️ Voleur activé!</p>
          {selectedTile && (
            <button
              onClick={() =>
                onAction({
                  type: ActionType.MOVE_ROBBER,
                  payload: { tileId: selectedTile },
                })
              }
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Déplacer le voleur
            </button>
          )}
        </div>
      )}

      {/* Placer une colonie */}
      {selectedIntersection && (
        <button
          onClick={() =>
            onAction({
              type: ActionType.PLACE_SETTLEMENT,
              payload: { coordinate: selectedIntersection },
            })
          }
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          🏘️ Placer une colonie
        </button>
      )}

      {/* Placer une route */}
      {selectedRoad && (
        <button
          onClick={() =>
            onAction({
              type: ActionType.PLACE_ROAD,
              payload: { from: selectedRoad.from, to: selectedRoad.to },
            })
          }
          className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-700 transition"
        >
          🛣️ Placer une route
        </button>
      )}

      {/* Acheter une carte développement */}
      <button
        onClick={() => {
          if (confirm('Acheter une carte développement pour 1 mouton, 1 blé, 1 minerai ?')) {
            onAction({ type: ActionType.BUY_DEVELOPMENT_CARD });
          }
        }}
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition"
      >
        🎴 Acheter une carte développement
      </button>

      {/* Terminer le tour */}
      {hasRolledDice && (
        <button
          onClick={() => onAction({ type: ActionType.END_TURN })}
          className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-900 transition"
        >
          ✓ Terminer le tour
        </button>
      )}
    </div>
  );
}

