import { DevelopmentCardType } from '@catan/shared';

export class DevelopmentCardDeck {
  private cards: DevelopmentCardType[];

  constructor() {
    // Composition standard d'un deck de cartes développement
    this.cards = [
      // 14 Chevaliers
      ...Array(14).fill(DevelopmentCardType.KNIGHT),
      // 5 Points de victoire
      ...Array(5).fill(DevelopmentCardType.VICTORY_POINT),
      // 2 Construction de routes
      ...Array(2).fill(DevelopmentCardType.ROAD_BUILDING),
      // 2 Année d'abondance
      ...Array(2).fill(DevelopmentCardType.YEAR_OF_PLENTY),
      // 2 Monopole
      ...Array(2).fill(DevelopmentCardType.MONOPOLY),
    ];

    this.shuffle();
  }

  /**
   * Pioche une carte
   */
  draw(): DevelopmentCardType | null {
    if (this.cards.length === 0) {
      return null;
    }
    return this.cards.pop() || null;
  }

  /**
   * Mélange le deck
   */
  private shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Nombre de cartes restantes
   */
  getRemainingCount(): number {
    return this.cards.length;
  }
}

