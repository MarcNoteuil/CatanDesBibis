export class DiceService {
  /**
   * Lance deux dés et retourne la somme
   */
  static rollDice(): number {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    return die1 + die2;
  }

  /**
   * Vérifie si le résultat est un 7 (voleur)
   */
  static isRobber(value: number): boolean {
    return value === 7;
  }
}

