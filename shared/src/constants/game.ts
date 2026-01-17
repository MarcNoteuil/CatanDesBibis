import { ResourceType, TerrainType } from '../types/game';

// Configuration du plateau selon le nombre de joueurs
export const BOARD_CONFIG = {
  // Petite carte (2-4 joueurs)
  SMALL: {
    TILES: {
      [TerrainType.FOREST]: 4,      // Bois
      [TerrainType.HILLS]: 3,       // Briques
      [TerrainType.PASTURE]: 4,     // Moutons
      [TerrainType.FIELDS]: 4,      // Blé
      [TerrainType.MOUNTAINS]: 3,   // Minerai
      [TerrainType.DESERT]: 1,      // Désert
    },
    RADIUS: 2, // Rayon hexagonal (pour forme 3-4-5-4-3)
  },
  // Carte moyenne (5-6 joueurs)
  MEDIUM: {
    TILES: {
      [TerrainType.FOREST]: 5,      // Bois
      [TerrainType.HILLS]: 4,       // Briques
      [TerrainType.PASTURE]: 5,     // Moutons
      [TerrainType.FIELDS]: 5,      // Blé
      [TerrainType.MOUNTAINS]: 4,   // Minerai
      [TerrainType.DESERT]: 1,      // Désert
    },
    RADIUS: 2.5, // Rayon hexagonal (pour forme 4-5-6-5-4)
  },
  // Grande carte (7-8 joueurs)
  LARGE: {
    TILES: {
      [TerrainType.FOREST]: 8,      // Bois
      [TerrainType.HILLS]: 7,       // Briques
      [TerrainType.PASTURE]: 8,     // Moutons
      [TerrainType.FIELDS]: 8,      // Blé
      [TerrainType.MOUNTAINS]: 7,   // Minerai
      [TerrainType.DESERT]: 2,      // Désert
    },
    RADIUS: 3, // Rayon hexagonal (pour forme 4-5-6-7-6-5-4)
  },
  // Nombre de tuiles par type de terrain (déprécié, utiliser SMALL ou LARGE)
  TILES: {
    [TerrainType.FOREST]: 6,      // Bois
    [TerrainType.HILLS]: 6,       // Briques
    [TerrainType.PASTURE]: 6,     // Moutons
    [TerrainType.FIELDS]: 6,      // Blé
    [TerrainType.MOUNTAINS]: 6,   // Minerai
    [TerrainType.DESERT]: 2,      // Désert (avec voleur)
  },
  // Jetons numérotés (2-12, sauf 7)
  NUMBER_TOKENS: [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12],
  // Coûts des constructions
  COSTS: {
    SETTLEMENT: {
      [ResourceType.WOOD]: 1,
      [ResourceType.BRICK]: 1,
      [ResourceType.SHEEP]: 1,
      [ResourceType.WHEAT]: 1,
    },
    CITY: {
      [ResourceType.WHEAT]: 2,
      [ResourceType.ORE]: 3,
    },
    ROAD: {
      [ResourceType.WOOD]: 1,
      [ResourceType.BRICK]: 1,
    },
    DEVELOPMENT_CARD: {
      [ResourceType.SHEEP]: 1,
      [ResourceType.WHEAT]: 1,
      [ResourceType.ORE]: 1,
    },
  },
  // Points de victoire
  VICTORY_POINTS: {
    SETTLEMENT: 1,
    CITY: 2,
    LONGEST_ROAD: 2,
    LARGEST_ARMY: 2,
    DEVELOPMENT_CARD_VICTORY: 1,
    WIN_CONDITION: 10, // Pour 8 joueurs, on peut augmenter à 12-15
  },
  // Limites de constructions
  MAX_BUILDINGS: {
    SETTLEMENTS: 5,
    CITIES: 4,
    ROADS: 15,
  },
  // Banque initiale
  INITIAL_BANK: {
    [ResourceType.WOOD]: 19,
    [ResourceType.BRICK]: 19,
    [ResourceType.SHEEP]: 19,
    [ResourceType.WHEAT]: 19,
    [ResourceType.ORE]: 19,
  },
};

// Couleurs des joueurs
export const PLAYER_COLORS = [
  '#FF6B6B', // Rouge
  '#4ECDC4', // Cyan
  '#45B7D1', // Bleu
  '#FFA07A', // Saumon
  '#98D8C8', // Vert menthe
  '#F7DC6F', // Jaune
  '#BB8FCE', // Violet
  '#85C1E2', // Bleu clair
];

// Mapping terrain -> ressource
export const TERRAIN_TO_RESOURCE: Record<TerrainType, ResourceType | null> = {
  [TerrainType.FOREST]: ResourceType.WOOD,
  [TerrainType.HILLS]: ResourceType.BRICK,
  [TerrainType.PASTURE]: ResourceType.SHEEP,
  [TerrainType.FIELDS]: ResourceType.WHEAT,
  [TerrainType.MOUNTAINS]: ResourceType.ORE,
  [TerrainType.DESERT]: null,
  [TerrainType.SEA]: null,
};

