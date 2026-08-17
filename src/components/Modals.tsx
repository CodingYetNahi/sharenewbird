import React, { useState } from 'react';
import {
  Play,
  Trophy,
  HelpCircle,
  Settings as SettingsIcon,
  Music,
  Volume2,
  VolumeX,
  Sparkles,
  Calendar,
  Flame,
  CheckCircle2,
  Clock,
  Award,
  Target,
  Star,
  Zap,
  BookOpen,
  Vibrate,
  Shield,
  Gift,
  Crown,
} from 'lucide-react';
import { BirdMascot } from '../App';
import { GameLogoGraphic } from './GameLogoGraphic';
import { getPast7DaysChallengeHistory, challengeLabels } from '../lib/dailyChallenge';
import { getLoginStreakState, claimTodayLoginBonus, LOGIN_REWARDS, LoginStreakState } from '../lib/dailyLoginBonus';

import aeroplaneImg from '../assets/game/aeroplane.webp';
import birdArmoredImg from '../assets/game/bird-armored.webp';
import birdDangerImg from '../assets/game/bird-danger.webp';
import birdFastImg from '../assets/game/bird-fast.webp';
import birdLargeImg from '../assets/game/bird-large.webp';
import birdNormalImg from '../assets/game/bird-normal.webp';
import birdRareImg from '../assets/game/bird-rare.webp';
import birdSmallImg from '../assets/game/bird-small.webp';

export interface GameSettings {
  sound: boolean;
  music: boolean;
  musicVolume: number;
  soundVolume: number;
  vibration: boolean;
  hapticIntensity: 'off' | 'low' | 'medium' | 'high';
  fps: boolean;
}

export function MainMenuModal({
  playerName,
  onRequestStart,
  onOpenRanks,
  onOpenHow,
  onOpenSettings,
  onOpenMultiplayer,
  dailyChallenge,
}: {
  playerName: string;
  onRequestStart: () => void;
  onOpenRanks: () => void;
  onOpenHow: () => void;
  onOpenSettings: () => void;
  onOpenMultiplayer: () => void;
  dailyChallenge: {
    date: string;
    timeLimit: number;
    reward: number;
    claimed: boolean;
    targets: { label: string; progress: number; target: number }[];
  };
}) {
  const [loginState, setLoginState] = useState<LoginStreakState>(getLoginStreakState());
  const [loginClaimToast, setLoginClaimToast] = useState<string | null>(null);

  const handleClaimLogin = () => {
    const res = claimTodayLoginBonus();
    setLoginState(res.updatedState);
    if (res.success) {
      setLoginClaimToast(`🎉 Claimed Day ${res.reward.day}: ${res.reward.bonusTitle} (${res.reward.bonusDesc})!`);
      setTimeout(() => setLoginClaimToast(null), 4000);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] max-h-[94vh] overflow-y-auto bg-white/95 rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/60">
        <div className="text-center mb-4">
          <GameLogoGraphic className="mb-2" />
          <p className="text-xs text-[#475569] mt-1 font-medium">
            Dynamic skies, Dive Bombers, Golden Phoenix, and 1v1 Multi-duels!
          </p>
          {playerName && (
            <div className="mt-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 py-1 px-3 rounded-full inline-block">
              Welcome back, {playerName} 👋
            </div>
          )}
        </div>

        {/* Daily Login Streak Banner */}
        <div className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-200/90">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <h3 className="text-xs font-black text-slate-800 leading-tight">
                  Daily Login Streak: <span className="text-orange-600">Day {loginState.currentStreak}/7</span>
                </h3>
                <p className="text-[10px] text-gray-500 font-medium">
                  {loginState.claimedToday ? 'Today\'s reward already collected!' : 'Claim today\'s bonus boost!'}
                </p>
              </div>
            </div>
            {!loginState.claimedToday ? (
              <button
                onClick={handleClaimLogin}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl text-xs shadow-sm active:scale-95 transition-transform flex items-center gap-1"
              >
                <Gift className="w-3.5 h-3.5" /> CLAIM
              </button>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black rounded-xl text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> CLAIMED
              </span>
            )}
          </div>

          {/* 7-day mini progress dots */}
          <div className="grid grid-cols-7 gap-1">
            {LOGIN_REWARDS.map((r) => {
              const isPast = r.day < loginState.currentStreak || (r.day === loginState.currentStreak && loginState.claimedToday);
              const isCurrent = r.day === loginState.currentStreak;
              return (
                <div
                  key={r.day}
                  className={`p-1 rounded-xl text-center text-[9px] border transition-all ${
                    isPast
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : isCurrent
                      ? 'bg-amber-100 border-amber-300 font-black text-amber-900 ring-2 ring-amber-400/40'
                      : 'bg-white/80 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="text-[11px]">{r.bonusIcon}</div>
                  <div className="font-bold leading-none mt-0.5">D{r.day}</div>
                </div>
              );
            })}
          </div>

          {loginClaimToast && (
            <div className="mt-2 text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-1 rounded-lg text-center animate-in fade-in">
              {loginClaimToast}
            </div>
          )}
        </div>

        {/* Daily Challenge */}
        <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3" aria-label="Today's Daily Challenge">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-xs font-black text-amber-950">🏆 DAILY CHALLENGE</h3>
              <p className="text-[9px] font-bold text-amber-700">{dailyChallenge.date} · {dailyChallenge.timeLimit}s limit</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-[9px] font-black ${dailyChallenge.claimed ? 'bg-emerald-600 text-white' : 'bg-amber-200 text-amber-950'}`}>
              {dailyChallenge.claimed ? 'COMPLETED' : `+${dailyChallenge.reward} PTS`}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {dailyChallenge.targets.map(target => (
              <div key={target.label} className="rounded-lg bg-white px-2 py-1.5 text-center border border-amber-100">
                <div className="text-[9px] font-bold text-slate-600">{target.label}</div>
                <div className={`text-xs font-black ${target.progress >= target.target ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {target.progress}/{target.target}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-2.5">
          <button
            onClick={onRequestStart}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 text-base active:scale-98 transition-transform"
          >
            <Play className="w-5 h-5 fill-current" /> PLAY NOW (SOLO)
          </button>

          <button
            onClick={onOpenMultiplayer}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm active:scale-98 transition-transform"
          >
            ⚔️ MULTIPLAYER 1V1 DUELS
          </button>

          <button
            onClick={onOpenRanks}
            className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-[#0f172a] font-bold rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center gap-2 text-xs active:scale-98 transition-transform"
          >
            <Trophy className="w-4 h-4 text-amber-500" /> LEADERBOARD & 7-DAY LOG
          </button>

          <button
            onClick={onOpenHow}
            className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-[#0f172a] font-bold rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center gap-2 text-xs active:scale-98 transition-transform"
          >
            <HelpCircle className="w-4 h-4 text-sky-600" /> BIRDPEDIA & HOW TO PLAY
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-[#0f172a] font-bold rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center gap-2 text-xs active:scale-98 transition-transform"
          >
            <SettingsIcon className="w-4 h-4 text-slate-600" /> SETTINGS, AUDIO & HAPTICS
          </button>
        </div>
      </div>
    </div>
  );
}

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'GUIDE' | 'BIRDPEDIA'>('BIRDPEDIA');

  return (
    <div className="absolute inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-[600px] max-h-[92vh] flex flex-col bg-white/95 rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/60">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <BirdMascot size={36} />
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#0f283d] flex items-center gap-1.5 leading-tight">
                {activeTab === 'BIRDPEDIA' ? (
                  <>
                    <BookOpen className="w-5 h-5 text-amber-500" /> Birdpedia & Field Guide
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-5 h-5 text-sky-600" /> How To Play & Controls
                  </>
                )}
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                {activeTab === 'BIRDPEDIA' ? 'Official avian lore, stats, flight patterns & pro tips' : 'Core mechanics, score multipliers & power-ups'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-3 text-xs font-black">
          <button
            onClick={() => setActiveTab('BIRDPEDIA')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'BIRDPEDIA'
                ? 'bg-white text-[#0f283d] shadow-sm font-black'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-500" /> 📖 Birdpedia & Stats
          </button>
          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'GUIDE'
                ? 'bg-white text-[#0f283d] shadow-sm font-black'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Zap className="w-4 h-4 text-sky-600" /> ⚡ Quick Mechanics
          </button>
        </div>

        {/* Tab 1: Birdpedia & Species Field Guide */}
        {activeTab === 'BIRDPEDIA' && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
            {/* Dive Bomber */}
            <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 flex items-start gap-3">
              <img src={birdFastImg} alt="Dive Bomber" className="w-12 h-12 object-contain flex-shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-orange-950 font-black text-sm">⚡ Dive Bomber</strong>
                  <span className="font-mono font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full text-[10px]">
                    +30 PTS · SPEED: 180
                  </span>
                </div>
                <p className="text-orange-900 mt-1 text-[11px] leading-relaxed">
                  <strong>Lore:</strong> High-altitude apex predator that begins high above the clouds and executes a sudden, lightning-fast parabolic swoop toward the ground before escaping!
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-orange-800">
                  <span><strong>Flight:</strong> Parabolic Arc</span>
                  <span>•</span>
                  <span><strong>Pro Tip:</strong> Anticipate its swoop valley for easy bullseye crits!</span>
                </div>
              </div>
            </div>

            {/* Golden Phoenix */}
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-100/70 rounded-2xl border border-yellow-300 flex items-start gap-3 shadow-xs">
              <img src={birdRareImg} alt="Golden Phoenix" className="w-12 h-12 object-contain flex-shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-yellow-950 font-black text-sm">✨ Golden Phoenix (Legendary)</strong>
                  <span className="font-mono font-black text-amber-700 bg-yellow-200/90 px-2 py-0.5 rounded-full text-[10px]">
                    +300 PTS · SPEED: 250 (2x Fast!)
                  </span>
                </div>
                <p className="text-yellow-900 mt-1 text-[11px] leading-relaxed">
                  <strong>Lore:</strong> Ancient mythical avians that blaze across the sky with golden radiant stardust. Extremely rare and flies twice as fast as normal swifts!
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-amber-800">
                  <span><strong>Flight:</strong> High-Frequency Wave</span>
                  <span>•</span>
                  <span><strong>Drops:</strong> Guaranteed Power-Up Capsule!</span>
                </div>
              </div>
            </div>

            {/* Armored Bird */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-300 flex items-start gap-3">
              <img src={birdArmoredImg} alt="Armored Bird" className="w-12 h-12 object-contain flex-shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-black text-sm">🛡️ Armored Bird (Steel Crest)</strong>
                  <span className="font-mono font-black text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full text-[10px]">
                    +120 PTS · 2 HP SHIELD
                  </span>
                </div>
                <p className="text-slate-700 mt-1 text-[11px] leading-relaxed">
                  <strong>Lore:</strong> Heavily reinforced cyber-avian with a kinetic deflector shield. Takes 2 direct hits to break down and trigger screen shake!
                </p>
              </div>
            </div>

            {/* Normal Bluebird */}
            <div className="p-2.5 bg-sky-50 rounded-2xl border border-sky-200 flex items-start gap-3">
              <img src={birdNormalImg} alt="Bluebird" className="w-10 h-10 object-contain flex-shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-sky-950 font-black">Normal Bluebird</strong>
                  <span className="font-mono font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full text-[10px]">
                    +10 PTS · SPEED: 85
                  </span>
                </div>
                <p className="text-sky-800 mt-0.5 text-[11px]">Smooth sinusoidal wave flight. Perfect for chaining consecutive hit streaks.</p>
              </div>
            </div>

            {/* Swift Swallow */}
            <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
              <img src={birdFastImg} alt="Swift" className="w-10 h-10 object-contain flex-shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-emerald-950 font-black">Swift Swallow</strong>
                  <span className="font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    +20 PTS · SPEED: 125
                  </span>
                </div>
                <p className="text-emerald-800 mt-0.5 text-[11px]">Rapid straight-line vector flight across the sky.</p>
              </div>
            </div>

            {/* Hummingbird */}
            <div className="p-2.5 bg-purple-50 rounded-2xl border border-purple-200 flex items-start gap-3">
              <img src={birdSmallImg} alt="Hummingbird" className="w-10 h-10 object-contain flex-shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-purple-950 font-black">Hummingbird</strong>
                  <span className="font-mono font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full text-[10px]">
                    +35 PTS · ZIGZAG FLIGHT
                  </span>
                </div>
                <p className="text-purple-800 mt-0.5 text-[11px]">Tiny and agile. Frequently drops Slow-Mo, Multi-Shot, or Shield capsules!</p>
              </div>
            </div>

            {/* Hazard Bird & Cursed Raven */}
            <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-200 flex items-start gap-3">
              <img src={birdDangerImg} alt="Hazard" className="w-10 h-10 object-contain flex-shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-rose-950 font-black">⚠️ Hazard Birds & Cursed Ravens</strong>
                  <span className="font-mono font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full text-[10px]">
                    -1 ❤️ HEART DAMAGE
                  </span>
                </div>
                <p className="text-rose-800 mt-0.5 text-[11px]">Dangerous prickly predators. DO NOT SHOOT! Let them pass safely.</p>
              </div>
            </div>

            {/* Supersonic Jet */}
            <div className="p-2.5 bg-blue-50 rounded-2xl border border-blue-200 flex items-start gap-3">
              <img src={aeroplaneImg} alt="Aeroplane" className="w-11 h-7 object-contain flex-shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-blue-950 font-black">✈️ Supersonic Bonus Jet</strong>
                  <span className="font-mono font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full text-[10px]">
                    +100 PTS BONUS
                  </span>
                </div>
                <p className="text-blue-800 mt-0.5 text-[11px]">Cruises high altitude leaving jet contrails. Hit for huge flat score bonus!</p>
              </div>
            </div>

            {/* Alien UFO */}
            <div className="p-2.5 bg-cyan-50 rounded-2xl border border-cyan-300 flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center text-2xl flex-shrink-0">🛸</div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-cyan-950 font-black">🛸 Alien UFO Saucer</strong>
                  <span className="font-mono font-black text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full text-[10px]">
                    +200 PTS · 1V1 SABOTAGE
                  </span>
                </div>
                <p className="text-cyan-800 mt-0.5 text-[11px]">Hit to award 200 PTS and black out your rival's screen in 1v1 multiplayer duels!</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Quick Mechanics Guide */}
        {activeTab === 'GUIDE' && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
            {/* Temporary Power-Ups Section */}
            <div className="p-3.5 bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 rounded-2xl border border-indigo-200">
              <div className="text-xs font-black text-indigo-900 flex items-center gap-1.5 mb-2">
                <span>⚡ Power-Up Capsules (Dropped from Special Birds)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white/80 rounded-xl border border-sky-200">
                  <div className="text-lg mb-0.5">⏱️</div>
                  <div className="font-black text-sky-900 text-[11px]">Chrono Slow-Mo</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">Slows birds by 55% for 6s</div>
                </div>
                <div className="p-2 bg-white/80 rounded-xl border border-orange-200">
                  <div className="text-lg mb-0.5">🎯</div>
                  <div className="font-black text-orange-900 text-[11px]">Triple Shot</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">Fires 3 spread blasts for 8s</div>
                </div>
                <div className="p-2 bg-white/80 rounded-xl border border-emerald-200">
                  <div className="text-lg mb-0.5">🛡️</div>
                  <div className="font-black text-emerald-900 text-[11px]">Guardian Shield</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">Blocks 1 hazard penalty for 10s</div>
                </div>
              </div>
            </div>

            {/* Multipliers & Accuracy Streaks */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950">
              <strong className="font-black flex items-center gap-1.5">🎯 Accuracy Streaks & Combos:</strong>
              <p className="mt-1 text-[11px] leading-relaxed">
                Hit targets consecutively without missing to build your <strong>Accuracy Streak</strong> and increase your score multiplier up to <strong>12x</strong>!
              </p>
            </div>

            {/* Extra Life Milestone */}
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 flex items-center gap-2.5">
              <span className="text-xl">💖</span>
              <div>
                <strong>Extra Lives</strong>: Earn +1 Extra Life for every <strong>40,000 Points</strong> milestone (40k, 80k, 120k...)!
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-1">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#f97316] hover:bg-[#ea580c] text-white font-black rounded-2xl shadow-md active:scale-98 transition-transform text-sm"
          >
            GOT IT, LET'S PLAY!
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({
  settings,
  playerName,
  onSaveSettings,
  onMusicVolChange,
  onSoundVolChange,
  onChangeName,
  onClose,
}: {
  settings: GameSettings;
  playerName: string;
  onSaveSettings: (s: Partial<GameSettings>) => void;
  onMusicVolChange: (v: number) => void;
  onSoundVolChange: (v: number) => void;
  onChangeName: () => void;
  onClose: () => void;
}) {
  const handleHapticChange = (intensity: 'off' | 'low' | 'medium' | 'high') => {
    onSaveSettings({ hapticIntensity: intensity });
    if (intensity !== 'off' && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(intensity === 'low' ? 15 : intensity === 'medium' ? 35 : 60);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white/95 rounded-3xl p-6 shadow-2xl border border-white/60">
        <h2 className="text-xl font-black text-[#0f283d] mb-3 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-slate-700" /> Settings & Audio
        </h2>

        <div className="space-y-3.5 text-xs text-gray-700">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold flex items-center gap-2">
                <Music className="w-4 h-4 text-indigo-600" /> Relaxing Background Music
              </span>
              <input
                type="checkbox"
                checked={settings.music}
                onChange={(e) => onSaveSettings({ music: e.target.checked })}
                className="w-4 h-4 text-[#f97316] rounded"
              />
            </div>
            {settings.music && (
              <div className="pl-6">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) => onMusicVolChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] text-gray-500">Volume: {Math.round(settings.musicVolume * 100)}%</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-600" /> Sound Effects
              </span>
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(e) => onSaveSettings({ sound: e.target.checked })}
                className="w-4 h-4 text-[#f97316] rounded"
              />
            </div>
            {settings.sound && (
              <div className="pl-6">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => onSoundVolChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-[10px] text-gray-500">Volume: {Math.round(settings.soundVolume * 100)}%</span>
              </div>
            )}
          </div>

          {/* Haptic Intensity Slider / Selector */}
          <div className="pt-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-bold flex items-center gap-2">
                <Vibrate className="w-4 h-4 text-purple-600" /> Haptic Vibration Intensity
              </span>
              <span className="text-[10px] font-black text-purple-700 uppercase bg-purple-100 px-2 py-0.5 rounded-md">
                {settings.hapticIntensity || 'medium'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-center text-[10px] font-bold">
              {(['off', 'low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleHapticChange(level)}
                  className={`py-1.5 rounded-lg capitalize transition-all ${
                    (settings.hapticIntensity || 'medium') === level
                      ? 'bg-purple-600 text-white font-black shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <label className="flex justify-between items-center cursor-pointer pt-1">
            <span className="font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> FPS Counter
            </span>
            <input
              type="checkbox"
              checked={settings.fps}
              onChange={(e) => onSaveSettings({ fps: e.target.checked })}
              className="w-4 h-4 text-[#f97316] rounded"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={onChangeName}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs"
          >
            👤 Change Player Name ({playerName || 'None'})
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#f97316] hover:bg-[#ea580c] text-white font-black rounded-xl shadow-md text-sm active:scale-98"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

export function LeaderboardModal({
  globalRanks,
  localScores,
  playerName,
  onClose,
}: {
  globalRanks: { name: string; score: number }[];
  localScores: { name: string; score: number }[];
  playerName: string;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'LOCAL' | 'HISTORY'>('GLOBAL');
  const challengeHistory = getPast7DaysChallengeHistory();

  return (
    <div className="absolute inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-[500px] max-h-[92vh] flex flex-col bg-white/95 rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/60">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BirdMascot size={36} />
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#0f283d] flex items-center gap-1.5 leading-tight">
                {activeTab === 'GLOBAL' ? (
                  <>
                    <Trophy className="w-5 h-5 text-amber-500" /> Global Leaderboard
                  </>
                ) : activeTab === 'LOCAL' ? (
                  <>
                    <Star className="w-5 h-5 text-indigo-500" /> Local Records
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5 text-emerald-500" /> Challenge History
                  </>
                )}
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                {activeTab === 'HISTORY'
                  ? '7-Day challenge progress & consistency streak'
                  : 'Live top marksmen scores & personal bests'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-2xl mb-3 text-xs font-black">
          <button
            onClick={() => setActiveTab('GLOBAL')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'GLOBAL'
                ? 'bg-white text-[#0f283d] shadow-sm font-black'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Global
          </button>
          <button
            onClick={() => setActiveTab('LOCAL')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'LOCAL'
                ? 'bg-white text-[#0f283d] shadow-sm font-black'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-indigo-500" /> My Bests
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'HISTORY'
                ? 'bg-white text-[#0f283d] shadow-sm font-black'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-500" /> 7-Day Log
          </button>
        </div>

        {/* Tab 1: Global Ranks */}
        {activeTab === 'GLOBAL' && (
          <div className="flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded-2xl divide-y divide-gray-100 bg-white">
            {globalRanks.length > 0 ? (
              globalRanks.map((r, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center px-4 py-2.5 text-xs font-semibold ${
                    r.name === playerName ? 'bg-amber-50 text-amber-900 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 text-center font-bold text-gray-500">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <span className="text-gray-800 truncate max-w-[170px]">{r.name}</span>
                    {r.name === playerName && (
                      <span className="text-[9px] bg-amber-200 text-amber-900 font-black px-1.5 py-0.5 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-black text-[#f97316]">{Number(r.score).toLocaleString()} pts</span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-gray-400">
                Connecting to global leaderboards...
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Local Scores */}
        {activeTab === 'LOCAL' && (
          <div className="flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded-2xl divide-y divide-gray-100 bg-white">
            {localScores.length > 0 ? (
              localScores.map((r, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-2.5 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-center font-bold text-gray-500">#{i + 1}</span>
                    <span className="text-gray-800">{r.name}</span>
                  </div>
                  <span className="font-mono font-black text-[#f97316]">{Number(r.score).toLocaleString()} pts</span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-gray-400">No match records yet. Play your first round!</div>
            )}
          </div>
        )}

        {/* Tab 3: 7-Day Challenge History */}
        {activeTab === 'HISTORY' && (
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5 pr-0.5">
            {/* Consistency Summary Ribbon */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/80 shadow-xs text-center">
              <div>
                <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block">Consistency</span>
                <span className="text-base sm:text-lg font-black text-emerald-950 leading-tight">
                  {challengeHistory.completedCount}/7 Days
                </span>
              </div>
              <div className="border-x border-emerald-200/70 px-1">
                <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider block flex items-center justify-center gap-0.5">
                  <Flame className="w-3 h-3 text-amber-500" /> Active Streak
                </span>
                <span className="text-base sm:text-lg font-black text-amber-900 leading-tight">
                  {challengeHistory.currentStreak} {challengeHistory.currentStreak === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block">Total Reward</span>
                <span className="text-base sm:text-lg font-black text-indigo-950 leading-tight">
                  +{challengeHistory.totalRewardEarned.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 7-Day Visual Bubbles */}
            <div className="flex justify-between items-center px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              {challengeHistory.entries.slice().reverse().map((entry, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-500">{entry.dayName}</span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${
                      entry.completed
                        ? 'bg-emerald-500 text-white'
                        : entry.completionRate > 0
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {entry.completed ? '✓' : entry.isToday ? '•' : '—'}
                  </div>
                </div>
              ))}
            </div>

            {/* Daily History Cards List */}
            <div className="flex flex-col gap-2">
              {challengeHistory.entries.map((entry) => (
                <div
                  key={entry.date}
                  className={`p-3 rounded-2xl border transition-all ${
                    entry.completed
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : entry.isToday
                      ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/60'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-800">{entry.displayDate}</span>
                      {entry.isToday && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-extrabold text-[9px]">
                          TODAY
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {entry.completed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> COMPLETED (+{entry.reward} PTS)
                        </span>
                      ) : entry.completionRate > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          <Zap className="w-3 h-3 text-amber-600" /> IN PROGRESS ({entry.completionRate}%)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {entry.isToday ? 'NOT STARTED' : 'MISSED'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-300 ${
                        entry.completed
                          ? 'bg-emerald-500'
                          : entry.completionRate > 0
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${entry.completionRate}%` }}
                    />
                  </div>

                  {/* Target details breakdown */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="px-1.5 py-1 bg-white rounded-lg border border-slate-100">
                      <span className="text-gray-500 font-semibold block">{challengeLabels.normal}</span>
                      <span
                        className={`font-black ${
                          (entry.progress.normal || 0) >= (entry.targets.normal || 0)
                            ? 'text-emerald-600'
                            : 'text-slate-800'
                        }`}
                      >
                        {entry.progress.normal || 0}/{entry.targets.normal || 0}
                      </span>
                    </div>

                    <div className="px-1.5 py-1 bg-white rounded-lg border border-slate-100">
                      <span className="text-gray-500 font-semibold block">{challengeLabels.fast}</span>
                      <span
                        className={`font-black ${
                          (entry.progress.fast || 0) >= (entry.targets.fast || 0)
                            ? 'text-emerald-600'
                            : 'text-slate-800'
                        }`}
                      >
                        {entry.progress.fast || 0}/{entry.targets.fast || 0}
                      </span>
                    </div>

                    <div className="px-1.5 py-1 bg-white rounded-lg border border-slate-100">
                      <span className="text-gray-500 font-semibold block">{challengeLabels.small}</span>
                      <span
                        className={`font-black ${
                          (entry.progress.small || 0) >= (entry.targets.small || 0)
                            ? 'text-emerald-600'
                            : 'text-slate-800'
                        }`}
                      >
                        {entry.progress.small || 0}/{entry.targets.small || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Close Button */}
        <div className="mt-4 pt-1">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#f97316] hover:bg-[#ea580c] text-white font-black rounded-2xl shadow-md text-sm active:scale-98 transition-transform"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}


