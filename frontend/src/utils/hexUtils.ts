import { HexCoordinate } from '@catan/shared';

/**
 * Convertit des coordonnées hexagonales en coordonnées pixel
 * Orientation pointy-top (pointe en haut)
 */
export function hexToPixel(hex: HexCoordinate, size: number): { x: number; y: number } {
  // Pour pointy-top (pointe en haut), on utilise cette formule
  const x = size * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
  const y = size * ((3 / 2) * hex.r);
  return { x, y };
}

/**
 * Génère les points SVG pour un hexagone pointy-top (pointe en haut)
 */
export function hexagonPoints(size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    // Pour pointy-top (pointe en haut), on commence à -30° (pointe vers le haut)
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = size * Math.cos(angle);
    const y = size * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

/**
 * Calcule les coordonnées des 6 intersections autour d'une tuile
 */
export function getIntersectionCoords(hex: HexCoordinate, size: number): { x: number; y: number }[] {
  const center = hexToPixel(hex, size);
  const coords: { x: number; y: number }[] = [];
  
  for (let i = 0; i < 6; i++) {
    // Pour pointy-top, les intersections sont aux coins (commence à -30° pour avoir une pointe en haut)
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = center.x + size * Math.cos(angle);
    const y = center.y + size * Math.sin(angle);
    coords.push({ x, y });
  }
  
  return coords;
}

/**
 * Trouve la tuile la plus proche d'un point
 */
export function pixelToHex(
  x: number,
  y: number,
  size: number
): HexCoordinate | null {
  const q = ((2 / 3) * x) / size;
  const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / size;
  
  return hexRound({ q, r });
}

/**
 * Arrondit des coordonnées hexagonales
 */
function hexRound(hex: { q: number; r: number }): HexCoordinate {
  let q = Math.round(hex.q);
  let r = Math.round(hex.r);
  const s = Math.round(-hex.q - hex.r);

  const qDiff = Math.abs(q - hex.q);
  const rDiff = Math.abs(r - hex.r);
  const sDiff = Math.abs(s - (-hex.q - hex.r));

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }

  return { q, r };
}

/**
 * Trouve les intersections adjacentes à une intersection donnée
 * Pour pointy-top, les directions sont :
 * - (q+1, r), (q+1, r-1), (q, r-1), (q-1, r), (q-1, r+1), (q, r+1)
 */
export function getAdjacentIntersections(
  coord: HexCoordinate,
  allIntersections: Array<{ coordinate: HexCoordinate }>
): HexCoordinate[] {
  const directions = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];

  const adjacent: HexCoordinate[] = [];
  
  directions.forEach(dir => {
    const targetCoord = { q: coord.q + dir.q, r: coord.r + dir.r };
    const found = allIntersections.find(
      i => i.coordinate.q === targetCoord.q && i.coordinate.r === targetCoord.r
    );
    if (found) {
      adjacent.push(targetCoord);
    }
  });

  return adjacent;
}

