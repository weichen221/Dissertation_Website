/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SensorData } from '../lib/types';

interface CodePaperProps {
  data: SensorData;
}

export function CodePaper({ data }: CodePaperProps) {
  // Simple syntax highlighter for JSON
  const jsonString = JSON.stringify(data, null, 2);
  const broker = data.mqttStatus?.broker || 'mqtt.cetools.org:1883';

  return (
    <div className="bg-[#21201d] text-[#e3decb] border border-[#302e2a] font-mono text-[11px] leading-relaxed relative overflow-auto select-text flex flex-col w-full h-full min-w-0">
      {/* Blueprint header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#3d3a33] px-4 py-3 relative z-20 bg-[#21201d]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
          <span className="text-[10px] tracking-wider text-stone-400 font-semibold truncate">MQTT_TOPIC_STREAM: ucl/greenwall/feed</span>
        </div>
        <span className="text-[9px] text-[#c4a46c] shrink-0">Sensed_IoT_V1.0</span>
      </div>

      {/* Grid line watermark background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'linear-gradient(#e3decb 1px, transparent 1px), linear-gradient(90deg, #e3decb 1px, transparent 1px)',
          backgroundSize: '15px 15px'
        }}
      />

      <pre className="overflow-auto relative z-10 whitespace-pre-wrap sm:whitespace-pre scrollbar-thin px-3 py-3 flex-1 min-h-0">
        <code>
          {jsonString.split('\n').map((line, i) => {
            // Very simple token matching for pretty rendering
            let styledLine = line;
            if (line.includes(':')) {
              const parts = line.split(':');
              const key = parts[0];
              const val = parts.slice(1).join(':');
              styledLine = `<span class="text-[#c4a46c]">${key}</span>:<span class="text-emerald-400">${val}</span>`;
            }
            return (
              <div 
                key={i} 
                className="hover:bg-[#2c2a25] px-1 rounded-xs flex"
                dangerouslySetInnerHTML={{ __html: `<span class="text-stone-600 select-none w-6 inline-block text-right pr-2">${i+1}</span> ${styledLine}` }}
              />
            );
          })}
        </code>
      </pre>

      <div className="border-t border-[#3d3a33] px-4 py-2 text-[9px] text-stone-500 relative z-20 bg-[#21201d] shrink-0">
        <span className="truncate">Broker sample: {broker}</span>
      </div>
    </div>
  );
}
