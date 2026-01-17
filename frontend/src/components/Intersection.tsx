import { Intersection as IntersectionType, BuildingType } from '@catan/shared';

interface IntersectionProps {
  intersection: IntersectionType;
  size: number;
  playerColors: Record<string, string>;
  onClick?: () => void;
  isHoverable?: boolean;
  isSelected?: boolean;
}

export function IntersectionComponent({
  intersection,
  size,
  playerColors,
  onClick,
  isHoverable = true,
  isSelected = false,
}: IntersectionProps) {
  // Les intersections sont déjà positionnées par le parent, donc on utilise (0,0)
  const radius = size * 0.1;

  const building = intersection.building;
  const color = building ? playerColors[building.playerId] : undefined;

  return (
    <g
      onClick={onClick}
      style={{ cursor: isHoverable ? 'pointer' : 'default' }}
    >
      {/* Cercle de base */}
      <circle
        cx="0"
        cy="0"
        r={radius}
        fill={color || '#FFFFFF'}
        stroke={isSelected ? '#FFD700' : (color ? '#000000' : '#CCCCCC')}
        strokeWidth={isSelected ? 3 : (building ? 2 : 1)}
        opacity={isHoverable && !building ? 0.5 : 1}
      />

      {/* Colonie (petit cercle) */}
      {building?.type === BuildingType.SETTLEMENT && (
        <circle cx="0" cy="0" r={radius * 0.6} fill={color || '#FFFFFF'} stroke="#000" strokeWidth="1" />
      )}

      {/* Ville (étoile ou carré) */}
      {building?.type === BuildingType.CITY && (
        <polygon
          points={`0,${-radius * 0.8} ${radius * 0.6},${radius * 0.4} ${-radius * 0.6},${radius * 0.4}`}
          fill={color || '#FFFFFF'}
          stroke="#000"
          strokeWidth="1"
        />
      )}
    </g>
  );
}

