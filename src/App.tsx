/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Leaf, 
  Wind, 
  Droplets, 
  Sun, 
  Moon, 
  Volume2, 
  Activity, 
  Eye, 
  ArrowRight,
  BookOpen,
  Info,
  ChevronRight,
  ShieldCheck,
  Binary,
  Cpu
} from 'lucide-react';

// Recharts for our silent ecological graphs
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

// Import Types
import { SensorData, GlobalMode } from './lib/types';

// Import Clients & Helpers
import { dataClient } from './lib/dataClient';
import { loadGlobalMode, saveGlobalMode } from './lib/storage';
import { useMqtt } from './lib/useMqtt';

// Import Components
import { SidebarNav } from './components/SidebarNav';
import { TopStatusBar } from './components/TopStatusBar';
import HeroSection from './components/HeroSection';
import { CodePaper } from './components/CodePaper';
import { ResizableTelemetryWorkbench } from './components/ResizableTelemetryWorkbench';
import { CommunityObservationForm } from './components/CommunityObservationForm';
import WindChimeSoundscape from './components/WindChimeSoundscape';
import MicroHabitatDashboard from './components/MicroHabitatDashboard';
import HistoryTimeline from './components/HistoryTimeline';
import HiddenEcology from './components/HiddenEcology';
import LocationMapSection from './components/LocationMapSection';
import { 
  SectionFrame, 
  HandwrittenTitle,
  PaperNote, 
  CaptionStrip, 
  QuietDataBadge, 
  SegmentedToggle, 
  AnnotationPanel 
} from './components/ReusableUI';

// Import image assets through Vite ESM so they resolve correctly
import HERO_DAY_IMG from './assets/images/hero_day_1782830793176.jpg';
import HERO_NIGHT_IMG from './assets/images/hero_night_1782830808488.jpg';
import FRONT_ELEVATION_IMG from './assets/images/front_elevation_1782830846750.jpg';

export default function App() {
  // Navigation & Shell States
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Global Settings States
  const [globalMode, setGlobalMode] = useState<GlobalMode>('auto');
  const [sensorMode, setSensorMode] = useState<'mqtt' | 'api'>('mqtt');

  // Frontend WebSocket MQTT Hook
  const { mqttState, liveSensorData } = useMqtt(sensorMode === 'mqtt');

  // Sensor Data Stream State
  const [currentData, setCurrentData] = useState<SensorData>(liveSensorData);
  const [historyData, setHistoryData] = useState<SensorData[]>([]);

  // Local Interaction States
  const [activeElevationPin, setActiveElevationPin] = useState<string | null>('unified_node');
  const [ecologyVisible, setEcologyVisible] = useState<boolean>(true);
  const [ecologyPage, setEcologyPage] = useState<'mapping' | 'dashboard'>('mapping');
  const [soundscapeDay, setSoundscapeDay] = useState<boolean>(true);
  const [historyStage, setHistoryStage] = useState<'ancient' | 'industrial' | 'sensed'>('sensed');

  // Accordion state for references
  const [referencesExpanded, setReferencesExpanded] = useState<boolean>(false);

  // Load preferences on mount
  useEffect(() => {
    const savedMode = loadGlobalMode();
    setGlobalMode(savedMode);
  }, []);

  // Sync mode changes to storage
  const handleGlobalModeChange = (mode: GlobalMode) => {
    setGlobalMode(mode);
    saveGlobalMode(mode);
  };

  // Sync live MQTT sensor data when sensorMode === 'mqtt'
  useEffect(() => {
    if (sensorMode === 'mqtt') {
      const formattedMqttStatus = {
        connected: mqttState.status === 'connected',
        broker: mqttState.brokerUrl,
        subscribedTopics: mqttState.subscribedTopics,
        lastMessageTime: mqttState.lastMessageTime,
        messageCount: mqttState.messageCount,
        recentTopics: mqttState.recentMessages.map(m => ({
          topic: m.topic,
          value: m.message,
          rawPayload: m.rawMessage,
          timestamp: m.receivedAt
        })),
        lastError: mqttState.lastError || undefined
      };

      const combinedData: SensorData = {
        ...liveSensorData,
        mqttStatus: formattedMqttStatus
      };

      setCurrentData(combinedData);

      setHistoryData(prev => {
        const updated = [...prev, combinedData];
        if (updated.length > 8) return updated.slice(updated.length - 8);
        return updated;
      });
    }
  }, [sensorMode, liveSensorData, mqttState]);

  // Setup live-updating data stream for api mode.
  useEffect(() => {
    if (sensorMode === 'api') {
      dataClient.startStream((data) => {
        setCurrentData(data);
        setHistoryData((prev) => {
          const updated = [...prev, data];
          if (updated.length > 8) return updated.slice(updated.length - 8);
          return updated;
        });
      }, sensorMode, globalMode);
    }

    return () => {
      dataClient.stopStream();
    };
  }, [sensorMode, globalMode]);

  useEffect(() => {
    if (sensorMode === 'mqtt') {
      setCurrentData(liveSensorData);
    }
  }, [sensorMode, liveSensorData]);

  // Section Observer to automatically update active left-sidebar item on scroll
  const sectionsRef = useRef<string[]>(['overview', 'history', 'ecology', 'realtime', 'charts', 'soundscape', 'community', 'references', 'location']);
  
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    sectionsRef.current.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Format timestamp nicely for humans
  const formatSensorTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-paper-bg text-ink-charcoal antialiased selection:bg-sage-pale selection:text-sage-dark">
      
      {/* Persistent App Shell Elements */}
      <SidebarNav 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        isOpen={mobileMenuOpen} 
        setIsOpen={setMobileMenuOpen} 
      />

      <TopStatusBar 
        globalMode={globalMode} 
        setGlobalMode={handleGlobalModeChange} 
        lastUpdated={currentData.timestamp}
        sensorMode={sensorMode}
        setSensorMode={setSensorMode}
      />

      {/* Main Content Stage */}
      <main className="lg:pl-64 pt-14 min-h-screen flex flex-col justify-between bg-paper-bg">
        <div className="flex-1 pb-20 paper-texture">
          
          {/* ========================================================= */}
          {/* 1. OVERVIEW / HERO SECTION */}
          {/* ========================================================= */}
          <div id="overview" className="scroll-mt-16">
            <HeroSection 
              dayImage={HERO_DAY_IMG} 
              nightImage={HERO_NIGHT_IMG} 
              currentData={currentData} 
            />
          </div>

          {/* ========================================================= */}
          {/* 2. HISTORY TIMELINE SECTION */}
          {/* ========================================================= */}
          <SectionFrame 
            id="history" 
            title="History Timeline" 
            subtitle="Tracing the development of building greening systems from ancient antiquity to cybernetic skins."
            badge="Exhibition Specimen 02"
          >
            <HistoryTimeline 
              heroDayImg={HERO_DAY_IMG} 
              frontElevationImg={FRONT_ELEVATION_IMG} 
            />
          </SectionFrame>

          {/* ========================================================= */}
          {/* 3. BENEFITS & HIDDEN ECOLOGY SECTION */}
          {/* ========================================================= */}
          <SectionFrame 
            id="ecology" 
            title="From Wall to Wider System" 
            subtitle="Start by observing the wall itself, then explore how it connects to wider water, climate, ecological, social and urban systems."
            badge="Exhibition Specimen 03"
          >
            <HiddenEcology 
              frontElevationImg={FRONT_ELEVATION_IMG} 
              currentData={currentData} 
            />
          </SectionFrame>

          {/* ========================================================= */}
          {/* 4. REAL-TIME DATA SECTION */}
          {/* ========================================================= */}
          <SectionFrame 
            id="realtime" 
            title="Real-Time Data Feed & Data Pipeline" 
            subtitle="Explore real-time microclimatic values on the front elevation of the living facade alongside the hardware IoT principles and telemetric data pipeline."
            badge="Exhibition Specimen 04"
          >
            <div className="space-y-6">
              
              {/* Image Elevation with Single Integrated Sensor Node Pin */}
              <div className="relative border border-stone-200/80 aspect-4/3 overflow-hidden bg-paper-dark/30">
                <img 
                  src={FRONT_ELEVATION_IMG} 
                  alt="UCL Green Wall Front Elevation"
                  className="w-full h-full object-cover opacity-90"
                  referrerPolicy="no-referrer"
                />

                {/* Single Unified IoT Sensor Node Pin */}
                <AnnotationPanel
                  title="IoT Sensor Node"
                  x="52%"
                  y="38%"
                  active={activeElevationPin === 'unified_node'}
                  onClick={() => setActiveElevationPin(activeElevationPin === 'unified_node' ? null : 'unified_node')}
                >
                  IoT Sensor Node deployed inside the dense ivy foliage, capturing canopy acoustics and microclimate.
                </AnnotationPanel>

                {/* Overlay Instruction Badge */}
                <div className="absolute top-3 left-3 bg-paper-sheet/90 border border-stone-200/80 py-1 px-2.5 text-[10px] font-mono tracking-wider text-stone-600 shadow-xs">
                  CLICK PIN TO INSPECT UNIFIED SENSOR HUB
                </div>
              </div>

              <div className="hidden">
                <div className="order-2 bg-paper-sheet border border-stone-200/80 p-4 font-sans space-y-3">
                  <div className="flex items-center gap-2 border-b border-stone-200/60 pb-2">
                    <Cpu size={16} className="text-sage-primary" />
                    <h4 className="font-serif font-medium text-ink-charcoal text-xs uppercase tracking-wider font-mono">
                      Sensing Principles & Environmental Translation
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-600 leading-relaxed">
                    <div className="space-y-1.5">
                      <span className="font-mono text-[11px] font-bold text-stone-800 uppercase block">1. Canopy Sensing Hub</span>
                      <p>
                        A compact, low-power sensor node is nestled discreetly within the ivy foliage. Equipped with delicate environmental probes and high-frequency microphones, the hub continuously records subtle micro-shifts in temperature, humidity, and acoustic signals directly inside the living plant layer, streaming updates wirelessly in real time.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="font-mono text-[11px] font-bold text-stone-800 uppercase block">2. Environmental Metrics & Audio Detection</span>
                      <ul className="list-disc list-inside space-y-1.5 text-[11px] font-sans text-stone-600">
                        <li><strong>Microclimate (Air & Moisture):</strong> Measures temperature and relative humidity inside the leaf canopy, capturing how foliage creates a cooler micro-environment.</li>
                        <li><strong>Bio-Acoustics (Birds & Bats):</strong> Listens for wildlife activity, distinguishing daylight bird songs (2–8 kHz) from ultrasonic bat echolocation (&gt;20 kHz) to index nocturnal biodiversity.</li>
                        <li><strong>Solar & Wind Exposure:</strong> Tracks sunlight intensity and ambient air speed across the facade to monitor foliage stress and urban shelter dynamics.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Split: Live JSON Log Stream vs Data Pipeline Architecture (Vertical Layout) */}
              <ResizableTelemetryWorkbench data={currentData} />
              <div className="hidden">
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-stone-500 leading-relaxed font-serif italic">
                    The telemetry pipeline streams data packets down to our web client via JSON payloads. Toggle between modes in the header to simulate active broker updates.
                  </p>
                  <div className="max-w-none">
                    <CodePaper data={currentData} />
                  </div>
                </div>

                {/* Vertical Data Pipeline Architecture Layout (纵轴排布) */}
                <div className="flex flex-col justify-start border border-stone-200 bg-paper-sheet/40 p-4 font-mono self-start">
                  <div>
                    <span className="text-[10px] text-sage-primary uppercase tracking-widest block mb-1">Telemetric Pipeline</span>
                    <h4 className="font-serif font-medium text-ink-charcoal text-sm mb-1">Data Pipeline Architecture</h4>
                    <p className="text-[11px] text-stone-500 font-sans mb-4 leading-relaxed">
                      Visualizing the telemetric flow from raw sensory triggers inside the foliage to situated live-drawings on your screen.
                    </p>
                  </div>

                  {/* Vertical Step-by-Step Flow (纵轴排布) */}
                  <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200/80">
                    
                    {/* Step 1 */}
                    <div className="relative pl-8">
                      <div className="absolute left-1.5 top-1 -translate-x-1/2 w-4 h-4 rounded-full bg-paper-sheet border-2 border-sage-primary flex items-center justify-center text-[9px] font-bold text-sage-primary z-10">
                        1
                      </div>
                      <div className="bg-paper-sheet/90 border border-stone-200/80 p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-stone-400 font-mono">01 // SIGNAL ACQUISITION</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-sage-primary/10 text-sage-primary rounded-xs">1000Hz ADC</span>
                        </div>
                        <h5 className="font-serif font-medium text-xs text-ink-charcoal mt-0.5">Raw Sensory Voltage Triggers</h5>
                        <p className="text-[11px] text-stone-500 font-sans mt-1 leading-snug">
                          Sensory transducers (BME280, MEMS mics) capture micro-voltages inside dense ivy foliage.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative pl-8">
                      <div className="absolute left-1.5 top-1 -translate-x-1/2 w-4 h-4 rounded-full bg-paper-sheet border-2 border-sage-primary flex items-center justify-center text-[9px] font-bold text-sage-primary z-10">
                        2
                      </div>
                      <div className="bg-paper-sheet/90 border border-stone-200/80 p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-stone-400 font-mono">02 // EDGE FFT PROCESSING</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-700 rounded-xs">ESP32 Compute</span>
                        </div>
                        <h5 className="font-serif font-medium text-xs text-ink-charcoal mt-0.5">Spectral FFT Peak Windowing</h5>
                        <p className="text-[11px] text-stone-500 font-sans mt-1 leading-snug">
                          Onboard FFT algorithm categorizes avian calls (2–8 kHz) and bat echolocation pulses (&gt;20 kHz).
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative pl-8">
                      <div className="absolute left-1.5 top-1 -translate-x-1/2 w-4 h-4 rounded-full bg-paper-sheet border-2 border-sage-primary flex items-center justify-center text-[9px] font-bold text-sage-primary z-10">
                        3
                      </div>
                      <div className="bg-paper-sheet/90 border border-stone-200/80 p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-stone-400 font-mono">03 // MQTT BROKERAGE</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-sky-500/10 text-sky-700 rounded-xs">QoS 1 Stream</span>
                        </div>
                        <h5 className="font-serif font-medium text-xs text-ink-charcoal mt-0.5">Telemetry Topic Publishing</h5>
                        <p className="text-[11px] text-stone-500 font-sans mt-1 leading-snug">
                          Formats readings into JSON payloads published over MQTT topics (`UCL/GordonStreet/sensors/*`).
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="relative pl-8">
                      <div className="absolute left-1.5 top-1 -translate-x-1/2 w-4 h-4 rounded-full bg-paper-sheet border-2 border-sage-primary flex items-center justify-center text-[9px] font-bold text-sage-primary z-10">
                        4
                      </div>
                      <div className="bg-paper-sheet/90 border border-stone-200/80 p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-stone-400 font-mono">04 // SITUATED WEB RENDER</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-xs">Vite React State</span>
                        </div>
                        <h5 className="font-serif font-medium text-xs text-ink-charcoal mt-0.5">Dynamic Visual Coordinates</h5>
                        <p className="text-[11px] text-stone-500 font-sans mt-1 leading-snug">
                          Web app subscribes to live stream, updating facade drawings, gauges, and historical scatter plots.
                        </p>
                      </div>
                    </div>

                  </div>

                  <div className="mt-3 text-[10px] text-stone-400 text-right font-mono">
                    Pipeline status: ACTIVE_LIVE (5s polling sync)
                  </div>
                </div>
              </div>

            </div>
          </SectionFrame>

          {/* ========================================================= */}
          {/* 5. VISUAL TELEMETRY & CHARTS: "...and what does it look like?" */}
          {/* ========================================================= */}
          <SectionFrame 
            id="charts" 
            title="Explore Environmental Change" 
            subtitle="Explore temperature, humidity, light, wind and rainfall around the living wall. These measurements offer a snapshot of changing conditions around the living wall. They can help reveal environmental changes that may not be immediately visible."
            badge="Exhibition Specimen 05"
          >
            <MicroHabitatDashboard currentData={currentData} />
          </SectionFrame>

          {/* ========================================================= */}
          {/* 6. SOUNDSCAPE SECTION: "...and what does it sound like?" */}
          {/* ========================================================= */}
          <SectionFrame 
            id="soundscape" 
            title="Listen to the Living Wall" 
            subtitle="Explore sound samples associated with the living wall, selected through acoustic data and temporal patterns. They are not direct recordings of the site, but interpretive samples that offer another way to encounter possible non-human activity."
            badge="Exhibition Specimen 06"
          >
            <div className="space-y-6">
              
              {/* Day/Night soundscape toggle */}
              <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                <span className="text-xs uppercase font-mono text-stone-400">Biological Shift</span>
                <SegmentedToggle
                  options={[
                    { value: 'day', label: 'Day (Avian focus)' },
                    { value: 'night', label: 'Night (Microbat focus)' }
                  ]}
                  selected={soundscapeDay ? 'day' : 'night'}
                  onChange={(val) => setSoundscapeDay(val === 'day')}
                />
              </div>

              {/* Dynamic Interactive Wind Chime Matrix */}
              <WindChimeSoundscape isDaytime={soundscapeDay} />

              {/* Vocal counts status and call activity details */}
              <div className="w-full">
                <PaperNote 
                  title={soundscapeDay ? "Daytime: Bird Chatter" : "Nighttime: Microbat Echolocation"} 
                  annotation="Acoustic telemetry"
                >
                  {soundscapeDay ? (
                    <div className="space-y-2">
                      <p className="text-xs leading-relaxed text-stone-600">
                        Avian activity peaks around sunrise and sunset. Core species include the blue tit, goldfinch, and robin, communicating territorial boundaries and nesting triggers.
                      </p>
                      <span className="block text-sm font-semibold font-mono text-sage-primary">
                        Recorded calls: {currentData.bird_calls_min} vocalizations/min
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs leading-relaxed text-stone-600">
                        Microbats navigate Gordon St using ultrasonic echolocation calls (~45kHz). Peak flight paths occur under twilight coverage as they forage for insects nested in the wall.
                      </p>
                      <span className="block text-sm font-semibold font-mono text-emerald-600">
                        Recorded calls: {currentData.bat_calls_min} vocalizations/min
                      </span>
                    </div>
                  )}
                </PaperNote>
              </div>

            </div>
          </SectionFrame>

          {/* ========================================================= */}
          {/* 7. COMMUNITY PARTICIPATION SECTION */}
          {/* ========================================================= */}
          <SectionFrame 
            id="community" 
            title="Community Participation Logs" 
            subtitle="Are you walking down Gordon Street? Help register botanical or animal activity on our shared wall."
            badge="Exhibition Specimen 07"
          >
            <div className="space-y-6">
              
              <div className="prose max-w-none text-stone-600 text-sm leading-relaxed font-serif">
                <p>
                  Sensing ecosystems is not solely the domain of silicon chips. Human biophilic attention completes the loop. Tap on the ecological observation tags below to log physical anomalies or moments of natural overlap.
                </p>
              </div>

              {/* Real form */}
              <CommunityObservationForm currentSensorData={currentData} />

            </div>
          </SectionFrame>

          {/* ========================================================= */}
          {/* 8. REFERENCES SECTION */}
          {/* ========================================================= */}
          <section id="references" className="py-12 border-b border-stone-200/60 scroll-mt-16">
            <div className="max-w-4xl mx-auto px-4 md:px-8">
              
              <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-sage-primary">— Specimen 09</span>
                  <HandwrittenTitle className="text-5xl md:text-6xl text-ink-charcoal">Academic References</HandwrittenTitle>
                </div>
                
                <button
                  onClick={() => setReferencesExpanded(!referencesExpanded)}
                  className="text-xs font-mono text-sage-primary hover:text-sage-dark flex items-center gap-1 cursor-pointer"
                >
                  <span>{referencesExpanded ? 'COLLAPSE_LOG' : 'EXPAND_LOG'}</span>
                  <ChevronRight size={14} className={`transform transition-transform ${referencesExpanded ? 'rotate-90' : ''}`} />
                </button>
              </div>

              <div className="mt-4">
                <AnimatePresence initial={false}>
                  {(referencesExpanded || true) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-4 pt-2 text-xs leading-relaxed text-stone-500 font-serif"
                    >
                      <div className="pl-4 border-l-2 border-stone-200 py-1">
                        <span className="font-semibold text-ink-charcoal">Enzi-Zechner, M., et al. (2025)</span> “Standardization of building greening in Central Europe: A historical review of standards and policy support.” <span className="italic">Building and Environment</span>, 268, p. 112105.
                      </div>
                      <div className="pl-4 border-l-2 border-stone-200 py-1">
                        <span className="font-semibold text-ink-charcoal">Gabrys, J. (2016)</span> <span className="italic">Program Earth: Environmental Sensing Technology and the Making of a Computational Planet</span>. Minneapolis: University of Minnesota Press.
                      </div>
                      <div className="pl-4 border-l-2 border-stone-200 py-1">
                        <span className="font-semibold text-ink-charcoal">McQuire, S. (2008)</span> <span className="italic">The Media City: Media, Architecture and Urban Space</span>. London: SAGE Publications.
                      </div>
                      <div className="pl-4 border-l-2 border-stone-200 py-1">
                        <span className="font-semibold text-ink-charcoal">Gandy, M. (2012)</span> “Queer ecology: nature, sexuality, and heterotopic alliances.” <span className="italic">Environment and Planning D: Society and Space</span>, 30(4), pp. 727-747.
                      </div>
                      <div className="pl-4 border-l-2 border-stone-200 py-1">
                        <span className="font-semibold text-ink-charcoal">Manso, M. and Castro-Gomes, J. (2015)</span> “Green wall systems: A review of their characteristics.” <span className="italic">Renewable and Sustainable Energy Reviews</span>, 41, pp. 863-871. doi: 10.1016/j.rser.2014.07.203.
                      </div>
                      <div className="pl-4 border-l-2 border-stone-200 py-1">
                        <span className="font-semibold text-ink-charcoal">Jim, C.Y., Hui, L.C. and Rupprecht, C.D.D. (2022)</span> “Public perceptions of green roofs and green walls in Tokyo, Japan: A call to heighten awareness.” <span className="italic">Environmental Management</span>, 70(1), pp. 35-53. doi: 10.1007/s00267-022-01625-8.
                      </div>
                      <div className="pl-4 border-l-2 border-stone-200 py-1">
                        <span className="font-semibold text-ink-charcoal">Nevárez-Favela, M.M., García-Albarado, J.C., Quevedo-Nolasco, A., López-Pérez, A. and Bolaños-González, M.A. (2023)</span> “Perception of green infrastructure systems: Green walls and green roofs.” <span className="italic">Agrociencia</span>, 57(8). doi: 10.47163/agrociencia.v57i8.3077.
                      </div>
                      <div className="pl-4 border-l-2 border-stone-200 py-1">
                        <span className="font-semibold text-ink-charcoal">Theodoridou, I. et al. (2025)</span> “Benefits and monetary values of vertical greening systems: A semi-systematic review.” <span className="italic">Building and Environment</span>, 284, 113463. doi: 10.1016/j.buildenv.2025.113463.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </section>

          {/* ========================================================= */}
          {/* 9. LOCATION & COORDINATES SECTION */}
          {/* ========================================================= */}
          <LocationMapSection />

        </div>

        {/* Global Footer */}
        <footer className="bg-paper-sheet border-t border-stone-200 py-8 px-4 text-center text-xs text-stone-400 font-mono">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf size={14} className="text-sage-primary" />
              <span>UCL Bartlett Prototype (Sensing the Living Wall)</span>
            </div>
            <span>Academic Term 2026</span>
          </div>
        </footer>

      </main>

    </div>
  );
}
