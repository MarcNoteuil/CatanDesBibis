import { BotLevel } from '@catan/shared';

interface BotSelectorProps {
  selectedBots: Array<{ level: BotLevel }>;
  onBotsChange: (bots: Array<{ level: BotLevel }>) => void;
  maxPlayers: number;
  currentPlayers: number;
}

export function BotSelector({ selectedBots, onBotsChange, maxPlayers, currentPlayers }: BotSelectorProps) {
  const availableSlots = maxPlayers - currentPlayers - 1; // -1 pour le joueur actuel
  const canAddBot = selectedBots.length < availableSlots;

  const addBot = (level: BotLevel) => {
    if (canAddBot) {
      onBotsChange([...selectedBots, { level }]);
    }
  };

  const removeBot = (index: number) => {
    const newBots = selectedBots.filter((_, i) => i !== index);
    onBotsChange(newBots);
  };

  const getLevelLabel = (level: BotLevel) => {
    switch (level) {
      case BotLevel.AMATEUR:
        return 'Amateur';
      case BotLevel.INTERMEDIATE:
        return 'Intermédiaire';
      case BotLevel.DIFFICULT:
        return 'Difficile';
      default:
        return level;
    }
  };

  const getLevelColor = (level: BotLevel) => {
    switch (level) {
      case BotLevel.AMATEUR:
        return 'bg-green-100 text-green-800';
      case BotLevel.INTERMEDIATE:
        return 'bg-yellow-100 text-yellow-800';
      case BotLevel.DIFFICULT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="font-bold text-lg mb-3">Ajouter des bots</h3>
      <p className="text-sm text-gray-600 mb-4">
        Joueurs: {currentPlayers + 1} / {maxPlayers} (vous + {selectedBots.length} bot{selectedBots.length > 1 ? 's' : ''})
      </p>

      {/* Bots sélectionnés */}
      {selectedBots.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">Bots ajoutés:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedBots.map((bot, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-3 py-1 rounded-full ${getLevelColor(bot.level)}`}
              >
                <span className="text-sm font-medium">{getLevelLabel(bot.level)}</span>
                <button
                  onClick={() => removeBot(index)}
                  className="text-xs hover:font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boutons pour ajouter des bots */}
      {canAddBot && (
        <div className="space-y-2">
          <button
            onClick={() => addBot(BotLevel.AMATEUR)}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition text-left"
          >
            ➕ Ajouter Bot Amateur
          </button>
          <button
            onClick={() => addBot(BotLevel.INTERMEDIATE)}
            className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-yellow-700 transition text-left"
          >
            ➕ Ajouter Bot Intermédiaire
          </button>
          <button
            onClick={() => addBot(BotLevel.DIFFICULT)}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition text-left"
          >
            ➕ Ajouter Bot Difficile
          </button>
        </div>
      )}

      {!canAddBot && (
        <p className="text-sm text-gray-500 text-center py-2">
          Maximum {maxPlayers} joueurs atteint
        </p>
      )}
    </div>
  );
}

