import React from 'react';
import { Activity, Cpu, Radio, Monitor, Waves } from 'lucide-react';

const steps = [
  ['1', '01 // SIGNAL ACQUISITION', '1000Hz ADC', 'Raw Sensory Voltage Triggers', 'BME280 and MEMS transducers capture micro-voltages inside dense ivy foliage.', 'bg-sage-primary/10 text-sage-primary'],
  ['2', '02 // EDGE FFT PROCESSING', 'ESP32 Compute', 'Spectral FFT Peak Windowing', 'Onboard FFT categorizes avian calls (2–8 kHz) and bat pulses (>20 kHz).', 'bg-purple-500/10 text-purple-700'],
  ['3', '03 // MQTT BROKERAGE', 'QoS 1 Stream', 'Telemetry Topic Publishing', 'JSON readings publish over UCL/GordonStreet sensor and bio-acoustic topics.', 'bg-sky-500/10 text-sky-700'],
  ['4', '04 // SITUATED WEB RENDER', 'Vite React State', 'Dynamic Visual Coordinates', 'The live stream updates facade drawings, gauges, and historical plots.', 'bg-emerald-500/10 text-emerald-700']
];

function PipelineVector() {
  const nodes = [
    { x: 48, Icon: Activity, title: 'SENSE', sub: 'BME280 + MEMS' },
    { x: 164, Icon: Cpu, title: 'COMPUTE', sub: 'ESP32 / FFT' },
    { x: 280, Icon: Radio, title: 'PUBLISH', sub: 'MQTT / QoS 1' },
    { x: 396, Icon: Monitor, title: 'RENDER', sub: 'React client' }
  ];
  return (
    <div className="relative overflow-hidden border border-stone-200/80 bg-[#f4f3ed] min-h-[190px] flex items-center">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#b9c3b2 1px, transparent 1px), linear-gradient(90deg, #b9c3b2 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      <svg viewBox="0 0 460 184" className="relative z-10 w-full h-auto" role="img" aria-label="Sensor data moving through edge processing and MQTT to the web interface">
        <defs>
          <marker id="pipeline-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#73936c" /></marker>
        </defs>
        <path d="M72 76 C98 44 116 108 140 76 S214 44 256 76 S328 108 372 76" fill="none" stroke="#cbd4c6" strokeWidth="12" opacity=".35" />
        <path d="M75 76 H137 M191 76 H253 M307 76 H369" fill="none" stroke="#73936c" strokeWidth="2" strokeDasharray="5 5" markerEnd="url(#pipeline-arrow)" />
        {[104, 220, 336].map((x, index) => <circle key={x} cx={x} cy="76" r="3" fill="#4f9b68"><animate attributeName="cx" values={`${x - 24};${x + 24}`} dur={`${1.4 + index * .2}s`} repeatCount="indefinite" /><animate attributeName="opacity" values=".2;1;.2" dur={`${1.4 + index * .2}s`} repeatCount="indefinite" /></circle>)}
        {nodes.map(({ x, title, sub }) => <g key={title}><circle cx={x} cy="76" r="27" fill="#fbfaf5" stroke="#73936c" strokeWidth="1.5" /><circle cx={x} cy="76" r="21" fill="none" stroke="#d9ded5" strokeDasharray="2 3" /><text x={x} y="128" textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="700" fill="#3f493c">{title}</text><text x={x} y="143" textAnchor="middle" fontSize="8" fill="#858a80">{sub}</text></g>)}
      </svg>
      <div className="pointer-events-none absolute inset-0 z-20">
        {nodes.map(({ x, Icon, title }) => <Icon key={title} size={19} className="absolute text-sage-primary" style={{ left: `${x / 4.6}%`, top: '41.3%', transform: 'translate(-50%, -50%)' }} />)}
      </div>
      <div className="absolute left-3 top-2 z-20 flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-stone-400"><Waves size={12} className="text-sage-primary" />LIVE TELEMETRIC PATH</div>
    </div>
  );
}

export function DataPipelineArchitecture() {
  return (
    <div className="h-full flex flex-col border border-stone-200 bg-paper-sheet/40 p-4 font-mono">
      <span className="text-[10px] text-sage-primary uppercase tracking-widest block mb-1">Telemetric Pipeline</span>
      <h4 className="font-serif font-medium text-ink-charcoal text-sm mb-1">Data Pipeline Architecture</h4>
      <p className="text-[11px] text-stone-500 font-sans mb-4 leading-relaxed">From raw sensory triggers inside the foliage to situated live drawings on your screen.</p>
      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(18rem,1.05fr)_minmax(15rem,.95fr)] gap-4 flex-1">
        <PipelineVector />
        <div className="space-y-2 relative before:absolute before:left-2 before:top-3 before:bottom-3 before:w-px before:bg-stone-200/80">
          {steps.map(([number, label, badge, title, body, badgeClass]) => (
            <div key={number} className="relative pl-6">
              <div className="absolute left-2 top-3 -translate-x-1/2 w-4 h-4 rounded-full bg-paper-sheet border-2 border-sage-primary flex items-center justify-center text-[8px] font-bold text-sage-primary z-10">{number}</div>
              <div className="bg-paper-sheet/90 border border-stone-200/80 p-2.5">
                <div className="flex items-center justify-between gap-2"><span className="text-[9px] text-stone-400">{label}</span><span className={`text-[8px] px-1.5 py-0.5 rounded-xs shrink-0 ${badgeClass}`}>{badge}</span></div>
                <h5 className="font-serif font-medium text-xs text-ink-charcoal mt-0.5">{title}</h5>
                <p className="text-[10px] text-stone-500 font-sans mt-1 leading-snug">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 text-[9px] text-stone-400 text-right">Pipeline status: ACTIVE_LIVE · 5s polling sync</div>
    </div>
  );
}
