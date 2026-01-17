import { DevelopmentCardType, Player } from '@catan/shared';

interface DevelopmentCardModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onPlayCard: (cardType: DevelopmentCardType, data?: any) => void;
}

const CARD_NAMES: Record<DevelopmentCardType, string> = {
  [DevelopmentCardType.KNIGHT]: 'Chevalier',
  [DevelopmentCardType.VICTORY_POINT]: 'Point de Victoire',
  [DevelopmentCardType.ROAD_BUILDING]: 'Construction de Routes',
  [DevelopmentCardType.YEAR_OF_PLENTY]: 'Année d\'Abondance',
  [DevelopmentCardType.MONOPOLY]: 'Monopole',
};

const CARD_DESCRIPTIONS: Record<DevelopmentCardType, string> = {
  [DevelopmentCardType.KNIGHT]: 'Déplacez le voleur et volez une ressource',
  [DevelopmentCardType.VICTORY_POINT]: '1 point de victoire',
  [DevelopmentCardType.ROAD_BUILDING]: 'Placez 2 routes gratuitement',
  [DevelopmentCardType.YEAR_OF_PLENTY]: 'Prenez 2 ressources de votre choix',
  [DevelopmentCardType.MONOPOLY]: 'Prenez toutes les ressources d\'un type',
};

export function DevelopmentCardModal({
  player,
  isOpen,
  onClose,
  onPlayCard,
}: DevelopmentCardModalProps) {
  if (!isOpen) return null;

  // Compter les cartes par type
  const cardCounts: Record<DevelopmentCardType, number> = {
    [DevelopmentCardType.KNIGHT]: 0,
    [DevelopmentCardType.VICTORY_POINT]: 0,
    [DevelopmentCardType.ROAD_BUILDING]: 0,
    [DevelopmentCardType.YEAR_OF_PLENTY]: 0,
    [DevelopmentCardType.MONOPOLY]: 0,
  };

  player.developmentCards.forEach(card => {
    cardCounts[card]++;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Vos Cartes Développement</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {player.developmentCards.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Vous n'avez pas de cartes développement</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(cardCounts).map(([cardType, count]) => {
              if (count === 0) return null;
              const type = cardType as DevelopmentCardType;

              return (
                <div
                  key={cardType}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-lg">{CARD_NAMES[type]}</h3>
                    <p className="text-sm text-gray-600">{CARD_DESCRIPTIONS[type]}</p>
                    <p className="text-xs text-gray-500 mt-1">Quantité: {count}</p>
                  </div>
                  <button
                    onClick={() => {
                      onPlayCard(type);
                      onClose();
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Jouer
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

