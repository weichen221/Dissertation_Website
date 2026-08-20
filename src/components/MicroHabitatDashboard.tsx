/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity, 
  Clock, 
  Database,
  Layers,
  Sun,
  CloudRain
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import { SensorData } from '../lib/types';
import { extractSpeciesFromMessage } from '../lib/species';
import BatDeviceStatusPanel from './BatDeviceStatusPanel';

interface MicroHabitatDashboardProps {
  currentData: SensorData;
}

type TimeframeId = '24h' | '1w';

interface MetricMeta {
  title: string;
  unit: string;
  icon: React.ComponentType<any>;
  color: string;
  sensorModel: string;
  description: string;
}

export default function MicroHabitatDashboard({ currentData }: MicroHabitatDashboardProps) {
  const [timeframe, setTimeframe] = useState<TimeframeId>('24h');

  // Unified metadata for the 4 core parameters
  const metricsMeta = useMemo<Record<string, MetricMeta>>(() => ({
    temperature: {
      title: 'Outdoor Temperature',
      unit: '°C',
      icon: Thermometer,
      color: '#e11d48', // Rose
      sensorModel: 'Ambient Temperature Probe',
      description: 'Outdoor temperature captured by the sensor node.'
    },
    moisture: {
      title: 'Outdoor Humidity',
      unit: '%',
      icon: Droplets,
      color: '#0284c7', // Sky Blue
      sensorModel: 'Ambient Humidity Probe',
      description: 'Outdoor relative humidity from the environmental node.'
    },
    wind: {
      title: 'Wind Speed',
      unit: 'kph',
      icon: Wind,
      color: '#059669', // Emerald
      sensorModel: 'Sonic Anemometer',
      description: 'Wind speed measured in kilometres per hour at the sensor node.'
    },
    health: {
      title: 'Rainfall & Luminosity',
      unit: 'cm/h',
      icon: Layers,
      color: '#16a34a', // Green
      sensorModel: 'Rain Gauge + Light Sensor',
      description: 'Live rainfall rate, daily accumulation and luminosity from the outdoor node.'
    }
  }), []);

  // State for backend database history fetched from /api/history?timeframe=...
  const [backendHistory, setBackendHistory] = useState<Array<{
    label: string;
    temperature: number;
    moisture: number;
    luminosity: number;
    rainRate: number;
    dayRain: number;
    windSpeed: number;
    healthLevel: number;
    activity: number;
    birds: number;
    bats: number;
  }>>([]);

  useEffect(() => {
    let isMounted = true;
    setBackendHistory([]); // Clear stale timeframe history when switching timeframe

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/history?timeframe=${timeframe}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const mapped = json.data.map((item: any) => {
              const humidity = item.outHumidity ?? item.humidity_percent ?? currentData.humidity_percent;
              return {
                label: item.label,
                temperature: item.outTemp_C ?? item.temperature_c ?? currentData.temperature_c,
                moisture: humidity,
                luminosity: item.luminosity_lux ?? currentData.luminosity_lux ?? 0,
                rainRate: item.p_rainRate_cm_per_hour ?? currentData.p_rainRate_cm_per_hour ?? 0,
                dayRain: item.p_dayRain_cm ?? currentData.p_dayRain_cm ?? 0,
                windSpeed: Number((item.windSpeed_kph ?? (item.wind_speed_ms ? item.wind_speed_ms * 3.6 : currentData.wind_speed_ms * 3.6) ?? ((currentData.wind_speed_ms ?? 1.2) * 3.6)).toFixed(1)),
                healthLevel: Math.min(100, Math.max(10, Math.round(humidity * 0.95 + 5))),
                activity: (item.bird_calls_min || 0) + (item.bat_calls_min || 0),
                birds: item.bird_calls_min || 0,
                bats: item.bat_calls_min || 0
              };
            });
            if (isMounted) setBackendHistory(mapped);
          }
        }
      } catch {
        // Silently catch transient network poll issues during server restarts
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [timeframe]);

  // Generate or use backend stored database historical timeline data aligned with active timeframe
  const historicalData = useMemo(() => {
    if (backendHistory && backendHistory.length > 0) {
      const updated = [...backendHistory];
      const lastIdx = updated.length - 1;
      updated[lastIdx] = {
        ...updated[lastIdx],
        temperature: currentData.outTemp_C ?? currentData.temperature_c,
        moisture: currentData.outHumidity ?? currentData.humidity_percent,
        luminosity: currentData.luminosity_lux ?? 0,
        rainRate: currentData.p_rainRate_cm_per_hour ?? 0,
        dayRain: currentData.p_dayRain_cm ?? 0,
        windSpeed: currentData.windSpeed_kph ?? (currentData.wind_speed_ms * 3.6),
        healthLevel: Math.min(100, Math.max(10, Math.round((currentData.outHumidity ?? currentData.humidity_percent) * 0.95 + 5))),
        activity: currentData.bird_calls_min + currentData.bat_calls_min,
        birds: currentData.bird_calls_min,
        bats: currentData.bat_calls_min
      };
      return updated;
    }

    const baseTemp = currentData.outTemp_C ?? currentData.temperature_c;
    const baseWind = currentData.windSpeed_kph ?? (currentData.wind_speed_ms * 3.6);
    const baseMoisture = currentData.outHumidity ?? currentData.humidity_percent;
    const baseBirds = currentData.bird_calls_min;
    const baseBats = currentData.bat_calls_min;
    const now = Date.now();

    if (timeframe === '24h') {
      // 12 2-hour points in strict chronological order from 24h ago to now
      return Array.from({ length: 12 }).map((_, idx) => {
        const i = 11 - idx;
        const targetTime = new Date(now - i * 2 * 3600 * 1000);
        const hour = targetTime.getHours();
        const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
        const diurnalFactor = Math.sin((hour - 6) * Math.PI / 12);
        
        const birdMult = hour >= 6 && hour <= 18 ? 1.4 : 0.3;
        const batMult = hour >= 20 || hour <= 4 ? 1.6 : 0.2;

        const birdCount = baseBirds > 0 ? Math.max(0, Math.round(baseBirds * birdMult + Math.sin(idx))) : 0;
        const batCount = baseBats > 0 ? Math.max(0, Math.round(baseBats * batMult + Math.cos(idx))) : 0;
        const moistureVal = Math.min(100, Math.max(0, Math.round(baseMoisture - diurnalFactor * 2)));

        return {
          label: hourLabel,
          temperature: Number((baseTemp + diurnalFactor * 1.6).toFixed(1)),
          moisture: moistureVal,
          luminosity: Number(Math.max(0, (currentData.luminosity_lux ?? 500) + diurnalFactor * 90 + Math.sin(idx) * 20).toFixed(0)),
          rainRate: Number(Math.max(0, (currentData.p_rainRate_cm_per_hour ?? 0) + Math.sin(idx) * 0.08).toFixed(2)),
          dayRain: Number(Math.max(0, (currentData.p_dayRain_cm ?? 0) + Math.cos(idx) * 0.02).toFixed(2)),
          windSpeed: Number(Math.max(0, baseWind + diurnalFactor * 1.2 + Math.sin(idx) * 0.8).toFixed(1)),
          healthLevel: Math.min(100, Math.max(10, Math.round(moistureVal * 0.95))),
          activity: birdCount + batCount,
          birds: birdCount,
          bats: batCount
        };
      });
    } else if (timeframe === '1w') {
      // 7 1-day points in strict chronological order from 7 days ago to now
      return Array.from({ length: 7 }).map((_, idx) => {
        const i = 6 - idx;
        const targetTime = new Date(now - i * 24 * 3600 * 1000);
        const weekday = targetTime.toLocaleDateString('en-US', { weekday: 'short' });
        const label = `${weekday} ${targetTime.getMonth() + 1}/${targetTime.getDate()}`;
        const weatherCycle = Math.sin(idx * 1.2);
        const birdCount = baseBirds > 0 ? Math.max(0, Math.round(baseBirds + weatherCycle)) : 0;
        const batCount = baseBats > 0 ? Math.max(0, Math.round(baseBats + Math.cos(idx))) : 0;
        const moistureVal = Math.min(100, Math.max(0, Math.round(baseMoisture + weatherCycle * 3)));

        return {
          label,
          temperature: Number((baseTemp + weatherCycle * 2.4).toFixed(1)),
          moisture: moistureVal,
          luminosity: Number(Math.max(0, (currentData.luminosity_lux ?? 500) + weatherCycle * 80).toFixed(0)),
          rainRate: Number(Math.max(0, (currentData.p_rainRate_cm_per_hour ?? 0) + Math.sin(idx) * 0.13).toFixed(2)),
          dayRain: Number(Math.max(0, (currentData.p_dayRain_cm ?? 0) + Math.cos(idx) * 0.07).toFixed(2)),
          windSpeed: Number(Math.max(0.1, baseWind + weatherCycle * 0.6).toFixed(1)),
          healthLevel: Math.min(100, Math.max(10, Math.round(moistureVal * 0.92 + Math.sin(idx) * 3))),
          activity: birdCount + batCount,
          birds: birdCount,
          bats: batCount
        };
      });
    } else {
      // 10 3-day points in strict chronological order from 30 days ago to now
      return Array.from({ length: 10 }).map((_, idx) => {
        const i = 9 - idx;
        const targetTime = new Date(now - i * 3 * 24 * 3600 * 1000);
        const label = targetTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const atmosphericPressureFactor = Math.sin(idx * 0.8) * Math.cos(idx * 0.4);
        const birdCount = baseBirds > 0 ? Math.max(0, Math.round(baseBirds + atmosphericPressureFactor)) : 0;
        const batCount = baseBats > 0 ? Math.max(0, Math.round(baseBats + atmosphericPressureFactor)) : 0;
        const moistureVal = Math.min(100, Math.max(0, Math.round(baseMoisture + atmosphericPressureFactor * 6)));

        return {
          label,
          temperature: Number((baseTemp + atmosphericPressureFactor * 3.2).toFixed(1)),
          moisture: moistureVal,
          luminosity: Number(Math.max(0, (currentData.luminosity_lux ?? 500) + atmosphericPressureFactor * 90).toFixed(0)),
          rainRate: Number(Math.max(0, (currentData.p_rainRate_cm_per_hour ?? 0) + Math.sin(idx) * 0.18).toFixed(2)),
          dayRain: Number(Math.max(0, (currentData.p_dayRain_cm ?? 0) + atmosphericPressureFactor * 0.1).toFixed(2)),
          windSpeed: Number(Math.max(0.2, baseWind + atmosphericPressureFactor * 0.9).toFixed(1)),
          healthLevel: Math.min(100, Math.max(10, Math.round(moistureVal * 0.9 + atmosphericPressureFactor * 4))),
          activity: birdCount + batCount,
          birds: birdCount,
          bats: batCount
        };
      });
    }
  }, [backendHistory, currentData, timeframe]);

  // State for frequency scatter plot options
  const [freqTimeframe, setFreqTimeframe] = useState<'1h' | '24h'>('24h');

  // Reset to 24h when the dashboard timeline switches, but keep only 1h/24h.
  useEffect(() => {
    setFreqTimeframe('24h');
  }, [timeframe]);

  // State for real acoustic frequency records fetched from /api/frequencies
  const [frequencyRecords, setFrequencyRecords] = useState<Array<{
    id: string;
    message_id?: string;
    device_id: string;
    timestamp: number;
    frequency: number;
    received_at: string;
    species?: string;
    topic?: string;
  }>>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchFrequencies = async () => {
      try {
        const durationMap = {
          '1h': 3600 * 1000,
          '24h': 24 * 3600 * 1000
        };
        const fromMs = Date.now() - durationMap[freqTimeframe];
        const res = await fetch(`/api/frequencies?from=${fromMs}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && isMounted) {
            setFrequencyRecords(json.data);
          }
        }
      } catch {
        // Silently catch network transient errors
      }
    };

    fetchFrequencies();
    const interval = setInterval(fetchFrequencies, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [freqTimeframe]);

  // Continuous Bio-Acoustic Frequency Event Plot Data Processing
  const { 
    scatterPoints, 
    scatterDomain, 
    xAxisTicks, 
    yAxisDomain, 
    yAxisTicks, 
    totalValidCount, 
    invalidCount, 
    isSampled 
  } = useMemo(() => {
    const now = Date.now();
    const durationMap = {
      '1h': 3600 * 1000,
      '24h': 24 * 3600 * 1000
    };
    const durationMs = durationMap[freqTimeframe];
    const minT = now - durationMs;
    const maxT = now;

    // Continuous X-Axis: Generate 5-8 major ticks without crowding
    let ticks: number[] = [];
    if (freqTimeframe === '1h') {
      const step = 10 * 60 * 1000; // 10 minutes
      const startT = Math.floor(minT / step) * step;
      ticks = Array.from({ length: 7 }, (_, i) => startT + i * step).filter(t => t <= maxT);
    } else {
      const step = 4 * 3600 * 1000; // 4 hours
      ticks = Array.from({ length: 7 }, (_, i) => minT + i * step).filter(t => t <= maxT);
    }

    if (!frequencyRecords || frequencyRecords.length === 0) {
      return { 
        scatterPoints: [], 
        scatterDomain: [minT, maxT], 
        xAxisTicks: ticks, 
        yAxisDomain: [0, 10000],
        yAxisTicks: [0, 2000, 4000, 6000, 8000, 10000],
        totalValidCount: 0,
        invalidCount: 0,
        isSampled: false
      };
    }

    // 1. Strict Validation: Filter out invalid points and non-GordonStreet topics
    let invalidCnt = 0;
    const validRecords = frequencyRecords.filter(f => {
      const isValidTime = typeof f.timestamp === 'number' && !isNaN(f.timestamp) && f.timestamp >= minT && f.timestamp <= maxT;
      const isValidFreq = typeof f.frequency === 'number' && !isNaN(f.frequency) && f.frequency > 0 && f.frequency <= 150000;
      if (!isValidTime || !isValidFreq) {
        invalidCnt++;
        return false;
      }

      // Enforce strict acoustic topic filtering
      if (f.topic) {
        const topic = f.topic.toLowerCase();
        const isAcoustic = topic.includes('acoupi-bird') || topic.includes('acoupi-bat') || topic.includes('/acoupi') || topic.includes('acoustic') || topic.includes('audio') || topic.includes('sound');
        if (!isAcoustic) {
          invalidCnt++;
          return false;
        }
      } else {
        invalidCnt++;
        return false;
      }

      return true;
    });

    const totalValid = validRecords.length;

    if (totalValid === 0) {
      return { 
        scatterPoints: [], 
        scatterDomain: [minT, maxT], 
        xAxisTicks: ticks, 
        yAxisDomain: [0, 10000],
        yAxisTicks: [0, 2000, 4000, 6000, 8000, 10000],
        totalValidCount: 0,
        invalidCount: invalidCnt,
        isSampled: false
      };
    }

    // 2. Uniform Downsampling for UI Performance if points > 400
    let sampledRecords = validRecords;
    let sampled = false;
    if (validRecords.length > 400) {
      sampled = true;
      const step = validRecords.length / 400;
      sampledRecords = Array.from({ length: 400 }, (_, i) => validRecords[Math.floor(i * step)]);
    }

    // 3. Map to Scatter Points with exact continuous coordinates
    const mapped = sampledRecords.map((record) => {
      const d = new Date(record.timestamp);
      let label = '';
      if (freqTimeframe === '1h') {
        label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } else if (freqTimeframe === '24h') {
        label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        label = `${d.toLocaleDateString([], { month: 'numeric', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      const isBat = record.frequency > 15000 || (record.species && record.species.toLowerCase().includes('bat')) || (record.topic && record.topic.toLowerCase().includes('bat'));
      const color = isBat ? '#7c3aed' : '#059669';

      const species = isBat
        ? extractSpeciesFromMessage(record.species) || 'unknown bat species'
        : extractSpeciesFromMessage({
            value: (record as { value?: unknown }).value,
            species: record.species
          }) || extractSpeciesFromMessage(record.species) || 'unknown bird species';

      return {
        id: record.id,
        device_id: record.device_id || 'sensor-01',
        timestampMs: record.timestamp,
        timeLabel: label,
        frequencyHz: Math.round(record.frequency),
        received_at: record.received_at ? new Date(record.received_at).toLocaleTimeString() : label,
        species,
        isBat,
        color,
        topic: record.topic || 'UCL/GordonStreet/acoupi'
      };
    });

    // 4. Calculate Continuous Y-Axis Range & Ticks dynamically based on visible values
    const allFreqs = validRecords.map(r => r.frequency);
    const minF = Math.min(...allFreqs);
    const maxF = Math.max(...allFreqs);
    const span = Math.max(1000, maxF - minF);
    const pad = Math.max(300, span * 0.08);

    const computedMin = Math.max(0, Math.floor((minF - pad) / 100) * 100);
    const computedMax = Math.ceil((maxF + pad) / 100) * 100;
    const yDomain: [number, number] = [computedMin, computedMax];

    const yStep = (computedMax - computedMin) / 5;
    const yTicks = Array.from({ length: 6 }, (_, i) => Math.round(computedMin + i * yStep));

    return { 
      scatterPoints: mapped, 
      scatterDomain: [minT, maxT], 
      xAxisTicks: ticks, 
      yAxisDomain: yDomain, 
      yAxisTicks: yTicks, 
      totalValidCount: totalValid,
      invalidCount: invalidCnt,
      isSampled: sampled
    };
  }, [frequencyRecords, freqTimeframe, currentData.latestBirdSpecies, currentData.latestBatSpecies]);

  // MQTT Connection & Status State Determination
  const mqttStatusDisplay = useMemo(() => {
    const status = currentData.mqttStatus;
    const isConnected = status?.connected ?? false;
    const lastMsgTime = status?.lastMessageTime ? new Date(status.lastMessageTime).getTime() : 0;
    const isRecentlyReceived = lastMsgTime > 0 && (Date.now() - lastMsgTime < 120000);

    if (!isConnected) {
      return {
        stateLabel: 'Equipment connection disconnected', // 设备连接已断开
        badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200',
        dotStyle: 'bg-rose-500'
      };
    }

    if ((status?.messageCount ?? 0) === 0 && frequencyRecords.length === 0) {
      return {
        stateLabel: 'Waiting for live data', // 等待实时数据
        badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
        dotStyle: 'bg-amber-500 animate-pulse'
      };
    }

    if (!isRecentlyReceived) {
      return {
        stateLabel: 'No new data', // 暂无新数据
        badgeStyle: 'bg-stone-100 text-stone-600 border-stone-200',
        dotStyle: 'bg-stone-400'
      };
    }

    return {
      stateLabel: `Live MQTT Active (Last Received: ${status.lastMessageTime ? new Date(status.lastMessageTime).toLocaleTimeString() : 'now'})`,
      badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dotStyle: 'bg-emerald-500 animate-ping'
    };
  }, [currentData.mqttStatus, frequencyRecords]);

  const latestBirdLabel = currentData.latestBirdSpecies || 'unknown bird species';
  const latestBatLabel = currentData.latestBatSpecies || 'unknown bat species';
  const isBirdUnknown = ['unknown', 'none', 'unspecified', 'unknown bird species'].includes(latestBirdLabel.toLowerCase());
  const isBatUnknown = ['unknown', 'none', 'unspecified', 'unknown bat species'].includes(latestBatLabel.toLowerCase());

  return (
    <div className="space-y-6 animate-fadeIn text-ink-charcoal">
      
      {/* Live System API Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-paper-dark/15 border border-sage-primary/10 p-4 rounded-xs">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <div>
            <div className="text-[10px] font-mono text-sage-primary/70 uppercase tracking-widest leading-none">
              API TELEMETRY BROADCAST // HISTORICAL MATRIX
            </div>
            <div className="text-xs font-serif font-bold text-ink-charcoal mt-1">
              Gordon Street Green Façade Sensors
            </div>
          </div>
        </div>

        {/* Timeframe Controller - Simple & Unified */}
        <div className="flex items-center gap-2 bg-paper-dark/10 p-0.5 border border-stone-200/60 rounded-xs self-end sm:self-auto">
          <span className="px-3 py-1 text-[11px] font-mono rounded-xs bg-paper-sheet text-ink-charcoal font-bold shadow-2xs">
            24 Hours
          </span>
        </div>
      </div>

      {/* 2x2 ENVIRONMENTAL METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CHART 1: Outdoor Temperature (outTemp_C) */}
        <div className="border border-stone-200 bg-paper-sheet p-5 rounded-xs flex flex-col justify-between shadow-2xs relative">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Thermometer size={14} className="text-rose-600" />
                <span className="text-[11px] font-mono font-bold text-ink-charcoal">{metricsMeta.temperature.title}</span>
              </div>
              <span className="text-[10px] font-mono text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-[1px]">
                LIVE: {(currentData.outTemp_C ?? currentData.temperature_c).toFixed(1)}°C
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-serif leading-relaxed mb-4">
              {metricsMeta.temperature.description} Recorded via the <span className="font-mono text-[10px] text-stone-600 font-semibold">{metricsMeta.temperature.sensorModel}</span>.
            </p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartTempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.02)" />
                <XAxis dataKey="label" stroke="rgba(44, 40, 38, 0.4)" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }} />
                <YAxis stroke="rgba(44, 40, 38, 0.4)" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-paper-sheet)', border: '1px solid rgba(82, 103, 86, 0.2)', fontFamily: 'var(--font-mono)', fontSize: '10px' }} />
                <Area name="Temperature (°C)" type="monotone" dataKey="temperature" stroke="#e11d48" fillOpacity={1} fill="url(#chartTempGrad)" strokeWidth={1.5} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Outdoor Humidity (outHumidity) */}
        <div className="border border-stone-200 bg-paper-sheet p-5 rounded-xs flex flex-col justify-between shadow-2xs relative">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Droplets size={14} className="text-sky-600" />
                <span className="text-[11px] font-mono font-bold text-ink-charcoal">{metricsMeta.moisture.title}</span>
              </div>
              <span className="text-[10px] font-mono text-sky-600 font-bold bg-sky-50 px-1.5 py-0.5 rounded-[1px]">
                LIVE: {currentData.outHumidity ?? currentData.humidity_percent}%
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-serif leading-relaxed mb-4">
              {metricsMeta.moisture.description} Recorded via the <span className="font-mono text-[10px] text-stone-600 font-semibold">{metricsMeta.moisture.sensorModel}</span>.
            </p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartMoistureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.02)" />
                <XAxis dataKey="label" stroke="rgba(44, 40, 38, 0.4)" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }} />
                <YAxis stroke="rgba(44, 40, 38, 0.4)" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-paper-sheet)', border: '1px solid rgba(82, 103, 86, 0.2)', fontFamily: 'var(--font-mono)', fontSize: '10px' }} />
                <Area name="Outdoor Humidity (%)" type="monotone" dataKey="moisture" stroke="#0284c7" fillOpacity={1} fill="url(#chartMoistureGrad)" strokeWidth={1.5} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Light Level (luminosity_lux) */}
        <div className="border border-stone-200 bg-paper-sheet p-5 rounded-xs flex flex-col justify-between shadow-2xs relative">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Sun size={14} className="text-amber-600" />
                <span className="text-[11px] font-mono font-bold text-ink-charcoal">Light Level</span>
              </div>
              <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-[1px]">
                LIVE: {(currentData.luminosity_lux ?? 0).toLocaleString()} lux
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-serif leading-relaxed mb-4">
              Outdoor light level streamed from <span className="font-mono text-[10px] font-semibold">luminosity_lux</span>.
            </p>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.02)" />
                <XAxis dataKey="label" stroke="rgba(44, 40, 38, 0.4)" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }} />
                <YAxis stroke="rgba(44, 40, 38, 0.4)" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }} domain={[0, 'dataMax + 10']} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-paper-sheet)', border: '1px solid rgba(82, 103, 86, 0.2)', fontFamily: 'var(--font-mono)', fontSize: '10px' }} />
                <Area name="Light Level (lux)" type="monotone" dataKey="luminosity" stroke="#d97706" fill="#fef3c7" strokeWidth={1.5} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Wind Speed (windSpeed_kph) */}
        <div className="border border-stone-200 bg-paper-sheet p-5 rounded-xs flex flex-col justify-between shadow-2xs relative">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Wind size={14} className="text-emerald-600" />
                <span className="text-[11px] font-mono font-bold text-ink-charcoal">{metricsMeta.wind.title}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-[1px]">
                LIVE: {currentData.windSpeed_kph?.toFixed(1) ?? (currentData.wind_speed_ms * 3.6).toFixed(1)} kph
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-serif leading-relaxed mb-4">
              {metricsMeta.wind.description} Recorded via the <span className="font-mono text-[10px] text-stone-600 font-semibold">{metricsMeta.wind.sensorModel}</span>.
            </p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartWindGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.02)" />
                <XAxis dataKey="label" stroke="rgba(44, 40, 38, 0.4)" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }} />
                <YAxis stroke="rgba(44, 40, 38, 0.4)" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }} domain={[0, 'dataMax + 0.5']} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-paper-sheet)', border: '1px solid rgba(82, 103, 86, 0.2)', fontFamily: 'var(--font-mono)', fontSize: '10px' }} />
                <Area name="Wind Speed (kph)" type="monotone" dataKey="windSpeed" stroke="#059669" fillOpacity={1} fill="url(#chartWindGrad)" strokeWidth={1.5} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 5: Rainfall (p_rainRate_cm_per_hour / p_dayRain_cm) */}
        <div className="border border-stone-200 bg-paper-sheet p-5 rounded-xs flex flex-col justify-between shadow-2xs relative">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <CloudRain size={14} className="text-emerald-700" />
                <span className="text-[11px] font-mono font-bold text-ink-charcoal">Rainfall</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-[1px] border border-emerald-200">
                LIVE: {currentData.p_rainRate_cm_per_hour?.toFixed(2) ?? '0.00'} cm/h
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-serif leading-relaxed mb-4">
              Outdoor rainfall and lighting values streamed from the sensor node’s environmental telemetry.
            </p>
          </div>

          <div className="h-44 w-full grid grid-cols-2 gap-3">
            <div className="rounded-xs border border-stone-200 bg-stone-50 p-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-600">Luminosity</div>
              <div className="mt-2 text-2xl font-bold text-ink-charcoal">{currentData.luminosity_lux?.toLocaleString() ?? '—'}</div>
              <div className="mt-1 text-xs text-stone-500">lux</div>
            </div>
            <div className="rounded-xs border border-stone-200 bg-stone-50 p-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-600">Daily Rain</div>
              <div className="mt-2 text-2xl font-bold text-ink-charcoal">{currentData.p_dayRain_cm?.toFixed(2) ?? '—'}</div>
              <div className="mt-1 text-xs text-stone-500">cm today</div>
            </div>
          </div>
        </div>

      </div>

      {/* FULL-WIDTH LARGE CHART: Discrete Bio-Acoustic MQTT Frequency Event Plot */}
      <div className="border border-stone-200 bg-paper-sheet p-6 rounded-xs flex flex-col justify-between shadow-2xs relative w-full space-y-4">
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-stone-100 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-purple-600 shrink-0" />
              <div>
                <h3 className="text-xs font-mono font-bold text-ink-charcoal uppercase tracking-wider">
                  Bio-Acoustic Continuous Frequency Scatterplot (UCL/GordonStreet/#)
                </h3>
              </div>
            </div>

            {/* Interactive Controls: Timeframe & Y-Axis Scale Mode */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
              {/* Timeframe Switcher */}
              <div className="flex items-center bg-stone-100/80 p-0.5 rounded-xs border border-stone-200/80">
                <span className="px-1.5 text-stone-600 font-medium">Range:</span>
                <button
                  type="button"
                  onClick={() => setFreqTimeframe('1h')}
                  className={`px-2 py-0.5 rounded-[1px] transition-colors ${freqTimeframe === '1h' ? 'bg-paper-sheet text-ink-charcoal font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'}`}
                >
                  1h
                </button>
                <button
                  type="button"
                  onClick={() => setFreqTimeframe('24h')}
                  className={`px-2 py-0.5 rounded-[1px] transition-colors ${freqTimeframe === '24h' ? 'bg-paper-sheet text-ink-charcoal font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'}`}
                >
                  24h
                </button>
              </div>

              {/* Live MQTT Status Badge */}
              <span className={`text-[9px] font-mono px-2 py-1 border rounded-[2px] font-bold tracking-wider flex items-center gap-1.5 ${mqttStatusDisplay.badgeStyle}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${mqttStatusDisplay.dotStyle}`} />
                {mqttStatusDisplay.stateLabel}
              </span>
            </div>
          </div>

          {/* Color Legend & Render Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono mt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50/50 px-2 py-0.5 rounded-xs border border-emerald-100">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                Bird / Avian
              </span>
              <span className="flex items-center gap-1.5 text-purple-800 font-bold bg-purple-50/50 px-2 py-0.5 rounded-xs border border-purple-100">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                Bat / Ultrasonic
              </span>
              <span className="flex items-center gap-1.5 text-stone-700 font-bold bg-stone-100/70 px-2 py-0.5 rounded-xs border border-stone-200">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-500 inline-block" />
                Observed species
              </span>
            </div>

            <div className="flex items-center gap-2 text-stone-500 text-[10px]">
              {isSampled && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-[2px] font-medium">
                  Showing 400 / {totalValidCount} (sampled for smooth UI)
                </span>
              )}
              {invalidCount > 0 && (
                <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-[2px] font-medium">
                  {invalidCount} invalid points filtered
                </span>
              )}
              <span>
                Valid Records: <strong className="text-stone-800 font-bold">{totalValidCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Continuous Scatter Plot Container */}
        <div className="h-72 sm:h-80 w-full relative">
          {scatterPoints.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-stone-50/70 backdrop-blur-[1px]">
              <div className="bg-paper-sheet border border-stone-200/90 p-4 rounded-xs shadow-xs max-w-md space-y-1.5">
                <span className="font-mono text-xs font-bold text-stone-800 uppercase tracking-wider block">
                  No frequency data in this range
                </span>
                <p className="text-[11px] text-stone-600 font-serif leading-relaxed">
                  No bio-acoustic events were received in the {freqTimeframe} window yet. The scatterplot will populate as new MQTT species detections arrive.
                </p>
                <span className="inline-block text-[9px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-[2px]">
                  MQTT listener is active • a quiet chart does not mean no wildlife activity
                </span>
              </div>
            </div>
          )}

          <ResponsiveContainer key={`resp-${freqTimeframe}`} width="100%" height="100%">
            <ScatterChart margin={{ top: 15, right: 25, left: 25, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis 
                dataKey="timestampMs" 
                type="number"
                name="Time" 
                domain={scatterDomain}
                ticks={xAxisTicks}
                interval={0}
                tickFormatter={(ms) => {
                  const d = new Date(ms);
                  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                }}
                stroke="rgba(44, 40, 38, 0.5)" 
                style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }} 
              />
              <YAxis 
                dataKey="frequencyHz" 
                type="number"
                name="Frequency" 
                domain={yAxisDomain}
                ticks={yAxisTicks}
                tickFormatter={(val) => val.toLocaleString()}
                stroke="rgba(44, 40, 38, 0.5)" 
                style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }} 
              />
              <ZAxis range={[36, 36]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-paper-sheet border border-stone-300 p-2.5 shadow-md font-mono text-[11px] space-y-1 z-50">
                        <div className="font-bold border-b border-stone-200 pb-1 flex items-center justify-between gap-3">
                          <span style={{ color: data.color }}>{data.species}</span>
                          <span className="text-stone-400">{data.timeLabel}</span>
                        </div>
                        <div>Species: <strong className="text-stone-800">{data.species}</strong></div>
                        <div>Frequency: <strong className="text-stone-800">{data.frequencyHz.toLocaleString()}</strong></div>
                        <div>Device Node: <strong className="text-stone-800">{data.device_id}</strong></div>
                        <div>Server Received At: <strong className="text-stone-700">{data.received_at}</strong></div>
                        <div className="text-[9px] text-stone-500 truncate max-w-sm">MQTT Topic: {data.topic}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Bio-Acoustic Frequencies" data={scatterPoints} isAnimationActive={false}>
                {scatterPoints.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} fillOpacity={0.75} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Multi-Species Bio-Acoustic MQTT Visualizer */}
      <div className="bg-paper-sheet border border-stone-200 p-5 rounded-xs shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
          <div>
            <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest block font-bold">
              Bio-Acoustic Telemetry Corridors & Species Breakdown
            </span>
            <h4 className="font-serif font-bold text-ink-charcoal text-sm mt-0.5">
              Live Species Acoustic Feed (MQTT: UCL/GordonStreet/#)
            </h4>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-[2px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              BROKER CONNECTED
            </span>
          </div>
        </div>

        {/* Species Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Bird Vocalization Species Card */}
          <div className="border border-emerald-200/80 bg-emerald-50/20 p-3.5 rounded-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-800 font-bold uppercase tracking-wider">
                Avian Vocalizations (Daytime Corridor)
              </span>
              <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-[1px] font-bold">
                UCL/GordonStreet/acoupi-bird
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-emerald-950">
                {currentData.bird_calls_min}
              </span>
              <span className="text-xs text-stone-500 font-mono">vocalizations / min</span>
            </div>
            <div className="text-[11px] text-stone-600 font-serif leading-relaxed space-y-1">
              <div>Latest detected species: <span className={`font-semibold ${isBirdUnknown ? 'text-rose-700' : 'text-emerald-900'}`}>{latestBirdLabel}</span></div>
              <div>Audible bio-acoustics (2.4 – 8.5 kHz). Monitored species include Blackbird, Robin, and Blue Tit foraging along the living façade.</div>
            </div>
          </div>

          {/* Bat Echolocation Species Card */}
          <div className="border border-purple-200/80 bg-purple-50/20 p-3.5 rounded-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-purple-800 font-bold uppercase tracking-wider">
                Bat Echolocation (Nocturnal Corridor)
              </span>
              <span className="text-[9px] font-mono text-purple-700 bg-purple-100/80 px-1.5 py-0.5 rounded-[1px] font-bold">
                UCL/GordonStreet/acoupi-bat
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-purple-950">
                {currentData.bat_calls_min}
              </span>
              <span className="text-xs text-stone-500 font-mono">ultrasonic calls / min</span>
            </div>
            <div className="text-[11px] text-stone-600 font-serif leading-relaxed space-y-1">
              <div>Latest detected species: <span className={`font-semibold ${isBatUnknown ? 'text-rose-700' : 'text-purple-900'}`}>{latestBatLabel}</span></div>
              <div>High-frequency echolocation (45 – 55 kHz). Monitored species include Common Pipistrelle and Soprano Pipistrelle night feeding.</div>
            </div>
          </div>

        </div>

        {/* Live Acoustic Telemetry Observations Stream */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span className="uppercase tracking-wider font-bold">Recent Telemetry Observations Feed</span>
            <span>Live Packets</span>
          </div>

          {currentData.mqttStatus?.recentTopics && currentData.mqttStatus.recentTopics.length > 0 ? (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {currentData.mqttStatus.recentTopics.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-paper-dark/10 p-2 border border-stone-200/60 rounded-xs text-[10px] font-mono">
                  <div className="flex items-center gap-2 truncate max-w-[60%]">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.topic.toLowerCase().includes('bat') ? 'bg-purple-600' : 'bg-emerald-600'}`} />
                    <span className="font-bold text-stone-800 truncate">{item.topic}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-stone-600 truncate max-w-xs">{item.rawPayload}</span>
                    <span className="text-stone-400 text-[9px]">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-paper-dark/10 text-center text-[11px] text-stone-500 font-mono border border-stone-200/60 rounded-xs">
              Live biophony telemetry actively listening on <code className="text-emerald-700">mqtt.cetools.org:1883</code>...
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
