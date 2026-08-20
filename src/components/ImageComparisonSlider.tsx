/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Sun, Moon } from 'lucide-react';

interface ImageComparisonSliderProps {
  dayImage: string;
  nightImage: string;
}

export function ImageComparisonSlider({ dayImage, nightImage }: ImageComparisonSliderProps) {
  const [sliderPos, setSliderPos] = useState(50); // percentage (0 - 100)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPos(Number(e.target.value));
  };

  return (
    <div className="relative w-full aspect-4/3 overflow-hidden border border-sage-primary/25 bg-paper-dark group select-none rounded-xs shadow-xs">
      {/* Day Image (Background) */}
      <img
        src={dayImage}
        alt="UCL Green Wall - Day View"
        className="absolute inset-0 w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      
      {/* Day visual label (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-10 bg-paper-sheet/95 text-ink-charcoal px-2 py-1 text-[9px] font-mono tracking-widest flex items-center gap-1 border border-sage-primary/10">
        <Sun size={10} className="text-amber-600" />
        DAYTIME
      </div>

      {/* Night Image (Foreground container using clipPath to prevent any squeezing or distortion) */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
      >
        <img
          src={nightImage}
          alt="UCL Green Wall - Night View"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Night visual label (Bottom Left) */}
      <div 
        className="absolute bottom-4 left-4 z-10 bg-ink-charcoal/80 text-paper-bg px-2 py-1 text-[9px] font-mono tracking-widest flex items-center gap-1 pointer-events-none"
        style={{ opacity: sliderPos > 15 ? 1 : 0, transition: 'opacity 0.2s' }}
      >
        <Moon size={10} />
        NIGHTTIME
      </div>

      {/* Custom Slider Handle/Bar */}
      <div 
        className="absolute inset-y-0 z-20 pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        {/* Fine vertical line */}
        <div className="absolute inset-y-0 -left-[1px] w-[2px] bg-white/60 shadow-xs" />
        
        {/* Drag handle styled nicely with twin vertical lines from the design */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 rounded-full bg-paper-sheet border border-sage-primary/30 flex items-center justify-center shadow-md text-sage-primary group-hover:scale-105 transition-transform">
          <div className="flex space-x-1">
            <div className="w-0.5 h-3 bg-sage-primary/60"></div>
            <div className="w-0.5 h-3 bg-sage-primary/60"></div>
          </div>
        </div>
      </div>

      {/* Transparent Overlay Range input that controls the state */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPos}
        onChange={handleSliderChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
      />
    </div>
  );
}
