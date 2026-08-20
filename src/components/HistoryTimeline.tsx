/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Compass, Eye, ShieldCheck, Cpu, ArrowUpRight } from 'lucide-react';
import { HandwrittenTitle } from './ReusableUI';

interface HistoryTimelineProps {
  heroDayImg: string;
  frontElevationImg: string;
}

type StageId = 'ancient' | 'industrial' | 'sensed';

interface StageData {
  id: StageId;
  stepNumber: string;
  title: string;
  subtitle: string;
  content: string;
  badge: string;
  meta: string;
  detailsLabel?: string;
  detailsUrl?: string;
}

export default function HistoryTimeline({ heroDayImg, frontElevationImg }: HistoryTimelineProps) {
  const [activeStage, setActiveStage] = useState<StageId>('ancient');

  const historyImages: Record<StageId, { src: string; fallback: string }> = {
    ancient: { src: '/images/history/01.jpg', fallback: heroDayImg },
    industrial: { src: '/images/history/02.jpg', fallback: frontElevationImg },
    sensed: { src: '/images/history/03.jpg', fallback: heroDayImg }
  };

  const useHistoryFallback = (event: React.SyntheticEvent<HTMLImageElement>, stage: StageId) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = historyImages[stage].fallback;
  };
  
  // Refs for the scroll containers
  const containerRef = useRef<HTMLDivElement>(null);
  const ancientRef = useRef<HTMLDivElement>(null);
  const industrialRef = useRef<HTMLDivElement>(null);
  const sensedRef = useRef<HTMLDivElement>(null);

  const stages: StageData[] = [
    {
      id: 'ancient',
      stepNumber: 'I',
      title: 'Ancient Vernacular Greening',
      subtitle: 'Insulation buffers integrated with vernacular architecture',
      content: '“Building greening is not a new idea. Green roofs and walls have existed since ancient times, showing that the integration of vegetation and architecture has a long historical background (Enzi-Zechner et al., 2025).” From the hanging gardens of Babylon to early Roman ivy-clad stone shelters, vegetative layers served as durable protection against heavy winds and solar radiation, harmonizing human habitats with seasonal geological patterns.',
      badge: 'HISTORIC RECONSTRUCTION',
      meta: 'Circa 600 BCE – 19th Century',
      detailsLabel: 'See details',
      detailsUrl: 'https://www.worldhistory.org/Hanging_Gardens_of_Babylon/'
    },
    {
      id: 'industrial',
      stepNumber: 'II',
      title: 'Standardized Facade Engineering',
      subtitle: 'The modern turn toward industrial and lightweight modular systems',
      content: '“In Central Europe, building greening systems became increasingly industrialised in the 1980s, turning green roofs and green walls into more technical and standardised architectural systems (Enzi-Zechner et al., 2025).” Architectural grids, wire trellises, and modular geotextile growing bags replaced raw soil mounds, translating botanical life into structural specifications, load calculations, and automated irrigation models.',
      badge: 'ARCHIVAL SCHEMATIC',
      meta: 'Late 20th Century (1980s)',
      detailsLabel: 'See details',
      detailsUrl: 'https://www.dezeen.com/2013/09/08/the-oasis-of-aboukir-green-wall-by-patrick-blanc/'
    },
    {
      id: 'sensed',
      stepNumber: 'III',
      title: 'The Living Interface',
      subtitle: 'Connecting the visible wall with its hidden environmental conditions',
      content: '“With sensors, sound data and interactive interfaces, the green wall can be understood not only as green infrastructure, but also as a situated ecological interface that makes local environmental relations perceptible in place (Gabrys, 2016; McQuire, 2008).” The living wall can be approached as more than a visible layer of vegetation. Environmental sensing, acoustic material and interactive media provide additional ways of exploring the conditions, processes and non-human activity associated with the site. Rather than making the ecology of the wall fully visible, these technologies offer partial and situated representations of what may otherwise remain difficult to perceive.',
      badge: 'LIVE ECOLOGICAL INTERFACE',
      meta: 'Present Day & Future Horizons',
      detailsLabel: 'See details',
      detailsUrl: 'https://www.ucl.ac.uk/news/2026/apr/transforming-gordon-street-where-campus-meets-community'
    }
  ];

  // Set up intersection observer for scroll-based image updating
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -40% 0px', // focused heavily on the viewport center
      threshold: 0.1
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const targetId = entry.target.getAttribute('data-stage') as StageId;
          if (targetId) {
            setActiveStage(targetId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    if (ancientRef.current) observer.observe(ancientRef.current);
    if (industrialRef.current) observer.observe(industrialRef.current);
    if (sensedRef.current) observer.observe(sensedRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Helper to smooth scroll to a section when clicked
  const scrollToStage = (id: StageId) => {
    setActiveStage(id);
    const refMap = {
      ancient: ancientRef,
      industrial: industrialRef,
      sensed: sensedRef
    };
    const targetRef = refMap[id];
    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full text-ink-charcoal">
      
      {/* Mobile Top-Sticky Visual Box: Pins to the top of the viewport when scrolling text on mobile */}
      <div className="block md:hidden sticky top-14 z-20 w-full bg-paper-bg/95 backdrop-blur-md border-b border-stone-200 pb-2 mb-4">
        <div className="relative aspect-16/10 w-full overflow-hidden border border-stone-200/80 bg-stone-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full"
            >
              {activeStage === 'ancient' ? (
                <div className="w-full h-full relative">
                  <img 
                    src={historyImages.ancient.src}
                    alt="Ancient Vernacular" 
                    className="w-full h-full object-cover"
                    onError={(event) => useHistoryFallback(event, 'ancient')}
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : activeStage === 'industrial' ? (
                <div className="w-full h-full relative">
                  <img 
                    src={historyImages.industrial.src}
                    alt="Industrial Engineered" 
                    className="w-full h-full object-cover"
                    onError={(event) => useHistoryFallback(event, 'industrial')}
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <img 
                    src={historyImages.sensed.src}
                    alt="Sensed Cybernetic" 
                    className="w-full h-full object-cover"
                    onError={(event) => useHistoryFallback(event, 'sensed')}
                    referrerPolicy="no-referrer"
                  />
                  {/* Neon pulsing dots for modern cyber-physical overlay */}
                  <div className="absolute top-[30%] left-[45%] w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-90" />
                  <div className="absolute top-[65%] left-[70%] w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-90 delay-700" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Era Indicator Badge */}
          <div className="absolute bottom-2 left-2 bg-ink-charcoal/95 text-[8px] text-paper-bg font-mono py-0.5 px-2 tracking-wider rounded-[1px]">
            {activeStage === 'ancient' ? 'ERA: VERNACULAR' : activeStage === 'industrial' ? 'ERA: INDUSTRIALIZED' : 'ERA: CYBERNETIC'}
          </div>
        </div>

        {/* Small horizontal tab pills on mobile to jump stages instantly */}
        <div className="flex gap-1 mt-2 px-1">
          {stages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => scrollToStage(stage.id)}
              className={`flex-1 py-1 text-[10px] font-mono border rounded-[1px] transition-all ${
                activeStage === stage.id
                  ? 'border-sage-primary text-sage-dark bg-sage-pale/40 font-bold'
                  : 'border-stone-200 text-stone-500 bg-paper-sheet/40'
              }`}
            >
              {stage.id === 'ancient' ? 'Ancient' : stage.id === 'industrial' ? 'Industrial' : 'Sensed'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative">
        
        {/* LEFT COLUMN: Takes up 1/3 only (md:col-span-4). Very elegant, large font descriptions */}
        <div className="md:col-span-5 relative space-y-24 md:py-16 md:pb-40">
          
          {/* Continuous Vertical Timeline Progress Track Line (Desktop Only) */}
          <div className="hidden md:block absolute left-2 top-20 bottom-44 w-[1px] bg-stone-200/60">
            {/* Filled Animated Highlight Line */}
            <div 
              className="absolute left-0 top-0 w-[1px] bg-sage-primary transition-all duration-500"
              style={{
                height: 
                  activeStage === 'ancient' ? '15%' :
                  activeStage === 'industrial' ? '50%' : '100%',
              }}
            />
          </div>

          {/* Text Blocks */}
          {stages.map((stage) => {
            const isSelected = activeStage === stage.id;
            
            return (
              <div
                key={stage.id}
                data-stage={stage.id}
                ref={
                  stage.id === 'ancient' ? ancientRef : 
                  stage.id === 'industrial' ? industrialRef : sensedRef
                }
                onClick={() => scrollToStage(stage.id)}
                className={`relative pl-0 md:pl-8 transition-all duration-300 group cursor-pointer ${
                  isSelected ? 'opacity-100' : 'opacity-40 hover:opacity-75'
                }`}
              >
                {/* Desk-only timeline circle node index indicator */}
                <div className="hidden md:flex absolute left-0 top-1.5 -translate-x-[4.5px] items-center justify-center">
                  <div 
                    className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                      isSelected 
                        ? 'bg-sage-primary border-sage-primary scale-125' 
                        : 'bg-paper-bg border-stone-300 group-hover:border-stone-400'
                    }`} 
                  />
                </div>

                <div className="space-y-3">
                  {/* Step Code & Year Index */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] tracking-widest text-sage-primary uppercase font-bold">
                      Stage {stage.stepNumber} // {stage.meta}
                    </span>
                  </div>

                  {/* LARGE ELEGANT DISPLAY HEADINGS */}
                  <HandwrittenTitle className="text-2xl md:text-3xl text-ink-charcoal group-hover:text-sage-dark transition-colors">
                    {stage.title}
                  </HandwrittenTitle>

                  <p className="font-sans text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    {stage.subtitle}
                  </p>

                  <div className="pt-2 border-t border-stone-200/30">
                    <p className="font-serif text-[13px] md:text-sm text-stone-600 leading-relaxed">
                      {stage.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Takes up 2/3 (md:col-span-7). Sticky, clean image viewer */}
        <div className="hidden md:block md:col-span-7 md:sticky md:top-20 w-full">
          <div className="relative w-full border border-stone-200 bg-paper-sheet overflow-hidden shadow-sm rounded-xs">
            {/* Era and specimen title */}
            <div className="z-10 flex items-center justify-between gap-4 px-4 py-3 border-b border-stone-150 bg-paper-bg/90">
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500">
                  {stages.find(s => s.id === activeStage)?.meta}
                </span>
                <span className="block mt-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-charcoal">
                  {activeStage === 'ancient'
                    ? 'Ancient Vernacular Construction'
                    : activeStage === 'industrial'
                      ? 'Industrial Engineered Facade Schema'
                      : 'Present Day Cybernetic Living Interface'}
                </span>
              </div>
              <a
                href={stages.find(stage => stage.id === activeStage)?.detailsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 rounded-[1px] bg-[#7c5b3f] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#624630]"
              >
                <span>See details</span>
                <ArrowUpRight size={10} />
              </a>
            </div>

            {/* High-Fidelity Historical Specimen Imagery container */}
            <div className="relative w-full aspect-[4/3] bg-stone-100 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStage}
                  initial={{ opacity: 0, scale: 1.03, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                  className="w-full h-full"
                >
                  {activeStage === 'ancient' ? (
                    <div className="w-full h-full relative">
                      <img 
                        src={historyImages.ancient.src}
                        alt="Ancient Vernacular Construction" 
                        className="w-full h-full object-cover object-center transition-all bg-stone-100"
                        onError={(event) => useHistoryFallback(event, 'ancient')}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : activeStage === 'industrial' ? (
                    <div className="w-full h-full relative">
                      <img 
                        src={historyImages.industrial.src}
                        alt="Industrial Engineered Facade Schema" 
                        className="w-full h-full object-cover object-center bg-stone-100"
                        onError={(event) => useHistoryFallback(event, 'industrial')}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full relative">
                      <img 
                        src={historyImages.sensed.src}
                        alt="Present Day Cybernetic Living Interface" 
                        className="w-full h-full object-cover object-center bg-stone-100"
                        onError={(event) => useHistoryFallback(event, 'sensed')}
                        referrerPolicy="no-referrer"
                      />
                      {/* Neon cybernetic nodes with glowing visual vectors overlaid on the image */}
                      {/* Sensed node 1 */}
                      <div className="absolute top-[28%] left-[40%] flex flex-col items-center">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                        <div className="bg-ink-charcoal/90 text-white text-[8px] font-mono py-0.5 px-1 rounded-[1px] mt-1 uppercase">
                          SHT35 // PRECISION_TEMP
                        </div>
                      </div>

                      {/* Sensed node 2 */}
                      <div className="absolute top-[60%] left-[68%] flex flex-col items-center">
                        <div className="w-3.5 h-3.5 rounded-full bg-sky-500 border border-white flex items-center justify-center animate-pulse delay-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                        <div className="bg-ink-charcoal/90 text-white text-[8px] font-mono py-0.5 px-1 rounded-[1px] mt-1 uppercase">
                          TEROS12 // MOISTURE
                        </div>
                      </div>

                      {/* Sensed node 3 */}
                      <div className="absolute top-[45%] left-[25%] flex flex-col items-center">
                        <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 border border-white flex items-center justify-center animate-pulse delay-1000">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                        <div className="bg-ink-charcoal/90 text-white text-[8px] font-mono py-0.5 px-1 rounded-[1px] mt-1 uppercase">
                          ACOUSTIC // AUDIO_ARRAY
                        </div>
                      </div>

                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Keep the image explanation in the document flow so it is always visible. */}
            <div className="border-t border-stone-200 bg-paper-sheet px-4 py-3 font-mono text-[11px] text-stone-500 leading-relaxed">
              <span>
                {activeStage === 'ancient'
                  ? 'A depiction of the Hanging Gardens of Babylon by Ferdinand Knab, 1886.'
                  : activeStage === 'industrial'
                    ? 'The Oasis of Aboukir — Patrick Blanc, 2013.'
                    : 'GordonStreet, LivingWall, 2026'}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
