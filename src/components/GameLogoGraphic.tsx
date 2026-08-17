import React from 'react';
import birdNormalImg from '../assets/game/bird-normal.webp';
import birdRareImg from '../assets/game/bird-rare.webp';

export function GameLogoGraphic({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Glow Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-orange-500/25 to-sky-400/20 rounded-full blur-xl transform scale-110 pointer-events-none" />

      {/* Main Logo Composition */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Mascot Center with Crosshair & Wings */}
        <div className="relative flex items-center justify-center mb-1">
          {/* Target Reticle Circular Aura */}
          <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-dashed border-amber-400/40 animate-[spin_12s_linear_infinite]" />
          <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-sky-400/50 bg-gradient-to-br from-sky-400/20 via-indigo-600/10 to-amber-500/20 shadow-inner" />

          {/* Crosshair accents */}
          <div className="absolute w-32 sm:w-36 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <div className="absolute h-32 sm:h-36 w-[2px] bg-gradient-to-b from-transparent via-amber-400/60 to-transparent" />

          {/* Left Wing / Phoenix accent */}
          <img
            src={birdRareImg}
            alt="Golden Phoenix"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain opacity-70 transform -translate-x-8 -translate-y-2 -rotate-12 drop-shadow-md pointer-events-none"
          />

          {/* Central Bluebird Mascot */}
          <div className="relative z-20 transform hover:scale-105 transition-transform">
            <img
              src={birdNormalImg}
              alt="Shoot The Bird Mascot"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_8px_16px_rgba(15,40,64,0.3)] animate-bounce"
            />
            {/* Sparkle badge */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 items-center justify-center text-[8px] text-white font-black">✦</span>
            </span>
          </div>

          {/* Right Bird Accent */}
          <img
            src={birdNormalImg}
            alt="Bird Wing"
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain opacity-60 transform translate-x-8 translate-y-1 rotate-12 scale-x-[-1] drop-shadow-md pointer-events-none"
          />
        </div>

        {/* 3D Stylized Title Banner */}
        <div className="relative text-center mt-0.5">
          {/* Stylized Main Typography */}
          <div className="relative inline-block">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0f283d] drop-shadow-sm font-sans uppercase">
              <span className="bg-gradient-to-b from-amber-400 via-orange-500 to-rose-600 bg-clip-text text-transparent filter drop-shadow-[0_2px_4px_rgba(249,115,22,0.4)]">
                SHOOT
              </span>{' '}
              <span className="text-[#0f283d]">THE</span>{' '}
              <span className="bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-700 bg-clip-text text-transparent filter drop-shadow-[0_2px_4px_rgba(37,99,235,0.3)]">
                BIRD
              </span>
            </h1>
          </div>

          {/* Arcade Sub-Ribbon Badge */}
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="h-[1px] w-6 sm:w-8 bg-gradient-to-r from-transparent to-amber-400/80"></span>
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-[9px] sm:text-[10px] tracking-widest uppercase shadow-xs">
              ⚡ ARCADE EDITION ⚡
            </span>
            <span className="h-[1px] w-6 sm:w-8 bg-gradient-to-l from-transparent to-amber-400/80"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
