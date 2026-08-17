import { WeatherType, PowerUpType, PowerUpEntity, ActivePowerUp } from '../types';

export interface EntityTypeConfig {
  type: 'bird' | 'plane' | 'hazard_25' | 'skull_50' | 'ufo';
  name: string;
  radius: number;
  speed: number;
  points: number;
  hp: number;
  color: string;
  light: string;
  head: string;
  wing: string;
  tail: string;
  beak: string;
  legs: string;
  pattern: 'sine' | 'zigzag' | 'straight' | 'wave' | 'plane_straight' | 'ufo_orbit' | 'parabolic_dive';
  isDangerous?: boolean;
  isBonus?: boolean;
  isUfo?: boolean;
  isRare?: boolean;
  penaltyPercent?: number;
}

// Scaled scoring with dedicated point balance
export const entityConfigs: Record<string, EntityTypeConfig> = {
  normal: {
    type: 'bird',
    name: 'Normal Bird',
    radius: 20,
    speed: 85,
    points: 10,
    hp: 1,
    color: '#f59e0b',
    light: '#fde68a',
    head: '#f59e0b',
    wing: '#fbbf24',
    tail: '#d97706',
    beak: '#ea580c',
    legs: '#78350f',
    pattern: 'sine',
  },
  fast: {
    type: 'bird',
    name: 'Swift Bird',
    radius: 17,
    speed: 125,
    points: 20,
    hp: 1,
    color: '#f43f5e',
    light: '#fecdd3',
    head: '#f43f5e',
    wing: '#fb7185',
    tail: '#be123c',
    beak: '#f59e0b',
    legs: '#881337',
    pattern: 'straight',
  },
  small: {
    type: 'bird',
    name: 'Humming Bird',
    radius: 13,
    speed: 105,
    points: 35,
    hp: 1,
    color: '#10b981',
    light: '#a7f3d0',
    head: '#059669',
    wing: '#34d399',
    tail: '#047857',
    beak: '#fbbf24',
    legs: '#064e3b',
    pattern: 'zigzag',
    isBonus: true,
  },
  large: {
    type: 'bird',
    name: 'Heavy Falcon',
    radius: 30,
    speed: 70,
    points: 25,
    hp: 1,
    color: '#8b5cf6',
    light: '#ddd6fe',
    head: '#7c3aed',
    wing: '#a78bfa',
    tail: '#6d28d9',
    beak: '#f97316',
    legs: '#4c1d95',
    pattern: 'sine',
  },
  dive_bomber: {
    type: 'bird',
    name: 'Dive Bomber',
    radius: 19,
    speed: 180,
    points: 30,
    hp: 1,
    color: '#ea580c',
    light: '#ffedd5',
    head: '#9a3412',
    wing: '#f97316',
    tail: '#7c2d12',
    beak: '#facc15',
    legs: '#431407',
    pattern: 'parabolic_dive',
  },
  rare: {
    type: 'bird',
    name: 'Golden Phoenix',
    radius: 25,
    speed: 250, // Flies twice as fast as fast birds (125 * 2)
    points: 300, // Massive point bonus!
    hp: 1,
    color: '#eab308',
    light: '#fef08a',
    head: '#ca8a04',
    wing: '#fde047',
    tail: '#b45309',
    beak: '#f97316',
    legs: '#854d0e',
    pattern: 'wave',
    isBonus: true,
    isRare: true,
  },
  golden_phoenix: {
    type: 'bird',
    name: 'Golden Phoenix',
    radius: 25,
    speed: 250, // Flies twice as fast as fast birds (125 * 2)
    points: 300, // Massive point bonus!
    hp: 1,
    color: '#eab308',
    light: '#fef08a',
    head: '#ca8a04',
    wing: '#fde047',
    tail: '#b45309',
    beak: '#f97316',
    legs: '#854d0e',
    pattern: 'wave',
    isBonus: true,
    isRare: true,
  },
  armored: {
    type: 'bird',
    name: 'Armored Bird',
    radius: 26,
    speed: 80,
    points: 120, // Scaled 5:1 (600 -> 120)
    hp: 2,
    color: '#475569',
    light: '#94a3b8',
    head: '#334155',
    wing: '#64748b',
    tail: '#1e293b',
    beak: '#eab308',
    legs: '#0f172a',
    pattern: 'sine',
  },
  hazard_25: {
    type: 'hazard_25',
    name: 'Hazard Bird (-1 Heart)',
    radius: 21,
    speed: 110,
    points: 0,
    hp: 1,
    color: '#eab308',
    light: '#fde047',
    head: '#171717',
    wing: '#eab308',
    tail: '#171717',
    beak: '#ef4444',
    legs: '#171717',
    pattern: 'zigzag',
    isDangerous: true,
  },
  skull_50: {
    type: 'skull_50',
    name: 'Cursed Raven (-1 Heart)',
    radius: 24,
    speed: 100,
    points: 0,
    hp: 1,
    color: '#831843',
    light: '#be185d',
    head: '#1e1b4b',
    wing: '#4c0519',
    tail: '#000000',
    beak: '#f8fafc',
    legs: '#0f172a',
    pattern: 'wave',
    isDangerous: true,
  },
  plane: {
    type: 'plane',
    name: 'Bonus Aeroplane',
    radius: 29,
    speed: 110,
    points: 100, // Scaled 5:1 (500 -> 100)
    hp: 1,
    color: '#ffffff',
    light: '#f8fafc',
    head: '#3b82f6',
    wing: '#ef4444',
    tail: '#2563eb',
    beak: '#ffffff',
    legs: '#1e293b',
    pattern: 'plane_straight',
    isBonus: true,
  },
  ufo: {
    type: 'ufo',
    name: 'Alien UFO Saucer',
    radius: 27, // Reduced by 20% from 34
    speed: 125,
    points: 200, // Scaled 5:1 (1000 -> 200)
    hp: 1,
    color: '#06b6d4',
    light: '#a5f3fc',
    head: '#22c55e',
    wing: '#67e8f9',
    tail: '#0891b2',
    beak: '#a855f7',
    legs: '#0f172a',
    pattern: 'ufo_orbit',
    isBonus: true,
    isUfo: true,
  },
};

// USER INSTRUCTION: Keep difficulty level as per birds hunted, the more birds hunted the more difficult!
export function getDifficultyFactor(birdsHunted: number): number {
  if (birdsHunted <= 0) return 0;
  if (birdsHunted >= 80) return 1.0;
  if (birdsHunted <= 15) {
    // Warm-up curve: 0 to 15 birds hunted scales from 0 to 0.25
    return (birdsHunted / 15) * 0.25;
  } else if (birdsHunted <= 40) {
    // Intermediate curve: 15 to 40 birds hunted scales from 0.25 to 0.65
    return 0.25 + ((birdsHunted - 15) / 25) * 0.40;
  } else {
    // Expert curve: 40 to 80 birds hunted scales to 1.0
    return 0.65 + ((birdsHunted - 40) / 40) * 0.35;
  }
}

// Weather Particle Cycle Manager
export function updateWeatherCycle(
  dt: number,
  g: any,
  onWeatherChange: (w: WeatherType) => void
) {
  g.weatherTimer += dt;
  const cyclePeriod = 30; // 30s clear -> 30s rain -> 30s drizzle -> 30s snow
  const phase = Math.floor((g.weatherTimer / cyclePeriod) % 4);
  const targetWeather: WeatherType =
    phase === 0 ? 'clear' : phase === 1 ? 'rain' : phase === 2 ? 'drizzle' : 'snow';

  if (g.weather !== targetWeather) {
    g.weather = targetWeather;
    onWeatherChange(targetWeather);
  }

  // Populate weather particles
  if (g.weather !== 'clear') {
    const maxParticles = g.weather === 'rain' ? 65 : g.weather === 'snow' ? 45 : 35;
    while (g.weatherParticles.length < maxParticles) {
      g.weatherParticles.push({
        x: Math.random() * (g.width + 60) - 30,
        y: Math.random() * -40,
        vx: g.weather === 'snow' ? (Math.random() - 0.5) * 25 : -25 - Math.random() * 20,
        vy: g.weather === 'rain' ? 380 + Math.random() * 120 : g.weather === 'snow' ? 55 + Math.random() * 35 : 220 + Math.random() * 80,
        size: g.weather === 'snow' ? 2 + Math.random() * 3 : 1.5,
        length: g.weather === 'rain' ? 14 + Math.random() * 10 : g.weather === 'drizzle' ? 8 + Math.random() * 5 : 0,
        alpha: 0.3 + Math.random() * 0.45,
        wobble: Math.random() * Math.PI * 2,
        type: g.weather,
      });
    }
  }

  // Update existing particles
  for (const wp of g.weatherParticles) {
    wp.y += wp.vy * dt;
    wp.x += wp.vx * dt;
    if (wp.type === 'snow') {
      wp.wobble += dt * 3;
      wp.x += Math.sin(wp.wobble) * 18 * dt;
    }
  }

  // Filter offscreen particles
  g.weatherParticles = g.weatherParticles.filter(
    (wp: any) => wp.y < g.height + 40 && wp.x > -60 && wp.x < g.width + 60
  );
}

// Draw Weather Atmosphere & Particles
export function drawWeatherAtmosphere(ctx: CanvasRenderingContext2D, g: any) {
  if (g.weather === 'clear') return;

  ctx.save();
  // Soft ambient weather mist
  if (g.weather === 'rain' || g.weather === 'drizzle') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.fillRect(0, 0, g.width, g.height);
  } else if (g.weather === 'snow') {
    ctx.fillStyle = 'rgba(240, 249, 255, 0.09)';
    ctx.fillRect(0, 0, g.width, g.height);
  }

  // Draw raindrops or snowflakes
  for (const wp of g.weatherParticles) {
    ctx.globalAlpha = wp.alpha;
    if (wp.type === 'snow') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = wp.size;
      ctx.beginPath();
      ctx.moveTo(wp.x, wp.y);
      ctx.lineTo(wp.x - 4, wp.y + wp.length);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Draw Floating Power-Up Capsules
export function drawPowerUpCapsules(ctx: CanvasRenderingContext2D, powerUps: PowerUpEntity[]) {
  for (const p of powerUps) {
    if (p.collected) continue;
    ctx.save();
    ctx.translate(p.x, p.y + Math.sin(p.bobPhase) * 4);

    // Glowing Halo
    const glowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, p.radius + 8);
    const glowColor =
      p.type === 'slow_mo' ? 'rgba(56, 189, 248, 0.8)' : p.type === 'multi_shot' ? 'rgba(234, 88, 12, 0.8)' : 'rgba(16, 185, 129, 0.8)';
    glowGrad.addColorStop(0, glowColor);
    glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 8, 0, Math.PI * 2);
    ctx.fill();

    // Capsule Body
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = p.type === 'slow_mo' ? '#0284c7' : p.type === 'multi_shot' ? '#ea580c' : '#059669';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Icon representation
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.type === 'slow_mo' ? '⏱️' : p.type === 'multi_shot' ? '🎯' : '🛡️', 0, 1);

    ctx.restore();
  }
}
