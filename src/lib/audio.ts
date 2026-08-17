// Web Audio API Sound Generator & Synthesizer for Shoot The Bird Game

export interface AudioSystem {
  ctx: AudioContext | null;
  masterGain: GainNode | null;
  musicGain: GainNode | null;
  sfxGain: GainNode | null;
  musicTimer: any;
  musicStep: number;
  configuredMusicVolume: number;
  duckDepth: number;
}

export function createAudioSystem(): AudioSystem {
  return {
    ctx: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    musicTimer: null,
    musicStep: 0,
    configuredMusicVolume: 0.6,
    duckDepth: 0,
  };
}

export function initAudioContext(sys: AudioSystem, soundEnabled: boolean, musicEnabled: boolean, soundVol: number, musicVol: number) {
  if (sys.ctx) return;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();

    const master = ctx.createGain();
    master.gain.value = 1.0;
    master.connect(ctx.destination);

    const musicG = ctx.createGain();
    musicG.gain.value = musicEnabled ? musicVol : 0;
    musicG.connect(master);

    const sfxG = ctx.createGain();
    sfxG.gain.value = soundEnabled ? soundVol : 0;
    sfxG.connect(master);

    sys.ctx = ctx;
    sys.masterGain = master;
    sys.musicGain = musicG;
    sys.sfxGain = sfxG;
    sys.configuredMusicVolume = musicEnabled ? musicVol : 0;
  } catch {}
}

function rampMusic(sys: AudioSystem, target: number, seconds = 0.28) {
  if (!sys.ctx || !sys.musicGain) return;
  const now = sys.ctx.currentTime;
  sys.musicGain.gain.cancelScheduledValues(now);
  sys.musicGain.gain.setValueAtTime(sys.musicGain.gain.value, now);
  sys.musicGain.gain.linearRampToValueAtTime(Math.max(0, target), now + seconds);
}

/** Smoothly lowers music for alerts and overlays. Calls may be safely nested. */
export function duckMusic(sys: AudioSystem, targetFactor = 0.45, duration = 0.12) {
  sys.duckDepth++;
  rampMusic(sys, sys.configuredMusicVolume * targetFactor, duration);
}

/** Releases one duck request and restores the player's configured volume. */
export function restoreMusic(sys: AudioSystem, configuredVolume: number, duration = 0.25) {
  sys.configuredMusicVolume = configuredVolume;
  sys.duckDepth = Math.max(0, sys.duckDepth - 1);
  rampMusic(sys, sys.duckDepth > 0 ? configuredVolume * 0.45 : configuredVolume, duration);
}

/** Applies a settings change without disturbing nested overlay duck requests. */
export function updateMusicVolume(sys: AudioSystem, configuredVolume: number, duration = 0.12) {
  sys.configuredMusicVolume = configuredVolume;
  rampMusic(sys, sys.duckDepth > 0 ? configuredVolume * 0.45 : configuredVolume, duration);
}

export function playSfxTone(
  sys: AudioSystem,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  vol = 0.15,
  pitchEnd?: number
) {
  if (!sys.ctx || !sys.sfxGain || sys.sfxGain.gain.value <= 0) return;
  if (sys.ctx.state === 'suspended') {
  sys.ctx.resume().catch(() => {});
}
  try {
    const ctx = sys.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (pitchEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, pitchEnd), t + duration);
    }
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(sys.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  } catch {}
}

export function playSoundShoot(sys: AudioSystem) {
  playSfxTone(sys, 900 + Math.random() * 200, 0.07, 'square', 0.12, 400);
}

export function playSoundHit(sys: AudioSystem) {
  playSfxTone(sys, 550 + Math.random() * 400, 0.16, 'triangle', 0.2, 200);
}

/** Distinct crisp pop sound when a bird target is destroyed */
export function playSoundBirdPop(sys: AudioSystem) {
  if (!sys.ctx || !sys.sfxGain || sys.sfxGain.gain.value <= 0) return;
  if (sys.ctx.state === 'suspended') {
    sys.ctx.resume().catch(() => {});
  }
  try {
    const ctx = sys.ctx;
    const t = ctx.currentTime;

    // Resonant bubble/balloon pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(780 + Math.random() * 120, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.11);

    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    osc.connect(gain);
    gain.connect(sys.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);

    // High harmonic click
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1600, t);
    clickOsc.frequency.exponentialRampToValueAtTime(300, t + 0.04);
    clickGain.gain.setValueAtTime(0.18, t);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    clickOsc.connect(clickGain);
    clickGain.connect(sys.sfxGain);
    clickOsc.start(t);
    clickOsc.stop(t + 0.05);
  } catch {}
}

/** Soft tick sound for accuracy streak increment */
export function playSoundHudTick(sys: AudioSystem) {
  playSfxTone(sys, 1350 + Math.random() * 80, 0.03, 'sine', 0.08, 1600);
}

/** Distinct bright chime ding when combo multiplier shifts */
export function playSoundComboDing(sys: AudioSystem, multiplier = 2) {
  const base = Math.min(1800, 880 + (multiplier - 1) * 110);
  playSfxTone(sys, base, 0.22, 'sine', 0.22);
  setTimeout(() => playSfxTone(sys, base * 1.5, 0.28, 'sine', 0.18), 35);
}

export function playSoundEscape(sys: AudioSystem) {
  playSfxTone(sys, 160, 0.35, 'sawtooth', 0.15, 80);
}

export function playSoundCombo(sys: AudioSystem) {
  playSfxTone(sys, 523.25, 0.12, 'sine', 0.15);
  setTimeout(() => playSfxTone(sys, 659.25, 0.15, 'sine', 0.18), 60);
  setTimeout(() => playSfxTone(sys, 783.99, 0.22, 'sine', 0.2), 120);
}

export function playSoundBonusPlane(sys: AudioSystem) {
  playSfxTone(sys, 659.25, 0.15, 'sine', 0.2);
  setTimeout(() => playSfxTone(sys, 880.0, 0.18, 'sine', 0.22), 80);
  setTimeout(() => playSfxTone(sys, 1046.5, 0.3, 'sine', 0.25), 160);
}

export function playSoundDangerPenalty(sys: AudioSystem, percent: number) {
  playSfxTone(sys, percent === 50 ? 180 : 260, 0.35, 'sawtooth', 0.28, 90);
  setTimeout(() => playSfxTone(sys, 140, 0.4, 'sawtooth', 0.3, 60), 100);
}

export function playSoundGameOver(sys: AudioSystem) {
  playSfxTone(sys, 150, 0.6, 'sawtooth', 0.2, 50);
}

export function playSoundChomp(sys: AudioSystem) {
  playSfxTone(sys, 230, 0.1, 'sawtooth', 0.24, 85);
  setTimeout(() => playSfxTone(sys, 160, 0.12, 'square', 0.22, 60), 50);
}

export function playSoundUfoSpawn(sys: AudioSystem) {
  playSfxTone(sys, 440, 0.2, 'sine', 0.25, 880);
  setTimeout(() => playSfxTone(sys, 880, 0.25, 'triangle', 0.28, 440), 90);
  setTimeout(() => playSfxTone(sys, 660, 0.3, 'sine', 0.25, 1320), 180);
}

export function playSoundUfoEmp(sys: AudioSystem) {
  playSfxTone(sys, 220, 0.4, 'sawtooth', 0.35, 45);
  setTimeout(() => playSfxTone(sys, 120, 0.5, 'square', 0.3, 30), 120);
  setTimeout(() => playSfxTone(sys, 90, 0.6, 'sawtooth', 0.25, 20), 240);
}

export function playSoundUfoExplode(sys: AudioSystem) {
  playSfxTone(sys, 1200, 0.15, 'sine', 0.3, 200);
  setTimeout(() => playSfxTone(sys, 600, 0.2, 'triangle', 0.35, 80), 80);
  setTimeout(() => playSfxTone(sys, 250, 0.4, 'sawtooth', 0.4, 40), 160);
}

export function playSoundCriticalHit(sys: AudioSystem) {
  playSfxTone(sys, 1046.5, 0.1, 'sine', 0.35, 1568);
  setTimeout(() => playSfxTone(sys, 1568.0, 0.2, 'triangle', 0.4, 2093), 60);
}

export function playSoundPowerUpSpawn(sys: AudioSystem) {
  playSfxTone(sys, 587.33, 0.15, 'triangle', 0.2, 880);
  setTimeout(() => playSfxTone(sys, 880, 0.2, 'sine', 0.25, 1174), 70);
}

export function playSoundPowerUpCollect(sys: AudioSystem) {
  playSfxTone(sys, 523.25, 0.1, 'sine', 0.25);
  setTimeout(() => playSfxTone(sys, 659.25, 0.12, 'sine', 0.28), 70);
  setTimeout(() => playSfxTone(sys, 783.99, 0.14, 'sine', 0.3), 140);
  setTimeout(() => playSfxTone(sys, 1046.5, 0.25, 'sine', 0.35), 210);
}

export function playSoundExtraLife(sys: AudioSystem) {
  playSfxTone(sys, 523.25, 0.12, 'sine', 0.22);
  setTimeout(() => playSfxTone(sys, 659.25, 0.14, 'sine', 0.25), 90);
  setTimeout(() => playSfxTone(sys, 783.99, 0.16, 'sine', 0.28), 180);
  setTimeout(() => playSfxTone(sys, 1046.5, 0.35, 'sine', 0.32), 270);
}

export function playSoundSabotageAlert(sys: AudioSystem) {
  playSfxTone(sys, 880, 0.15, 'sawtooth', 0.35, 440);
  setTimeout(() => playSfxTone(sys, 880, 0.15, 'sawtooth', 0.35, 440), 160);
  setTimeout(() => playSfxTone(sys, 880, 0.25, 'sawtooth', 0.4, 440), 320);
}

export function playSoundStreakMilestone(sys: AudioSystem, streak: number) {
  const baseFreq = Math.min(1200, 523.25 + (streak / 5) * 80);
  playSfxTone(sys, baseFreq, 0.1, 'sine', 0.25);
  setTimeout(() => playSfxTone(sys, baseFreq * 1.25, 0.12, 'triangle', 0.28), 65);
  setTimeout(() => playSfxTone(sys, baseFreq * 1.5, 0.18, 'sine', 0.3), 130);
  if (streak >= 15) {
    setTimeout(() => playSfxTone(sys, baseFreq * 2.0, 0.25, 'sine', 0.35), 200);
  }
}


// Background Music Synthesizer
export function startBackgroundMusic(sys: AudioSystem, musicVol: number) {
  if (sys.musicTimer || !sys.ctx || !sys.musicGain) return;
  updateMusicVolume(sys, musicVol, 0.08);

  const chords = [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7
    [220.0, 261.63, 329.63, 493.88],  // Am9
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [196.0, 261.63, 293.66, 392.0],  // Gsus4
  ];

  const melodyTones = [
    523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 493.88, 523.25,
    659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25, 493.88,
  ];

  sys.musicStep = 0;

  const tick = () => {
    if (!sys.ctx || !sys.musicGain || sys.musicGain.gain.value <= 0) return;
    const ctx = sys.ctx;
    const t = ctx.currentTime;
    const step = sys.musicStep;

    const chordIdx = Math.floor((step / 4) % chords.length);
    const chord = chords[chordIdx];

    if (step % 4 === 0) {
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(850, t);

        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t);

        // User volume is applied once at musicGain, not again per oscillator.
        const vol = i === 0 ? 0.04 : 0.02;
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(sys.musicGain!);

        osc.start(t);
        osc.stop(t + 1.85);
      });
    }

    const noteFreq = melodyTones[step % melodyTones.length];
    const mOsc = ctx.createOscillator();
    const mGain = ctx.createGain();
    mOsc.type = 'sine';
    mOsc.frequency.setValueAtTime(noteFreq, t);

    const mVol = 0.025;
    mGain.gain.setValueAtTime(0.001, t);
    mGain.gain.linearRampToValueAtTime(mVol, t + 0.05);
    mGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

    mOsc.connect(mGain);
    mGain.connect(sys.musicGain!);
    mOsc.start(t);
    mOsc.stop(t + 0.6);

    sys.musicStep++;
  };

  tick();
  sys.musicTimer = setInterval(tick, 420);
}

export function stopBackgroundMusic(sys: AudioSystem) {
  if (sys.musicTimer) {
    clearInterval(sys.musicTimer);
    sys.musicTimer = null;
  }
}
