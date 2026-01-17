import { Tile, TerrainType, ResourceType } from '@catan/shared';
import { hexagonPoints } from '../utils/hexUtils';

interface HexTileProps {
  tile: Tile;
  size: number;
  onClick?: () => void;
  isSelected?: boolean;
}

const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.FOREST]: '#2d5016', // Vert forêt plus foncé
  [TerrainType.HILLS]: '#cd853f', // Brun sable
  [TerrainType.PASTURE]: '#90ee90', // Vert pâturages
  [TerrainType.FIELDS]: '#daa520', // Or pour les champs
  [TerrainType.MOUNTAINS]: '#696969', // Gris montagnes
  [TerrainType.DESERT]: '#deb887', // Beige désert
  [TerrainType.SEA]: '#87ceeb', // Bleu ciel pour l'océan
};

const RESOURCE_ICONS: Record<ResourceType, string> = {
  [ResourceType.WOOD]: '🪵',
  [ResourceType.BRICK]: '🧱',
  [ResourceType.SHEEP]: '🐑',
  [ResourceType.WHEAT]: '🌾',
  [ResourceType.ORE]: '⛏️',
  [ResourceType.DESERT]: '🏜️',
};

export function HexTile({ tile, size, onClick, isSelected }: HexTileProps) {
  // Le centre est déjà géré par le parent, donc on utilise (0,0)
  const points = hexagonPoints(size);
  const color = TERRAIN_COLORS[tile.terrain] || '#CCCCCC';
  const hasRobber = tile.hasRobber;

  return (
    <g
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Hexagone principal avec ombre pour effet 3D */}
      <defs>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
        </filter>
      </defs>
      <polygon
        points={points}
        fill={color}
        stroke={isSelected ? '#FF0000' : '#2C2C2C'}
        strokeWidth={isSelected ? 4 : 2}
        opacity={hasRobber ? 0.7 : 1}
        filter="url(#shadow)"
      />

      {/* Numéro de la tuile - Style Catan classique (en bas pour pointy-top) */}
      {tile.numberToken && (
        <>
          {/* Carré blanc avec coins arrondis et bordure noire */}
          <rect
            x={-size * 0.22}
            y={size * 0.25}
            width={size * 0.44}
            height={size * 0.44}
            fill="white"
            stroke="#000"
            strokeWidth="2"
            rx="4"
            ry="4"
          />
          {/* Numéro en gras */}
          <text
            x="0"
            y={size * 0.48}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.32}
            fontWeight="bold"
            fill={tile.numberToken === 6 || tile.numberToken === 8 ? '#c41e3a' : '#2d5016'}
          >
            {tile.numberToken}
          </text>
          {/* Points sous le numéro - nombre variable selon le numéro */}
          <g>
            {Array.from({ length: Math.min(5, tile.numberToken) }).map((_, i) => (
              <circle
                key={i}
                cx={-size * 0.15 + (i * size * 0.075)}
                cy={size * 0.62}
                r={size * 0.025}
                fill={tile.numberToken === 6 || tile.numberToken === 8 ? '#c41e3a' : '#2d5016'}
              />
            ))}
          </g>
        </>
      )}

      {/* Icône de ressource - en haut (pointe) de l'hexagone */}
      {tile.resource && (
        <text
          x="0"
          y={-size * 0.4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.6}
        >
          {RESOURCE_ICONS[tile.resource]}
        </text>
      )}

      {/* Voleur */}
      {hasRobber && (
        <g>
          <circle cx="0" cy="0" r={size * 0.3} fill="#8B0000" opacity="0.8" />
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.4}
          >
            👹
          </text>
        </g>
      )}
    </g>
  );
}

