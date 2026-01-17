import { Tile, HexCoordinate, TerrainType, ResourceType, Intersection } from '@catan/shared';
import { BOARD_CONFIG, TERRAIN_TO_RESOURCE } from '@catan/shared';
import { v4 as uuidv4 } from 'uuid';

export class BoardGenerator {
  /**
   * Génère un plateau selon le nombre de joueurs
   * @param playerCount Nombre de joueurs (2-8)
   */
  generateBoard(playerCount: number = 4): { tiles: Tile[]; intersections: Intersection[]; roads: any[] } {
    // Configuration selon le nombre de joueurs :
    // 2-4 joueurs : plateau standard (3-4-5-4-3 = 19 hexagones)
    // 5-6 joueurs : plateau moyen (4-5-6-5-4 = 24 hexagones)
    // 7-8 joueurs : grand plateau (4-5-6-7-6-5-4 = 37 hexagones)
    let config;
    if (playerCount >= 7) {
      config = BOARD_CONFIG.LARGE;
    } else if (playerCount >= 5) {
      config = BOARD_CONFIG.MEDIUM;
    } else {
      config = BOARD_CONFIG.SMALL;
    }
    
    const tiles = this.generateTiles(config, playerCount >= 7, playerCount);
    const intersections = this.generateIntersections(tiles);
    const roads: any[] = [];

    return { tiles, intersections, roads };
  }

  private generateTiles(config: any, isLargeMap: boolean, playerCount?: number): Tile[] {
    const tiles: Tile[] = [];
    
    // Générer les terrains selon la configuration
    const terrains: TerrainType[] = [];
    Object.entries(config.TILES).forEach(([terrain, count]) => {
      const tileCount = count as number;
      for (let i = 0; i < tileCount; i++) {
        terrains.push(terrain as TerrainType);
      }
    });

    // Mélanger les terrains
    this.shuffleArray(terrains);

    // Générer les coordonnées hexagonales
    const radius = config.RADIUS;
    const coordinates = this.generateHexCoordinates(radius, playerCount);
    
    // Assigner les terrains aux coordonnées
    let terrainIndex = 0;
    let tokenIndex = 0;
    const tokens = [...BOARD_CONFIG.NUMBER_TOKENS];
    this.shuffleArray(tokens);

    coordinates.forEach((coord) => {
      if (terrainIndex >= terrains.length) return;
      
      const terrain = terrains[terrainIndex++];
      const resource = TERRAIN_TO_RESOURCE[terrain] || undefined;
      const numberToken = terrain === TerrainType.DESERT ? undefined : tokens[tokenIndex++];
      const hasRobber = terrain === TerrainType.DESERT;

      tiles.push({
        id: uuidv4(),
        coordinate: coord,
        terrain,
        resource,
        numberToken,
        hasRobber,
      });
    });

    return tiles;
  }

  private generateHexCoordinates(radius: number, playerCount?: number): HexCoordinate[] {
    const coordinates: HexCoordinate[] = [];
    
    // Déterminer la forme selon le nombre de joueurs ou le radius
    // Si radius est 2 et playerCount >= 5, c'est le plateau moyen (4-5-6-5-4)
    // Si radius est 2, c'est le plateau standard (3-4-5-4-3)
    // Si radius est 3, c'est le grand plateau (4-5-6-7-6-5-4)
    if (radius === 2.5 || (radius === 2 && playerCount && playerCount >= 5 && playerCount <= 6)) {
      // Plateau moyen pour 5-6 joueurs : 4-5-6-5-4 hexagones par rangée (24 hexagones)
      const rows = [
        { r: -2, qStart: -2, qEnd: 1 },   // 4 hexagones
        { r: -1, qStart: -2, qEnd: 2 },   // 5 hexagones
        { r: 0, qStart: -3, qEnd: 2 },     // 6 hexagones (centre)
        { r: 1, qStart: -2, qEnd: 2 },     // 5 hexagones
        { r: 2, qStart: -1, qEnd: 2 },     // 4 hexagones
      ];
      
      rows.forEach(row => {
        for (let q = row.qStart; q <= row.qEnd; q++) {
          coordinates.push({ q, r: row.r });
        }
      });
    } else if (radius === 2) {
      // Plateau standard Catan : 3-4-5-4-3 hexagones par rangée (19 hexagones)
      const rows = [
        { r: -2, qStart: -1, qEnd: 1 },   // 3 hexagones
        { r: -1, qStart: -1, qEnd: 2 },   // 4 hexagones
        { r: 0, qStart: -2, qEnd: 2 },    // 5 hexagones
        { r: 1, qStart: -2, qEnd: 1 },    // 4 hexagones
        { r: 2, qStart: -1, qEnd: 1 },    // 3 hexagones
      ];
      
      rows.forEach(row => {
        for (let q = row.qStart; q <= row.qEnd; q++) {
          coordinates.push({ q, r: row.r });
        }
      });
    } else if (radius === 3) {
      // Grand plateau pour 7-8 joueurs : 4-5-6-7-6-5-4 hexagones par rangée (37 hexagones)
      const rows = [
        { r: -3, qStart: -2, qEnd: 1 },   // 4 hexagones
        { r: -2, qStart: -2, qEnd: 2 },   // 5 hexagones
        { r: -1, qStart: -3, qEnd: 2 },   // 6 hexagones
        { r: 0, qStart: -3, qEnd: 3 },    // 7 hexagones (centre)
        { r: 1, qStart: -2, qEnd: 3 },    // 6 hexagones
        { r: 2, qStart: -2, qEnd: 2 },    // 5 hexagones
        { r: 3, qStart: -1, qEnd: 2 },    // 4 hexagones
      ];
      
      rows.forEach(row => {
        for (let q = row.qStart; q <= row.qEnd; q++) {
          coordinates.push({ q, r: row.r });
        }
      });
    } else {
      // Fallback : génération par rayon (ancienne méthode)
      for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r++) {
          if (Math.abs(q) + Math.abs(r) + Math.abs(-q - r) <= radius * 2) {
            coordinates.push({ q, r });
          }
        }
      }
    }

    return coordinates;
  }

  private generateIntersections(tiles: Tile[]): Intersection[] {
    const intersections: Map<string, Intersection> = new Map();

    // Pour chaque tuile, générer les 6 intersections autour
    tiles.forEach(tile => {
      const { q, r } = tile.coordinate;
      
      // Les 6 intersections autour d'une tuile hexagonale
      const offsets = [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
        { q: 1, r: -1 },
        { q: 0, r: -1 },
        { q: -1, r: 0 },
        { q: -1, r: 1 },
      ];

      offsets.forEach(offset => {
        const intersectionCoord = {
          q: q + offset.q,
          r: r + offset.r,
        };

        const key = `${intersectionCoord.q},${intersectionCoord.r}`;
        
        if (!intersections.has(key)) {
          intersections.set(key, {
            id: uuidv4(),
            coordinate: intersectionCoord,
          });
        }
      });
    });

    return Array.from(intersections.values());
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

