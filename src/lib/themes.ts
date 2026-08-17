import { BackgroundThemeType } from '../types';

export interface ThemeConfig {
  id: BackgroundThemeType;
  name: string;
  badge: string;
  minScore: number;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  sunMoonType: 'sun' | 'sunset_sun' | 'moon' | 'aurora_moon';
  sunColor: string;
  sunGlow: string;
  hillsBack: string;
  hillsFront: string;
  cloudColor: string;
  cloudAlpha: number;
  starsAlpha: number;
  hasAurora: boolean;
  mountainStyle: 'hills' | 'dusk_ridges' | 'night_mountains' | 'snowy_peaks';
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'day',
    name: 'Azure Day',
    badge: '☀️ Azure Day',
    minScore: 0,
    skyTop: '#38bdf8',
    skyMid: '#60a5fa',
    skyBottom: '#2563eb',
    sunMoonType: 'sun',
    sunColor: '#fffbeb',
    sunGlow: 'rgba(255, 255, 255, 0.45)',
    hillsBack: 'rgba(22, 163, 74, 0.35)',
    hillsFront: 'rgba(21, 128, 61, 0.55)',
    cloudColor: '#ffffff',
    cloudAlpha: 0.88,
    starsAlpha: 0,
    hasAurora: false,
    mountainStyle: 'hills',
  },
  {
    id: 'sunset',
    name: 'Crimson Sunset',
    badge: '🌅 Sunset Glow',
    minScore: 1200, // Or elapsed > 25s
    skyTop: '#f97316',
    skyMid: '#db2777',
    skyBottom: '#4c1d95',
    sunMoonType: 'sunset_sun',
    sunColor: '#ffedd5',
    sunGlow: 'rgba(251, 146, 60, 0.65)',
    hillsBack: 'rgba(109, 40, 217, 0.45)',
    hillsFront: 'rgba(76, 29, 149, 0.65)',
    cloudColor: '#fecdd3',
    cloudAlpha: 0.82,
    starsAlpha: 0.15,
    hasAurora: false,
    mountainStyle: 'dusk_ridges',
  },
  {
    id: 'night',
    name: 'Starry Cosmic Night',
    badge: '🌌 Starry Night',
    minScore: 3500, // Or elapsed > 55s
    skyTop: '#020617',
    skyMid: '#0f172a',
    skyBottom: '#1e1b4b',
    sunMoonType: 'moon',
    sunColor: '#f8fafc',
    sunGlow: 'rgba(224, 231, 255, 0.35)',
    hillsBack: 'rgba(30, 27, 75, 0.6)',
    hillsFront: 'rgba(15, 23, 42, 0.85)',
    cloudColor: '#94a3b8',
    cloudAlpha: 0.45,
    starsAlpha: 0.95,
    hasAurora: false,
    mountainStyle: 'night_mountains',
  },
  {
    id: 'snow',
    name: 'Snowy Mountain Aurora',
    badge: '🏔️ Snowy Aurora',
    minScore: 7000, // Or elapsed > 85s
    skyTop: '#030712',
    skyMid: '#064e3b',
    skyBottom: '#0c4a6e',
    sunMoonType: 'aurora_moon',
    sunColor: '#e0f2fe',
    sunGlow: 'rgba(56, 189, 248, 0.45)',
    hillsBack: 'rgba(30, 41, 59, 0.75)',
    hillsFront: 'rgba(15, 23, 42, 0.92)',
    cloudColor: '#cbd5e1',
    cloudAlpha: 0.55,
    starsAlpha: 0.85,
    hasAurora: true,
    mountainStyle: 'snowy_peaks',
  },
];

export interface StarParticle {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  phase: number;
}

// Generate static twinkling star field
export function createStarField(count = 65, width = 600, height = 800): StarParticle[] {
  const stars: StarParticle[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * (height * 0.72),
      size: 0.8 + Math.random() * 2.2,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 1.5 + Math.random() * 3.5,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

// Helper to determine current theme based on score or duration
export function getCurrentThemeState(score: number, elapsed: number): {
  currentTheme: ThemeConfig;
  nextTheme: ThemeConfig;
  blend: number;
  themeIndex: number;
} {
  // Score progression or time progression (every ~35s or milestone)
  // Milestones: 0 -> Day, 1200 -> Sunset, 3500 -> Night, 7000 -> Snow
  let themeIndex = 0;
  let blend = 0;

  // Let score or elapsed time advance the cycle smoothly
  const effectiveMilestone = Math.max(score, elapsed * 50);

  if (effectiveMilestone < 1200) {
    themeIndex = 0;
    blend = Math.max(0, Math.min(1, effectiveMilestone / 1200));
  } else if (effectiveMilestone < 3500) {
    themeIndex = 1;
    blend = Math.max(0, Math.min(1, (effectiveMilestone - 1200) / 2300));
  } else if (effectiveMilestone < 7000) {
    themeIndex = 2;
    blend = Math.max(0, Math.min(1, (effectiveMilestone - 3500) / 3500));
  } else {
    // Cycles smoothly after 7000 every 6000 points
    const cycle = (effectiveMilestone - 7000) % 18000;
    if (cycle < 4500) {
      themeIndex = 3;
      blend = cycle / 4500;
    } else if (cycle < 9000) {
      themeIndex = 0;
      blend = (cycle - 4500) / 4500;
    } else if (cycle < 13500) {
      themeIndex = 1;
      blend = (cycle - 9000) / 4500;
    } else {
      themeIndex = 2;
      blend = (cycle - 13500) / 4500;
    }
  }

  const currentTheme = THEMES[themeIndex];
  const nextTheme = THEMES[(themeIndex + 1) % THEMES.length];

  return {
    currentTheme,
    nextTheme,
    blend,
    themeIndex,
  };
}

// Convert hex to rgb
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

// Lerp color helper
export function lerpColor(colorA: string, colorB: string, t: number): string {
  if (colorA.startsWith('#') && colorB.startsWith('#')) {
    const [r1, g1, b1] = hexToRgb(colorA);
    const [r2, g2, b2] = hexToRgb(colorB);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return t > 0.5 ? colorB : colorA;
}

// Main background canvas renderer
export function drawDynamicBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  score: number,
  elapsed: number,
  stars: StarParticle[]
) {
  const { currentTheme, nextTheme, blend } = getCurrentThemeState(score, elapsed);

  // 1. Sky Gradient
  const topCol = lerpColor(currentTheme.skyTop, nextTheme.skyTop, blend);
  const midCol = lerpColor(currentTheme.skyMid, nextTheme.skyMid, blend);
  const botCol = lerpColor(currentTheme.skyBottom, nextTheme.skyBottom, blend);

  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, topCol);
  skyGradient.addColorStop(0.55, midCol);
  skyGradient.addColorStop(1, botCol);

  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Stars (twinkling based on starsAlpha)
  const currentStarsAlpha = currentTheme.starsAlpha + (nextTheme.starsAlpha - currentTheme.starsAlpha) * blend;
  if (currentStarsAlpha > 0.02) {
    ctx.save();
    for (const star of stars) {
      const twinkle = Math.sin(elapsed * star.twinkleSpeed + star.phase);
      const alpha = Math.max(0, Math.min(1, (star.brightness + twinkle * 0.35) * currentStarsAlpha));
      if (alpha <= 0.01) continue;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x % width, star.y % (height * 0.72), star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. Aurora Borealis Waves (Snow theme)
  const auroraWeight = (currentTheme.hasAurora ? 1 - blend : 0) + (nextTheme.hasAurora ? blend : 0);
  if (auroraWeight > 0.05) {
    ctx.save();
    ctx.globalAlpha = auroraWeight * 0.42;

    for (let wave = 0; wave < 3; wave++) {
      const grad = ctx.createLinearGradient(0, 30 + wave * 40, width, 180 + wave * 50);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0)');
      grad.addColorStop(0.3, wave % 2 === 0 ? 'rgba(52, 211, 153, 0.7)' : 'rgba(56, 189, 248, 0.7)');
      grad.addColorStop(0.7, 'rgba(168, 85, 247, 0.55)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 80 + wave * 35);
      for (let x = 0; x <= width; x += 30) {
        const y = 80 + wave * 35 + Math.sin(x * 0.018 + elapsed * 0.8 + wave) * 35;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height * 0.5);
      ctx.lineTo(0, height * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 4. Sun or Moon
  const isNightOrSnow = currentTheme.id === 'night' || currentTheme.id === 'snow';
  const celestialX = width * 0.82;
  const celestialY = 75;

  ctx.save();
  if (isNightOrSnow) {
    // Radiant Crescent / Moon with Glow
    const moonGlow = ctx.createRadialGradient(celestialX, celestialY, 12, celestialX, celestialY, 95);
    moonGlow.addColorStop(0, 'rgba(240, 249, 255, 0.5)');
    moonGlow.addColorStop(1, 'rgba(240, 249, 255, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(celestialX, celestialY, 95, 0, Math.PI * 2);
    ctx.fill();

    // Moon Orb
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(celestialX, celestialY, 26, 0, Math.PI * 2);
    ctx.fill();

    // Crater Details
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.beginPath(); ctx.arc(celestialX - 8, celestialY - 6, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(celestialX + 6, celestialY + 8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(celestialX + 10, celestialY - 9, 4, 0, Math.PI * 2); ctx.fill();
  } else if (currentTheme.id === 'sunset') {
    // Sinking Warm Sunset Sun
    const sunGrad = ctx.createRadialGradient(celestialX - 30, celestialY + 40, 10, celestialX - 30, celestialY + 40, 130);
    sunGrad.addColorStop(0, 'rgba(254, 215, 170, 0.7)');
    sunGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.4)');
    sunGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(celestialX - 30, celestialY + 40, 130, 0, Math.PI * 2);
    ctx.fill();

    // Sun Disc
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(celestialX - 30, celestialY + 40, 32, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Bright Daytime Sun
    const sunGrad = ctx.createRadialGradient(celestialX, celestialY - 15, 10, celestialX, celestialY - 15, 140);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    sunGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.25)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(celestialX, celestialY - 15, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(celestialX, celestialY - 15, 26, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 5. Multi-Layered Parallax Scrolling Clouds (Tinted by Theme)
  const cloudAlpha = currentTheme.cloudAlpha + (nextTheme.cloudAlpha - currentTheme.cloudAlpha) * blend;
  const cloudColor = lerpColor(currentTheme.cloudColor, nextTheme.cloudColor, blend);

  ctx.save();
  ctx.fillStyle = cloudColor;

  // Layer 1: High distant clouds (slowest speed = 6px/s, soft low opacity, smaller scale)
  ctx.globalAlpha = cloudAlpha * 0.42;
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 180 + elapsed * 6) % (width + 260)) - 130;
    const cy = 32 + (i % 3) * 26;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 38, 11, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 18, cy - 2, 22, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 17, cy - 1, 23, 9, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, cy - 6, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layer 2: Mid-altitude clouds (medium speed = 14px/s, medium opacity)
  ctx.globalAlpha = cloudAlpha * 0.72;
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 210 + elapsed * 14) % (width + 280)) - 140;
    const cy = 60 + ((i * 2) % 3) * 36;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 54, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 26, cy - 3, 30, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 24, cy - 2, 32, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, cy - 9, 26, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layer 3: Lower drifting clouds (faster speed = 25px/s, full cloud opacity)
  ctx.globalAlpha = cloudAlpha * 0.95;
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 260 + elapsed * 25) % (width + 320)) - 160;
    const cy = 95 + (i % 2) * 30;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 66, 19, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 32, cy - 4, 38, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 30, cy - 3, 40, 17, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, cy - 11, 32, 17, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 6. Layered Mountain / Landscape Horizon
  const isSnowy = currentTheme.mountainStyle === 'snowy_peaks' || nextTheme.mountainStyle === 'snowy_peaks';

  // Back mountain ridge
  ctx.save();
  ctx.fillStyle = currentTheme.hillsBack;
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height - 70);
  for (let x = 0; x <= width; x += 40) {
    const yOffset = isSnowy
      ? Math.sin(x * 0.015 + 0.5) * 35 + ((x % 80 === 0) ? -25 : 0)
      : Math.sin(x * 0.018 + 0.8) * 26;
    ctx.lineTo(x, height - 60 + yOffset);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Front mountain / hills ridge
  ctx.save();
  ctx.fillStyle = currentTheme.hillsFront;
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height - 42);
  for (let x = 0; x <= width; x += 30) {
    const yOffset = isSnowy
      ? Math.sin(x * 0.022 + 1.4) * 22 + ((x % 60 === 0) ? -18 : 0)
      : Math.sin(x * 0.025 + 1.2) * 16;
    ctx.lineTo(x, height - 32 + yOffset);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // If snowy peaks, render snow caps on the crests
  if (isSnowy) {
    ctx.fillStyle = 'rgba(241, 245, 249, 0.78)';
    for (let x = 30; x <= width - 30; x += 60) {
      const peakY = height - 52 + Math.sin(x * 0.022 + 1.4) * 22 - 18;
      ctx.beginPath();
      ctx.moveTo(x, peakY);
      ctx.lineTo(x - 14, peakY + 18);
      ctx.lineTo(x, peakY + 13);
      ctx.lineTo(x + 14, peakY + 18);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}
