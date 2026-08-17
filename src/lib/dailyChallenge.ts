import { DailyChallengeHistoryEntry } from '../types';

export type ChallengeBird = 'normal' | 'fast' | 'small';

export interface DailyChallenge {
  date: string;
  timeLimit: number;
  reward: number;
  targets: Record<ChallengeBird, number>;
}

export const challengeLabels: Record<ChallengeBird, string> = {
  normal: 'Normal',
  fast: 'Swift',
  small: 'Humming',
};

export const CHALLENGE_HISTORY_KEY = 'birdShooter_challengeHistory_map_v2';

// UTC makes the date boundary identical for every player worldwide.
export function getChallengeDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function dateSeed(date: string) {
  let seed = 2166136261;
  for (const char of date) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return seed >>> 0;
}

export function getDailyChallenge(date = getChallengeDate()): DailyChallenge {
  let seed = dateSeed(date);
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return {
    date,
    timeLimit: 70 + Math.floor(next() * 3) * 5,
    reward: 1200 + Math.floor(next() * 5) * 100,
    targets: {
      normal: 4 + Math.floor(next() * 4),
      fast: 3 + Math.floor(next() * 3),
      small: 1 + Math.floor(next() * 3),
    },
  };
}

export function safePlayerId(playerName: string) {
  const storageKey = 'birdShooter_playerId_v1';
  try {
    let id = localStorage.getItem(storageKey);
    if (!id) {
      id = crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(storageKey, id);
    }
    return id.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 80);
  } catch {
    // Stable fallback for restricted storage contexts; never place the raw name in a path.
    return `local-${dateSeed(playerName.trim().toLowerCase() || 'player').toString(36)}`;
  }
}

export function getStoredHistoryMap(): Record<string, { progress: Record<ChallengeBird, number>; claimed: boolean }> {
  try {
    const raw = localStorage.getItem(CHALLENGE_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function recordChallengeProgressInHistory(date: string, progress: Record<ChallengeBird, number>, claimed: boolean) {
  try {
    const map = getStoredHistoryMap();
    map[date] = { progress, claimed };
    localStorage.setItem(CHALLENGE_HISTORY_KEY, JSON.stringify(map));
  } catch {}
}

export function getPast7DaysChallengeHistory(todayDate = getChallengeDate()): {
  entries: DailyChallengeHistoryEntry[];
  completedCount: number;
  currentStreak: number;
  totalRewardEarned: number;
} {
  const historyMap = getStoredHistoryMap();
  const entries: DailyChallengeHistoryEntry[] = [];
  const todayObj = new Date(todayDate + 'T00:00:00Z');

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < 7; i++) {
    const targetDateObj = new Date(todayObj.getTime() - i * 86400000);
    const dateStr = targetDateObj.toISOString().slice(0, 10);
    const challenge = getDailyChallenge(dateStr);
    const stored = historyMap[dateStr];

    const isToday = i === 0;
    const isYesterday = i === 1;

    const dayName = daysOfWeek[targetDateObj.getUTCDay()];
    const monthName = months[targetDateObj.getUTCMonth()];
    const dayNum = targetDateObj.getUTCDate();

    const displayDate = isToday
      ? `Today, ${monthName} ${dayNum}`
      : isYesterday
      ? `Yesterday, ${monthName} ${dayNum}`
      : `${dayName}, ${monthName} ${dayNum}`;

    const progress: Record<ChallengeBird, number> = stored?.progress || { normal: 0, fast: 0, small: 0 };
    const claimed = Boolean(stored?.claimed);

    const isCompleted =
      claimed ||
      (progress.normal >= challenge.targets.normal &&
        progress.fast >= challenge.targets.fast &&
        progress.small >= challenge.targets.small);

    const totalTargets = challenge.targets.normal + challenge.targets.fast + challenge.targets.small;
    const currentProgressTotal =
      Math.min(challenge.targets.normal, progress.normal) +
      Math.min(challenge.targets.fast, progress.fast) +
      Math.min(challenge.targets.small, progress.small);

    const completionRate = Math.min(100, Math.round((currentProgressTotal / Math.max(1, totalTargets)) * 100));

    entries.push({
      date: dateStr,
      displayDate,
      dayName,
      isToday,
      timeLimit: challenge.timeLimit,
      reward: challenge.reward,
      targets: challenge.targets,
      progress,
      completed: isCompleted,
      claimed,
      completionRate: isCompleted ? 100 : completionRate,
    });
  }

  const completedCount = entries.filter((e) => e.completed).length;

  let currentStreak = 0;
  for (const entry of entries) {
    if (entry.completed) {
      currentStreak++;
    } else {
      // If today is not completed yet, keep streak unbroken if yesterday was completed
      if (entry.isToday) continue;
      break;
    }
  }

  const totalRewardEarned = entries.filter((e) => e.completed).reduce((sum, e) => sum + e.reward, 0);

  return {
    entries,
    completedCount,
    currentStreak,
    totalRewardEarned,
  };
}

