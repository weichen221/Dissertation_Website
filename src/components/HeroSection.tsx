/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, ArrowDown } from 'lucide-react';
import { HandwrittenTitle } from './ReusableUI';

interface HeroSectionProps {
  dayImage: string;
  nightImage: string;
  currentData: any;
}

export default function HeroSection({ dayImage, nightImage, currentData }: HeroSectionProps) {
  // Determine if it is currently daytime or night-time locally
  const [ambientMode, setAmbientMode] = useState<'day' | 'night'>(() => {
    const currentHour = new Date().getHours();
    return (currentHour >= 6 && currentHour < 18) ? 'day' : 'night';
  });

  const [observationStage, setObservationStage] = useState<'day' | 'night' | 'and'>('day');

  return (
    <section className="pb-14 border-b border-sage-primary/10 scroll-mt-16 bg-paper-bg">
      {/* Full-screen moving cover */}
      <div className="relative h-[calc(100vh-3.5rem)] min-h-[36rem] w-full overflow-hidden bg-stone-950">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/landing.mp4"
          poster={dayImage}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 bg-[#17130d]/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/55" />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center text-white">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.42em] text-white/75">
            Gordon Street Living Wall · London
          </p>
          <HandwrittenTitle className="text-7xl sm:text-8xl md:text-9xl text-white">
            SENSE
          </HandwrittenTitle>
          <p className="mt-6 font-serif text-sm sm:text-base uppercase tracking-[0.28em] text-white/85">
            Observe · Interpret · Connect
          </p>
          <p className="mt-4 max-w-md font-serif text-sm italic leading-relaxed text-white/70">
            Revealing the hidden ecology of place.
          </p>
        </div>

        <a
          href="#day-night-observation"
          className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-white/75 transition-colors hover:text-white"
          aria-label="Continue to day and night observation"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.3em]">Day / Night</span>
          <ArrowDown size={17} className="animate-bounce" />
        </a>
      </div>

      <div id="day-night-observation" className="max-w-4xl mx-auto px-4 pt-12 md:px-8 md:pt-16 scroll-mt-14">
        <div className="mb-12">
          <HandwrittenTitle className="text-4xl text-stone-700 md:text-5xl">
            About SENSE
          </HandwrittenTitle>
          <div className="mx-auto mt-5 max-w-2xl space-y-3 text-left font-serif text-xs leading-5 text-stone-600 md:text-sm md:leading-6">
            <p>
              <strong className="font-semibold text-stone-800">SENSE is a student-led design research project developed at The Bartlett, UCL.</strong>{' '}
              It focuses on the proposed living wall at the Christopher Ingold Building on Gordon Street, within UCL’s Bloomsbury campus.
            </p>
            <p>
              Through an interactive website, the project brings together site context, day-and-night observation, environmental sensing, wall-layer visualisation, bioacoustics and community reflection. It explores how digital media can reveal ecological processes that are often difficult to perceive and support a deeper interpretation of the living wall as a changing ecological place.
            </p>
            <p>
              Visitors can explore the wall’s material construction, environmental conditions and non-human activity, while also contributing their own observations and perspectives to the developing representation of the site.
            </p>
          </div>
        </div>

        <div className="mb-7 space-y-2">
          <span className="block text-[10px] tracking-[0.2em] uppercase font-mono text-sage-primary">
            Exhibition Specimen 01
          </span>
          <HandwrittenTitle className="text-5xl text-stone-700 md:text-6xl">
            Day &amp; Night Observation
          </HandwrittenTitle>
        </div>

        {/* Ambient Visual Frame */}
        <div className="relative aspect-video w-full border-[10px] md:border-[14px] border-[#e9e0ce] outline outline-1 outline-stone-500/50 bg-paper-dark/30 shadow-[0_12px_30px_rgba(55,45,30,0.16)] group select-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={ambientMode}
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={ambientMode === 'day' ? dayImage : nightImage}
                alt={`Gordon Street living wall in the ${ambientMode}`}
                className="w-full h-full object-cover sepia-[0.12] contrast-[1.04] saturate-[0.88]"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </AnimatePresence>

          {/* Editorial overlay for landing-page atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#211b13]/75 via-[#211b13]/20 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

          <AnimatePresence mode="wait">
            {observationStage !== 'and' && (
              <motion.div
                key={observationStage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute bottom-0 left-0 z-10 max-w-2xl p-6 md:p-8 lg:p-10 pointer-events-none"
              >
            <p className="text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-white/70 font-mono mb-4">
                  {observationStage}
            </p>
                <p className="max-w-xl font-serif text-sm font-semibold leading-relaxed text-white sm:text-base md:text-lg">
                  {observationStage === 'day'
                    ? 'Vegetation, movement and bird activity become visible in daylight.'
                    : 'After dark, cooling, moisture and acoustic activity continue beyond ordinary sight.'}
            </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(observationStage === 'day'
                    ? ['LIGHT', 'GROWTH', 'BIRDSONG']
                    : ['COOLING', 'MOISTURE', 'HIDDEN SOUND']
                  ).map((tag) => (
                    <span key={tag} className="border border-white/40 bg-black/20 px-2 py-1 font-mono text-[8px] tracking-[0.2em] text-white/85 backdrop-blur-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Postal mark */}
          <div className="absolute right-5 top-5 z-20 flex h-24 w-24 rotate-[-8deg] items-center justify-center rounded-full border border-white/70 bg-white/10 backdrop-blur-[2px] shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_8px_18px_rgba(0,0,0,0.25)]">
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full border border-white/70 text-center font-mono text-[7.5px] uppercase leading-[1.35] tracking-[0.24em] text-white/90">
              <div>
                <div className="mb-1 text-[6.5px] tracking-[0.32em] text-white/70">UCL</div>
                <div className="font-semibold">BARTLETT</div>
                <div className="mt-1 text-[6px] tracking-[0.28em] text-white/70">LONDON</div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 z-30 flex gap-1.5 border border-stone-200/80 bg-paper-sheet/95 p-0.5 shadow-sm">
            <button
              onClick={() => { setAmbientMode('day'); setObservationStage('day'); }}
              className={`flex items-center gap-1.5 px-3 py-1 font-mono text-[10px] tracking-wider transition-all ${
                observationStage === 'day' ? 'bg-ink-charcoal font-bold text-white' : 'text-stone-500 hover:text-ink-charcoal'
              }`}
            >
              <Sun size={11} className={observationStage === 'day' ? 'text-amber-400' : 'text-stone-400'} />
              DAY
            </button>
            <button
              onClick={() => { setAmbientMode('night'); setObservationStage('night'); }}
              className={`flex items-center gap-1.5 px-3 py-1 font-mono text-[10px] tracking-wider transition-all ${
                observationStage === 'night' ? 'bg-ink-charcoal font-bold text-white' : 'text-stone-500 hover:text-ink-charcoal'
              }`}
            >
              <Moon size={11} className={observationStage === 'night' ? 'text-indigo-300' : 'text-stone-400'} />
              NIGHT
            </button>
            <button
              onClick={() => setObservationStage('and')}
              className={`px-3 py-1 font-mono text-[10px] tracking-wider transition-all ${
                observationStage === 'and' ? 'bg-ink-charcoal font-bold text-white' : 'text-stone-500 hover:text-ink-charcoal'
              }`}
            >
              AND
            </button>
          </div>

          <AnimatePresence>
            {observationStage === 'and' && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0.72 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0.82 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-[-3%] right-[-3%] top-1/2 z-25 flex -translate-y-1/2 flex-col items-center justify-center border-y border-stone-600/55 bg-[#d8c7a8]/95 px-6 py-9 text-center shadow-[0_10px_24px_rgba(30,24,16,0.28)] backdrop-blur-[2px]"
              >
                <span className="mb-3 font-mono text-[8px] uppercase tracking-[0.45em] text-stone-600">And</span>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="[font-family:'Caveat',cursive] text-3xl font-semibold text-stone-800 md:text-5xl"
                >
                  What changes—and what remains unseen?
                </motion.p>
                <motion.a
                  href="#history"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.15, duration: 0.6 }}
                  className="mt-6 border-b border-stone-700 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-stone-800"
                >
                  Start exploring ↓
                </motion.a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
