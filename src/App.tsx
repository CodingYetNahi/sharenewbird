import React, { useEffect, useRef, useState } from 'react';
import homeBird from './assets/game/bird-normal.webp';
import {
  Play,
  Trophy,
  HelpCircle,
  Settings as SettingsIcon,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Shield,
  Plane,
  Crosshair,
  Sparkles,
  Heart,
  Volume1,
  AlertTriangle,
  Skull,
  Share2,
  Swords,
  Users,
  Zap,
  Crown,
  Flame,
Target,
Radio,
Clock,
CloudRain,
Snowflake,
Sun,
RotateCcw,
Home
} from 'lucide-react';
import {
  submitScoreToFirestore,
  subscribeToLeaderboard,
  MultiplayerRoomData,
  updateRoomPlayer,
  sendRoomSabotage,
  sendRoomTaunt,
  completeMultiplayerMatch,
  subscribeToMultiplayerRoom, loadDailyChallenge, saveDailyChallengeProgress, claimDailyChallengeReward
} from './lib/firebase';
import { MultiplayerModal } from './components/MultiplayerModal';
import { MatchSummaryModal } from './components/MatchSummaryModal';
import {
  MainMenuModal,
  HowToPlayModal,
  SettingsModal,
  LeaderboardModal,
  GameSettings
} from './components/Modals';
import {
  createAudioSystem,
  initAudioContext,
  playSoundShoot,
  playSoundHit,
  playSoundEscape,
  playSoundCombo,
  playSoundBonusPlane,
  playSoundDangerPenalty,
  playSoundGameOver,
  playSoundChomp,
  playSoundUfoSpawn,
  playSoundUfoEmp,
  playSoundUfoExplode,
  playSoundCriticalHit,
  playSoundPowerUpSpawn,
  playSoundPowerUpCollect,
  playSoundExtraLife,
  playSoundSabotageAlert,
  playSoundStreakMilestone,
  playSoundBirdPop,
  playSoundHudTick,
  playSoundComboDing,
  startBackgroundMusic,
  stopBackgroundMusic,
AudioSystem,
duckMusic,
restoreMusic,
updateMusicVolume
} from './lib/audio';
import {
  entityConfigs,
  getDifficultyFactor,
  updateWeatherCycle,
  drawWeatherAtmosphere,
  drawPowerUpCapsules
} from './lib/gameLogic';
import {
  drawDetailedBird,
  drawDetailedAeroplane
} from './lib/renderEntities';
import {
  WeatherType,
  PowerUpType,
  PowerUpEntity,
  ActivePowerUp,
  MatchPerformanceStats,
  LifetimeStats,
  BackgroundThemeType,
  ShotHistoryPoint,
  HapticIntensity
} from './types';
import {
  challengeLabels,
  getDailyChallenge,
  safePlayerId,
  ChallengeBird,
  recordChallengeProgressInHistory
} from './lib/dailyChallenge';
import {
  drawDynamicBackground,
  createStarField,
  getCurrentThemeState,
  StarParticle
} from './lib/themes';

const STORAGE_KEY = 'birdShooterData_v7';
const SETTINGS_KEY = 'birdShooter_userSettings_v7';
const LIFETIME_STATS_KEY = 'birdShooter_lifetimeStats_v2';
const DAILY_PROGRESS_KEY = 'birdShooter_dailyChallenge_v1';

function loadLocalDailyProgress(date: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(DAILY_PROGRESS_KEY) || 'null');
    if (
      saved?.date === date &&
      typeof saved?.progress?.normal === 'number' &&
      typeof saved?.progress?.fast === 'number' &&
      typeof saved?.progress?.small === 'number'
    ) return saved as { date: string; progress: Record<ChallengeBird, number>; claimed: boolean };
  } catch {}
  return null;
}

function saveLocalDailyProgress(date: string, progress: Record<ChallengeBird, number>, claimed: boolean) {
  try {
    localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify({ date, progress, claimed }));
    recordChallengeProgressInHistory(date, progress, claimed);
  } catch {}
}

function loadLifetimeStats(): LifetimeStats {
  try {
    const raw = localStorage.getItem(LIFETIME_STATS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {
    lifetimeHeadshots: 0,
    lifetimeBirdsSaved: 0,
    lifetimeBirdsHunted: 0,
    totalGamesPlayed: 0,
    bestAccuracy: 0,
    bestAccuracyStreak: 0,
    fastestReactionMs: 9999,
  };
}

function saveLifetimeStats(stats: LifetimeStats) {
  try {
    localStorage.setItem(LIFETIME_STATS_KEY, JSON.stringify(stats));
  } catch {}
}

function loadStoredData() {
  let savedSettings: GameSettings = {
    sound: true,
    music: true,
    musicVolume: 0.6,
    soundVolume: 0.7,
    vibration: true,
    hapticIntensity: 'medium',
    fps: false,
  };

  try {
    const rawSettings = localStorage.getItem(SETTINGS_KEY);
    if (rawSettings) {
      savedSettings = { ...savedSettings, ...JSON.parse(rawSettings) };
    }
  } catch {}

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        playerName: parsed.playerName || '',
        scores: parsed.scores || ([] as { name: string; score: number; date: string }[]),
        best: parsed.best || 0,
        settings: { ...savedSettings, ...(parsed.settings || {}) },
      };
    }
  } catch {}

  return {
    playerName: '',
    scores: [] as { name: string; score: number; date: string }[],
    best: 0,
    settings: savedSettings,
  };
}

// Vector Bird Mascot - Rich layered plumage & glossy anime sparkle
export function BirdMascot({
  size = 48,
  className = ''
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={homeBird}
      alt="Bird"
      width={size}
      height={size}
      className={`inline-block object-contain drop-shadow-md ${className}`}
    />
  );
}

      
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Storage & State
  const [data, setData] = useState(loadStoredData);
  const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats>(loadLifetimeStats);
  const [gameState, setGameState] = useState<
    'MENU' | 'NAME' | 'PLAYING' | 'PAUSED' | 'SETTINGS' | 'SETTINGS_PAUSED' | 'HOW' | 'RANKS' | 'SUMMARY'
  >('MENU');
  const [gameMode, setGameMode] = useState<'SOLO' | 'MULTIPLAYER'>('SOLO');
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [activeMultiRoom, setActiveMultiRoom] = useState<MultiplayerRoomData | null>(null);
  const [isHostPlayer, setIsHostPlayer] = useState(false);
  const [rivalScore, setRivalScore] = useState(0);
  const [rivalCombo, setRivalCombo] = useState(0);
  const [rivalLives, setRivalLives] = useState(3);
  const [rivalName, setRivalName] = useState('Challenger');
  const [lastSabotageTime, setLastSabotageTime] = useState(0);
  const [duelTime, setDuelTime] = useState(60);
  const [duelStartsIn, setDuelStartsIn] = useState(0);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(Number(data.best) || 0);
  const [multiplier, setMultiplier] = useState(1);
  const [comboText, setComboText] = useState('');
  const [showCombo, setShowCombo] = useState(false);
  const [accuracyStreak, setAccuracyStreak] = useState(0);
  const [highestAccuracyStreak, setHighestAccuracyStreak] = useState(0);
  const [hudMode, setHudMode] = useState<'COMBO' | 'STREAK'>('COMBO');
  const [currentThemeBadge, setCurrentThemeBadge] = useState('☀️ Azure Day');
  const [lives, setLives] = useState(3);
  const [fpsDisplay, setFpsDisplay] = useState('60 FPS');
  const [nameInput, setNameInput] = useState(data.playerName || '');
  const [globalRanks, setGlobalRanks] = useState<{ name: string; score: number }[]>([]);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dailyChallenge = useRef(getDailyChallenge()).current;
  const [dailyProgress, setDailyProgress] = useState<Record<ChallengeBird, number>>({ normal: 0, fast: 0, small: 0 });
  const [dailyTime, setDailyTime] = useState(dailyChallenge.timeLimit);
  const [dailyClaimed, setDailyClaimed] = useState(false);

  // Match Performance State
  const [currentWeather, setCurrentWeather] = useState<WeatherType>('clear');
  const [activeBuff, setActiveBuff] = useState<ActivePowerUp | null>(null);
  const [summaryStats, setSummaryStats] = useState<MatchPerformanceStats | null>(null);

  // Audio System Ref
  const audioSysRef = useRef<AudioSystem>(createAudioSystem());
  const toastTimerRef = useRef<number | null>(null);

  // Mutable Game Loop State
  const gameRef = useRef({
    birds: [] as any[],
    particles: [] as any[],
    floatingTexts: [] as any[],
    powerUps: [] as PowerUpEntity[],
    activePowerUp: null as ActivePowerUp | null,
    weatherParticles: [] as any[],
    weather: 'clear' as WeatherType,
    weatherTimer: 0,
    score: 0,
    lives: 3,
    combo: 0,
    multiplier: 1,
    accuracyStreak: 0,
    highestAccuracyStreak: 0,
    stars: createStarField(70),
    elapsed: 0,
    spawnTimer: 0.25,
    planeTimer: 4.0,
    ufoTimer: 7.0,
    blankoutTimer: 0,
    lastAwarded40kMultiplier: 0,
    lastTime: performance.now(),
    width: 480,
    height: 700,
    dpr: 1,
    pointer: { x: 240, y: 350, active: false, lastShot: 0 },
    fpsCounter: 0,
    fpsTime: 0,
    animFrameId: 0,
    shotsFired: 0,
    shotsHit: 0,
    criticalHits: 0,
    birdsSaved: 0,
    birdsHunted: 0,
    ufoKills: 0,
    highestCombo: 0,
    powerUpsCollected: 0,
    shotsHistory: [] as ShotHistoryPoint[],
    shakeTimer: 0,
    maxShakeTimer: 0,
    shakeIntensity: 0,
    reactionTimes: [] as number[],
    dailyProgress: { normal: 0, fast: 0, small: 0 } as Record<ChallengeBird, number>,
    dailyTime: dailyChallenge.timeLimit,
    dailyClaimed: false,
    dailyClaimPending: false,
    lastDailySecond: dailyChallenge.timeLimit,
    finishing: false,
    duelTime: 60,
    lastDuelSecond: 60,
    matchStartsAt: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2500);
  };

  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    stopBackgroundMusic(audioSysRef.current);
  }, []);

    useEffect(() => {
    const shouldDuck = Boolean(toastMessage) || showVolumePopup || showMultiplayerModal || (gameState !== 'PLAYING' && gameState !== 'MENU');
    if (!shouldDuck) return;
    duckMusic(audioSysRef.current, data.settings.music ? data.settings.musicVolume : 0);
    return () => restoreMusic(audioSysRef.current, data.settings.music ? data.settings.musicVolume : 0);
  }, [toastMessage, showVolumePopup, showMultiplayerModal, gameState, data.settings.music, data.settings.musicVolume]);

  // Subscribe to real-time leaderboard
  useEffect(() => {
    const unsub = subscribeToLeaderboard((scores) => {
      setGlobalRanks(scores);
    });
    return () => unsub();
  }, []);

  const unlockAudio = () => {
    const sys = audioSysRef.current;
    initAudioContext(sys, data.settings.sound, data.settings.music, data.settings.soundVolume, data.settings.musicVolume);
    if (sys.ctx && sys.ctx.state === 'suspended') {
      sys.ctx.resume();
    }
  };

  const handleMusicVolumeChange = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    saveSettings({ musicVolume: clamped, music: clamped > 0 });
  };

  const handleSoundVolumeChange = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    saveSettings({ soundVolume: clamped, sound: clamped > 0 });
  };

  const isAllMuted =
    (!data.settings.music || data.settings.musicVolume === 0) &&
    (!data.settings.sound || data.settings.soundVolume === 0);

  const handleToggleMuteAll = () => {
    if (isAllMuted) {
      saveSettings({
        music: true,
        sound: true,
        musicVolume: 0.35,
        soundVolume: 0.6,
      });
      showToast('🔊 ALL AUDIO UNMUTED');
    } else {
      saveSettings({
        music: false,
        sound: false,
        musicVolume: 0,
        soundVolume: 0,
      });
      showToast('🔇 ALL AUDIO MUTED');
    }
  };

  const saveSettings = (newSettings: Partial<GameSettings>) => {
    const updatedSettings = { ...data.settings, ...newSettings };
    const updated = {
      ...data,
      settings: updatedSettings,
    };
    setData(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch {}

    const sys = audioSysRef.current;
    if (sys.musicGain) {
      updateMusicVolume(sys, updatedSettings.music ? updatedSettings.musicVolume : 0);
      sys.musicGain.gain.value = updatedSettings.music ? updatedSettings.musicVolume : 0;
    }
    if (sys.sfxGain) {
      sys.sfxGain.gain.value = updatedSettings.sound ? updatedSettings.soundVolume : 0;
    }

    if (newSettings.music !== undefined || newSettings.musicVolume !== undefined) {
      if (updatedSettings.music && updatedSettings.musicVolume > 0) {
        unlockAudio();
        startBackgroundMusic(sys, updatedSettings.musicVolume);
      } else {
        stopBackgroundMusic(sys);
      }
    }
  };

  // Unlock audio on first gesture
  useEffect(() => {
    const handleInitialUserGesture = () => {
      unlockAudio();
      if (data.settings.music && (gameState === 'PLAYING' || gameState === 'MENU')) {
        startBackgroundMusic(audioSysRef.current, data.settings.musicVolume);
      }
    };
    window.addEventListener('pointerdown', handleInitialUserGesture, { once: true });
    window.addEventListener('keydown', handleInitialUserGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleInitialUserGesture);
      window.removeEventListener('keydown', handleInitialUserGesture);
    };
  }, [data.settings.music, gameState]);

  // Resize canvas
  const handleResize = () => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    const availableHeight = container.clientHeight || window.innerHeight - 130;
    const maxWidth = Math.min(container.clientWidth - 16, 560);
    const ratio = 0.62;

    let w = maxWidth;
    let h = Math.min(availableHeight, Math.floor(w / ratio));

    if (h > availableHeight) {
      h = availableHeight;
      w = Math.floor(h * ratio);
    }

    w = Math.max(280, Math.floor(w));
    h = Math.max(420, Math.floor(h));

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    gameRef.current.width = w;
    gameRef.current.height = h;
    gameRef.current.dpr = dpr;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  };

  const requestStart = () => {
    unlockAudio();
    if (!data.playerName) {
      setGameState('NAME');
    } else {
      startGame();
    }
  };

  const saveName = () => {
    const trimmed = nameInput.trim().slice(0, 20);
    if (!trimmed) {
      showToast('Please enter a nickname!');
      return;
    }
    const updated = { ...data, playerName: trimmed };
    setData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    startGame();
  };

  const startGame = (mode: 'SOLO' | 'MULTIPLAYER' = 'SOLO', duelRoom?: MultiplayerRoomData | null) => {
    const g = gameRef.current;
    const localDaily = loadLocalDailyProgress(dailyChallenge.date);
    g.score = 0;
    g.lives = 3;
    g.combo = 0;
    g.multiplier = 1;
    g.elapsed = 0;
    g.spawnTimer = 0.2;
    g.planeTimer = 15 + Math.random() * 5;
    g.ufoTimer = 30 + Math.random() * 5;
    g.blankoutTimer = 0;
    g.lastAwarded40kMultiplier = 0;
    g.birds = [];
    g.particles = [];
    g.floatingTexts = [];
    g.powerUps = [];
    g.activePowerUp = null;
    g.weather = 'clear';
    g.weatherTimer = 0;
    g.weatherParticles = [];
    g.shotsFired = 0;
    g.shotsHit = 0;
    g.criticalHits = 0;
    g.accuracyStreak = 0;
    g.highestAccuracyStreak = 0;
    g.birdsSaved = 0;
    g.birdsHunted = 0;
    g.ufoKills = 0;
    g.highestCombo = 0;
    g.powerUpsCollected = 0;
    g.shotsHistory = [];
    g.shakeTimer = 0;
    g.maxShakeTimer = 0;
    g.shakeIntensity = 0;
    g.reactionTimes = [];
    g.dailyProgress = localDaily?.progress || { normal: 0, fast: 0, small: 0 };
    g.dailyTime = dailyChallenge.timeLimit;
    g.dailyClaimed = Boolean(localDaily?.claimed);
    g.dailyClaimPending = false;
    g.lastDailySecond = dailyChallenge.timeLimit;
    g.finishing = false;
    const roomForMatch = duelRoom || activeMultiRoom;
    g.duelTime = roomForMatch?.gameDuration || 60;
    g.lastDuelSecond = Math.ceil(g.duelTime);
    g.matchStartsAt = mode === 'MULTIPLAYER' ? roomForMatch?.gameStartTime || Date.now() : 0;
    g.lastTime = performance.now();

    setScore(0);
    setLives(3);
    setMultiplier(1);
    setShowCombo(false);
    setAccuracyStreak(0);
    setHighestAccuracyStreak(0);
    setGameMode(mode);
    setActiveBuff(null);
    setCurrentWeather('clear');
    setSummaryStats(null);
    setDailyProgress({ ...g.dailyProgress });
    setDailyTime(dailyChallenge.timeLimit);
    setDailyClaimed(g.dailyClaimed);
    setDuelTime(g.lastDuelSecond);
    setDuelStartsIn(mode === 'MULTIPLAYER' ? Math.max(0, Math.ceil((g.matchStartsAt - Date.now()) / 1000)) : 0);
    setGameState('PLAYING');

    unlockAudio();
    if (data.settings.music) {
      startBackgroundMusic(audioSysRef.current, data.settings.musicVolume);
    }
    const playerId = safePlayerId(data.playerName || nameInput || 'Player');
    loadDailyChallenge(playerId, dailyChallenge.date).then(record => {
      if (!record) return;
      g.dailyProgress = {
        normal: Math.max(g.dailyProgress.normal, record.progress?.normal || 0),
        fast: Math.max(g.dailyProgress.fast, record.progress?.fast || 0),
        small: Math.max(g.dailyProgress.small, record.progress?.small || 0),
      };
      g.dailyClaimed = g.dailyClaimed || Boolean(record.rewardClaimed);
      setDailyProgress({ ...g.dailyProgress });
      setDailyClaimed(g.dailyClaimed);
      saveLocalDailyProgress(dailyChallenge.date, g.dailyProgress, g.dailyClaimed);
    });
  };

  const handleStartDuel = (room: MultiplayerRoomData, isHost: boolean) => {
    setActiveMultiRoom(room);
    setIsHostPlayer(isHost);
    setShowMultiplayerModal(false);
    setRivalName(isHost ? room.guestName || 'Challenger' : room.hostName);
    setRivalScore(isHost ? room.guestScore || 0 : room.hostScore || 0);
    setRivalLives(isHost ? room.guestLives ?? 3 : room.hostLives ?? 3);
    startGame('MULTIPLAYER', room);
    showToast(`⚔️ 1V1 DUEL STARTED! Destroy the rival!`);
  };

  // Sync multiplayer state
  useEffect(() => {
    if (gameState !== 'PLAYING' || gameMode !== 'MULTIPLAYER' || !activeMultiRoom?.id) return;
    const interval = setInterval(() => {
      const g = gameRef.current;
      updateRoomPlayer(activeMultiRoom.id, isHostPlayer, g.score, g.combo, g.lives);
    }, 380);
    return () => clearInterval(interval);
  }, [gameState, gameMode, activeMultiRoom?.id, isHostPlayer]);

  // Subscribe to live room updates
  useEffect(() => {
    if (!activeMultiRoom?.id) return;
    const unsub = subscribeToMultiplayerRoom(activeMultiRoom.id, (room) => {
      if (!room) return;
      setActiveMultiRoom(room);

      const isCurrentHost = isHostPlayer;
      setRivalScore(isCurrentHost ? room.guestScore || 0 : room.hostScore || 0);
      setRivalCombo(isCurrentHost ? room.guestCombo || 0 : room.hostCombo || 0);
      setRivalLives(isCurrentHost ? room.guestLives ?? 3 : room.hostLives ?? 3);

      if (room.sabotage) {
        const myTarget = isCurrentHost ? 'host' : 'guest';
        if (room.sabotage.target === myTarget && room.sabotage.timestamp > lastSabotageTime) {
          setLastSabotageTime(room.sabotage.timestamp);
          const g = gameRef.current;
          g.blankoutTimer = 2.0;
          playSoundSabotageAlert(audioSysRef.current);
          playSoundUfoEmp(audioSysRef.current);
          showToast(`⚡ ${room.sabotage.from} SABOTAGED YOU WITH EMP BLACKOUT! (2s)`);
        }
      }

      if (room.status === 'completed' && gameState === 'PLAYING') {
        finishMatch();
      }
    });
    return () => unsub();
  }, [activeMultiRoom?.id, isHostPlayer, lastSabotageTime, gameState]);

  // Spawn entity logic
  const spawnEntity = () => {
    const g = gameRef.current;
    const activeEntities = g.birds.filter((b: any) => b.alive && !b.dying);
    if (activeEntities.length >= 3) return;

    let key = 'normal';
    const isUfoReady = g.ufoTimer <= 0;
    const isPlaneReady = g.planeTimer <= 0;
    const hasUfo = activeEntities.some((e: any) => e.key === 'ufo');
    const hasPlane = activeEntities.some((e: any) => e.key === 'plane');
    const hasHazard = activeEntities.some((e: any) => e.isDangerous);

    if (isUfoReady && !hasUfo) {
      key = 'ufo';
      g.ufoTimer = 30 + Math.random() * 5;
      playSoundUfoSpawn(audioSysRef.current);
      showToast('🛸 WARNING: ALIEN UFO INCOMING! DESTROY OR ESCAPE (-5% PENALTY)!');
    } else if (isPlaneReady && !hasPlane) {
      key = 'plane';
      g.planeTimer = 15 + Math.random() * 5;
    } else {
      const r = Math.random();
      if (r < 0.22) key = 'normal';
      else if (r < 0.38) key = 'fast';
      else if (r < 0.50) key = 'small';
      else if (r < 0.60) key = 'large';
      else if (r < 0.70) key = 'dive_bomber';
      else if (r < 0.78) key = 'hazard_25';
      else if (r < 0.85) key = 'skull_50';
      else if (r < 0.91) key = 'rare';
      else if (r < 0.95) key = 'golden_phoenix';
      else key = 'armored';
      if ((key === 'hazard_25' || key === 'skull_50') && hasHazard) key = 'normal';
    }

    const type = entityConfigs[key] || entityConfigs['normal'];
    // Difficulty curve based strictly on BIRDS HUNTED
    const diff = getDifficultyFactor(g.birdsHunted);
    const speedBoost = 1 + diff * 0.45;
    const speed = type.speed * (0.9 + Math.random() * 0.2) * speedBoost;

    let x: number, y: number, vx: number, vy = 0, dir: number;
    const isPlane = key === 'plane';
    const isUfo = key === 'ufo';
    const isDiveBomber = key === 'dive_bomber';

    if (key === 'golden_phoenix') {
      playSoundPowerUpSpawn(audioSysRef.current);
      showToast('✨ A MYTHICAL GOLDEN PHOENIX HAS APPEARED! (+300 PTS)');
    }

    if (isUfo) {
      // Fly from any side
      const ufoEntryType = Math.floor(Math.random() * 4);
      if (ufoEntryType === 0) {
        x = -type.radius - 35;
        y = 50 + Math.random() * (g.height * 0.35);
        vx = speed * 1.05;
        dir = 1;
      } else if (ufoEntryType === 1) {
        x = g.width + type.radius + 35;
        y = 50 + Math.random() * (g.height * 0.35);
        vx = -speed * 1.05;
        dir = -1;
      } else if (ufoEntryType === 2) {
        x = -type.radius - 20;
        y = -20;
        vx = speed * 0.9;
        vy = speed * 0.55;
        dir = 1;
      } else {
        x = g.width + type.radius + 20;
        y = -20;
        vx = -speed * 0.9;
        vy = speed * 0.55;
        dir = -1;
      }
    } else if (isDiveBomber) {
      y = 15 + Math.random() * 30; // Starts near top
      if (Math.random() < 0.5) {
        x = -type.radius - 30;
        vx = speed;
        dir = 1;
      } else {
        x = g.width + type.radius + 30;
        vx = -speed;
        dir = -1;
      }
    } else if (isPlane) {
      y = 35 + Math.random() * (g.height * 0.20);
      if (Math.random() < 0.5) {
        x = -type.radius - 35;
        vx = speed;
        dir = 1;
      } else {
        x = g.width + type.radius + 35;
        vx = -speed;
        dir = -1;
      }
    } else {
      const topBound = 55;
      const bottomBound = g.height - 120;
      const totalSpan = bottomBound - topBound;
      const lanes = [
        topBound + totalSpan * 0.15,
        topBound + totalSpan * 0.45,
        topBound + totalSpan * 0.75,
      ];

      let bestLane = lanes[Math.floor(Math.random() * lanes.length)];
      let maxMinDist = -1;
      for (const candidateLane of lanes) {
        let minDist = 9999;
        for (const existing of activeEntities) {
          const d = Math.abs(existing.baseY !== undefined ? existing.baseY - candidateLane : existing.y - candidateLane);
          if (d < minDist) minDist = d;
        }
        if (minDist > maxMinDist) {
          maxMinDist = minDist;
          bestLane = candidateLane;
        }
      }

      y = bestLane + (Math.random() - 0.5) * 26;
      y = Math.max(topBound, Math.min(bottomBound, y));

      if (Math.random() < 0.5) {
        x = -type.radius - 35;
        vx = speed;
        dir = 1;
      } else {
        x = g.width + type.radius + 35;
        vx = -speed;
        dir = -1;
      }
    }

    g.birds.push({
      key,
      type,
      x,
      y,
      baseY: y,
      vx,
      vy,
      dir,
      hp: type.hp,
      maxHp: type.hp,
      radius: type.radius,
      points: type.points,
      isDangerous: type.isDangerous,
      isUfo: type.isUfo,
      penaltyPercent: type.penaltyPercent,
      phase: Math.random() * Math.PI * 2,
      wingPhase: Math.random() * Math.PI * 2,
      age: 0,
      spawnTime: performance.now(),
      alive: true,
      dying: false,
      dyingTimer: 0,
      maxDyingTime: 0.95,
      rot: 0,
      rotSpeed: 0,
    });
  };

  const triggerHaptic = (type: 'shot' | 'hit' | 'damage' | 'bonus') => {
    const intensity = data.settings.hapticIntensity || 'medium';
    if (typeof navigator === 'undefined' || !navigator.vibrate || intensity === 'off') return;
    const durations = {
      off: 0,
      low: type === 'shot' ? 8 : type === 'hit' ? 16 : 28,
      medium: type === 'shot' ? 16 : type === 'hit' ? 32 : 55,
      high: type === 'shot' ? 28 : type === 'hit' ? 60 : 90,
    };
    try {
      navigator.vibrate(durations[intensity] || 16);
    } catch {}
  };

  // Perform single shot raycast
  const performSingleShot = (x: number, y: number) => {
    const g = gameRef.current;
    const sys = audioSysRef.current;

    // Check if player clicked a falling power-up capsule
    for (const p of g.powerUps) {
      if (p.collected) continue;
      const dist = Math.hypot(p.x - x, p.y - y);
      if (dist <= p.radius + 18) {
        p.collected = true;
        g.powerUpsCollected++;
        g.accuracyStreak++;
        g.highestAccuracyStreak = Math.max(g.highestAccuracyStreak, g.accuracyStreak);
        setAccuracyStreak(g.accuracyStreak);
        setHighestAccuracyStreak(g.highestAccuracyStreak);
        playSoundHudTick(sys);
        triggerHaptic('bonus');

        if (g.accuracyStreak % 5 === 0) {
          playSoundStreakMilestone(sys, g.accuracyStreak);
        }

        const duration = p.type === 'shield' ? 10 : p.type === 'multi_shot' ? 8 : 6;
        g.activePowerUp = {
          type: p.type,
          duration,
          maxDuration: duration,
        };
        setActiveBuff(g.activePowerUp);
        playSoundPowerUpCollect(sys);

        const nameMap: Record<PowerUpType, string> = {
          slow_mo: '⏱️ CHRONO SLOW-MO (6s)',
          multi_shot: '🎯 TRIPLE MULTI-SHOT (8s)',
          shield: '🛡️ GUARDIAN SHIELD (10s)',
        };
        showToast(`${nameMap[p.type]} ACTIVATED!`);

        g.floatingTexts.push({
          x: p.x,
          y: p.y - 20,
          text: nameMap[p.type],
          color: '#38bdf8',
          life: 1.3,
          maxLife: 1.3,
          size: 15,
        });
        return;
      }
    }

    let hitTarget: any = null;
    let isCritical = false;

    for (let i = g.birds.length - 1; i >= 0; i--) {
      const b = g.birds[i];
      if (!b.alive || b.dying) continue;
      const dx = b.x - x;
      const dy = b.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist <= b.radius + 14) {
        hitTarget = b;
        // Critical bullseye check
        if (dist <= b.radius * 0.38) {
          isCritical = true;
        }
        break;
      }
    }

    // Record shot trajectory point for heatmap
    g.shotsHistory.push({
      x: x / g.width,
      y: y / g.height,
      hit: Boolean(hitTarget),
      isCritical: Boolean(hitTarget && isCritical),
    });

    if (hitTarget) {
      g.shotsHit++;
      g.accuracyStreak++;
      g.highestAccuracyStreak = Math.max(g.highestAccuracyStreak, g.accuracyStreak);
      setAccuracyStreak(g.accuracyStreak);
      setHighestAccuracyStreak(g.highestAccuracyStreak);
      playSoundHudTick(sys);
      triggerHaptic(hitTarget.isDangerous ? 'damage' : 'hit');

      if (g.accuracyStreak % 5 === 0) {
        playSoundStreakMilestone(sys, g.accuracyStreak);
        g.floatingTexts.push({
          x: g.width / 2,
          y: g.height * 0.42,
          text: `🎯 ${g.accuracyStreak} HIT STREAK!`,
          color: '#34d399',
          life: 1.4,
          maxLife: 1.4,
          size: 18,
        });
        if (g.accuracyStreak >= 10) {
          showToast(`🎯 ${g.accuracyStreak} CONSECUTIVE HITS!`);
        }
      }

      if (isCritical) {
        g.criticalHits++;
        playSoundCriticalHit(sys);
      }

      // Record reaction time
      if (hitTarget.spawnTime) {
        const reactionMs = performance.now() - hitTarget.spawnTime;
        g.reactionTimes.push(reactionMs);
      }

      // Trigger screen shake when hitting armored bird or rare phoenix
      if (hitTarget.key === 'armored' || hitTarget.key === 'rare' || hitTarget.key === 'golden_phoenix') {
        g.shakeTimer = 0.32;
        g.maxShakeTimer = 0.32;
        g.shakeIntensity = hitTarget.key === 'armored' ? 9 : 14;
      }

      hitTarget.hp--;
      if (hitTarget.hp > 0) {
        playSoundHit(sys);
        g.floatingTexts.push({
          x: hitTarget.x,
          y: hitTarget.y - 12,
          text: '🛡️ HIT!',
          color: '#cbd5e1',
          life: 0.6,
          maxLife: 0.6,
        });
      } else {
        // Destroyed target
        hitTarget.dying = true;
        hitTarget.dyingTimer = 0;
        hitTarget.maxDyingTime = 0.9;
        hitTarget.vx = hitTarget.vx * 0.25;
        hitTarget.vy = 80;
        hitTarget.rot = 0;
        hitTarget.rotSpeed = (hitTarget.dir >= 0 ? 1 : -1) * (5 + Math.random() * 3);

        // Play distinct crisp pop sound for bird destruction
        playSoundBirdPop(sys);

        // Track Birds Hunted
        if (
          !hitTarget.isDangerous &&
          hitTarget.key !== 'plane' &&
          hitTarget.key !== 'ufo'
        ) {
          g.birdsHunted++;
        }

        // UFO is a score-only bonus; multiplayer sabotage targets the rival separately
        if (hitTarget.key === 'ufo') {
          g.ufoKills++;
          const ufoBonus = Math.floor(200 * g.multiplier * (isCritical ? 2.5 : 1)); // 5:1 scaled (1000 -> 200)
          g.score += ufoBonus;
          g.combo += 2;
          g.multiplier = Math.min(12, Math.max(1, Math.floor(g.combo / 2) + 1));
          g.highestCombo = Math.max(g.highestCombo, g.combo);

          playSoundUfoExplode(sys);
          showToast(`🛸 UFO DESTROYED! +${ufoBonus.toLocaleString()} BONUS!`);

          g.floatingTexts.push({
            x: hitTarget.x,
            y: hitTarget.y - 15,
            text: `🛸 +${ufoBonus} BONUS!`,
            color: '#22c55e',
            life: 1.4,
            maxLife: 1.4,
            size: 16,
          });

          if (gameMode === 'MULTIPLAYER' && activeMultiRoom?.id) {
            sendRoomSabotage(activeMultiRoom.id, isHostPlayer, 'blackout', data.playerName || 'Player');
          }
        }
        // Check if Dangerous Bird Hit
        else if (hitTarget.isDangerous) {
          // If Guardian Shield is active, shield absorbs the hazard!
          if (g.activePowerUp?.type === 'shield') {
            g.activePowerUp = null;
            setActiveBuff(null);
            showToast('🛡️ GUARDIAN SHIELD BLOCKED HAZARD PENALTY!');
            g.floatingTexts.push({
              x: hitTarget.x,
              y: hitTarget.y - 15,
              text: '🛡️ BLOCKED!',
              color: '#10b981',
              life: 1.2,
              maxLife: 1.2,
              size: 16,
            });
          } else {
            g.combo = 0;
            g.multiplier = 1;
            setShowCombo(false);
            g.lives = Math.max(0, g.lives - 1);
            setLives(g.lives);

            const penaltyPct = hitTarget.penaltyPercent || 25;
            playSoundDangerPenalty(sys, penaltyPct);
            showToast(
              hitTarget.key === 'skull_50'
                ? `☠️ CURSED RAVEN HIT! -1 ❤️ HEART!`
                : `⚠️ HAZARD BIRD HIT! -1 ❤️ HEART!`
            );

            g.floatingTexts.push({
              x: hitTarget.x,
              y: hitTarget.y - 15,
              text: '⚠️ -1 ❤️',
              color: hitTarget.key === 'skull_50' ? '#ef4444' : '#f59e0b',
              life: 1.3,
              maxLife: 1.3,
              size: 16,
            });

            if (g.lives <= 0) {
              finishMatch();
              return;
            }
          }
        }
        // Plane or Standard Bird Hit
        else {
          const isPlane = hitTarget.key === 'plane';
          const basePts = isPlane ? 100 : hitTarget.points; // 5:1 scaled (Plane 500 -> 100)
          const pts = Math.floor(basePts * g.multiplier * (isCritical ? 2.5 : 1));
          g.score += pts;
          g.combo++;
          const prevMultiplier = g.multiplier;
          g.multiplier = Math.min(12, Math.max(1, Math.floor(g.combo / 2) + 1));
          g.highestCombo = Math.max(g.highestCombo, g.combo);

          if (g.multiplier > prevMultiplier) {
            playSoundComboDing(sys, g.multiplier);
          }

          if (isPlane) {
            playSoundBonusPlane(sys);
          } else {
            if ((['normal', 'fast', 'small'] as string[]).includes(hitTarget.key) && g.dailyTime > 0 && !g.dailyClaimed) {
              const birdKey = hitTarget.key as ChallengeBird;
              g.dailyProgress[birdKey] = Math.min(dailyChallenge.targets[birdKey], g.dailyProgress[birdKey] + 1);
              setDailyProgress({ ...g.dailyProgress });
              saveLocalDailyProgress(dailyChallenge.date, g.dailyProgress, g.dailyClaimed);
              const playerId = safePlayerId(data.playerName || 'Player');
              void saveDailyChallengeProgress(playerId, dailyChallenge.date, g.dailyProgress);
              const complete = (Object.keys(dailyChallenge.targets) as ChallengeBird[]).every(k => g.dailyProgress[k] >= dailyChallenge.targets[k]);
              if (complete && !g.dailyClaimPending) {
                g.dailyClaimPending = true;
                claimDailyChallengeReward(
  playerId,
  data.playerName || 'Player',
  dailyChallenge.date,
  g.dailyProgress,
  dailyChallenge.reward,
).then(claimed => {
  g.dailyClaimPending = false;

  if (!claimed || g.dailyClaimed) return;

  g.dailyClaimed = true;
  g.score += dailyChallenge.reward;

  setScore(g.score);
  setDailyClaimed(true);

  saveLocalDailyProgress(
    dailyChallenge.date,
    g.dailyProgress,
    true
  );

  showToast(
    `🏆 DAILY CHALLENGE COMPLETE! +${dailyChallenge.reward} points`
  );
});
              }
            }
            playSoundHit(sys);
            if (g.combo >= 3) {
              playSoundCombo(sys);
              setComboText(`🔥 COMBO x${g.multiplier}`);
              setShowCombo(true);
            }
          }

          g.floatingTexts.push({
            x: hitTarget.x,
            y: hitTarget.y - 12,
            text: isCritical ? `🎯 CRIT +${pts}` : `+${pts}`,
            color: isCritical ? '#facc15' : '#fef08a',
            life: isCritical ? 0.95 : 0.75,
            maxLife: isCritical ? 0.95 : 0.75,
            size: isCritical ? 16 : 14,
          });

          // Check if Rare / Armored / Small bird drops a Temporary Power-Up Capsule (~60% chance)
          if (
            (hitTarget.key === 'rare' || hitTarget.key === 'armored' || hitTarget.key === 'small') &&
            Math.random() < 0.65
          ) {
            const types: PowerUpType[] = ['slow_mo', 'multi_shot', 'shield'];
            const chosenType = types[Math.floor(Math.random() * types.length)];
            g.powerUps.push({
              id: Math.random().toString(),
              type: chosenType,
              x: hitTarget.x,
              y: hitTarget.y,
              vy: 65,
              radius: 18,
              life: 9.0,
              maxLife: 9.0,
              bobPhase: Math.random() * Math.PI * 2,
              collected: false,
            });
            playSoundPowerUpSpawn(sys);
          }
        }

        // USER INSTRUCTION: Extra Life awarded at 40,000 points and multiples (5:1 scaled)!
        const current40kBracket = Math.floor(g.score / 40000);
        if (current40kBracket > g.lastAwarded40kMultiplier) {
          const milestonesGained = current40kBracket - g.lastAwarded40kMultiplier;
          g.lastAwarded40kMultiplier = current40kBracket;
          g.lives += milestonesGained;
          setLives(g.lives);
          playSoundExtraLife(sys);
          showToast(`💖 +1 EXTRA LIFE! ${(current40kBracket * 40).toLocaleString()},000 Points Milestone!`);

          g.floatingTexts.push({
            x: g.width / 2,
            y: g.height * 0.35,
            text: `💖 +1 EXTRA LIFE! (${(current40kBracket * 40).toLocaleString()}k)`,
            color: '#f43f5e',
            life: 1.8,
            maxLife: 1.8,
            size: 20,
          });
        }

        // Particle effect
        const pCount = isCritical ? 30 : 20;
        for (let i = 0; i < pCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = (isCritical ? 75 : 50) + Math.random() * (isCritical ? 200 : 160);
          g.particles.push({
            x: hitTarget.x,
            y: hitTarget.y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0.35 + Math.random() * 0.45,
            maxLife: 0.8,
            size: 2 + Math.random() * 3.5,
            color: hitTarget.type.color || '#ffffff',
            alive: true,
          });
        }

        setScore(g.score);
        setMultiplier(g.multiplier);
      }
    } else {
      // Missed shot
      g.combo = 0;
      g.multiplier = 1;
      g.accuracyStreak = 0;
      setShowCombo(false);
      setMultiplier(1);
      setAccuracyStreak(0);
    }
  };

  const shootAt = (x: number, y: number) => {
    const g = gameRef.current;
    const now = performance.now();
    if (now - g.pointer.lastShot < 85) return;
    g.pointer.lastShot = now;

    const projectileCount = g.activePowerUp?.type === 'multi_shot' ? 3 : 1;
    g.shotsFired += projectileCount;
  
    playSoundShoot(audioSysRef.current);
    triggerHaptic('shot');

    // Multi-shot power-up fires 3 spread shots
    if (g.activePowerUp?.type === 'multi_shot') {
      performSingleShot(x, y);
      performSingleShot(Math.max(10, x - 28), y);
      performSingleShot(Math.min(g.width - 10, x + 28), y);
    } else {
      performSingleShot(x, y);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(gameRef.current.width, ((e.clientX - rect.left) / rect.width) * gameRef.current.width)
    );
    const y = Math.max(
      0,
      Math.min(gameRef.current.height, ((e.clientY - rect.top) / rect.height) * gameRef.current.height)
    );
    gameRef.current.pointer.x = x;
    gameRef.current.pointer.y = y;
    gameRef.current.pointer.active = true;
    shootAt(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(gameRef.current.width, ((e.clientX - rect.left) / rect.width) * gameRef.current.width)
    );
    const y = Math.max(
      0,
      Math.min(gameRef.current.height, ((e.clientY - rect.top) / rect.height) * gameRef.current.height)
    );
    gameRef.current.pointer.x = x;
    gameRef.current.pointer.y = y;
  };

  const handlePointerUp = () => {
    gameRef.current.pointer.active = false;
  };

  // End of match summary computation
  const finishMatch = () => {
    const g = gameRef.current;
    if (g.finishing) return;
    g.finishing = true;
    stopBackgroundMusic(audioSysRef.current);
    playSoundGameOver(audioSysRef.current);

    const finalScore = g.score;
    const newBest = Math.max(data.best || 0, finalScore);
    setBestScore(newBest);

    const playerName = data.playerName || 'Player';
    const newScores = [...(data.scores || []), { name: playerName, score: finalScore, date: new Date().toISOString() }]
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    const updated = {
      ...data,
      best: newBest,
      scores: newScores,
    };
    setData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Update Lifetime Stats
    const totalReaction = g.reactionTimes.reduce((a, b) => a + b, 0);
    const avgReaction = g.reactionTimes.length > 0 ? totalReaction / g.reactionTimes.length : 450;
    const accuracy = g.shotsFired > 0 ? Math.round((g.shotsHit / g.shotsFired) * 100) : 100;

    const newLifetime: LifetimeStats = {
      lifetimeHeadshots: lifetimeStats.lifetimeHeadshots + g.criticalHits,
      lifetimeBirdsSaved: lifetimeStats.lifetimeBirdsSaved + g.birdsSaved,
      lifetimeBirdsHunted: lifetimeStats.lifetimeBirdsHunted + g.birdsHunted,
      totalGamesPlayed: lifetimeStats.totalGamesPlayed + 1,
      bestAccuracy: Math.max(lifetimeStats.bestAccuracy, accuracy),
      bestAccuracyStreak: Math.max(lifetimeStats.bestAccuracyStreak || 0, g.highestAccuracyStreak),
      fastestReactionMs: Math.min(lifetimeStats.fastestReactionMs, avgReaction),
    };
    setLifetimeStats(newLifetime);
    saveLifetimeStats(newLifetime);

    // Prepare match summary object
    const matchSummary: MatchPerformanceStats = {
      score: finalScore,
      bestScore: newBest,
      birdsHunted: g.birdsHunted,
      lifetimeBirdsHunted: newLifetime.lifetimeBirdsHunted,
      headshots: g.criticalHits,
      lifetimeHeadshots: newLifetime.lifetimeHeadshots,
      birdsSaved: g.birdsSaved,
      lifetimeBirdsSaved: newLifetime.lifetimeBirdsSaved,
      avgReactionTimeMs: avgReaction,
      shotsFired: g.shotsFired,
      shotsHit: g.shotsHit,
      accuracy,
      accuracyStreak: g.accuracyStreak,
      highestAccuracyStreak: g.highestAccuracyStreak,
      highestCombo: g.highestCombo,
      ufoKills: g.ufoKills,
      powerUpsCollected: g.powerUpsCollected,
      shotsHistory: [...g.shotsHistory],
      gameMode,
      winnerName: gameMode === 'MULTIPLAYER'
        ? finalScore === rivalScore ? 'Draw' : finalScore > rivalScore ? playerName : rivalName
        : null,
      rivalName,
      rivalScore,
    };
    setSummaryStats(matchSummary);
    setGameState('SUMMARY');

    // Submit score to Firestore
    submitScoreToFirestore(playerName, finalScore);

    if (gameMode === 'MULTIPLAYER' && activeMultiRoom?.id) {
      const winnerName = finalScore === rivalScore ? 'Draw' : finalScore > rivalScore ? playerName : rivalName;
      completeMultiplayerMatch(activeMultiRoom.id, winnerName);
          }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    let running = true;

    const loop = (timestamp: number) => {
      if (!running) return;
      const g = gameRef.current;
     const frameDt = Math.min(
  0.05,
  (timestamp - g.lastTime) / 1000
);

const awaitingDuelStart =
  gameState === 'PLAYING' &&
  gameMode === 'MULTIPLAYER' &&
  Date.now() < g.matchStartsAt;

const dt = awaitingDuelStart ? 0 : frameDt;

if (gameState === 'PLAYING' && gameMode === 'MULTIPLAYER') {
  if (awaitingDuelStart) {
    setDuelStartsIn(
      Math.max(
        1,
        Math.ceil((g.matchStartsAt - Date.now()) / 1000)
      )
    );
  } else {
    setDuelStartsIn(0);

    g.duelTime = Math.max(
      0,
      g.duelTime - dt
    );

    const duelSecond = Math.ceil(g.duelTime);

    if (duelSecond !== g.lastDuelSecond) {
      g.lastDuelSecond = duelSecond;
      setDuelTime(duelSecond);
    }

    if (g.duelTime <= 0) {
      finishMatch();
    }
  }
}

      if (gameState === 'PLAYING') {
        g.elapsed += dt;
        if (!g.dailyClaimed && g.dailyTime > 0) {
          g.dailyTime = Math.max(0, g.dailyTime - dt);
          const second = Math.ceil(g.dailyTime);
          if (second !== g.lastDailySecond) {
            g.lastDailySecond = second;
            setDailyTime(second);
          }
        }
        g.spawnTimer -= dt;
        g.planeTimer -= dt;
        g.ufoTimer -= dt;

        // Difficulty interval scales with BIRDS HUNTED
        const diff = getDifficultyFactor(g.birdsHunted);
        const baseInterval = 1.3 - diff * 0.85;
        if (g.spawnTimer <= 0) {
          spawnEntity();
          g.spawnTimer = baseInterval * (0.85 + Math.random() * 0.35);
        }

        // Update Weather
        updateWeatherCycle(dt, g, (w) => setCurrentWeather(w));

        // Update Power-Ups
        for (const p of g.powerUps) {
          p.life -= dt;
          p.y += p.vy * dt;
          p.bobPhase += dt * 4;
        }
        g.powerUps = g.powerUps.filter((p) => !p.collected && p.life > 0 && p.y < g.height + 40);

        // Update Active Buff
        if (g.activePowerUp) {
          g.activePowerUp.duration -= dt;
          if (g.activePowerUp.duration <= 0) {
            g.activePowerUp = null;
            setActiveBuff(null);
          } else {
            setActiveBuff({ ...g.activePowerUp });
          }
        }

        // Decrement screen blackout timer
        if (g.blankoutTimer > 0) {
          g.blankoutTimer = Math.max(0, g.blankoutTimer - dt);
        }

        // Update Flying Entities
        const speedModifier = g.activePowerUp?.type === 'slow_mo' ? 0.45 : 1.0;

        for (const entity of g.birds) {
          if (!entity.alive) continue;
          if (entity.biteTimer > 0) entity.biteTimer -= dt;

          if (entity.dying) {
            entity.dyingTimer += dt;
            entity.vy += 650 * dt;
            entity.x += entity.vx * dt;
            entity.y += entity.vy * dt;
            entity.rot += entity.rotSpeed * dt;

            if (entity.dyingTimer >= entity.maxDyingTime || entity.y > g.height + 120) {
              entity.alive = false;
            }
            continue;
          }

          entity.age += dt;
          entity.wingPhase += dt * 12;
          entity.x += entity.vx * dt * speedModifier;
          entity.y += entity.vy * dt * speedModifier;

          if (entity.key === 'dive_bomber' || entity.type.pattern === 'parabolic_dive') {
            // Parabolic deep downward swoop and pull back up
            const swoopFactor = Math.sin(Math.min(Math.PI, entity.age * 1.6));
            entity.y = entity.baseY + swoopFactor * (g.height * 0.48);
          } else if (entity.key === 'ufo') {
            entity.y += Math.sin(entity.age * 4.5 + entity.phase) * 32 * dt;
          } else if (entity.key === 'golden_phoenix') {
            entity.y += Math.sin(entity.age * 5.5 + entity.phase) * 45 * dt;
          } else if (entity.type.pattern === 'sine') {
            entity.y += Math.sin(entity.age * 3.5 + entity.phase) * 35 * dt;
          } else if (entity.type.pattern === 'zigzag') {
            entity.y += Math.sign(Math.sin(entity.age * 5 + entity.phase)) * 55 * dt;
          } else if (entity.type.pattern === 'wave') {
            entity.y += Math.sin(entity.age * 2.5 + entity.phase) * 60 * dt;
          }

          // Offscreen escape check
          if (entity.x < -120 || entity.x > g.width + 120 || entity.y < -150 || entity.y > g.height + 150) {
            entity.alive = false;

            // USER INSTRUCTION: If player misses UFO (or it escapes), reduce score by 5%!
            if (entity.key === 'ufo') {
              const lost = Math.floor(g.score * 0.05);
              g.score = Math.max(0, g.score - lost);
              setScore(g.score);
              showToast(`🛸 UFO ESCAPED! -5% SCORE PENALTY (-${lost.toLocaleString()} PTS)!`);
              playSoundDangerPenalty(audioSysRef.current, 25);
            } else {
              const isExempt = entity.key === 'small' || entity.isDangerous || entity.key === 'plane';
              if (!isExempt) {
                g.lives = Math.max(0, g.lives - 1);
                playSoundEscape(audioSysRef.current);
                g.combo = 0;
                g.multiplier = 1;
                setShowCombo(false);
                setMultiplier(1);
                setLives(g.lives);
              }
            }
          }
        }

        // Predator mechanic: Cursed Raven eats scoring birds
        const activePredators = g.birds.filter((b) => b.alive && !b.dying && b.key === 'skull_50');
        const activePrey = g.birds.filter(
          (b) => b.alive && !b.dying && !b.isDangerous && b.key !== 'plane' && b.key !== 'ufo'
        );

        for (const predator of activePredators) {
          for (const prey of activePrey) {
            if (!prey.alive || prey.dying) continue;
            const dist = Math.hypot(predator.x - prey.x, predator.y - prey.y);
            if (dist < predator.radius + prey.radius + 6) {
              prey.alive = false;
              prey.dying = true;
              prey.maxDyingTime = 0.2;
              playSoundChomp(audioSysRef.current);
              showToast('🩸 RED CURSED RAVEN DEVOURED A BIRD!');
            }
          }
        }

        // Filter dead entities & update particles
        g.birds = g.birds.filter((b) => b.alive);

        for (const p of g.particles) {
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.life <= 0) p.alive = false;
        }
        g.particles = g.particles.filter((p) => p.alive);

        for (const ft of g.floatingTexts) {
          ft.life -= dt;
          ft.y -= 35 * dt;
        }
        g.floatingTexts = g.floatingTexts.filter((ft) => ft.life > 0);

        if (g.lives <= 0) {
          finishMatch();
        }
      }

      // Canvas Rendering
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, g.width, g.height);

          // Apply Screen Shake if active
          let shook = false;
          if (g.shakeTimer > 0) {
            g.shakeTimer -= dt;
            const factor = Math.max(0, g.shakeTimer / (g.maxShakeTimer || 0.32));
            const amp = g.shakeIntensity * factor;
            const angle = Math.random() * Math.PI * 2;
            ctx.save();
            ctx.translate(Math.cos(angle) * amp, Math.sin(angle) * amp);
            shook = true;
          }

          // Dynamic multi-theme atmospheric background (Day, Sunset, Starry Night, Snowy Aurora)
          drawDynamicBackground(ctx, g.width, g.height, g.score, g.elapsed, g.stars);

          // Sync theme badge label
          const themeInfo = getCurrentThemeState(g.score, g.elapsed);
          if (themeInfo.currentTheme.badge !== currentThemeBadge) {
            setCurrentThemeBadge(themeInfo.currentTheme.badge);
          }

          // Render Entities
          for (const entity of g.birds) {
            if (!entity.alive) continue;
            ctx.save();
            ctx.translate(entity.x, entity.y);

            if (entity.dying) {
              const fade = Math.max(0, 1 - (entity.dyingTimer / entity.maxDyingTime) * 0.75);
              ctx.globalAlpha = fade;
              ctx.rotate(entity.rot);
            }

            const r = entity.radius;

            if (entity.key === 'ufo') {
              ctx.fillStyle = '#67e8f9';
              ctx.beginPath(); ctx.arc(0, -r * .18, r * .55, Math.PI, 0); ctx.fill();
              ctx.fillStyle = '#0891b2';
              ctx.beginPath(); ctx.ellipse(0, r * .08, r * 1.25, r * .42, 0, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#facc15';
              for (const x of [-.65, 0, .65]) { ctx.beginPath(); ctx.arc(x * r, r * .16, 3, 0, Math.PI * 2); ctx.fill(); }
            } else if (entity.key === 'plane') {
              // High Polish Supersonic Aeroplane
              drawDetailedAeroplane(ctx, entity, g.elapsed);
            } else {
              // High Polish Layered Feather Bird
              drawDetailedBird(ctx, entity, g.elapsed);
            }

            ctx.restore();
          }

          // Draw Power-Up Capsules
          drawPowerUpCapsules(ctx, g.powerUps);

          // Draw Weather Atmosphere & Particles
          drawWeatherAtmosphere(ctx, g);

          // Draw Particles
          for (const p of g.particles) {
            if (!p.alive) continue;
            ctx.save();
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Draw Floating Score Texts
          for (const ft of g.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, ft.life * 1.5);
            ctx.fillStyle = ft.color || '#fef08a';
            ctx.font = `black ${ft.size || 14}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 4;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
          }

          // Restore canvas transform if shook
          if (shook) {
            ctx.restore();
          }

          // 2-Second Screen Blackout (when UFO is hit or Sabotage triggers)
          if (gameState === 'PLAYING' && g.blankoutTimer > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(2, 6, 23, 0.98)';
            ctx.fillRect(0, 0, g.width, g.height);

            // Scanlines
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.16)';
            ctx.lineWidth = 1;
            for (let ly = 0; ly < g.height; ly += 6) {
              ctx.beginPath();
              ctx.moveTo(0, ly);
              ctx.lineTo(g.width, ly);
              ctx.stroke();
            }

            ctx.fillStyle = '#ef4444';
            ctx.font = 'black 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ MULTIPLAYER EMP SABOTAGE!' , g.width / 2, g.height * 0.42);

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`SCREEN BLACKOUT: ${g.blankoutTimer.toFixed(1)}s (BIRDS FLYING!)`, g.width / 2, g.height * 0.48);

            ctx.restore();
          }

          // Crosshair
          if (gameState === 'PLAYING') {
            ctx.save();
            ctx.translate(g.pointer.x, g.pointer.y);
            ctx.strokeStyle = g.blankoutTimer > 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.95)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-25, 0);
            ctx.lineTo(-6, 0);
            ctx.moveTo(6, 0);
            ctx.lineTo(25, 0);
            ctx.moveTo(0, -25);
            ctx.lineTo(0, -6);
            ctx.moveTo(0, 6);
            ctx.lineTo(0, 25);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // FPS tracking
      if (data.settings.fps) {
        g.fpsCounter++;
        g.fpsTime += dt;
        if (g.fpsTime >= 0.5) {
          setFpsDisplay(`${Math.round(g.fpsCounter / g.fpsTime)} FPS`);
          g.fpsCounter = 0;
          g.fpsTime = 0;
        }
      }

      gameRef.current.animFrameId = requestAnimationFrame(loop);
    };

    gameRef.current.animFrameId = requestAnimationFrame(loop);

    return () => {
      running = false;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(gameRef.current.animFrameId);
      stopBackgroundMusic(audioSysRef.current);
    };
  }, [gameState, data.settings]);

  return (
    <div
      id="app"
      className="w-full h-screen flex flex-col relative select-none overflow-hidden bg-gradient-to-b from-[#1e40af] via-[#3b82f6] to-[#60a5fa] text-[#0f172a]"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-black/85 backdrop-blur-md text-white font-bold text-xs shadow-xl border border-white/20 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header HUD */}
      <header className="flex-none w-full px-3 sm:px-5 py-2 sm:py-2.5 flex justify-between items-center z-10 gap-2 bg-white/20 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-2">
          <BirdMascot size={32} />
          <div>
            <div className="text-base sm:text-lg font-black tracking-wide text-white drop-shadow-sm flex items-center gap-1.5">
              <span>SHOOT THE BIRD</span>
            </div>
            {/* Live Weather & Theme Indicators */}
            <div className="text-[10px] sm:text-[11px] text-sky-100 font-bold flex items-center gap-1.5 flex-wrap">
              {currentWeather === 'rain' && <span>🌧️ Gentle Rain</span>}
              {currentWeather === 'snow' && <span>❄️ Light Snow</span>}
              {currentWeather === 'drizzle' && <span>🌦️ Misty Drizzle</span>}
              {currentWeather === 'clear' && <span>☀️ Clear Sky</span>}
              <span className="opacity-70">•</span>
              <span className="text-amber-200">{currentThemeBadge}</span>
            </div>
          </div>
        </div>

        {/* Score, Best, and Interactive Combo / Accuracy Streak Card */}
        <div className="flex gap-1.5 sm:gap-2.5 items-center">
          <div className="bg-white/95 backdrop-blur-md rounded-xl px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-center shadow-md border border-white/60 min-w-[50px] sm:min-w-[66px]">
            <strong className="block text-sm sm:text-lg lg:text-xl font-black text-[#0f283d] leading-none">
              {score.toLocaleString()}
            </strong>
            <span className="text-[8px] sm:text-[9px] text-gray-500 font-extrabold tracking-wider leading-none mt-0.5 block">
              SCORE
            </span>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-xl px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-center shadow-md border border-white/60 min-w-[50px] sm:min-w-[66px]">
            <strong className="block text-sm sm:text-lg lg:text-xl font-black text-[#f97316] leading-none">
              {Math.max(bestScore, score).toLocaleString()}
            </strong>
            <span className="text-[8px] sm:text-[9px] text-gray-500 font-extrabold tracking-wider leading-none mt-0.5 block">
              BEST
            </span>
          </div>

          {/* Toggleable Combo Multiplier / Accuracy Streak HUD Card */}
          <button
            onClick={() => setHudMode(hudMode === 'COMBO' ? 'STREAK' : 'COMBO')}
            className="bg-white/95 backdrop-blur-md rounded-xl px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-center shadow-md border border-white/60 min-w-[56px] sm:min-w-[70px] hover:bg-white active:scale-95 transition-all cursor-pointer group"
            title="Click to toggle between Combo Multiplier & Accuracy Streak"
          >
            <strong
              className={`block text-sm sm:text-lg lg:text-xl font-black leading-none transition-colors ${
                hudMode === 'COMBO' ? 'text-[#2563eb]' : 'text-emerald-600'
              }`}
            >
              {hudMode === 'COMBO' ? `x${multiplier}` : `🎯 ${accuracyStreak}`}
            </strong>
            <span className="text-[8px] sm:text-[9px] text-gray-500 group-hover:text-gray-800 font-extrabold tracking-wider leading-none mt-0.5 flex items-center justify-center gap-0.5">
              {hudMode === 'COMBO' ? 'COMBO ⇄' : 'STREAK ⇄'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div
        id="gameArea"
        ref={containerRef}
        className="relative flex-1 min-h-0 w-full flex justify-center items-center px-2 py-1"
      >
        <canvas
          id="gameCanvas"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="block rounded-2xl shadow-2xl bg-[#38bdf8] touch-none cursor-crosshair border border-white/40"
        />

        {/* Daily challenge stays visible without covering bottom controls or lives. */}
        {gameState === 'PLAYING' && (
          <div className="absolute top-3 right-3 z-20 w-[min(12.5rem,48vw)] rounded-xl border border-amber-200/80 bg-slate-950/80 px-3 py-2 text-white shadow-lg backdrop-blur-md pointer-events-none">
            <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wide text-amber-300">
              <span>🏆 Daily Challenge</span>
              <span className={dailyTime <= 10 && !dailyClaimed ? 'text-red-300' : 'text-sky-200'}>
                {dailyClaimed ? 'Claimed' : `${dailyTime}s`}
              </span>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1 text-center text-[9px] font-bold">
              {(Object.keys(dailyChallenge.targets) as ChallengeBird[]).map((key) => (
                <span key={key} className={dailyProgress[key] >= dailyChallenge.targets[key] ? 'text-emerald-300' : 'text-white'}>
                  {challengeLabels[key]} {dailyProgress[key]}/{dailyChallenge.targets[key]}
                </span>
              ))}
            </div>
            {!dailyClaimed && dailyTime === 0 && (
              <div className="mt-1 text-center text-[9px] font-bold text-slate-300">Try again next game</div>
            )}
          </div>
        )}

        {gameState === 'PLAYING' && gameMode === 'MULTIPLAYER' && (
          <div className="absolute top-20 left-3 z-30 rounded-xl border border-indigo-300/50 bg-slate-950/85 px-3 py-2 text-center text-white shadow-lg backdrop-blur-md pointer-events-none">
            <div className="text-[10px] font-black uppercase tracking-wide text-indigo-200">
              {duelStartsIn > 0 ? `Starts in ${duelStartsIn}` : `${duelTime}s duel`}
            </div>
            <div className="mt-0.5 whitespace-nowrap text-[10px] font-bold">
              You {score.toLocaleString()} · {rivalName} {rivalScore.toLocaleString()} · {Math.max(0, rivalLives)} ❤️
            </div>
          </div>
        )}

        {/* Active Power-Up HUD Widget */}
        {activeBuff && gameState === 'PLAYING' && (
          <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md shadow-lg border border-white/80 flex items-center gap-2">
            <span className="text-base">
              {activeBuff.type === 'slow_mo' ? '⏱️' : activeBuff.type === 'multi_shot' ? '🎯' : '🛡️'}
            </span>
            <div>
              <div className="text-[10px] font-black text-gray-800 leading-tight">
                {activeBuff.type === 'slow_mo' ? 'Slow-Mo' : activeBuff.type === 'multi_shot' ? 'Triple Shot' : 'Guardian Shield'}
              </div>
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-indigo-600 transition-all duration-100"
                  style={{ width: `${(activeBuff.duration / activeBuff.maxDuration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}


     
        {/* Responsive bottom game controls */}
        <div className="absolute right-3 sm:right-5 bottom-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-2 z-20">
          {/* Quick Mute All Button */}
          <button
            onClick={handleToggleMuteAll}
            className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center text-lg active:scale-95 transition-all border ${
              isAllMuted
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 ring-2 ring-rose-300'
                : 'bg-white/95 hover:bg-white text-indigo-600 border-gray-100'
            }`}
            title={isAllMuted ? 'Unmute All Audio' : 'Mute All Audio'}
            aria-label={isAllMuted ? 'Unmute All Audio' : 'Mute All Audio'}
          >
            {isAllMuted ? (
              <VolumeX className="w-5 h-5 text-rose-500 animate-pulse" />
            ) : (
              <Volume2 className="w-5 h-5 text-indigo-600" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowVolumePopup(!showVolumePopup)}
              className="w-10 h-10 rounded-xl bg-white/95 hover:bg-white shadow-md flex items-center justify-center text-lg active:scale-95 transition-transform border border-gray-100"
              title="Volume Controls"
              aria-label="Adjust Volume"
            >
              <Music className="w-5 h-5 text-gray-700" />
            </button>

            {showVolumePopup && (
              <div className="absolute right-0 bottom-12 w-60 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-gray-200 z-30 animate-in fade-in zoom-in-95">
                <div className="text-xs font-black text-gray-800 mb-3 flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-indigo-600" /> In-Game Volume
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-gray-600 mb-1">
                      <span>Music (Reliever)</span>
                      <span>{Math.round(data.settings.musicVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={data.settings.musicVolume}
                      onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between font-bold text-gray-600 mb-1">
                      <span>Sound Effects</span>
                      <span>{Math.round(data.settings.soundVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={data.settings.soundVolume}
                      onChange={(e) => handleSoundVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowVolumePopup(false)}
                  className="mt-3 w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[11px]"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => gameState === 'PLAYING' && setGameState('PAUSED')}
            className="w-10 h-10 rounded-xl bg-white/95 hover:bg-white shadow-md flex items-center justify-center text-lg active:scale-95 transition-transform border border-gray-100"
            aria-label="Pause"
          >
            <Pause className="w-5 h-5 text-gray-800" />
          </button>

          <button
            onClick={() => setGameState(gameState === 'PLAYING' ? 'SETTINGS_PAUSED' : 'SETTINGS')}
            className="w-10 h-10 rounded-xl bg-white/95 hover:bg-white shadow-md flex items-center justify-center text-lg active:scale-95 transition-transform border border-gray-100"
            aria-label="Settings"
          >
            <SettingsIcon className="w-5 h-5 text-gray-800" />
          </button>
        </div>

        {/* Hearts at Centre Bottom */}
        {gameState === 'PLAYING' && (
          <div className="absolute bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-xl border border-white/80 animate-in fade-in">
            <span className="text-[11px] font-extrabold text-gray-600 uppercase tracking-wider mr-0.5">LIVES</span>
            <div className="flex gap-1.5 text-lg">
              {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                <span key={i} className="animate-pulse">
                  ❤️
                </span>
              ))}
              {Array.from({ length: Math.max(0, 3 - lives) }).map((_, i) => (
                <span key={i} className="opacity-30 grayscale">
                  🖤
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Accuracy Streak Badge */}
        {accuracyStreak >= 3 && (
          <div className="absolute left-6 bottom-16 sm:bottom-6 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-lg z-20 flex items-center gap-1.5 animate-pulse">
            <span>🎯 {accuracyStreak} HIT STREAK</span>
          </div>
        )}

        {/* Combo Badge */}
        {showCombo && (
          <div className="absolute left-6 bottom-5 sm:bottom-16 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#ffd166] to-[#f97316] text-[#351a00] font-black text-sm shadow-lg z-20 animate-bounce">
            {comboText}
          </div>
        )}

        {/* FPS counter */}
        {data.settings.fps && (
          <div className="absolute left-4 top-16 px-2 py-1 rounded bg-black/50 text-white text-[10px] font-mono z-20">
            {fpsDisplay}
          </div>
        )}

        {/* Modals */}
        {gameState === 'MENU' && (
          <MainMenuModal
            playerName={data.playerName}
            onRequestStart={requestStart}
            onOpenRanks={() => setGameState('RANKS')}
            onOpenHow={() => setGameState('HOW')}
            onOpenSettings={() => setGameState('SETTINGS')}
            onOpenMultiplayer={() => setShowMultiplayerModal(true)}
            dailyChallenge={{
              date: dailyChallenge.date,
              timeLimit: dailyChallenge.timeLimit,
              reward: dailyChallenge.reward,
              claimed: dailyClaimed,
              targets: (Object.keys(dailyChallenge.targets) as ChallengeBird[]).map(key => ({
                label: challengeLabels[key], progress: dailyProgress[key], target: dailyChallenge.targets[key],
              })),
            }}
          />
        )}

        {gameState === 'NAME' && (
          <div className="absolute inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-[420px] bg-white/95 rounded-3xl p-6 shadow-2xl border border-white/60">
              <div className="flex items-center gap-3 mb-3">
                <BirdMascot size={42} />
                <div>
                  <h2 className="text-xl font-black text-[#0f283d]">Enter Nickname</h2>
                  <p className="text-xs text-gray-500">Your score will be logged on the global leaderboard.</p>
                </div>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  maxLength={20}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. AceShooter"
                  className="w-full p-3 rounded-xl border border-gray-300 font-bold text-base focus:outline-none focus:ring-2 focus:ring-[#f97316] bg-white"
                  autoFocus
                />
              </div>
              <button
                onClick={saveName}
                className="w-full py-3 bg-[#f97316] hover:bg-[#ea580c] text-white font-black rounded-xl shadow-md active:scale-98 transition-transform"
              >
                CONTINUE & PLAY
              </button>
            </div>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-[400px] bg-white/95 rounded-3xl p-6 shadow-2xl text-center border border-white/60">
              <h2 className="text-2xl font-black text-[#0f283d] mb-2">⏸️ Game Paused</h2>
              <p className="text-xs text-gray-500 mb-5">Take a breather, the skies are waiting for you!</p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    gameRef.current.lastTime = performance.now();
                    setGameState('PLAYING');
                  }}
                  className="w-full py-3 bg-[#f97316] hover:bg-[#ea580c] text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-transform"
                >
                  <Play className="w-4 h-4 fill-current" /> RESUME
                </button>
                <button
                  onClick={() => setGameState('SETTINGS_PAUSED')}
                  className="w-full py-2.5 bg-white hover:bg-gray-50 text-[#0f172a] font-bold rounded-xl border border-gray-200 text-xs flex items-center justify-center gap-2 active:scale-98 transition-transform"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-600" /> SETTINGS & AUDIO
                </button>
                <button
                  onClick={() => startGame(gameMode)}
                  className="w-full py-2.5 bg-white hover:bg-gray-50 text-[#0f172a] font-bold rounded-xl border border-gray-200 text-xs flex items-center justify-center gap-2 active:scale-98 transition-transform"
                >
                  <RotateCcw className="w-4 h-4 text-amber-500" /> RESTART GAME
                </button>
                <button
                  onClick={() => setGameState('MENU')}
                  className="w-full py-2.5 bg-white hover:bg-gray-50 text-[#0f172a] font-bold rounded-xl border border-gray-200 text-xs flex items-center justify-center gap-2 active:scale-98 transition-transform"
                >
                  <Home className="w-4 h-4 text-indigo-600" /> MAIN MENU
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'HOW' && (
          <HowToPlayModal onClose={() => setGameState('MENU')} />
        )}

        {(gameState === 'SETTINGS' || gameState === 'SETTINGS_PAUSED') && (
          <SettingsModal
            settings={data.settings}
            playerName={data.playerName}
            onSaveSettings={saveSettings}
            onMusicVolChange={handleMusicVolumeChange}
            onSoundVolChange={handleSoundVolumeChange}
            onChangeName={() => setGameState('NAME')}
            onClose={() => setGameState(gameState === 'SETTINGS_PAUSED' ? 'PAUSED' : 'MENU')}
          />
        )}

        {gameState === 'RANKS' && (
          <LeaderboardModal
            globalRanks={globalRanks}
            localScores={data.scores || []}
            playerName={data.playerName}
            onClose={() => setGameState('MENU')}
          />
        )}

        {/* End of Match Performance Summary Screen */}
        {gameState === 'SUMMARY' && summaryStats && (
          <MatchSummaryModal
            stats={summaryStats}
            playerName={data.playerName || 'Player'}
            onPlayAgain={() => startGame(gameMode)}
            onOpenLeaderboard={() => setGameState('RANKS')}
            onShare={() => {
              const text = `🐦 Scored ${summaryStats.score.toLocaleString()} in Shoot The Bird! (${summaryStats.accuracy}% accuracy, ${summaryStats.headshots} bullseyes!)`;
              if (navigator.share) {
                navigator.share({ title: 'Shoot The Bird Stats', text, url: window.location.href }).catch(() => {});
              } else if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => showToast('Stats copied to clipboard!'));
              }
            }}
            onMainMenu={() => setGameState('MENU')}
          />
        )}

        {/* Multiplayer Lobby Modal */}
        {showMultiplayerModal && (
          <MultiplayerModal
            playerName={data.playerName || 'Player'}
            onClose={() => setShowMultiplayerModal(false)}
            onStartDuel={handleStartDuel}
            activeDuelRoom={activeMultiRoom}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="flex-none text-center py-1.5 text-[11px] text-white font-bold bg-black/20 backdrop-blur-xs">
        Tap birds to shoot • 🛸 UFO Encounters • ⚡ Collect Power-Ups • ⚠️ Avoid Hazard Birds • Relax & Enjoy
      </footer>
    </div>
  );
}
