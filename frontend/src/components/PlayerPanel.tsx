import { Player, ResourceType } from '@catan/shared';

interface PlayerPanelProps {
  player: Player;
  isCurrentPlayer: boolean;
  isMyPlayer: boolean;
}

const RESOURCE_ICONS: Record<ResourceType, string> = {
  [ResourceType.WOOD]: '🪵',
  [ResourceType.BRICK]: '🧱',
  [ResourceType.SHEEP]: '🐑',
  [ResourceType.WHEAT]: '🌾',
  [ResourceType.ORE]: '⛏️',
  [ResourceType.DESERT]: '🏜️',
};

export function PlayerPanel({ player, isCurrentPlayer, isMyPlayer }: PlayerPanelProps) {

  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        isCurrentPlayer
          ? 'border-yellow-400 bg-yellow-50 shadow-lg'
          : isMyPlayer
          ? 'border-purple-500 bg-purple-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full border-2 border-gray-800"
            style={{ backgroundColor: player.color }}
          ></div>
          <span className="font-bold text-lg">{player.name}</span>
          {isCurrentPlayer && <span className="text-yellow-600">⭐</span>}
        </div>
        <div className="text-2xl font-bold text-gray-700">{player.victoryPoints} VP</div>
      </div>

      {/* Ressources */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {Object.entries(player.resources).map(([resource, count]) => {
          if (resource === ResourceType.DESERT) return null;
          return (
            <div
              key={resource}
              className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1"
            >
              <span className="text-lg">{RESOURCE_ICONS[resource as ResourceType]}</span>
              <span className="text-sm font-semibold">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Bâtiments */}
      <div className="flex gap-4 text-sm text-gray-600 mb-2">
        <span>🏘️ {player.buildings.settlements}</span>
        <span>🏛️ {player.buildings.cities}</span>
        <span>🛣️ {player.buildings.roads}</span>
      </div>

      {/* Bonus */}
      <div className="flex gap-2">
        {player.longestRoad && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Route la plus longue
          </span>
        )}
        {player.largestArmy && (
          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
            Plus grande armée
          </span>
        )}
      </div>

      {/* Cartes développement (seulement pour mon joueur) */}
      {isMyPlayer && player.developmentCards.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-1">
            Cartes développement: {player.developmentCards.length}
          </div>
        </div>
      )}
    </div>
  );
}

