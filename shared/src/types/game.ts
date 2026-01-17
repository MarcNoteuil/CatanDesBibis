// Types de ressources
export enum ResourceType {
  WOOD = 'wood',
  BRICK = 'brick',
  SHEEP = 'sheep',
  WHEAT = 'wheat',
  ORE = 'ore',
  DESERT = 'desert'
}

// Types de terrains
export enum TerrainType {
  FOREST = 'forest',
  HILLS = 'hills',
  PASTURE = 'pasture',
  FIELDS = 'fields',
  MOUNTAINS = 'mountains',
  DESERT = 'desert',
  SEA = 'sea'
}

// Types de cartes développement
export enum DevelopmentCardType {
  KNIGHT = 'knight',
  VICTORY_POINT = 'victory_point',
  ROAD_BUILDING = 'road_building',
  YEAR_OF_PLENTY = 'year_of_plenty',
  MONOPOLY = 'monopoly'
}

// Types de constructions
export enum BuildingType {
  SETTLEMENT = 'settlement',
  CITY = 'city',
  ROAD = 'road'
}

// Coordonnées hexagonales
export interface HexCoordinate {
  q: number;
  r: number;
}

// Tuile du plateau
export interface Tile {
  id: string;
  coordinate: HexCoordinate;
  terrain: TerrainType;
  resource?: ResourceType;
  numberToken?: number; // 2-12 (sauf 7)
  hasRobber: boolean;
}

// Intersection (pour colonies/villes)
export interface Intersection {
  id: string;
  coordinate: HexCoordinate;
  building?: {
    type: BuildingType;
    playerId: string;
  };
  port?: {
    type: ResourceType | 'generic';
    ratio: number; // 2:1 ou 3:1
  };
}

// Route
export interface Road {
  id: string;
  from: HexCoordinate;
  to: HexCoordinate;
  playerId: string;
}

// Joueur
export interface Player {
  id: string;
  name: string;
  color: string;
  resources: {
    wood: number;
    brick: number;
    sheep: number;
    wheat: number;
    ore: number;
  };
  developmentCards: DevelopmentCardType[];
  playedDevelopmentCards: DevelopmentCardType[];
  buildings: {
    settlements: number;
    cities: number;
    roads: number;
  };
  victoryPoints: number;
  longestRoad: boolean;
  largestArmy: boolean;
  isActive: boolean;
  isBot?: boolean;
  botLevel?: string;
}

// État de la partie
export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  board: {
    tiles: Tile[];
    intersections: Intersection[];
    roads: Road[];
  };
  diceRoll?: {
    value: number;
    playerId: string;
  };
  phase: GamePhase;
  turnNumber: number;
  bank: Record<ResourceType, number>;
  setupRound?: number; // 1 = premier tour (ordre normal), 2 = deuxième tour (ordre inverse)
  setupSettlementsPlaced?: number; // Nombre de colonies placées en setup
}

// Phases de jeu
export enum GamePhase {
  SETUP = 'setup',
  PLAYING = 'playing',
  FINISHED = 'finished'
}

// Actions de jeu
export interface GameAction {
  type: ActionType;
  playerId: string;
  payload?: any;
}

export enum ActionType {
  PLACE_SETTLEMENT = 'place_settlement',
  PLACE_CITY = 'place_city',
  PLACE_ROAD = 'place_road',
  ROLL_DICE = 'roll_dice',
  TRADE = 'trade',
  PLAY_DEVELOPMENT_CARD = 'play_development_card',
  BUY_DEVELOPMENT_CARD = 'buy_development_card',
  MOVE_ROBBER = 'move_robber',
  END_TURN = 'end_turn'
}

