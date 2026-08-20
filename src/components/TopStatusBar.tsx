/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Moon, Sparkles, Activity } from 'lucide-react';

interface TopStatusBarProps {
  globalMode: 'day' | 'night' | 'auto';
  setGlobalMode: (mode: 'day' | 'night' | 'auto') => void;
  lastUpdated: string | null;
  sensorMode: 'mqtt' | 'api';
  setSensorMode: (mode: 'mqtt' | 'api') => void;
}

export function TopStatusBar({
  globalMode,
  setGlobalMode,
  lastUpdated,
  sensorMode,
  setSensorMode
}: TopStatusBarProps) {
  const formattedTime = lastUpdated 
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Connecting...';

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-14 border-b border-sage-primary/20 px-4 md:px-8 flex items-center justify-between bg-paper-bg z-20">
      <div className="flex items-center space-x-4 md:space-x-6">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-charcoal">LIVE FEED</span>
        </div>
        <div className="h-4 w-px bg-sage-primary/20"></div>
        
        {/* Stream Source Selector styled matching the theme */}
        <div className="flex items-center space-x-1.5 text-xs font-mono">
          <span className="text-[9px] text-sage-primary/60 uppercase tracking-wider hidden sm:inline">Stream:</span>
          <select 
            value={sensorMode}
            onChange={(e) => setSensorMode(e.target.value as 'mqtt' | 'api')}
            className="bg-transparent border border-sage-primary/20 py-0.5 px-1.5 text-sage-primary rounded-xs focus:outline-none focus:border-sage-primary text-[10px] font-mono cursor-pointer"
          >
            <option value="mqtt" className="bg-paper-sheet">MQTT_PORT_1883</option>
            <option value="api" className="bg-paper-sheet">API_PULL_3000</option>
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-4 md:space-x-8">
        <div className="text-[10px] text-right">
          <span className="block opacity-50 text-[9px] uppercase tracking-wider">LAST UPDATED</span>
          <span className="font-mono font-medium text-sage-primary">{formattedTime}</span>
        </div>

        {/* Segmented Controller matching the design's DAY/NIGHT/AUTO capsules */}
        <div className="flex bg-paper-dark rounded-full p-1 border border-sage-primary/10">
          <button 
            onClick={() => setGlobalMode('day')}
            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer uppercase ${
              globalMode === 'day' 
                ? 'bg-paper-sheet text-ink-charcoal shadow-xs' 
                : 'opacity-50 hover:opacity-80 text-ink-charcoal'
            }`}
          >
            Day
          </button>
          <button 
            onClick={() => setGlobalMode('night')}
            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer uppercase ${
              globalMode === 'night' 
                ? 'bg-paper-sheet text-ink-charcoal shadow-xs' 
                : 'opacity-50 hover:opacity-80 text-ink-charcoal'
            }`}
          >
            Night
          </button>
          <button 
            onClick={() => setGlobalMode('auto')}
            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer uppercase ${
              globalMode === 'auto' 
                ? 'bg-paper-sheet text-ink-charcoal shadow-xs' 
                : 'opacity-50 hover:opacity-80 text-ink-charcoal'
            }`}
          >
            Auto
          </button>
        </div>
      </div>
    </header>
  );
}
