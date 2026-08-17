// Daily Login Bonus System for Shoot The Bird Game

export interface LoginReward {
  day: number;
  points: number;
  bonusTitle: string;
  bonusIcon: string;
  bonusDesc: string;
  extraLife?: number;
}

export const LOGIN_REWARDS: LoginReward[] = [
  { day: 1, points: 100, bonusTitle: 'Fledgling Bonus', bonusIcon: '🪙', bonusDesc: '+100 Score Boost' },
  { day: 2, points: 200, bonusTitle: 'Sharpshooter Perk', bonusIcon: '🎯', bonusDesc: '+200 Score Boost' },
  { day: 3, points: 300, bonusTitle: 'Chrono Booster', bonusIcon: '⏱️', bonusDesc: '+300 Pts & Slow-Mo Gift' },
  { day: 4, points: 400, bonusTitle: 'Avian Hunter', bonusIcon: '🏹', bonusDesc: '+400 Score Boost' },
  { day: 5, points: 500, bonusTitle: 'Triple Volley', bonusIcon: '⚡', bonusDesc: '+500 Pts & Triple Blast' },
  { day: 6, points: 750, bonusTitle: 'Guardian Aegis', bonusIcon: '🛡️', bonusDesc: '+750 Pts & Shield Protection' },
  { day: 7, points: 1000, bonusTitle: 'Phoenix Legend', bonusIcon: '💖', bonusDesc: '+1,000 Pts & +1 Extra Life!', extraLife: 1 },
];

export interface LoginStreakState {
  currentStreak: number;
  lastClaimDate: string;
  claimedToday: boolean;
  totalClaims: number;
  bonusPointsEarned: number;
}

const LOGIN_BONUS_KEY = 'birdShooter_dailyLoginBonus_v2';

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getLoginStreakState(): LoginStreakState {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  try {
    const raw = localStorage.getItem(LOGIN_BONUS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const lastDate = data.lastClaimDate || '';
      
      let streak = data.currentStreak || 1;
      let claimedToday = lastDate === today;

      // If last claimed was not today or yesterday, streak broken -> reset to day 1 (unclaimed today)
      if (lastDate !== today && lastDate !== yesterday && lastDate !== '') {
        streak = 1;
        claimedToday = false;
      }

      return {
        currentStreak: streak,
        lastClaimDate: lastDate,
        claimedToday,
        totalClaims: data.totalClaims || 0,
        bonusPointsEarned: data.bonusPointsEarned || 0,
      };
    }
  } catch {}

  return {
    currentStreak: 1,
    lastClaimDate: '',
    claimedToday: false,
    totalClaims: 0,
    bonusPointsEarned: 0,
  };
}

export function claimTodayLoginBonus(): {
  success: boolean;
  reward: LoginReward;
  updatedState: LoginStreakState;
} {
  const state = getLoginStreakState();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (state.claimedToday) {
    const dayIdx = ((state.currentStreak - 1) % 7);
    return {
      success: false,
      reward: LOGIN_REWARDS[dayIdx],
      updatedState: state,
    };
  }

  let nextStreak = 1;
  if (state.lastClaimDate === yesterday) {
    nextStreak = (state.currentStreak % 7) + 1;
  } else if (state.lastClaimDate === today) {
    nextStreak = state.currentStreak;
  } else {
    nextStreak = 1;
  }

  const rewardIndex = (nextStreak - 1) % 7;
  const reward = LOGIN_REWARDS[rewardIndex];

  const updatedState: LoginStreakState = {
    currentStreak: nextStreak,
    lastClaimDate: today,
    claimedToday: true,
    totalClaims: state.totalClaims + 1,
    bonusPointsEarned: state.bonusPointsEarned + reward.points,
  };

  try {
    localStorage.setItem(LOGIN_BONUS_KEY, JSON.stringify(updatedState));
  } catch {}

  return {
    success: true,
    reward,
    updatedState,
  };
}
