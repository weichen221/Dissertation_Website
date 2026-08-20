import React from 'react';
import { SensorData } from '../lib/types';
import { CodePaper } from './CodePaper';
import { DataPipelineArchitecture } from './DataPipelineArchitecture';

export function ResizableTelemetryWorkbench({ data }: { data: SensorData }) {
  return (
    <div>
      <div className="mb-3 bg-paper-sheet border border-stone-200/80 p-4 text-xs text-stone-600 leading-relaxed">
        <span className="font-mono text-[11px] font-bold text-stone-800 uppercase block mb-1.5">Canopy Sensing Hub</span>
        <p>
          A compact, low-power sensor node is nestled discreetly within the ivy foliage. Equipped with delicate environmental probes and high-frequency microphones, the hub continuously records subtle micro-shifts in temperature, humidity, and acoustic signals directly inside the living plant layer, streaming updates wirelessly in real time.
        </p>
      </div>
      <div className="mb-3">
        <p className="text-xs text-stone-500 leading-relaxed font-serif italic max-w-2xl">Live JSON packets and their route through the sensing stack are shown as one connected telemetry workspace.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[22rem_minmax(0,1fr)] gap-5 items-stretch">
        <div className="min-w-0 min-h-0 relative z-20 h-[32rem] md:h-auto">
          <div className="h-full md:absolute md:inset-0">
            <CodePaper data={data} />
          </div>
        </div>
        <div className="min-w-0 h-full"><DataPipelineArchitecture /></div>
      </div>
    </div>
  );
}
