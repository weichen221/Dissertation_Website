import fs from 'fs';
import path from 'path';
import { extractSpeciesFromMessage } from '../lib/species';

export interface TelemetryHistoryRecord {
  id: string;
  timestamp: string; // ISO String
  temperature_c: number;
  humidity_percent: number;
  wind_speed_ms?: number;
  rainfall_mm: number;
  light_lux: number;
  air_quality_aqi: number;
  bird_calls_min: number;
  bat_calls_min: number;
  acoustic_activity: number;
  outTemp_C?: number;
  outHumidity?: number;
  luminosity_lux?: number;
  p_rainRate_cm_per_hour?: number;
  p_dayRain_cm?: number;
  windSpeed_kph?: number;
  topic?: string;
}

export interface AcousticEventRecord {
  id: string;
  timestamp: string;
  topic: string;
  type: 'bird' | 'bat' | 'other';
  rawPayload: string;
  parsedVal: any;
  frequencyKHz: number;
  callsCount: number;
  species?: string;
}

export interface FrequencyRecord {
  id: string;
  message_id?: string;
  device_id: string;
  timestamp: number;
  frequency: number;
  received_at: string;
  species?: string;
  topic?: string;
  value?: unknown;
}

export interface BatDeviceStatusRecord {
  id: string;
  sent_on?: string;
  device_id?: string;
  status?: any;
  received_at: string;
  topic: string;
  raw_payload: string;
}

export interface RawMqttLogRecord {
  id: string;
  timestamp: string;
  topic: string;
  rawPayload: string;
  parsedPayload?: any;
}

export interface CommunityObservationRecord {
  id: string;
  timestamp: string;
  observationType: string;
  note?: string;
  weather_summary?: string;
  source: string;
}

interface DatabaseSchema {
  telemetryHistory: TelemetryHistoryRecord[];
  acousticEvents: AcousticEventRecord[];
  frequencyRecords: FrequencyRecord[];
  batDeviceStatus: BatDeviceStatusRecord[];
  rawMqttLogs: RawMqttLogRecord[];
  communityObservations: CommunityObservationRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mqtt_db.json');

export function shouldSeedDemoData(): boolean {
  // Demo seeding is disabled to enforce real MQTT-only telemetry persistence.
  return false;
}

class MqttDatabaseService {
  private data: DatabaseSchema = {
    telemetryHistory: [],
    acousticEvents: [],
    frequencyRecords: [],
    batDeviceStatus: [],
    rawMqttLogs: [],
    communityObservations: []
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(content);
        this.data.communityObservations = this.data.communityObservations || [];
        this.pruneToLast24Hours();
        this.reconcileFrequencySpecies();
        console.log(`[MqttDatabase] Loaded database with ${this.data.telemetryHistory.length} history records and ${this.data.rawMqttLogs.length} raw MQTT logs.`);
        if (shouldSeedDemoData()) {
          this.ensureFreshTimeline();
        } else {
          this.data.telemetryHistory = (this.data.telemetryHistory || []).filter(r => !this.isSyntheticSeedRecord(r));
          this.data.acousticEvents = (this.data.acousticEvents || []).filter(r => !this.isSyntheticSeedRecord(r));
          this.data.frequencyRecords = (this.data.frequencyRecords || []).filter(r => !this.isSyntheticSeedRecord(r));
          this.data.batDeviceStatus = (this.data.batDeviceStatus || []);
          this.save();
        }
      } else {
        if (shouldSeedDemoData()) {
          this.seedInitialHistory();
        } else {
          this.data = {
            telemetryHistory: [],
            acousticEvents: [],
            frequencyRecords: [],
            batDeviceStatus: [],
            rawMqttLogs: [],
            communityObservations: []
          };
        }
        this.save();
      }
    } catch (err) {
      console.error('[MqttDatabase] Error initializing database, resetting to clean state:', err);
      if (shouldSeedDemoData()) {
        this.seedInitialHistory();
      } else {
        this.data = {
          telemetryHistory: [],
          acousticEvents: [],
          frequencyRecords: [],
          batDeviceStatus: [],
          rawMqttLogs: [],
          communityObservations: []
        };
      }
      this.save();
    }
  }

  private isSyntheticSeedRecord(record: { id?: string; message_id?: string }) {
    const combined = `${record.id || ''} ${record.message_id || ''}`.toLowerCase();
    return combined.includes('seed-') || combined.includes('msg-1h-') || combined.includes('msg-24h-') || combined.includes('msg-7d-');
  }

  private ensureFreshTimeline() {
    if (!shouldSeedDemoData()) {
      return;
    }

    const now = Date.now();
    if (!this.data.telemetryHistory || this.data.telemetryHistory.length === 0) {
      this.seedInitialHistory();
      return;
    }

    // Check age of most recent telemetry history record
    const newestT = new Date(this.data.telemetryHistory[this.data.telemetryHistory.length - 1].timestamp).getTime();
    const diffHours = (now - newestT) / (3600 * 1000);

    if (diffHours > 0.1 || !this.data.frequencyRecords || this.data.frequencyRecords.length === 0) {
      const shiftMs = now - newestT;
      if (Math.abs(shiftMs) > 60000 && this.data.telemetryHistory.length > 0) {
        this.data.telemetryHistory = this.data.telemetryHistory.map(r => ({
          ...r,
          timestamp: new Date(new Date(r.timestamp).getTime() + shiftMs).toISOString()
        }));
      }

      this.seedAcousticEvents(now);
      this.save();
    }
  }

  private seedAcousticEvents(now: number) {
    const events: AcousticEventRecord[] = [];
    const freqRecords: FrequencyRecord[] = [];
    const speciesListBirds = ['Robin', 'Blue Tit', 'Blackbird', 'Great Tit', 'Wren', 'Goldfinch'];
    const speciesListBats = ['Pipistrelle', "Daubenton's Bat", 'Noctule'];

    const speciesFreqHzMap: Record<string, number> = {
      'Robin': 3100,
      'Blue Tit': 4200,
      'Blackbird': 2600,
      'Great Tit': 3500,
      'Wren': 5200,
      'Goldfinch': 4600,
      'Pipistrelle': 45000,
      "Daubenton's Bat": 38000,
      'Noctule': 22000
    };

    // 30 points in last 1 hour
    for (let i = 0; i < 30; i++) {
      const minutesAgo = i * 2;
      const evtTime = new Date(now - minutesAgo * 60 * 1000 - (i % 3) * 15 * 1000);
      const isBat = i % 3 === 0;
      const species = isBat ? speciesListBats[i % speciesListBats.length] : speciesListBirds[i % speciesListBirds.length];
      const freqHz = speciesFreqHzMap[species] || (isBat ? 42000 : 3800);
      const freqKHz = Math.round((freqHz / 1000) * 10) / 10;
      const topic = isBat ? 'UCL/GordonStreet/acoupi-bat' : 'UCL/GordonStreet/acoupi-bird';

      events.push({
        id: `seed-evt-1h-${i}`,
        timestamp: evtTime.toISOString(),
        topic,
        type: isBat ? 'bat' : 'bird',
        rawPayload: JSON.stringify({ value: species, time: evtTime.toISOString() }),
        parsedVal: { value: species },
        frequencyKHz: freqKHz,
        callsCount: (i % 3) + 1,
        species
      });

      freqRecords.push({
        id: `seed-freq-1h-${i}`,
        message_id: `msg-1h-${i}`,
        device_id: isBat ? 'acoupi-bat-01' : 'acoupi-bird-01',
        timestamp: evtTime.getTime(),
        frequency: freqHz,
        received_at: evtTime.toISOString(),
        species,
        topic
      });
    }

    // 70 points in last 24 hours (excluding last 1h)
    for (let i = 0; i < 70; i++) {
      const minutesAgo = 60 + i * 20;
      const evtTime = new Date(now - minutesAgo * 60 * 1000);
      const isBat = i % 4 === 0;
      const species = isBat ? speciesListBats[i % speciesListBats.length] : speciesListBirds[i % speciesListBirds.length];
      const freqHz = speciesFreqHzMap[species] || (isBat ? 42000 : 3800);
      const freqKHz = Math.round((freqHz / 1000) * 10) / 10;
      const topic = isBat ? 'UCL/GordonStreet/acoupi-bat' : 'UCL/GordonStreet/acoupi-bird';

      events.push({
        id: `seed-evt-24h-${i}`,
        timestamp: evtTime.toISOString(),
        topic,
        type: isBat ? 'bat' : 'bird',
        rawPayload: JSON.stringify({ value: species, time: evtTime.toISOString() }),
        parsedVal: { value: species },
        frequencyKHz: freqKHz,
        callsCount: (i % 3) + 1,
        species
      });

      freqRecords.push({
        id: `seed-freq-24h-${i}`,
        message_id: `msg-24h-${i}`,
        device_id: isBat ? 'acoupi-bat-01' : 'acoupi-bird-01',
        timestamp: evtTime.getTime(),
        frequency: freqHz,
        received_at: evtTime.toISOString(),
        species,
        topic
      });
    }

    // 100 points across rest of 7 days
    for (let i = 0; i < 100; i++) {
      const hoursAgo = 24 + i * 1.5;
      const evtTime = new Date(now - hoursAgo * 3600 * 1000);
      const isBat = i % 3 === 0;
      const species = isBat ? speciesListBats[i % speciesListBats.length] : speciesListBirds[i % speciesListBirds.length];
      const freqHz = speciesFreqHzMap[species] || (isBat ? 42000 : 3800);
      const freqKHz = Math.round((freqHz / 1000) * 10) / 10;
      const topic = isBat ? 'UCL/GordonStreet/acoupi-bat' : 'UCL/GordonStreet/acoupi-bird';

      events.push({
        id: `seed-evt-7d-${i}`,
        timestamp: evtTime.toISOString(),
        topic,
        type: isBat ? 'bat' : 'bird',
        rawPayload: JSON.stringify({ value: species, time: evtTime.toISOString() }),
        parsedVal: { value: species },
        frequencyKHz: freqKHz,
        callsCount: (i % 3) + 1,
        species
      });

      freqRecords.push({
        id: `seed-freq-7d-${i}`,
        message_id: `msg-7d-${i}`,
        device_id: isBat ? 'acoupi-bat-01' : 'acoupi-bird-01',
        timestamp: evtTime.getTime(),
        frequency: freqHz,
        received_at: evtTime.toISOString(),
        species,
        topic
      });
    }

    this.data.acousticEvents = events;
    this.data.frequencyRecords = freqRecords.sort((a, b) => b.timestamp - a.timestamp);
  }

  private seedInitialHistory() {
    console.log('[MqttDatabase] Seeding initial UCL Gordon Street 30-day historical telemetry dataset into backend database...');
    const now = Date.now();
    const records: TelemetryHistoryRecord[] = [];

    // Generate historical points covering 30 days (720 hours)
    for (let h = 720; h >= 0; h -= 2) {
      const time = new Date(now - h * 3600 * 1000);
      const hourOfDay = time.getHours();
      
      // Natural diurnal solar cycle
      const solarCycle = Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI);
      const temp = Number((20.5 + solarCycle * 4.2 + (Math.sin(h * 0.1) * 1.1)).toFixed(1));
      const humidity = Math.min(95, Math.max(40, Math.round(62 - solarCycle * 15 + Math.cos(h * 0.2) * 5)));
      const wind = Number(Math.max(0.2, 1.2 + Math.sin(h * 0.15) * 0.8 + Math.cos(h * 0.05) * 0.4).toFixed(1));
      const lux = hourOfDay >= 6 && hourOfDay <= 19 ? Math.round(Math.max(0, solarCycle * 1400 + Math.sin(h) * 200)) : 0;
      const aqi = Math.round(32 + Math.abs(Math.sin(h * 0.05)) * 25);
      
      // Diurnal bio-acoustic patterns
      const isDay = hourOfDay >= 6 && hourOfDay <= 18;
      const isNight = hourOfDay >= 20 || hourOfDay <= 4;

      const birdCalls = isDay ? Math.max(1, Math.round(8 + Math.sin(h * 0.3) * 6)) : (h % 12 === 0 ? 1 : 0);
      const batCalls = isNight ? Math.max(1, Math.round(4 + Math.cos(h * 0.4) * 3)) : (h % 16 === 0 ? 1 : 0);
      const acousticAct = Math.min(100, (birdCalls + batCalls) * 6 + 10);

      records.push({
        id: `seed-${time.getTime()}`,
        timestamp: time.toISOString(),
        temperature_c: temp,
        humidity_percent: humidity,
        wind_speed_ms: wind,
        rainfall_mm: Number((Math.max(0, Math.sin(h * 0.08) - 0.7) * 2.5).toFixed(1)),
        light_lux: lux,
        air_quality_aqi: aqi,
        bird_calls_min: birdCalls,
        bat_calls_min: batCalls,
        acoustic_activity: acousticAct,
        topic: 'UCL/GordonStreet/telemetry'
      });
    }

    this.data.telemetryHistory = records;
    this.seedAcousticEvents(now);
  }

  private reconcileFrequencySpecies() {
    if (!Array.isArray(this.data.frequencyRecords)) {
      this.data.frequencyRecords = [];
    }

    const genericSpecies = new Set(['Bird', 'Bat', 'Avian Vocalization', 'Bat Ultrasonic Echolocation', 'Unspecified', 'Birds', 'Bats']);

    this.data.frequencyRecords = this.data.frequencyRecords.map(record => {
      const species = record.species?.trim();
      if (!species || !genericSpecies.has(species)) {
        return record;
      }

      const match = (this.data.rawMqttLogs || []).find(log => {
        const logTime = typeof log.timestamp === 'string' ? new Date(log.timestamp).getTime() : null;
        if (!logTime) return false;
        const delta = Math.abs(logTime - (record.timestamp || 0));
        return delta <= 120000 && (
          log.topic?.toLowerCase() === record.topic?.toLowerCase() ||
          (record.topic?.toLowerCase().includes('bird') && log.topic?.toLowerCase().includes('bird')) ||
          (record.topic?.toLowerCase().includes('bat') && log.topic?.toLowerCase().includes('bat'))
        );
      });

      if (!match) return record;

      const derived = extractSpeciesFromMessage(match.parsedPayload ?? match.rawPayload, match.rawPayload);
      if (derived) {
        return { ...record, species: derived };
      }

      return record;
    });

    this.save();
  }

  private saveTimeout: NodeJS.Timeout | null = null;

  private pruneToLast24Hours() {
    const cutoff = Date.now() - 24 * 3600 * 1000;

    this.data.telemetryHistory = (this.data.telemetryHistory || []).filter(r => {
      const t = new Date(r.timestamp).getTime();
      return Number.isFinite(t) && t >= cutoff;
    });

    this.data.acousticEvents = (this.data.acousticEvents || []).filter(r => {
      const t = new Date(r.timestamp).getTime();
      return Number.isFinite(t) && t >= cutoff;
    });

    this.data.frequencyRecords = (this.data.frequencyRecords || []).filter(r => {
      return Number.isFinite(r.timestamp) && r.timestamp >= cutoff;
    });

    this.data.batDeviceStatus = (this.data.batDeviceStatus || []).filter(r => {
      const t = new Date(r.received_at).getTime();
      return Number.isFinite(t) && t >= cutoff;
    });

    this.data.rawMqttLogs = (this.data.rawMqttLogs || []).filter(r => {
      const t = new Date(r.timestamp).getTime();
      return Number.isFinite(t) && t >= cutoff;
    });
  }

  public save() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        const tmpFile = DB_FILE + '.tmp';
        fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2));
        fs.renameSync(tmpFile, DB_FILE);
      } catch (err) {
        console.error('[MqttDatabase] Failed to write database to disk:', err);
      }
    }, 1000);
  }

  // Record raw MQTT packet
  public recordMqttPacket(topic: string, rawPayload: string, parsedPayload?: any) {
    const record: RawMqttLogRecord = {
      id: `mqtt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      topic,
      rawPayload,
      parsedPayload
    };

    this.data.rawMqttLogs.unshift(record);
    this.pruneToLast24Hours();
    this.save();
  }

  // Record Telemetry Reading
  public recordTelemetry(reading: Omit<TelemetryHistoryRecord, 'id' | 'timestamp'>) {
    const record: TelemetryHistoryRecord = {
      id: `telemetry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...reading
    };

    this.data.telemetryHistory.push(record);
    this.pruneToLast24Hours();
    this.save();
  }

  // Record Acoustic Event
  public recordAcousticEvent(evt: Omit<AcousticEventRecord, 'id' | 'timestamp'>) {
    const record: AcousticEventRecord = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...evt
    };

    this.data.acousticEvents.unshift(record);
    this.pruneToLast24Hours();
    this.save();
    return record;
  }

  // Record Frequency Event into Persistent Database with Strict Deduplication
  public recordFrequency(record: {
    id?: string;
    message_id?: string;
    device_id?: string;
    timestamp?: number;
    frequency: number;
    received_at?: string;
    species?: string;
    topic?: string;
    value?: unknown;
  }): FrequencyRecord | null {
    const ts = record.timestamp || Date.now();
    const devId = record.device_id || 'sensor-01';
    const freq = Math.round(record.frequency);
    const msgId = record.message_id || record.id || `${devId}-${ts}-${freq}`;

    if (!this.data.frequencyRecords) {
      this.data.frequencyRecords = [];
    }

    // Deduplication check: Prevent storing identical message_id or (device_id + timestamp + frequency)
    const exists = this.data.frequencyRecords.some(r => 
      (r.message_id && r.message_id === msgId) ||
      r.id === msgId ||
      (r.device_id === devId && Math.abs(r.timestamp - ts) < 100 && Math.abs(r.frequency - freq) < 10)
    );

    if (exists) {
      return null; // Duplicate message, skip insertion
    }

    const newRecord: FrequencyRecord = {
      id: msgId,
      message_id: msgId,
      device_id: devId,
      timestamp: ts,
      frequency: freq,
      received_at: record.received_at || new Date().toISOString(),
      species: record.species || (freq > 20000 ? 'Bat' : 'Bird'),
      topic: record.topic || 'UCL/GordonStreet/acoupi',
      value: record.value
    };

    this.data.frequencyRecords.unshift(newRecord);
    this.pruneToLast24Hours();
    this.save();
    return newRecord;
  }

  public getFrequencies(fromMs?: number, toMs?: number): FrequencyRecord[] {
    this.ensureFreshTimeline();
    if (!this.data.frequencyRecords) {
      this.data.frequencyRecords = [];
    }

    this.reconcileFrequencySpecies();

    let list = (this.data.frequencyRecords || []).filter(r => !this.isSyntheticSeedRecord(r));
    if (fromMs !== undefined) {
      list = list.filter(r => r.timestamp >= fromMs);
    }
    if (toMs !== undefined) {
      list = list.filter(r => r.timestamp <= toMs);
    }
    return list.slice().sort((a, b) => a.timestamp - b.timestamp);
  }

  // Record Bat Device Status
  public recordBatStatus(status: Omit<BatDeviceStatusRecord, 'id' | 'received_at'>) {
    const record: BatDeviceStatusRecord = {
      id: `bat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      received_at: new Date().toISOString(),
      ...status
    };

    this.data.batDeviceStatus.unshift(record);
    this.pruneToLast24Hours();
    this.save();
    return record;
  }

  public getAcousticEvents() {
    this.ensureFreshTimeline();
    return (this.data.acousticEvents || []).filter(r => !this.isSyntheticSeedRecord(r));
  }

  public getBatStatusHistory() {
    return this.data.batDeviceStatus;
  }

  public getRawMqttLogs() {
    return this.data.rawMqttLogs;
  }

  public recordCommunityObservation(input: {
    observationType: string;
    note?: string;
    weather_summary?: string;
    source?: string;
  }): CommunityObservationRecord {
    const record: CommunityObservationRecord = {
      id: `community-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      observationType: input.observationType,
      note: input.note,
      weather_summary: input.weather_summary,
      source: input.source || 'Web App'
    };

    this.data.communityObservations = this.data.communityObservations || [];
    this.data.communityObservations.unshift(record);
    this.data.communityObservations = this.data.communityObservations.slice(0, 250);
    this.save();
    return record;
  }

  public getCommunityObservations(limit = 50): CommunityObservationRecord[] {
    this.data.communityObservations = this.data.communityObservations || [];
    return this.data.communityObservations.slice(0, Math.max(1, Math.min(limit, 100)));
  }

  // Get aggregated history according to requested timeframe ('24h' | '1w')
  public getTelemetryHistory(timeframe: '24h' | '1w') {
    this.ensureFreshTimeline();
    const now = Date.now();
    const liveTelemetry = (this.data.telemetryHistory || []).filter(r => !this.isSyntheticSeedRecord(r));

    if (timeframe === '24h') {
      // 12 two-hour buckets covering last 24 hours in strict chronological order
      const buckets: { label: string; start: number; end: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const end = now - i * 2 * 3600 * 1000;
        const start = end - 2 * 3600 * 1000;
        const endDate = new Date(end);
        const label = `${endDate.getHours().toString().padStart(2, '0')}:00`;
        buckets.push({ label, start, end });
      }

      return buckets.map(b => {
        const matching = liveTelemetry.filter(r => {
          const t = new Date(r.timestamp).getTime();
          return t >= b.start && t < b.end;
        });
        return this.aggregateBucket(b.label, matching);
      });
    }

    // Default '1w': 7 one-day buckets covering last 7 days in strict chronological order
    const buckets: { label: string; start: number; end: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const end = now - i * 24 * 3600 * 1000;
      const start = end - 24 * 3600 * 1000;
      const midDate = new Date(start + 12 * 3600 * 1000);
      const weekday = midDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = `${midDate.getMonth() + 1}/${midDate.getDate()}`;
      const label = `${weekday} ${dayNum}`;
      buckets.push({ label, start, end });
    }

    return buckets.map(b => {
      const matching = liveTelemetry.filter(r => {
        const t = new Date(r.timestamp).getTime();
        return t >= b.start && t < b.end;
      });
      return this.aggregateBucket(b.label, matching);
    });
  }

  private aggregateBucket(label: string, records: TelemetryHistoryRecord[]) {
    if (records.length === 0) {
      return {
        label,
        temperature_c: 21.0,
        humidity_percent: 60,
        wind_speed_ms: 1.2,
        rainfall_mm: 0.0,
        light_lux: 400,
        air_quality_aqi: 35,
        bird_calls_min: 0,
        bat_calls_min: 0,
        acoustic_activity: 0
      };
    }

    const avg = (fn: (r: TelemetryHistoryRecord) => number) => {
      const valid = records.map(fn).filter(v => typeof v === 'number' && !isNaN(v));
      if (valid.length === 0) return 0;
      const sum = valid.reduce((acc, curr) => acc + curr, 0);
      return Number((sum / valid.length).toFixed(1));
    };

    const max = (fn: (r: TelemetryHistoryRecord) => number) => {
      const valid = records.map(fn).filter(v => typeof v === 'number' && !isNaN(v));
      if (valid.length === 0) return 0;
      return Math.max(...valid);
    };

    return {
      label,
      temperature_c: avg(r => r.temperature_c),
      humidity_percent: Math.round(avg(r => r.humidity_percent)),
      wind_speed_ms: avg(r => r.wind_speed_ms ?? 1.2),
      rainfall_mm: avg(r => r.rainfall_mm),
      light_lux: Math.round(avg(r => r.light_lux)),
      outTemp_C: avg(r => r.outTemp_C ?? r.temperature_c),
      outHumidity: Math.round(avg(r => r.outHumidity ?? r.humidity_percent)),
      luminosity_lux: Math.round(avg(r => r.luminosity_lux ?? r.light_lux)),
      p_rainRate_cm_per_hour: avg(r => r.p_rainRate_cm_per_hour ?? r.rainfall_mm / 10),
      p_dayRain_cm: avg(r => r.p_dayRain_cm ?? 0),
      windSpeed_kph: avg(r => r.windSpeed_kph ?? (r.wind_speed_ms ?? 0) * 3.6),
      air_quality_aqi: Math.round(avg(r => r.air_quality_aqi)),
      bird_calls_min: Math.round(avg(r => r.bird_calls_min)),
      bat_calls_min: Math.round(avg(r => r.bat_calls_min)),
      acoustic_activity: Math.round(max(r => r.acoustic_activity))
    };
  }
}

export const dbService = new MqttDatabaseService();
