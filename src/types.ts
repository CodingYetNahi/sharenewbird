export type WeatherType = 'clear' | 'rain' | 'snow' | 'drizzle';

export type BackgroundThemeType = 'day' | 'sunset' | 'night' | 'snow';

export type PowerUpType = 'slow_mo' | 'multi_shot' | 'shield';

export type HapticIntensity = 'off' | 'low' | 'medium' | 'high';

export interface ShotHistoryPoint {
  x: number;
  y: number;
  hit: boolean;
  isCritical?: boolean;
}

export interface PowerUpEntity {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  bobPhase: number;
  collected: boolean;
}

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number;
  maxDuration: number;
}

export interface MatchPerformanceStats {
  score: number;
  bestScore: number;
  birdsHunted: number;
  lifetimeBirdsHunted: number;
  headshots: number;
  lifetimeHeadshots: number;
  birdsSaved: number;
  lifetimeBirdsSaved: number;
  avgReactionTimeMs: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  accuracyStreak: number;
  highestAccuracyStreak: number;
  highestCombo: number;
  ufoKills: number;
  powerUpsCollected: number;
  shotsHistory?: ShotHistoryPoint[];
  gameMode: 'SOLO' | 'MULTIPLAYER';
  winnerName?: string | null;
  rivalName?: string;
  rivalScore?: number;
}

export interface LifetimeStats {
  lifetimeHeadshots: number;
  lifetimeBirdsSaved: number;
  lifetimeBirdsHunted: number;
  totalGamesPlayed: number;
  bestAccuracy: number;
  bestAccuracyStreak: number;
  fastestReactionMs: number;
}

export interface DailyChallengeHistoryEntry {
  date: string;
  displayDate: string;
  dayName: string;
  isToday: boolean;
  timeLimit: number;
  reward: number;
  targets: Record<string, number>;
  progress: Record<string, number>;
  completed: boolean;
  claimed: boolean;
  completionRate: number;
}

