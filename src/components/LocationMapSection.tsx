/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HandwrittenTitle } from './ReusableUI';
import { 
  MapPin, 
  ExternalLink, 
  Copy, 
  Check, 
  Navigation, 
  Layers, 
  Compass, 
  Globe, 
  Building,
  Maximize2
} from 'lucide-react';

export default function LocationMapSection() {
  const [copied, setCopied] = useState(false);

  const lat = 51.524556;
  const lng = -0.132278;
  const coordStringDMS = `51°31'28.4"N 0°07'56.2"W`;
  const coordStringDec = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  const placeQuery = '22 Gordon Street, London WC1H 0QB';
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`;
  const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeQuery)}`;
  const uclMapsUrl = googleMapsUrl;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${coordStringDMS} (${coordStringDec})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="location" className="py-12 border-t border-stone-200/80 scroll-mt-16 bg-stone-50/50">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-200 pb-3">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase font-mono text-sage-primary font-bold flex items-center gap-1.5">
              <span>Specimen Location</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            </div>
            <HandwrittenTitle className="text-5xl md:text-6xl text-ink-charcoal mt-2">
              Geographic Coordinates
              <br />
              & Site Map
            </HandwrittenTitle>
          </div>
          <div className="text-xs font-mono text-stone-500 flex items-center gap-1">
            <Compass size={13} className="text-sage-primary" />
            <span>Bloomsbury Urban Canopy Zone</span>
          </div>
        </div>

        {/* Google Maps Style Card Container */}
        <div className="border border-stone-300/80 bg-white shadow-xs rounded-xs overflow-hidden">
          
          {/* Map Top Bar */}
          <div className="bg-stone-900 text-stone-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xs">
                <MapPin size={14} className="fill-white stroke-red-600" />
              </div>
              <div>
                <span className="font-bold text-white block text-[11px] uppercase tracking-wider">
                  22 Gordon Street
                </span>
                <span className="text-[10px] text-stone-400">
                  London WC1H 0QB, United Kingdom
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-stone-800 text-emerald-400 border border-stone-700 px-2 py-0.5 rounded-[1px] text-[10px] font-bold">
                {coordStringDMS}
              </span>
              <button
                onClick={handleCopyCoords}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 px-2 py-0.5 rounded-[1px] text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Copy coordinates"
              >
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{copied ? 'COPIED' : 'COPY GPS'}</span>
              </button>
            </div>
          </div>

          {/* Map Display Frame */}
          <div className="relative aspect-16/9 sm:aspect-21/9 w-full bg-stone-900 overflow-hidden group select-none">
            
            {/* Map Background Layer */}
            <div className="absolute inset-0 w-full h-full transition-all duration-500">
              <div className="relative w-full h-full bg-[#1b241c]">
                {/* Grid overlay simulating high-res satellite map tile */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'radial-gradient(#4ad084 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '20px 20px, 40px 40px'
                  }}
                />
                {/* Stylized street path */}
                <div className="absolute top-0 bottom-0 left-[35%] w-16 bg-stone-800/80 border-x border-stone-700/50 rotate-6" />
                <div className="absolute top-[40%] left-0 right-0 h-10 bg-stone-800/80 border-y border-stone-700/50 -rotate-3" />
                {/* Building shapes */}
                <div className="absolute top-[10%] left-[10%] w-[20%] h-[35%] bg-stone-800 border border-stone-600/40 rounded-xs flex items-center justify-center">
                  <span className="text-[8px] font-mono text-stone-400 font-bold uppercase tracking-widest text-center px-1">
                    UCL Student Centre
                  </span>
                </div>
                <div className="absolute top-[15%] right-[15%] w-[25%] h-[40%] bg-stone-800 border border-stone-600/40 rounded-xs flex items-center justify-center">
                  <span className="text-[8px] font-mono text-stone-400 font-bold uppercase tracking-widest text-center px-1">
                    Bartlett Architecture
                  </span>
                </div>
                {/* Greenery zone */}
                <div className="absolute top-[30%] left-[36%] w-6 h-28 bg-emerald-600/40 border border-emerald-400/60 rounded-xs backdrop-blur-[1px]" />
              </div>
            </div>

            {/* Google Pin Marker in Center */}
            <div className="absolute top-[45%] left-[37%] -translate-x-1/2 -translate-y-full z-20 flex flex-col items-center pointer-events-none">
              {/* Callout box */}
              <div className="bg-stone-900 text-white border border-stone-700 px-2.5 py-1 rounded-[2px] shadow-lg text-[10px] font-mono font-bold whitespace-nowrap mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>22 GORDON STREET</span>
              </div>
              {/* Red Google map pin */}
              <div className="relative">
                <MapPin size={32} className="text-red-600 fill-red-600 drop-shadow-md animate-bounce" />
                <div className="w-3 h-1.5 bg-black/40 rounded-full blur-[1px] absolute -bottom-1 left-1/2 -translate-x-1/2" />
              </div>
            </div>

            {/* Bottom Left Coordinate HUD Box */}
            <div className="absolute bottom-3 left-3 z-10 bg-stone-900/90 backdrop-blur-md border border-stone-700 text-white px-3 py-1.5 rounded-[2px] text-[10px] font-mono space-y-0.5">
              <div className="text-emerald-400 font-bold flex items-center gap-1">
                <Globe size={10} />
                <span>LAT: {lat.toFixed(6)}° N // LNG: {lng.toFixed(6)}° W</span>
              </div>
              <div className="text-stone-400 text-[9px]">
                Easting: 529810 // Northing: 182190 (OSGB36)
              </div>
            </div>

            {/* Bottom Right Direct Action Link */}
            <a
              href={uclMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 z-10 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 px-3 py-1.5 rounded-[2px] text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ExternalLink size={11} className="text-red-600" />
              <span>Open Google Maps</span>
            </a>
          </div>

          {/* Map Footer Metadata Grid */}
          <div className="p-4 bg-stone-50 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="space-y-1 border-b sm:border-b-0 sm:border-r border-stone-200 pb-2 sm:pb-0 sm:pr-2">
              <span className="text-[9px] text-stone-400 uppercase tracking-wider block">Physical Address</span>
              <div className="font-serif text-stone-800 text-xs font-semibold leading-snug">
                22 Gordon Street, London WC1H 0QB
              </div>
              <span className="text-[10px] text-sage-primary block">Home of The Bartlett School of Architecture</span>
            </div>

            <div className="space-y-1 border-b sm:border-b-0 sm:border-r border-stone-200 pb-2 sm:pb-0 sm:pr-2">
              <span className="text-[9px] text-stone-400 uppercase tracking-wider block">Facade Orientation</span>
              <div className="font-serif text-stone-800 text-xs font-semibold leading-snug">
                East-Facing Vertical Elevation (084° E)
              </div>
              <span className="text-[10px] text-stone-500 block">Height: 8.4m // Surface: 120m²</span>
            </div>

            <div className="space-y-1 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-stone-400 uppercase tracking-wider block">Navigation Links</span>
                <div className="flex gap-2 mt-1">
                  <a
                    href={googleDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-sage-primary hover:bg-sage-dark text-white rounded-[1px] text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    <Navigation size={10} />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
