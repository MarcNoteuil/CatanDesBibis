import { ResourceType, Player, GameState } from '@catan/shared';
import { BOARD_CONFIG } from '@catan/shared';

export class ResourceManager {
  /**
   * Vérifie si un joueur a assez de ressources pour une action
   */
  static canAfford(player: Player, cost: Partial<Player['resources']>): boolean {
    for (const [resource, amount] of Object.entries(cost)) {
      if (amount && player.resources[resource as keyof Player['resources']] < amount) {
        return false;
      }
    }
    return true;
  }

  /**
   * Déduit des ressources d'un joueur
   */
  static deductResources(player: Player, cost: Partial<Player['resources']>): void {
    for (const [resource, amount] of Object.entries(cost)) {
      if (amount) {
        player.resources[resource as keyof Player['resources']] -= amount;
      }
    }
  }

  /**
   * Ajoute des ressources à un joueur
   */
  static addResources(player: Player, resources: Partial<Player['resources']>): void {
    for (const [resource, amount] of Object.entries(resources)) {
      if (amount && amount > 0) {
        player.resources[resource as keyof Player['resources']] += amount;
      }
    }
  }

  /**
   * Distribue les ressources aux joueurs selon le résultat des dés
   */
  static distributeResources(gameState: GameState, diceValue: number): void {
    if (diceValue === 7) return; // Le voleur ne distribue pas de ressources

    // Trouver toutes les tuiles avec ce numéro
    const matchingTiles = gameState.board.tiles.filter(
      tile => tile.numberToken === diceValue && !tile.hasRobber
    );

    // Pour chaque tuile, distribuer aux joueurs adjacents
    matchingTiles.forEach(tile => {
      if (!tile.resource) return;

      // Trouver les intersections adjacentes à cette tuile
      const adjacentIntersections = ResourceManager.getAdjacentIntersections(
        tile.coordinate,
        gameState.board.intersections
      );

      // Distribuer la ressource aux joueurs qui ont des bâtiments sur ces intersections
      adjacentIntersections.forEach(intersection => {
        if (intersection.building) {
          const player = gameState.players.find(p => p.id === intersection.building!.playerId);
          if (player) {
            const amount = intersection.building.type === 'city' ? 2 : 1;
            ResourceManager.addResources(player, { [tile.resource!]: amount });
          }
        }
      });
    });
  }

  /**
   * Trouve les intersections adjacentes à une tuile hexagonale
   */
  private static getAdjacentIntersections(
    tileCoord: { q: number; r: number },
    intersections: any[]
  ): any[] {
    // Les 6 intersections autour d'une tuile hexagonale
    const offsets = [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 0, r: 1 },
      { q: -1, r: 1 },
      { q: -1, r: 0 },
      { q: 0, r: -1 },
    ];

    return intersections.filter(intersection => {
      return offsets.some(offset => {
        const expectedCoord = {
          q: tileCoord.q + offset.q,
          r: tileCoord.r + offset.r,
        };
        return (
          intersection.coordinate.q === expectedCoord.q &&
          intersection.coordinate.r === expectedCoord.r
        );
      });
    });
  }

  /**
   * Gère le vol de ressources quand un 7 est lancé
   */
  static handleRobber(
    gameState: GameState,
    targetPlayerId: string,
    robberTileId: string
  ): keyof Player['resources'] | null {
    const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return null;

    // Compter le total de ressources
    const totalResources = Object.values(targetPlayer.resources).reduce((a, b) => a + b, 0);

    // Si le joueur a plus de 7 ressources, il doit en donner la moitié
    if (totalResources > 7) {
      const discardCount = Math.floor(totalResources / 2);
      // Pour simplifier, on retire aléatoirement (en vrai, le joueur choisit)
      const resourcesToDiscard = this.selectResourcesToDiscard(targetPlayer, discardCount);
      this.deductResources(targetPlayer, resourcesToDiscard);
    }

    // Déplacer le voleur
    gameState.board.tiles.forEach(tile => {
      tile.hasRobber = tile.id === robberTileId;
    });

    // Voler une ressource aléatoire du joueur ciblé
    const availableResources = Object.entries(targetPlayer.resources)
      .filter(([_, count]) => count > 0)
      .map(([resource]) => resource as keyof Player['resources']);

    if (availableResources.length > 0) {
      const stolenResource = availableResources[
        Math.floor(Math.random() * availableResources.length)
      ] as keyof Player['resources'];
      this.deductResources(targetPlayer, { [stolenResource]: 1 } as any);
      return stolenResource;
    }

    return null;
  }

  /**
   * Sélectionne aléatoirement des ressources à défausser
   */
  private static selectResourcesToDiscard(
    player: Player,
    count: number
  ): Player['resources'] {
    const discard: Player['resources'] = {
      wood: 0,
      brick: 0,
      sheep: 0,
      wheat: 0,
      ore: 0,
    };

    const availableResources: ResourceType[] = [];
    Object.entries(player.resources).forEach(([resource, amount]) => {
      for (let i = 0; i < amount; i++) {
        availableResources.push(resource as ResourceType);
      }
    });

    // Mélanger et prendre les premières
    for (let i = availableResources.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableResources[i], availableResources[j]] = [
        availableResources[j],
        availableResources[i],
      ];
    }

    availableResources.slice(0, count).forEach(resource => {
      discard[resource as keyof Player['resources']]++;
    });

    return discard;
  }
}

