import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Sparkles, Activity, Sun, Moon, Info, HelpCircle } from 'lucide-react';
import { playBioSound } from '../lib/bioAudio';

// High Quality and Beautiful 100% accurate biological organism photos sourced directly from iNaturalist!
const ROBIN_IMG = 'https://static.inaturalist.org/photos/331946615/large.jpeg';
const BLUETIT_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/41677354/large.jpeg';
const GOLDFINCH_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/384965723/large.jpg';
const THRUSH_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/61267397/large.jpg';
const NIGHTINGALE_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/389920621/large.jpg';
const WREN_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/150980755/large.jpg';
const CHAFFINCH_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/151143058/large.jpg';
const BLACKBIRD_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/356885346/large.jpg';

const BAT_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/189395/large.jpg';
const TAWNYOWL_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/451350360/large.jpg';
const CRICKET_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/157317382/large.jpg';
const NIGHTJAR_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/1594673/large.jpg';
const BARNOWL_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/165796939/large.jpg';
const TOAD_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/607767964/large.jpg';
const BUSHCRICKET_IMG = 'https://static.inaturalist.org/photos/98388966/large.jpg';
const MOTH_IMG = 'https://inaturalist-open-data.s3.amazonaws.com/photos/67194061/large.jpeg';

interface ChimeSpecies {
  name: string;
  scientific: string;
  freqRange: string;
  color: string;
  desc: string;
  heightPct: number; // For physical chime rod sizing based on frequency!
  image?: string;
  peakTime: string;
  habitatNiche: string;
  peakHours: string; // Dynamic peak hours added for precise timing display
}

const DAY_SPECIES: ChimeSpecies[] = [
  { 
    name: 'European Robin', 
    scientific: 'Erithacus rubecula', 
    freqRange: '3.0 - 6.2 kHz', 
    color: '#ef4444', 
    desc: 'Melodic, sweet warbling whistling with high-pitch bursts.', 
    heightPct: 75,
    image: ROBIN_IMG,
    peakTime: 'Dawn & Dusk',
    peakHours: '04:00 - 08:00',
    habitatNiche: 'Low dense shrubbery & shaded ivy wall base'
  },
  { 
    name: 'Blue Tit', 
    scientific: 'Cyanistes caeruleus', 
    freqRange: '4.0 - 6.5 kHz', 
    color: '#3b82f6', 
    desc: 'High dual whistles followed by a rapid, laughing chattering trill.', 
    heightPct: 60,
    image: BLUETIT_IMG,
    peakTime: 'Morning',
    peakHours: '08:00 - 12:00',
    habitatNiche: 'High foliage canopy & climbing runners'
  },
  { 
    name: 'Goldfinch', 
    scientific: 'Carduelis carduelis', 
    freqRange: '2.9 - 6.0 kHz', 
    color: '#eab308', 
    desc: 'Liquid, bubbling, cheerful melodies jumping rapidly.', 
    heightPct: 68,
    image: GOLDFINCH_IMG,
    peakTime: 'Midday',
    peakHours: '10:00 - 14:00',
    habitatNiche: 'Topmost brick-cap flower beds'
  },
  { 
    name: 'Song Thrush', 
    scientific: 'Turdus philomelos', 
    freqRange: '3.0 - 4.2 kHz', 
    color: '#f97316', 
    desc: 'Repeating short, loud whistling statements of clear tone.', 
    heightPct: 82,
    image: THRUSH_IMG,
    peakTime: 'Dawn Chorus',
    peakHours: '04:00 - 07:30',
    habitatNiche: 'Thick perimeter timber support scaffolding'
  },
  { 
    name: 'Nightingale', 
    scientific: 'Luscinia megarhynchos', 
    freqRange: '1.3 - 4.6 kHz', 
    color: '#8b5cf6', 
    desc: 'Deep rich whistles leading to extremely fast, brilliant rhythmic chirrups.', 
    heightPct: 95,
    image: NIGHTINGALE_IMG,
    peakTime: 'Dusk & Night',
    peakHours: '19:00 - 23:30',
    habitatNiche: 'Deep horizontal root channels & moisture shields'
  },
  { 
    name: 'Eurasian Wren', 
    scientific: 'Troglodytes troglodytes', 
    freqRange: '2.6 - 5.8 kHz', 
    color: '#ec4899', 
    desc: 'Explosive, loud cascade of vibrating, high-speed musical trills.', 
    heightPct: 70,
    image: WREN_IMG,
    peakTime: 'Morning',
    peakHours: '06:00 - 10:00',
    habitatNiche: 'Lower brick gaps and moist structural crevices'
  },
  { 
    name: 'Chaffinch', 
    scientific: 'Fringilla coelebs', 
    freqRange: '3.3 - 6.3 kHz', 
    color: '#10b981', 
    desc: 'Descending musical cascade ending in a cheerful final flourish.', 
    heightPct: 65,
    image: CHAFFINCH_IMG,
    peakTime: 'Afternoon',
    peakHours: '12:00 - 16:00',
    habitatNiche: 'Intermediate horizontal soil planters'
  },
  { 
    name: 'Common Blackbird', 
    scientific: 'Turdus merula', 
    freqRange: '1.8 - 2.8 kHz', 
    color: '#6b7280', 
    desc: 'Flute-like, relaxed, mellow whistles with clear pitch slides.', 
    heightPct: 90,
    image: BLACKBIRD_IMG,
    peakTime: 'Dawn & Dusk',
    peakHours: '04:30 - 08:00',
    habitatNiche: 'Main horizontal wooden rafters & planter edges'
  },
];

const NIGHT_SPECIES: ChimeSpecies[] = [
  { 
    name: 'Pipistrelle Bat', 
    scientific: 'Pipistrellus pipistrellus', 
    freqRange: '45 - 80 kHz (Ultrasonic)', 
    color: '#10b981', 
    desc: 'Ultrasonic echolocation clicks converted down to sharp, cybernetic radar-like taps.', 
    heightPct: 50,
    image: BAT_IMG,
    peakTime: 'Late Evening',
    peakHours: '20:30 - 23:30',
    habitatNiche: 'Shaded, un-insulated timber cladding voids'
  },
  { 
    name: 'Tawny Owl', 
    scientific: 'Strix aluco', 
    freqRange: '300 - 380 Hz', 
    color: '#6366f1', 
    desc: 'Deep, rich territorial forest hooting of classical double tone.', 
    heightPct: 95,
    image: TAWNYOWL_IMG,
    peakTime: 'Midnight',
    peakHours: '22:00 - 02:00',
    habitatNiche: 'Elevated dense ivy roosting cavities'
  },
  { 
    name: 'Field Cricket', 
    scientific: 'Gryllus campestris', 
    freqRange: '4.6 - 4.8 kHz', 
    color: '#f59e0b', 
    desc: 'Rapid mechanical stridulation pulsing in high-pitched "cree-cree" bursts.', 
    heightPct: 70,
    image: CRICKET_IMG,
    peakTime: 'Warm Nights',
    peakHours: '20:00 - 00:00',
    habitatNiche: 'Lower substrate soil pockets & loose leaf litter'
  },
  { 
    name: 'European Nightjar', 
    scientific: 'Caprimulgus europaeus', 
    freqRange: '400 - 450 Hz', 
    color: '#a855f7', 
    desc: 'Continuous mechanical churring, like a miniature, wooden purring motor.', 
    heightPct: 88,
    image: NIGHTJAR_IMG,
    peakTime: 'Dusk till Dawn',
    peakHours: '21:00 - 03:00',
    habitatNiche: 'Exposed high timber horizontal rafters'
  },
  { 
    name: 'Barn Owl', 
    scientific: 'Tyto alba', 
    freqRange: '1.1 - 2.4 kHz', 
    color: '#f43f5e', 
    desc: 'Ghostly, rasping screeches carrying through open twilight fields.', 
    heightPct: 80,
    image: BARNOWL_IMG,
    peakTime: 'Late Night',
    peakHours: '23:00 - 04:00',
    habitatNiche: 'Top corner technical facade voids'
  },
  { 
    name: 'Common Toad', 
    scientific: 'Bufo bufo', 
    freqRange: '1.5 - 1.6 kHz', 
    color: '#84cc16', 
    desc: 'Soft high-pitched chirruping used for sub-canopy communication.', 
    heightPct: 76,
    image: TOAD_IMG,
    peakTime: 'Dusk',
    peakHours: '19:30 - 22:30',
    habitatNiche: 'Base filtration gravel layers & damp drains'
  },
  { 
    name: 'Great Green Bush-Cricket', 
    scientific: 'Tettigonia viridissima', 
    freqRange: '8.0 - 9.0 kHz', 
    color: '#14b8a6', 
    desc: 'Metallic, continuous sharp high-frequency buzzing.', 
    heightPct: 58,
    image: BUSHCRICKET_IMG,
    peakTime: 'Evening',
    peakHours: '18:30 - 22:00',
    habitatNiche: 'Lush dense vertical fern crowns'
  },
  { 
    name: 'Emperor Moth', 
    scientific: 'Saturnia pavonia', 
    freqRange: '80 - 120 Hz', 
    color: '#94a3b8', 
    desc: 'Gentle, sub-audible flutter of wings brushing against plant leaves.', 
    heightPct: 85,
    image: MOTH_IMG,
    peakTime: 'All Night',
    peakHours: '21:00 - 04:00',
    habitatNiche: 'Deep evergreen ivy root cover'
  },
];

interface TimeRange {
  startMin: number;
  endMin: number;
}

const parsePeakHours = (hoursStr: string): TimeRange => {
  const parts = hoursStr.split('-').map(s => s.trim());
  if (parts.length !== 2) return { startMin: 0, endMin: 0 };
  const parseMin = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  return {
    startMin: parseMin(parts[0]),
    endMin: parseMin(parts[1])
  };
};

const VerticalTimeline: React.FC<{
  peakHours: string;
  color: string;
  isHovered: boolean;
  currentTimeMin: number;
}> = ({ peakHours, color, isHovered, currentTimeMin }) => {
  const { startMin, endMin } = parsePeakHours(peakHours);
  const totalMin = 1440;

  const blocks: { top: number; height: number }[] = [];
  if (startMin < endMin) {
    blocks.push({
      top: (startMin / totalMin) * 100,
      height: ((endMin - startMin) / totalMin) * 100
    });
  } else {
    // Midnight wrap-around
    blocks.push({
      top: (startMin / totalMin) * 100,
      height: ((totalMin - startMin) / totalMin) * 100
    });
    blocks.push({
      top: 0,
      height: (endMin / totalMin) * 100
    });
  }

  const hourTicks = [
    { label: '00:00', min: 0 },
    { label: '06:00', min: 360 },
    { label: '12:00', min: 720 },
    { label: '18:00', min: 1080 },
    { label: '24:00', min: 1440 }
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center select-none text-[5.5px] font-mono text-sage-primary/40">
      <div className="text-[5px] leading-none scale-90 select-none">00h</div>
      
      <div className="relative flex-1 w-[3px] rounded-full bg-paper-dark/15 border border-sage-primary/5 my-1 transition-all duration-300">
        {/* Peak active highlights */}
        {blocks.map((block, i) => (
          <div
            key={i}
            className="absolute inset-x-0 rounded-full transition-all duration-300"
            style={{
              top: `${block.top}%`,
              height: `${block.height}%`,
              backgroundColor: color,
              opacity: isHovered ? 0.9 : 0.4,
              boxShadow: isHovered ? `0 0 8px ${color}` : 'none'
            }}
          />
        ))}

        {/* Hour tick marks */}
        {hourTicks.map((tick, i) => {
          const topPercent = (tick.min / totalMin) * 100;
          return (
            <div
              key={i}
              className="absolute w-[4px] h-[1px] bg-sage-primary/20 -left-[0.5px]"
              style={{ top: `${topPercent}%` }}
            />
          );
        })}

        {/* Current local time cursor */}
        {currentTimeMin >= 0 && currentTimeMin <= 1440 && (
          <div
            className="absolute -left-[3px] -right-[3px] h-[1.5px] bg-rose-500 rounded-full z-10 shadow-[0_0_4px_rgba(244,63,94,0.6)]"
            style={{ top: `${(currentTimeMin / totalMin) * 100}%` }}
          >
            {isHovered && (
              <span className="absolute left-[5px] -top-1 px-0.5 py-px bg-rose-500 text-white text-[4.5px] rounded-[1px] font-bold leading-none tracking-tighter uppercase whitespace-nowrap shadow-xs">
                Now
              </span>
            )}
          </div>
        )}
      </div>

      <div className="text-[5px] leading-none scale-90 select-none">24h</div>
    </div>
  );
};

export default function WindChimeSoundscape({ isDaytime }: { isDaytime: boolean }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [flippedCardIndices, setFlippedCardIndices] = useState<number[]>([]);
  const [triggeredRodIdx, setTriggeredRodIdx] = useState<{ idx: number; timestamp: number } | null>(null);
  const [currentTimeMin, setCurrentTimeMin] = useState<number>(0);
  
  const currentList = isDaytime ? DAY_SPECIES : NIGHT_SPECIES;

  // Real-time tracker for the Y-axis current time indicator line
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMin(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reset flips when switching daytime mode
  useEffect(() => {
    setFlippedCardIndices([]);
  }, [isDaytime]);

  const handleCardClick = (idx: number) => {
    setFlippedCardIndices((prev) =>
      prev.includes(idx) ? prev.filter((cardIdx) => cardIdx !== idx) : [...prev, idx]
    );
    // Play the audio
    playBioSound(idx, isDaytime);
    // Trigger visual sway in the corresponding hanging chime rod above!
    setTriggeredRodIdx({ idx, timestamp: Date.now() });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Hanging Interactive Chime Suspender */}
      <div className="relative border border-sage-primary/15 p-6 bg-paper-dark/10 overflow-hidden rounded-xs shadow-xs select-none">
        
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sage-primary/10 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-sage-primary" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-sage-primary">
              Acoustic Resonance Chimes
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-sage-primary/70">
            <Activity size={12} className="text-sage-primary/80 animate-pulse" />
            <span>SWIPE CURSOR OVER THE CHIMES TO GENERATE BIO-ACOUSTIC RESONANCE</span>
          </div>
        </div>

        {/* Top Suspender Beam */}
        <div className="relative w-full h-4 bg-stone-800 rounded-sm shadow-md border-b-2 border-stone-900 flex items-center justify-around px-4 z-20">
          {currentList.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-stone-400 shadow-inner" />
          ))}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-sage-primary/50 tracking-widest uppercase">
            Suspended Frequency Cladding
          </div>
        </div>

        {/* Hanging Chime Rods row */}
        <div className="flex justify-around items-stretch h-[200px] pt-1 relative z-10 px-2">
          <div className="absolute inset-x-0 top-0 bottom-4 border-x border-dashed border-sage-primary/10 pointer-events-none" />
          
          {currentList.map((species, idx) => (
            <ChimeRod
              key={`${isDaytime ? 'day' : 'night'}-${idx}`}
              index={idx}
              species={species}
              isDaytime={isDaytime}
              onFocus={() => setHoveredIdx(idx)}
              onBlur={() => setHoveredIdx(prev => prev === idx ? null : prev)}
              triggeredRodIdx={triggeredRodIdx}
            />
          ))}
        </div>

        {/* Simple Guide Banner */}
        <div className="mt-4 border-t border-dashed border-sage-primary/15 pt-2 text-center text-[10px] font-serif text-sage-primary/60 italic">
          * Sweep your cursor horizontally to hear the natural synthesizers. Or click the cards below to reveal their watercolor drawings.
        </div>
      </div>

      {/* 2. Acoustic Fingerprint Specimen Cards (Double Sided 3D Flips) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-sage-primary/10 pb-1 transition-opacity duration-200">
          <span className="text-[10px] font-mono text-sage-primary/70 uppercase tracking-widest block font-bold">
            {isDaytime ? 'Avian Specimen Cards' : 'Nocturnal Specimen Cards'}
          </span>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-stone-400">
            <HelpCircle size={11} />
            <span>CLICK CARDS TO REVEAL WATERCOLOR DRAWINGS & LAUNCH SINGING SAMPLES</span>
          </div>
        </div>

        {/* 3D Flip Card Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentList.map((species, idx) => {
            const isFlipped = flippedCardIndices.includes(idx);
            const isHovered = hoveredIdx === idx;
            
            // Generate pseudo-random signature frequencies for front graphic "竖条"
            const numSpikes = 16;
            const seedHeight = (i: number) => {
              // Create a distinct shape based on scientific name characters length
              const factor = (species.scientific.charCodeAt(i % species.scientific.length) * 0.7) % 1;
              return 15 + factor * 50; 
            };

            return (
              <div 
                key={species.name}
                onClick={() => handleCardClick(idx)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`relative w-full h-[220px] cursor-pointer group [perspective:1000px] transition-all duration-300 ${isFlipped ? 'z-40' : 'z-10'}`}
              >
                {/* 3D Card container */}
                <div 
                  className="relative w-full h-full [transform-style:preserve-3d]"
                  style={{ 
                    transform: isFlipped ? 'rotateY(180deg) scale(1)' : 'rotateY(0deg) scale(1)',
                    transition: 'transform 680ms cubic-bezier(0.22, 1, 0.36, 1) 120ms'
                  }}
                >
                  
                  {/* FRONT SIDE (Acoustic Frequency Trace, scientific details & vertical Y-axis timeline) */}
                  <div 
                    className={`absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-none border p-3 transition-all duration-300 ${
                      isHovered 
                        ? 'border-sage-primary shadow-lg bg-paper-sheet/95 scale-[1.03] -translate-y-1 z-30' 
                        : 'border-sage-primary/15 bg-paper-sheet/60 scale-100'
                    }`}
                    style={{
                      opacity: isFlipped ? 0 : 1,
                      transition: 'opacity 120ms ease-out'
                    }}
                  >
                    <div className="flex gap-2.5 h-full w-full">
                      
                      {/* Left Column (Details and Waveform) */}
                      <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono uppercase tracking-widest text-sage-primary/50">
                              Specimen #{idx+1}
                            </span>
                            <span 
                              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${isFlipped ? 'opacity-0 -translate-y-1 rotate-12 scale-75' : 'opacity-100 translate-y-0 rotate-0 scale-100'}`}
                              style={{ backgroundColor: species.color }} 
                            />
                          </div>
                          <h5 className="font-serif font-bold text-[11px] text-ink-charcoal mt-1 leading-tight truncate">
                            {species.name}
                          </h5>
                          <span className="text-[8px] font-mono italic text-sage-primary/60 block mt-0.5 leading-none truncate">
                            {species.scientific}
                          </span>
                        </div>

                        {/* Acoustic Frequency Waveform "竖条的那种frequency" */}
                        <div className="h-16 flex items-end justify-between px-1 bg-paper-dark/5 rounded-[2px] border border-sage-primary/5 relative overflow-hidden group-hover:bg-paper-dark/10 transition-colors">
                          <div className="absolute inset-x-0 bottom-0 top-1/2 border-t border-dashed border-sage-primary/5 pointer-events-none" />
                          
                          {/* Vertical frequency spikes */}
                          <div className="flex items-end gap-[1.2px] w-full h-full pt-4">
                            {Array.from({ length: numSpikes }).map((_, i) => {
                              const baseH = seedHeight(i);
                              // Add active floating hover effect to waveform
                              const waveHeight = isHovered 
                                ? Math.min(100, baseH + Math.sin(Date.now() / 150 + i * 0.8) * 15) 
                                : baseH;
                              
                              return (
                                <motion.div 
                                  key={i} 
                                  className="flex-1 rounded-t-[1px] transition-all duration-300"
                                  style={{ 
                                    height: `${waveHeight}%`,
                                    backgroundColor: isHovered ? species.color : `${species.color}45`
                                  }}
                                />
                              );
                            })}
                          </div>

                          {/* Frequency Badge overlay */}
                          <span className="absolute bottom-1 right-1 text-[6.5px] font-mono bg-ink-charcoal text-paper-bg px-1 py-0.5 rounded-[1px] tracking-tighter opacity-80 scale-90 origin-bottom-right">
                            {species.freqRange}
                          </span>
                        </div>

                        <div className="flex flex-col border-t border-sage-primary/10 pt-1 mt-1 leading-tight">
                          <span className="uppercase tracking-tighter text-sage-primary/45 text-[6.5px] font-mono font-bold">Active Period</span>
                          <span className="font-bold text-ink-charcoal text-[8.5px] leading-tight truncate">
                            {species.peakTime}
                          </span>
                          <span className="text-[7.5px] font-mono text-sage-primary/70 block mt-0.5 leading-none">
                            {species.peakHours}
                          </span>
                        </div>
                      </div>

                      {/* Right Column (Vertical Y-Axis Timeline) */}
                      <div className="w-5 shrink-0 h-full border-l border-sage-primary/10 pl-1.5">
                        <VerticalTimeline
                          peakHours={species.peakHours}
                          color={species.color}
                          isHovered={isHovered}
                          currentTimeMin={currentTimeMin}
                        />
                      </div>

                    </div>
                  </div>

                  {/* BACK SIDE (Beautiful clean wildlife photo with introduction underneath & hover zoom) */}
                  <div 
                    className={`absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-none border p-2 flex flex-col overflow-hidden bg-paper-sheet transition-all duration-300 ${
                      isHovered 
                        ? 'border-sage-primary shadow-lg scale-[1.03] -translate-y-1 z-30' 
                        : 'border-sage-primary/20 scale-100'
                    }`}
                  >
                    {/* The complete, clear, beautiful wildlife photo of the animal */}
                    <div className="w-full h-[120px] rounded-none overflow-hidden border border-stone-200 relative shrink-0 bg-stone-100">
                      {species.image ? (
                        <img 
                          src={species.image} 
                          alt={species.name} 
                          className={`w-full h-full object-cover filter saturate-[1.1] brightness-[1.02] transition-transform duration-500 ease-out ${
                            isHovered ? 'scale-110' : 'scale-100'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full relative bg-paper-dark/15 flex items-center justify-center">
                          <span className="text-[10px] font-mono text-stone-400">Specimen Portrait</span>
                        </div>
                      )}
                    </div>

                    {/* Scientific details and description shifted completely below the image */}
                    <div className="mt-1.5 flex-1 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex items-baseline justify-between gap-1 border-b border-sage-primary/10 pb-0.5">
                          <h6 className="font-serif font-bold text-[10px] text-ink-charcoal leading-none truncate">
                            {species.name}
                          </h6>
                          <span className="text-[7.5px] font-mono italic text-sage-primary/70 leading-none truncate">
                            {species.scientific}
                          </span>
                        </div>
                        <p className="text-[8px] text-stone-600 font-serif leading-tight mt-1 line-clamp-3">
                          {species.desc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[6.5px] font-mono text-sage-primary/50 pt-1 border-t border-sage-primary/5 mt-auto">
                        <span>FREQ: {species.freqRange}</span>
                        <span className="font-bold text-sage-primary/80">{species.peakHours}</span>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

interface ChimeRodProps {
  index: number;
  species: ChimeSpecies;
  isDaytime: boolean;
  onFocus: () => void;
  onBlur: () => void;
  triggeredRodIdx?: { idx: number; timestamp: number } | null;
}

/**
 * Individual Chime Rod with real-time Spring Physics & Web Audio triggers
 */
const ChimeRod: React.FC<ChimeRodProps> = ({
  index,
  species,
  isDaytime,
  onFocus,
  onBlur,
  triggeredRodIdx = null,
}) => {
  const [angle, setAngle] = useState(0);
  const posRef = useRef(0);
  const velRef = useRef(0);
  const lastSoundTriggerRef = useRef(0);
  const isHoveredRef = useRef(false);

  // Trigger sound and set velocity (impulse swing)
  const triggerChime = (strength = 1.0) => {
    const now = Date.now();
    // Cooldown of 120ms to prevent extreme sound spamming, but allow fluent swipe sounds
    if (now - lastSoundTriggerRef.current > 120) {
      lastSoundTriggerRef.current = now;
      playBioSound(index, isDaytime);
    }

    // Add impulse velocity
    const dir = Math.random() > 0.5 ? 1 : -1;
    const force = (12 + Math.random() * 12) * dir * strength;
    velRef.current += force;
  };

  // Coordinated trigger listener from parent Specimen cards
  useEffect(() => {
    if (triggeredRodIdx && triggeredRodIdx.idx === index) {
      triggerChime(1.5);
    }
  }, [triggeredRodIdx]);

  // Run physical update loop continuously
  useEffect(() => {
    let animId: number;

    const updatePhysics = () => {
      const stiffness = 0.045; // restores rod back to vertical
      const damping = 0.018;   // air resistance / wood friction (slow decay)

      const force = -stiffness * posRef.current - damping * velRef.current;
      velRef.current += force;
      posRef.current += velRef.current;

      setAngle(posRef.current);
      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    onFocus();
    triggerChime(1.1);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (Math.abs(velRef.current) < 5) {
      triggerChime(0.6);
    }
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    onBlur();
  };

  const handleClick = () => {
    triggerChime(1.5);
  };

  return (
    <div
      className="flex flex-col items-center relative w-12 cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Rotation wrapper around the pivot point at the top */}
      <div
        className="absolute top-0 flex flex-col items-center"
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'top center',
          transition: 'transform 0.05s linear', // smooth physics integration
          height: '100%',
        }}
      >
        {/* Support String */}
        <div className="w-[1.5px] h-8 bg-stone-600/70 shadow-xs" />

        {/* Chime Cylinder Body */}
        <div
          className="w-2.5 rounded-b-md shadow-md border relative transition-colors duration-300"
          style={{
            height: `${species.heightPct * 1.05}px`,
            backgroundColor: isHoveredRef.current ? `${species.color}dd` : 'rgba(82, 103, 86, 0.15)',
            borderColor: isHoveredRef.current ? species.color : 'rgba(82, 103, 86, 0.4)',
            boxShadow: isHoveredRef.current ? `0 0 12px ${species.color}40` : 'none',
          }}
        >
          {/* Metallic/Wooden texture highlights inside the rods */}
          <div className="absolute inset-y-0 left-0.5 w-[1px] bg-white/30" />
          <div className="absolute inset-y-0 right-0.5 w-[1.5px] bg-black/10" />
          
          {/* Tiny glowing node inside the active rod */}
          {isHoveredRef.current && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          )}
        </div>

        {/* Hanging Thread to Wind Sail */}
        <div className="w-[1px] h-6 bg-stone-500/60" />

        {/* Wind Sail / Ornaments (Feather or Leaf like shape) */}
        <div 
          className="w-4 h-6 rounded-b-full transition-colors duration-300 flex items-center justify-center"
          style={{
            backgroundColor: isHoveredRef.current ? `${species.color}20` : 'rgba(82, 103, 86, 0.05)',
            border: `1px solid ${isHoveredRef.current ? species.color : 'rgba(82, 103, 86, 0.2)'}`,
            clipPath: 'polygon(50% 0%, 100% 40%, 80% 100%, 20% 100%, 0% 40%)'
          }}
        >
          <div className="w-1 h-3 rounded-full" style={{ backgroundColor: species.color }} />
        </div>
      </div>

      {/* Static grid labels underneath */}
      <div className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-end h-8 pointer-events-none">
        <span className="text-[7px] font-mono text-sage-primary/50 text-center uppercase tracking-tighter leading-none mb-1">
          {species.name.split(' ')[1] || species.name}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-sage-primary/20" />
      </div>
    </div>
  );
}
