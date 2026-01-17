import { HexCoordinate, Intersection, Road, BuildingType } from '@catan/shared';

export class BuildingValidator {
  /**
   * Vérifie si une intersection est valide pour placer une colonie
   */
  static canPlaceSettlement(
    coordinate: HexCoordinate,
    playerId: string,
    intersections: Intersection[],
    roads: Road[],
    isSetupPhase: boolean
  ): { valid: boolean; reason?: string } {
    // Vérifier si l'intersection existe
    const intersection = intersections.find(
      i => i.coordinate.q === coordinate.q && i.coordinate.r === coordinate.r
    );

    if (!intersection) {
      return { valid: false, reason: "L'intersection n'existe pas" };
    }

    // Vérifier si l'intersection est déjà occupée
    if (intersection.building) {
      return { valid: false, reason: "L'intersection est déjà occupée" };
    }

    // Vérifier la distance (pas de colonie adjacente - même si c'est la nôtre)
    // Deux maisons doivent être séparées d'au moins une intersection
    const tooClose = intersections.some(i => {
      if (!i.building) return false;
      
      const distance = this.hexDistance(coordinate, i.coordinate);
      return distance <= 1; // Distance de 1 = adjacent, distance de 0 = même intersection
    });

    if (tooClose) {
      return { valid: false, reason: 'Trop proche d\'une autre colonie (au moins une intersection d\'écart requis)' };
    }

    // En phase de jeu normal, vérifier qu'il y a une route connectée
    if (!isSetupPhase) {
      const hasConnectedRoad = roads.some(
        road =>
          road.playerId === playerId &&
          (this.hexDistance(road.from, coordinate) === 0 ||
            this.hexDistance(road.to, coordinate) === 0)
      );

      if (!hasConnectedRoad) {
        return { valid: false, reason: 'Aucune route connectée' };
      }
    }

    return { valid: true };
  }

  /**
   * Vérifie si une colonie peut être transformée en ville
   */
  static canUpgradeToCity(
    coordinate: HexCoordinate,
    playerId: string,
    intersections: Intersection[]
  ): { valid: boolean; reason?: string } {
    const intersection = intersections.find(
      i => i.coordinate.q === coordinate.q && i.coordinate.r === coordinate.r
    );

    if (!intersection) {
      return { valid: false, reason: "L'intersection n'existe pas" };
    }

    if (!intersection.building) {
      return { valid: false, reason: "Aucune colonie à cet emplacement" };
    }

    if (intersection.building.playerId !== playerId) {
      return { valid: false, reason: "Cette colonie ne vous appartient pas" };
    }

    if (intersection.building.type !== BuildingType.SETTLEMENT) {
      return { valid: false, reason: 'Il y a déjà une ville ici' };
    }

    return { valid: true };
  }

  /**
   * Vérifie si une route peut être placée
   */
  static canPlaceRoad(
    from: HexCoordinate,
    to: HexCoordinate,
    playerId: string,
    intersections: Intersection[],
    roads: Road[],
    isSetupPhase: boolean
  ): { valid: boolean; reason?: string } {
    // Vérifier que les deux intersections existent
    const fromIntersection = intersections.find(
      i => i.coordinate.q === from.q && i.coordinate.r === from.r
    );
    const toIntersection = intersections.find(
      i => i.coordinate.q === to.q && i.coordinate.r === to.r
    );

    if (!fromIntersection || !toIntersection) {
      return { valid: false, reason: "Les intersections n'existent pas" };
    }

    // Vérifier que c'est une route valide (distance = 1)
    if (this.hexDistance(from, to) !== 1) {
      return { valid: false, reason: 'Les intersections ne sont pas adjacentes' };
    }

    // Vérifier qu'il n'y a pas déjà une route
    const existingRoad = roads.find(
      road =>
        (this.hexDistance(road.from, from) === 0 && this.hexDistance(road.to, to) === 0) ||
        (this.hexDistance(road.from, to) === 0 && this.hexDistance(road.to, from) === 0)
    );

    if (existingRoad) {
      return { valid: false, reason: 'Une route existe déjà ici' };
    }

    // En phase de jeu normal, vérifier la connexion
    if (!isSetupPhase) {
      const hasConnection =
        // Route connectée à une autre route du joueur
        roads.some(
          road =>
            road.playerId === playerId &&
            (this.hexDistance(road.from, from) === 0 ||
              this.hexDistance(road.to, from) === 0 ||
              this.hexDistance(road.from, to) === 0 ||
              this.hexDistance(road.to, to) === 0)
        ) ||
        // Ou route connectée à un bâtiment du joueur
        intersections.some(
          i =>
            i.building?.playerId === playerId &&
            (this.hexDistance(i.coordinate, from) === 0 ||
              this.hexDistance(i.coordinate, to) === 0)
        );

      if (!hasConnection) {
        return { valid: false, reason: 'La route doit être connectée à vos routes ou bâtiments' };
      }
    }

    return { valid: true };
  }

  /**
   * Calcule la distance hexagonale entre deux coordonnées
   */
  private static hexDistance(a: HexCoordinate, b: HexCoordinate): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }
}

