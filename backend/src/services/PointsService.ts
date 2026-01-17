/**
 * Service pour gérer les points selon le classement
 */

export const POINTS_BY_RANK: Record<number, number> = {
  1: 50,  // 1er: 50 points
  2: 30,  // 2ème: 30 points
  3: 20,  // 3ème: 20 points
  4: 10,  // 4ème: 10 points
  5: 5,   // 5ème: 5 points
  6: 0,   // 6ème: 0 points
  7: -5,  // 7ème: -5 points
  8: -10, // 8ème: -10 points
};

export class PointsService {
  /**
   * Calcule les points selon le rang
   */
  static getPointsForRank(rank: number): number {
    return POINTS_BY_RANK[rank] || 0;
  }

  /**
   * Calcule les points pour tous les joueurs selon leur classement
   */
  static calculatePoints(players: Array<{ victoryPoints: number; id: string }>): Map<string, number> {
    // Trier par points de victoire (décroissant)
    const sorted = [...players].sort((a, b) => b.victoryPoints - a.victoryPoints);
    
    const pointsMap = new Map<string, number>();
    
    sorted.forEach((player, index) => {
      const rank = index + 1;
      const points = this.getPointsForRank(rank);
      pointsMap.set(player.id, points);
    });

    return pointsMap;
  }
}

