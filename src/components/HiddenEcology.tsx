/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Eye, 
  Radio, 
  Thermometer, 
  Droplets, 
  Wind, 
  Heart,
  Leaf,
  Network,
  Users,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Layers
} from 'lucide-react';
import { SensorData } from '../lib/types';

interface HiddenEcologyProps {
  frontElevationImg: string;
  currentData: SensorData;
}

interface BgiTopic {
  id: string;
  label: string;
  initialX: number;
  initialY: number;
  title: string;
  subtitle: string;
  bgiConnection: string;
  observed: string;
  limitation: string;
  canShow: string;
  cannotShow: string;
  senseData: (data: SensorData) => string[];
  icon: React.ElementType;
  audioFreq: number;
}

// 02 BGI: five interpretive relationships
const BGI_TOPICS: BgiTopic[] = [
  {
    id: 'water',
    label: '01 / WATER',
    initialX: 26,
    initialY: 23,
    title: '01 / WATER - Rainfall · Vegetation · Urban Water',
    subtitle: 'Rainfall provides one way of connecting the living wall to urban water processes.',
    bgiConnection: 'Vegetation, substrate and drainage can be understood as part of building-scale infrastructure through which water is received, retained, transported or released.',
    observed: 'SENSE can show changing rainfall and humidity conditions around the site as contextual environmental observations.',
    limitation: 'Available SENSE data describe surrounding weather conditions rather than independently demonstrating wall water-management performance.',
    canShow: 'Current rainfall and humidity conditions at the monitored site.',
    cannotShow: 'Quantified wall water-retention or runoff-reduction performance without dedicated comparative measurements.',
    senseData: (d) => [
      `Rainfall rate: ${(d.p_rainRate_cm_per_hour ?? 0).toFixed(2)} cm/h`,
      `Daily rainfall: ${(d.p_dayRain_cm ?? 0).toFixed(2)} cm`,
      `Outdoor humidity: ${Math.round(d.outHumidity ?? d.humidity_percent)}%`
    ],
    icon: Droplets,
    audioFreq: 280
  },
  {
    id: 'microclimate',
    label: '02 / MICROCLIMATE',
    initialX: 74,
    initialY: 19,
    title: '02 / MICROCLIMATE - Heat · Humidity · Light · Wind',
    subtitle: 'Environmental conditions recorded around the site can be related to street and facade microclimate.',
    bgiConnection: 'Temperature, humidity, light and wind measurements help interpret how the wall sits within wider urban microclimate dynamics.',
    observed: 'SENSE records current environmental conditions around the monitored site.',
    limitation: 'These measurements do not by themselves establish a causal cooling effect produced by the wall without comparative or controlled measurements.',
    canShow: 'Current temperature, humidity, light and wind conditions at the monitored site.',
    cannotShow: 'Whether the wall itself causes measurable cooling without comparative evidence.',
    senseData: (d) => [
      `Outdoor temperature: ${(d.outTemp_C ?? d.temperature_c).toFixed(1)} C`,
      `Outdoor humidity: ${Math.round(d.outHumidity ?? d.humidity_percent)}%`,
      `Light level: ${Math.round(d.luminosity_lux ?? d.light_lux)} lux`,
      `Wind speed: ${(d.windSpeed_kph ?? d.wind_speed_ms * 3.6).toFixed(1)} kph`
    ],
    icon: Thermometer,
    audioFreq: 340
  },
  {
    id: 'biodiversity',
    label: '03 / BIODIVERSITY',
    initialX: 19,
    initialY: 58,
    title: '03 / BIODIVERSITY - Vegetation · Habitat · Non-human Presence',
    subtitle: 'Vegetation and recordings can be read as ecological encounter material in a dense urban setting.',
    bgiConnection: 'The wall introduces vegetation into built urban fabric and can be interpreted in relation to potential habitat and non-human activity.',
    observed: 'SENSE can bring together vegetation presence, bioacoustic material, seasonal observations and participant observations.',
    limitation: 'Recorded sounds or vegetation presence do not alone establish quantified biodiversity gain or habitat performance.',
    canShow: 'Vegetation, recorded sound and participant observations.',
    cannotShow: 'A quantified increase in biodiversity based on these materials alone.',
    senseData: (d) => [
      `Bird calls (contextual): ${d.bird_calls_min} per min`,
      `Bat calls (contextual): ${d.bat_calls_min} per min`,
      `Recent species cue: ${d.latestSpecies || d.latestBirdSpecies || d.latestBatSpecies || 'No recent species label'}`
    ],
    icon: Leaf,
    audioFreq: 480
  },
  {
    id: 'public',
    label: '04 / PUBLIC SPACE',
    initialX: 81,
    initialY: 58,
    title: '04 / PUBLIC SPACE - Green Infrastructure · Everyday Experience',
    subtitle: 'The wall can be interpreted through ordinary movement, noticing and sense of place on Gordon Street.',
    bgiConnection: 'Students, staff, visitors, workers and residents may notice, ignore, hear or gradually reinterpret the wall as part of everyday urban experience.',
    observed: 'Day/night imagery, sound and participant reflections can support interpretation of how infrastructure becomes visible and meaningful in ordinary life.',
    limitation: 'Personal perception is not equivalent to scientific proof of environmental performance, but remains relevant for BGI interpretation in public space.',
    canShow: 'Everyday observation and situated interpretation of the site.',
    cannotShow: 'Direct scientific proof of wall performance from perception data alone.',
    senseData: () => [
      'Contextual material: day/night imagery, soundscape, participant notes',
      'Key question: How does environmental infrastructure become part of ordinary urban experience?'
    ],
    icon: Users,
    audioFreq: 210
  },
  {
    id: 'connectivity',
    label: '05 / CONNECTIVITY',
    initialX: 50,
    initialY: 76,
    title: '05 / CONNECTIVITY - Building · Street · Wider Green Infrastructure',
    subtitle: 'The wall is interpreted through relationships with surrounding urban systems.',
    bgiConnection: 'A single wall can be read in relation to street trees, roofs, public space, drainage and surrounding vegetation without over-claiming network completion.',
    observed: 'SENSE supports contextual interpretation of the wall as one site-scale component within wider BGI relationships.',
    limitation: 'The project does not claim that this single wall creates a complete ecological corridor or full BGI network.',
    canShow: 'A relational reading between wall, buildings, street and adjacent green-blue elements.',
    cannotShow: 'Complete network-scale ecological function from this site alone.',
    senseData: () => [
      'Interpretive map logic: building, street, vegetation, public space, drainage context',
      'Scope: site-scale relation within wider BGI system'
    ],
    icon: Network,
    audioFreq: 390
  }
];

interface BgiBackCopy {
  heading: string;
  subheading: string;
  body: string;
  citation: string;
}

const BGI_BACK_COPY: BgiBackCopy[] = [
  {
    heading: '01 / MICROCLIMATE',
    subheading: 'Microclimate Regulation',
    body: 'Green walls can modify the microclimate around a building facade. Plant leaves intercept part of the incoming solar radiation, reducing direct heat gain at the wall surface, while evapotranspiration releases moisture into the surrounding air. Together, these processes create a local environmental condition that differs from an exposed building facade.',
    citation: '(Manso and Castro-Gomes, 2015; Radic et al., 2019)'
  },
  {
    heading: '02 / WATER',
    subheading: 'Water Regulation',
    body: 'Plants and growing media within a green wall can temporarily store water and release part of it back into the atmosphere through evapotranspiration. The remaining water moves through the wall and its drainage system. Water therefore moves between plants, growing media, air and the building as part of the wall\'s green-infrastructure function.',
    citation: '(Manso and Castro-Gomes, 2015; Theodoridou et al., 2025)'
  },
  {
    heading: '03 / BIODIVERSITY',
    subheading: 'Biodiversity Support',
    body: 'A green wall introduces vegetation into vertical spaces that would otherwise be dominated by building surfaces. Different plants, leaves and layers can provide food, shelter and resting spaces for insects and other small organisms, while also creating opportunities for bird activity. The wall therefore adds an ecological surface to an otherwise highly built environment.',
    citation: '(Kohler, 2008; Francis and Lorimer, 2011)'
  },
  {
    heading: '04 / AIR & ENVIRONMENT',
    subheading: 'Air & Environmental Quality',
    body: 'Green walls create a living interface between vegetation and the surrounding air. Plant surfaces can intercept some airborne particles, while vegetation also participates in gas exchange and modifies the thermal conditions around the facade. In a dense urban street, the wall therefore introduces biological activity into an otherwise largely artificial surface.',
    citation: '(Manso and Castro-Gomes, 2015; Fonseca, Paschoalino and Silva, 2023)'
  },
  {
    heading: '05 / PUBLIC SPACE EXPERIENCE',
    subheading: 'Public Space Experience',
    body: 'A green wall brings green infrastructure directly into the spaces people use every day. Changes in plant colour, form and season interact with light, weather, sound and surrounding conditions, making the wall a changing part of the streetscape. At Gordon Street, this creates an everyday point of contact between people, vegetation and the urban environment.',
    citation: '(Jim, Hui and Rupprecht, 2022; Nevarez-Favela et al., 2023)'
  }
];

interface ClickRipple {
  id: number;
  x: number;
  y: number;
  type: 'acoustic' | 'root' | 'chemical' | 'micro';
}

const VISUAL_LAYERS = [
  {
    number: '01',
    name: 'Vegetation Layer',
    description: 'The visible planting layer creates seasonal character, habitat and a stronger sense of place on Gordon Street.',
    image: '/images/01.jpg'
  },
  {
    number: '02',
    name: 'Growing Medium',
    description: 'The lightweight growing medium supports roots and stores the water, air and nutrients needed for plant growth.',
    image: '/images/02.jpg'
  },
  {
    number: '03',
    name: 'Drainage & Water-Retention Layer',
    description: 'This layer stores part of the water and safely drains excess moisture away from the roots.',
    image: '/images/03.jpg'
  },
  {
    number: '04',
    name: 'Sensor Layer',
    description: 'A small number of sensors monitor moisture, temperature, light and water movement to support research and maintenance.',
    image: '/images/04.jpg'
  },
  {
    number: '05',
    name: 'Waterproof & Root Barrier',
    description: 'This protective membrane prevents moisture and roots from damaging the existing building.',
    image: '/images/05.jpg'
  },
  {
    number: '06',
    name: 'Support Frame & Ventilation Cavity',
    description: 'The metal frame supports the green wall and creates space for ventilation, drainage, cables and maintenance.',
    image: '/images/06.jpg'
  },
  {
    number: '07',
    name: 'Existing Wall',
    description: 'The existing building wall is the structural background to which the entire green-wall system is attached.',
    image: '/images/07.jpg'
  }
];

export default function HiddenEcology({ frontElevationImg, currentData }: HiddenEcologyProps) {
  // Depth scrubber: 0 (VISIBLE) -> 100 (TELEMETRIC)
  const [depth, setDepth] = useState<number>(0);
  
  // Selected topic index
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);
  const [visualLayerIndex, setVisualLayerIndex] = useState<number>(0);

  const [showBgiStickers, setShowBgiStickers] = useState<boolean>(false);

  // Mouse position relative to canvas (%)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Interactive Click Events on Canvas
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const rippleIdRef = useRef(0);

  // Web Audio Context reference
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Depth state indicators
  const isVisible = depth < 50;
  const isSensed = depth >= 50;

  const currentTopic = selectedTopicIndex !== null ? BGI_TOPICS[selectedTopicIndex] : null;
  const currentVisualLayer = VISUAL_LAYERS[visualLayerIndex];
  const bgiBaseImage = VISUAL_LAYERS[0]?.image || frontElevationImg;

  const selectVisualLayer = (index: number) => {
    setVisualLayerIndex((index + VISUAL_LAYERS.length) % VISUAL_LAYERS.length);
    triggerAudioPulse(300 + index * 24);
  };

  const showNextVisualLayer = () => selectVisualLayer(visualLayerIndex + 1);
  const showPreviousVisualLayer = () => selectVisualLayer(visualLayerIndex - 1);

  // Play audio blip/tone on interaction
  const triggerAudioPulse = (freq: number = 440) => {
    // Keep this section visually focused; no ambient button audio in current interaction design.
    return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio fallback
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!isSensed) {
      setShowBgiStickers(false);
      return;
    }

    if (selectedTopicIndex !== null) {
      setShowBgiStickers(true);
      return;
    }

    setShowBgiStickers(false);
    const revealTimer = setTimeout(() => {
      setShowBgiStickers(true);
    }, 550);

    return () => clearTimeout(revealTimer);
  }, [isSensed, selectedTopicIndex]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  // Canvas click ripple
  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isVisible) {
      showNextVisualLayer();
      return;
    }
    if (selectedTopicIndex !== null) {
      setSelectedTopicIndex(null);
      return;
    }
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let type: ClickRipple['type'] = 'acoustic';
    let freq = 320;

    if (y > 60) {
      type = 'micro';
      freq = 180;
    } else if (x < 40 && y > 40) {
      type = 'root';
      freq = 240;
    } else if (y < 40) {
      type = 'chemical';
      freq = 520;
    }

    triggerAudioPulse(freq);

    const newRipple: ClickRipple = {
      id: ++rippleIdRef.current,
      x,
      y,
      type
    };

    setRipples((prev) => [...prev.slice(-5), newRipple]);
  };

  const handleSelectBenefit = (index: number) => {
    setSelectedTopicIndex(index);
    if (isVisible) {
      setDepth(100); // Jump to Telemetric view when clicked
    }
    const item = BGI_TOPICS[index];
    triggerAudioPulse(item.audioFreq);
  };

  const selectPreviousTopic = () => {
    setSelectedTopicIndex((prev) => {
      if (prev === null) return BGI_TOPICS.length - 1;
      return (prev - 1 + BGI_TOPICS.length) % BGI_TOPICS.length;
    });
  };

  const selectNextTopic = () => {
    setSelectedTopicIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % BGI_TOPICS.length;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* ATMOSPHERIC HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200/80 pb-4 gap-2">
        <div></div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[2px] border border-stone-200 bg-stone-50/80 px-3 py-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-stone-500 font-bold">
          Observation Mode
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setDepth(0); triggerAudioPulse(300); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-mono rounded-[2px] border transition-all cursor-pointer ${
              isVisible
                ? 'bg-sage-primary text-white border-sage-dark font-bold shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Eye size={13} />
            <span>01 // VISUAL</span>
          </button>

          <button
            onClick={() => { setDepth(100); setSelectedTopicIndex(null); triggerAudioPulse(440); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-mono rounded-[2px] border transition-all cursor-pointer ${
              isSensed
                ? 'bg-[#32506d] text-[#f3eee1] border-[#244058] font-bold shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Radio size={13} />
            <span>02 // BGI</span>
          </button>
        </div>
      </div>

      {/* LIVING WALL ELEVATION CANVAS */}
      <div className="space-y-4">
        <div 
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleCanvasClick}
          className={`relative aspect-16/10 w-full overflow-visible border border-stone-300 bg-stone-950 rounded-xs shadow-xs select-none group ${isVisible ? 'cursor-pointer' : 'cursor-crosshair'}`}
        >
          {/* Base Elevation Image */}
          <AnimatePresence mode="sync" initial={false}>
            <motion.img
              key={isVisible ? `visual-${visualLayerIndex}` : 'telemetric-elevation'}
              src={isVisible ? currentVisualLayer.image : bgiBaseImage}
              alt={isVisible ? `${currentVisualLayer.number} — ${currentVisualLayer.name}` : 'Living Wall Front Elevation'}
              initial={{ opacity: 1, x: 0, rotate: 0, zIndex: 1 }}
              animate={{ opacity: 1, x: 0, rotate: 0, zIndex: 1 }}
              exit={{ opacity: 0, zIndex: 2 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute inset-0 w-full h-full object-cover ${
                isVisible
                  ? 'brightness-100 contrast-105 saturate-100'
                  : 'brightness-90 contrast-105 saturate-95'
              }`}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = frontElevationImg;
              }}
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>

          {isVisible && (
            <div className="hidden md:block absolute inset-y-[-3%] left-[3.5%] z-30 w-[29%] max-w-[21rem] pointer-events-none">
              <div className="relative flex h-full flex-col justify-center overflow-hidden bg-[#eee5d2]/94 px-6 py-10 backdrop-blur-[2px] border-x border-[#776d5d]/55 shadow-[7px_0_14px_rgba(32,27,20,0.22),-2px_0_6px_rgba(32,27,20,0.12)]">
                <div className="absolute inset-y-0 left-[7px] w-px bg-[#776d5d]/30" />
                <div className="absolute inset-y-0 right-[7px] w-px bg-[#776d5d]/30" />
                <div className="absolute inset-x-0 top-5 border-t border-[#776d5d]/45" />
                <div className="absolute inset-x-0 bottom-5 border-t border-[#776d5d]/45" />
                <span className="font-mono text-[10px] tracking-[0.22em] text-sage-primary font-bold">LAYER {currentVisualLayer.number} / 07</span>
                <div className="my-4 h-px w-12 bg-stone-500/50" />
                <h4 className="font-serif text-lg lg:text-xl font-bold leading-tight text-ink-charcoal">{currentVisualLayer.name}</h4>
                <p className="font-serif text-xs lg:text-sm leading-relaxed text-stone-700 mt-4">{currentVisualLayer.description}</p>
              </div>
            </div>
          )}

          {/* DYNAMIC CLICK RIPPLES */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {ripples.map((r) => (
              <motion.div
                key={r.id}
                initial={{ scale: 0.2, opacity: 1 }}
                animate={{ scale: 2.8, opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ left: `${r.x}%`, top: `${r.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                  r.type === 'micro'
                    ? 'border-amber-400 bg-amber-400/20'
                    : r.type === 'root'
                    ? 'border-purple-400 bg-purple-400/20'
                    : r.type === 'chemical'
                    ? 'border-teal-300 bg-teal-400/20'
                    : 'border-emerald-400 bg-emerald-400/20'
                }`}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-mono text-white/90 bg-black/80 px-1.5 py-0.5 border border-white/20 uppercase tracking-widest whitespace-nowrap">
                    {r.type === 'micro' ? 'MICRO SIGNAL' : r.type === 'root' ? 'ROOT PULSE' : r.type === 'chemical' ? 'VOC EMISSION' : 'ACOUSTIC WAVE'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* LAYER 02: BGI INTERPRETATION NODES */}
          {isSensed && (
            <div className="absolute inset-0 pointer-events-auto z-20">
              <svg className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${selectedTopicIndex !== null ? 'opacity-35' : 'opacity-100'}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {BGI_TOPICS.map((item, idx) => {
                  const anchors = [
                    { x: 42, y: 31 },
                    { x: 58, y: 31 },
                    { x: 40, y: 49 },
                    { x: 60, y: 49 },
                    { x: 50, y: 63 }
                  ];
                  const a = anchors[idx];
                  const controlX = (a.x + item.initialX) / 2 + (item.initialX < 50 ? -3 : item.initialX > 50 ? 3 : 0);
                  const controlY = (a.y + item.initialY) / 2 - (item.initialY < a.y ? 4 : 1.5);
                  return (
                    <path
                      key={`link-${item.id}`}
                      d={`M ${a.x} ${a.y} Q ${controlX} ${controlY} ${item.initialX} ${item.initialY}`}
                      stroke="rgba(66, 100, 132, 0.62)"
                      strokeWidth="0.24"
                      strokeDasharray="1.2 1"
                      fill="none"
                    />
                  );
                })}
              </svg>

              <div className={`absolute left-1/2 top-[42%] z-10 -translate-x-1/2 -translate-y-1/2 border border-[#b8ac95] bg-[#f5eddd]/92 px-5 py-2.5 shadow-[0_6px_14px_rgba(58,45,30,0.2)] transition-opacity duration-300 ${selectedTopicIndex !== null ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <p className="font-serif text-[20px] italic tracking-[0.02em] text-[#3e5b73] rotate-[-1.8deg] whitespace-nowrap">
                  what is the benfits of Greenwall as a BGI
                </p>
              </div>

              <div className="absolute inset-0">
              {BGI_TOPICS.map((item, idx) => {
                const IconComponent = item.icon;
                const isActive = selectedTopicIndex === idx;
                const isAnotherActive = selectedTopicIndex !== null && !isActive;
                const frontNumber = String(idx + 1).padStart(2, '0');

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectBenefit(idx);
                    }}
                    aria-label={`Open ${item.label}`}
                    style={{
                      position: 'absolute',
                      left: isActive ? '15%' : `${item.initialX}%`,
                      top: isActive ? '15%' : `${item.initialY}%`,
                      transform: isActive ? 'translate(-50%, -50%) rotate(-5deg)' : 'translate(-50%, -50%) rotate(0deg)',
                      opacity: showBgiStickers ? (isAnotherActive ? 0.34 : 1) : 0,
                      zIndex: isActive ? 80 : 30,
                      pointerEvents: showBgiStickers ? 'auto' : 'none',
                      transition: 'left 560ms cubic-bezier(0.2, 0.88, 0.24, 1), top 560ms cubic-bezier(0.2, 0.88, 0.24, 1), transform 560ms cubic-bezier(0.2, 0.88, 0.24, 1), opacity 280ms ease-out, box-shadow 220ms ease-out'
                    }}
                    className="cursor-pointer text-left"
                  >
                    <div className={`relative flex h-[124px] w-[206px] flex-col justify-between border border-[#8b806d] bg-[#f6f1e6] p-3 text-[#2f4b62] shadow-[0_8px_16px_rgba(54,49,38,0.18)] transition-all duration-300 ${isActive ? 'shadow-[0_12px_20px_rgba(54,49,38,0.26)]' : ''}`}>
                      <div className={`absolute left-1/2 top-[-9px] h-4 w-4 -translate-x-1/2 border border-[#9f7e6a] bg-[#d6b9a4] shadow-[0_1px_5px_rgba(60,38,24,0.35)] transition-all duration-200 ${isActive ? 'opacity-0 -translate-y-2 rotate-12 scale-75' : 'opacity-100 translate-y-0 rotate-0 scale-100'}`}>
                        <div className="absolute left-[3px] top-[3px] h-1.5 w-1.5 bg-[#f7ece3]/85" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] tracking-[0.14em] text-[#6a5f50]">{frontNumber}</span>
                        <IconComponent size={17} className="text-[#385873]" />
                      </div>
                      <div>
                        <p className="font-mono text-[10px] font-bold tracking-[0.1em]">{item.label}</p>
                        <p className="mt-1 font-serif text-[11px] leading-snug text-stone-700">{item.subtitle}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              </div>

              {currentTopic && (
                <div
                  className="absolute left-[31%] top-[11%] z-70 h-[76%] w-[63%] border border-[#8b806d] bg-[#f3ecde]/97 p-4 text-stone-800 shadow-[0_12px_26px_rgba(58,45,30,0.24)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTopicIndex(null);
                    }}
                    className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 border border-[#9f9279] bg-[#efe6d4] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-stone-700 hover:bg-[#e7ddc8]"
                  >
                    <X size={11} /> Close
                  </button>
                  <div className="h-full overflow-y-auto pr-2 pt-1">
                    <h4 className="pr-16 font-mono text-[14px] uppercase tracking-[0.08em] font-bold text-[#2f4d66]">{BGI_BACK_COPY[selectedTopicIndex].heading}</h4>
                    <p className="mt-2 font-serif text-[15px] font-semibold leading-snug text-stone-800">{BGI_BACK_COPY[selectedTopicIndex].subheading}</p>
                    <p className="mt-3 font-serif text-[14px] leading-relaxed text-stone-700">{BGI_BACK_COPY[selectedTopicIndex].body}</p>
                    <p className="mt-3 border-t border-[#c1b59f] pt-2 font-serif text-[12px] italic leading-relaxed text-stone-600">{BGI_BACK_COPY[selectedTopicIndex].citation}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MOUSE HOVER TARGET LOCATOR */}
          {mousePos && isSensed && (
            <div 
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-75 z-10"
              style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%` }}
            >
              <div className={`w-16 h-16 border rounded-full flex items-center justify-center ${
                isVisible 
                  ? 'border-sage-primary/40 bg-sage-primary/5' 
                  : 'border-emerald-400/50 bg-emerald-500/5'
              }`}>
                <span className={`w-1 h-1 rounded-full ${isVisible ? 'bg-sage-primary' : 'bg-emerald-400'}`} />
              </div>
            </div>
          )}

        </div>

        {isVisible && (
          <div className="space-y-3">
            <div className="md:hidden bg-[#f7f1e5]/90 border border-stone-500/60 p-4 shadow-[2px_3px_0_rgba(87,76,59,0.16)] [border-radius:47%_2%_43%_3%/4%_44%_5%_38%]">
              <span className="font-mono text-[10px] tracking-[0.22em] text-sage-primary font-bold">LAYER {currentVisualLayer.number} / 07</span>
              <h4 className="font-serif text-lg font-bold text-ink-charcoal mt-1">{currentVisualLayer.name}</h4>
              <p className="font-serif text-xs leading-relaxed text-stone-700 mt-2">{currentVisualLayer.description}</p>
            </div>

            <div className="flex flex-col gap-3 border border-stone-200 bg-paper-sheet/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5" aria-label="Select green wall layer">
                {VISUAL_LAYERS.map((layer, index) => (
                  <button
                    key={layer.number}
                    type="button"
                    onClick={() => selectVisualLayer(index)}
                    aria-label={`Show ${layer.name}`}
                    aria-pressed={visualLayerIndex === index}
                    className={`h-8 min-w-8 border px-2 font-mono text-[10px] transition-colors cursor-pointer ${
                      visualLayerIndex === index
                        ? 'border-sage-dark bg-sage-primary text-white'
                        : 'border-stone-300 bg-white text-stone-600 hover:border-sage-primary hover:text-sage-dark'
                    }`}
                  >
                    {layer.number}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={showPreviousVisualLayer} className="inline-flex h-8 items-center gap-1.5 border border-stone-300 bg-white px-3 font-mono text-[10px] text-stone-600 hover:border-sage-primary cursor-pointer">
                  <ChevronLeft size={13} /> Previous
                </button>
                <button type="button" onClick={() => selectVisualLayer(0)} className="inline-flex h-8 items-center gap-1.5 border border-stone-300 bg-white px-3 font-mono text-[10px] text-stone-600 hover:border-sage-primary cursor-pointer">
                  <RotateCcw size={12} /> Reset
                </button>
                <button type="button" onClick={showNextVisualLayer} className="inline-flex h-8 items-center gap-1.5 border border-sage-dark bg-sage-primary px-3 font-mono text-[10px] text-white hover:bg-sage-dark cursor-pointer">
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {isSensed && (
          <div className="flex flex-col gap-2 border border-[#b8ac95] bg-[#f4ecdc]/90 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5" aria-label="Select BGI topic">
              {BGI_TOPICS.map((topic, idx) => (
                <button
                  key={`topic-chip-${topic.id}`}
                  type="button"
                  onClick={() => handleSelectBenefit(idx)}
                  aria-pressed={selectedTopicIndex === idx}
                  className={`h-8 border px-2 font-mono text-[9px] uppercase tracking-[0.06em] transition-colors cursor-pointer ${
                    selectedTopicIndex === idx
                      ? 'border-[#3f5f7a] bg-[#3f5f7a] text-[#f3ede1]'
                      : 'border-[#b8ac95] bg-[#f8f3e8] text-[#5b5a56] hover:border-[#6b8196] hover:text-[#2e495f]'
                  }`}
                >
                  {`${String(idx + 1).padStart(2, '0')} ${topic.id}`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button type="button" onClick={selectPreviousTopic} className="inline-flex h-7 items-center gap-1 border border-[#b8ac95] bg-[#f8f3e8] px-2.5 font-mono text-[9px] text-[#5b5a56] hover:border-[#6b8196] cursor-pointer">
                <ChevronLeft size={13} /> Previous
              </button>
              <button type="button" onClick={() => setSelectedTopicIndex(null)} className="inline-flex h-7 items-center gap-1 border border-[#b8ac95] bg-[#f8f3e8] px-2.5 font-mono text-[9px] text-[#5b5a56] hover:border-[#6b8196] cursor-pointer">
                <RotateCcw size={12} /> Reset
              </button>
              <button type="button" onClick={selectNextTopic} className="inline-flex h-7 items-center gap-1 border border-[#3f5f7a] bg-[#3f5f7a] px-2.5 font-mono text-[9px] text-[#f3ede1] hover:bg-[#2e495f] cursor-pointer">
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
