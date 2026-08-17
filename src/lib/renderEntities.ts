import type { EntityTypeConfig } from './gameLogic';

import aeroplaneImg from '../assets/game/aeroplane.webp';
import birdArmoredImg from '../assets/game/bird-armored.webp';
import birdDangerImg from '../assets/game/bird-danger.webp';
import birdFastImg from '../assets/game/bird-fast.webp';
import birdLargeImg from '../assets/game/bird-large.webp';
import birdNormalImg from '../assets/game/bird-normal.webp';
import birdRareImg from '../assets/game/bird-rare.webp';
import birdSmallImg from '../assets/game/bird-small.webp';

export interface RenderEntity {
  key: string;
  radius: number;
  dir: number;
  hp?: number;
  maxHp?: number;
  wingPhase?: number;
  isDangerous?: boolean;
  type: EntityTypeConfig;
}

// Preload and cache sprites
const spriteSources: Record<string, string> = {
  plane: aeroplaneImg,
  armored: birdArmoredImg,
  hazard_25: birdDangerImg,
  skull_50: birdDangerImg,
  fast: birdFastImg,
  dive_bomber: birdFastImg,
  large: birdLargeImg,
  normal: birdNormalImg,
  rare: birdRareImg,
  golden_phoenix: birdRareImg,
  small: birdSmallImg,
};

const spriteCache: Record<string, HTMLImageElement> = {};

if (typeof window !== 'undefined') {
  for (const [key, src] of Object.entries(spriteSources)) {
    const img = new Image();
    img.src = src;
    spriteCache[key] = img;
  }
}

function faceTravelDirection(ctx: CanvasRenderingContext2D, entity: RenderEntity) {
  // If moving left (dir < 0), flip horizontally so head points in travel direction
  if (entity.dir < 0) {
    ctx.scale(-1, 1);
  }
}

/** Render stylized aeroplane with smooth propeller/jet trail */
export function drawDetailedAeroplane(
  ctx: CanvasRenderingContext2D,
  entity: RenderEntity,
  elapsed: number
) {
  const r = entity.radius;
  ctx.save();
  faceTravelDirection(ctx, entity);

  const img = spriteCache.plane;
  if (img && img.complete && img.naturalWidth > 0) {
    const drawW = r * 2.8;
    const drawH = r * 2.0;

    // Jet contrail behind plane
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(elapsed * 20) * 0.2;
    const trailGrad = ctx.createLinearGradient(-drawW * 0.55, 0, -drawW * 0.9, 0);
    trailGrad.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
    trailGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = trailGrad;
    ctx.fillRect(-drawW * 0.9, -r * 0.15, drawW * 0.45, r * 0.3);
    ctx.restore();

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    // Canvas vector fallback
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = Math.max(2, r * 0.09);
    ctx.beginPath();
    ctx.moveTo(-r * 1.45, r * 0.2);
    ctx.lineTo(r * 1.25, r * 0.2);
    ctx.quadraticCurveTo(r * 1.65, 0, r * 1.2, -r * 0.2);
    ctx.lineTo(-r * 1.2, -r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, -r * 0.12);
    ctx.lineTo(r * 0.25, -r * 0.95);
    ctx.lineTo(r * 0.65, -r * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, r * 0.12);
    ctx.lineTo(r * 0.2, r * 0.9);
    ctx.lineTo(r * 0.65, r * 0.08);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-r * 1.25, -r * 0.62, r * 0.28, r * 0.62);
  }

  // Bonus star badge above plane
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('+100', 0, -r * 0.9);

  ctx.restore();
}

/** Render bird sprite or high-polish vector canvas fallback */
export function drawDetailedBird(
  ctx: CanvasRenderingContext2D,
  entity: RenderEntity,
  elapsed: number
) {
  const r = entity.radius;
  const config = entity.type;
  const flap = Math.sin(elapsed * 12 + (entity.wingPhase || 0));

  ctx.save();
  faceTravelDirection(ctx, entity);
  ctx.rotate(flap * 0.04);

  const img = spriteCache[entity.key];

  if (img && img.complete && img.naturalWidth > 0) {
    const drawSize = r * 2.5;

    // Wing flap bobbing
    const offsetY = flap * (r * 0.08);

    // Rare Phoenix Golden Glow
    if (entity.key === 'rare' || entity.key === 'golden_phoenix') {
      ctx.save();
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 18 + Math.sin(elapsed * 10) * 8;
      ctx.drawImage(img, -drawSize / 2, -drawSize / 2 + offsetY, drawSize, drawSize);
      ctx.restore();

      // Golden Phoenix Bonus Indicator
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨ +300 PTS', 0, -r * 1.15);
    } else if (entity.key === 'dive_bomber') {
      ctx.save();
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 12 + Math.sin(elapsed * 14) * 4;
      ctx.drawImage(img, -drawSize / 2, -drawSize / 2 + offsetY, drawSize, drawSize);
      ctx.restore();

      // Swoop indicator
      ctx.fillStyle = '#ea580c';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ DIVE', 0, -r * 1.1);
    } else if (entity.isDangerous) {
      ctx.save();
      ctx.shadowColor = entity.key === 'skull_50' ? '#ef4444' : '#f97316';
      ctx.shadowBlur = 12 + Math.sin(elapsed * 10) * 4;
      ctx.drawImage(img, -drawSize / 2, -drawSize / 2 + offsetY, drawSize, drawSize);
      ctx.restore();
    } else {
      ctx.drawImage(img, -drawSize / 2, -drawSize / 2 + offsetY, drawSize, drawSize);
    }

    // Armored Bird Metal Shield Overlay when HP > 1
    if (entity.key === 'armored' && (entity.hp ?? 1) > 1) {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.95)';
      ctx.lineWidth = Math.max(3, r * 0.16);
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, offsetY, r * 0.9, -1.2, 1.2);
      ctx.stroke();

      // Armor badge
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️ 2HP', 0, -r * 1.15);
    }
  } else {
    // High polish vector fallback
    // Tail
    ctx.fillStyle = config.tail;
    ctx.beginPath();
    ctx.moveTo(-r * 0.72, 0);
    ctx.lineTo(-r * 1.35, -r * 0.48);
    ctx.lineTo(-r * 1.15, r * 0.42);
    ctx.closePath();
    ctx.fill();

    // Body and head
    ctx.fillStyle = config.color;
    ctx.strokeStyle = entity.isDangerous ? '#7f1d1d' : 'rgba(15, 23, 42, 0.55)';
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath();
    ctx.ellipse(-r * 0.08, 0, r, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = config.head;
    ctx.beginPath();
    ctx.arc(r * 0.62, -r * 0.18, r * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = config.wing;
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, flap * r * 0.15, r * 0.62, r * (0.25 + Math.abs(flap) * 0.18), -0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = config.beak;
    ctx.beginPath();
    ctx.moveTo(r * 1.03, -r * 0.22);
    ctx.lineTo(r * 1.5, -r * 0.05);
    ctx.lineTo(r * 1.03, r * 0.05);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(r * 0.72, -r * 0.31, Math.max(2, r * 0.08), 0, Math.PI * 2);
    ctx.fill();

    if (entity.key === 'armored' && (entity.hp ?? 0) > 1) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = Math.max(3, r * 0.16);
      ctx.beginPath();
      ctx.arc(-r * 0.08, 0, r * 0.72, -1.1, 1.1);
      ctx.stroke();
    } else if (entity.isDangerous) {
      ctx.strokeStyle = '#fef2f2';
      ctx.lineWidth = Math.max(2, r * 0.1);
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, -r * 0.3);
      ctx.lineTo(r * 0.15, r * 0.3);
      ctx.moveTo(r * 0.15, -r * 0.3);
      ctx.lineTo(-r * 0.35, r * 0.3);
      ctx.stroke();
    }
  }

  ctx.restore();
}

