import { GameState, Tile, Intersection, HexCoordinate } from '@catan/shared';
import { HexTile } from './HexTile';
import { IntersectionComponent } from './Intersection';
import { hexToPixel, getAdjacentIntersections } from '../utils/hexUtils';

interface BoardProps {
  gameState: GameState;
  onTileClick?: (tile: Tile) => void;
  onIntersectionClick?: (intersection: Intersection) => void;
  onRoadClick?: (from: HexCoordinate, to: HexCoordinate) => void;
  selectedIntersection?: HexCoordinate | null;
  selectedTile?: string | null;
  selectedRoad?: { from: HexCoordinate; to: HexCoordinate } | null;
}

export function Board({
  gameState,
  onTileClick,
  onIntersectionClick,
  onRoadClick,
  selectedIntersection,
  selectedTile,
  selectedRoad,
}: BoardProps) {
  // Taille des hexagones
  const HEX_SIZE = 50;
  const SPACING_FACTOR = 1.02; // Facteur d'espacement très réduit : hexagones presque collés avec espace minimal pour routes
  const playerColors: Record<string, string> = {};
  gameState.players.forEach(player => {
    playerColors[player.id] = player.color;
  });

  // Calculer les dimensions du SVG avec espacement
  const allCoords = [
    ...gameState.board.tiles.map(t => t.coordinate),
    ...gameState.board.intersections.map(i => i.coordinate),
  ];

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  allCoords.forEach(coord => {
    const pixel = hexToPixel(coord, HEX_SIZE * SPACING_FACTOR);
    minX = Math.min(minX, pixel.x);
    minY = Math.min(minY, pixel.y);
    maxX = Math.max(maxX, pixel.x);
    maxY = Math.max(maxY, pixel.y);
  });

  const padding = HEX_SIZE * 2;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  const offsetX = -minX + padding;
  const offsetY = -minY + padding;

  // Rendre les routes existantes
  const renderRoads = () => {
    return gameState.board.roads.map(road => {
      // Les routes sont entre intersections, donc on utilise les coordonnées des intersections
      const fromIntersection = gameState.board.intersections.find(
        i => i.coordinate.q === road.from.q && i.coordinate.r === road.from.r
      );
      const toIntersection = gameState.board.intersections.find(
        i => i.coordinate.q === road.to.q && i.coordinate.r === road.to.r
      );

      if (!fromIntersection || !toIntersection) return null;

      // Utiliser le même facteur d'espacement pour les intersections
      // Les intersections sont positionnées aux coins des hexagones
      const from = hexToPixel(fromIntersection.coordinate, HEX_SIZE * SPACING_FACTOR);
      const to = hexToPixel(toIntersection.coordinate, HEX_SIZE * SPACING_FACTOR);
      const color = playerColors[road.playerId] || '#CCCCCC';

      return (
        <line
          key={road.id}
          x1={from.x + offsetX}
          y1={from.y + offsetY}
          x2={to.x + offsetX}
          y2={to.y + offsetY}
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={1}
        />
      );
    });
  };

  // Rendre les routes cliquables (bords entre intersections adjacentes)
  const renderClickableRoads = () => {
    const clickableRoads: JSX.Element[] = [];
    const processedRoads = new Set<string>();

    gameState.board.intersections.forEach(intersection => {
      const adjacent = getAdjacentIntersections(
        intersection.coordinate,
        gameState.board.intersections
      );

      adjacent.forEach(adjCoord => {
        // Créer une clé unique pour chaque paire d'intersections
        const key1 = `${intersection.coordinate.q},${intersection.coordinate.r}-${adjCoord.q},${adjCoord.r}`;
        const key2 = `${adjCoord.q},${adjCoord.r}-${intersection.coordinate.q},${intersection.coordinate.r}`;

        if (processedRoads.has(key1) || processedRoads.has(key2)) return;
        processedRoads.add(key1);

        // Vérifier si une route existe déjà
        const existingRoad = gameState.board.roads.find(
          road =>
            ((road.from.q === intersection.coordinate.q &&
              road.from.r === intersection.coordinate.r &&
              road.to.q === adjCoord.q &&
              road.to.r === adjCoord.r) ||
              (road.from.q === adjCoord.q &&
                road.from.r === adjCoord.r &&
                road.to.q === intersection.coordinate.q &&
                road.to.r === intersection.coordinate.r))
        );

        if (existingRoad) return; // Ne pas rendre cliquable si route existe déjà

        const from = hexToPixel(intersection.coordinate, HEX_SIZE * SPACING_FACTOR);
        const to = hexToPixel(adjCoord, HEX_SIZE * SPACING_FACTOR);

        const isSelected =
          selectedRoad &&
          ((selectedRoad.from.q === intersection.coordinate.q &&
            selectedRoad.from.r === intersection.coordinate.r &&
            selectedRoad.to.q === adjCoord.q &&
            selectedRoad.to.r === adjCoord.r) ||
            (selectedRoad.from.q === adjCoord.q &&
              selectedRoad.from.r === adjCoord.r &&
              selectedRoad.to.q === intersection.coordinate.q &&
              selectedRoad.to.r === intersection.coordinate.r));

        clickableRoads.push(
          <line
            key={key1}
            x1={from.x + offsetX}
            y1={from.y + offsetY}
            x2={to.x + offsetX}
            y2={to.y + offsetY}
            stroke={isSelected ? '#FFD700' : 'transparent'}
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isSelected ? 0.5 : 0}
            style={{ cursor: 'pointer' }}
            onClick={() => onRoadClick?.(intersection.coordinate, adjCoord)}
          />
        );
      });
    });

    return clickableRoads;
  };

  return (
    <div className="w-full overflow-auto rounded-lg p-4" style={{ backgroundColor: '#87CEEB' }}>
      <svg width={width} height={height} className="block">
        {/* Fond océan avec motif de vagues */}
        <defs>
          <pattern id="oceanPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="3" fill="#6BB6FF" opacity="0.2" />
            <circle cx="15" cy="15" r="2" fill="#6BB6FF" opacity="0.15" />
            <circle cx="45" cy="45" r="2" fill="#6BB6FF" opacity="0.15" />
            {/* Motif de vagues */}
            <path d="M 0 30 Q 15 25, 30 30 T 60 30" stroke="#87CEEB" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M 0 40 Q 15 35, 30 40 T 60 40" stroke="#87CEEB" strokeWidth="1" fill="none" opacity="0.2" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="#87CEEB" />
        <rect width={width} height={height} fill="url(#oceanPattern)" />

        {/* Routes cliquables invisibles (en premier pour être cliquables) */}
        <g>{renderClickableRoads()}</g>

        {/* Routes existantes (sous les tuiles) */}
        <g>{renderRoads()}</g>

        {/* Tuiles */}
        <g>
          {gameState.board.tiles.map(tile => {
            const tileCenter = hexToPixel(tile.coordinate, HEX_SIZE * SPACING_FACTOR);
            return (
              <g key={tile.id} transform={`translate(${tileCenter.x + offsetX}, ${tileCenter.y + offsetY})`}>
                <HexTile
                  tile={tile}
                  size={HEX_SIZE}
                  onClick={() => onTileClick?.(tile)}
                  isSelected={selectedTile === tile.id}
                />
              </g>
            );
          })}
        </g>

        {/* Intersections */}
        <g>
          {gameState.board.intersections.map(intersection => {
            const isSelected = !!(
              selectedIntersection &&
              intersection.coordinate.q === selectedIntersection.q &&
              intersection.coordinate.r === selectedIntersection.r
            );
            const intersectionCenter = hexToPixel(intersection.coordinate, HEX_SIZE * SPACING_FACTOR);

            return (
              <g key={intersection.id} transform={`translate(${intersectionCenter.x + offsetX}, ${intersectionCenter.y + offsetY})`}>
                <IntersectionComponent
                  intersection={intersection}
                  size={HEX_SIZE}
                  playerColors={playerColors}
                  onClick={() => onIntersectionClick?.(intersection)}
                  isHoverable={!intersection.building}
                  isSelected={isSelected}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

