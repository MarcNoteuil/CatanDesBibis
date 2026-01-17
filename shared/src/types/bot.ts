export enum BotLevel {
  AMATEUR = 'amateur',
  INTERMEDIATE = 'intermediate',
  DIFFICULT = 'difficult',
}

export interface BotConfig {
  level: BotLevel;
  name: string;
  color: string;
}

