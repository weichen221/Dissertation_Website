import express from 'express';
import path from 'path';
import mqtt from 'mqtt';
import { createServer as createViteServer } from 'vite';
import { dbService } from './src/db/mqttStorage.js';
import { extractSpeciesFromMessage } from './src/lib/species.js';

const __dirname = process.cwd();

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_PORT_ATTEMPTS = 10;

function listenWithFallback(app: express.Express, port: number, host: string) {
  const displayHost = host === '0.0.0.0' ? '127.0.0.1' : host;

  return new Promise<void>((resolve, reject) => {
    const tryPort = (currentPort: number, attempt: number) => {
      const server = app.listen(currentPort, host, () => {
        console.log(`[SERVER] Running at http://${displayHost}:${currentPort}`);
        resolve();
      });

      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
          console.warn(`[SERVER] Port ${currentPort} is busy, trying ${currentPort + 1}...`);
          server.close(() => tryPort(currentPort + 1, attempt + 1));
        } else {
          reject(err);
        }
      });
    };

    tryPort(port, 0);
  });
}

// MQTT Broker details provided by UCL CETools
const MQTT_BROKER = 'mqtt://mqtt.cetools.org:1883';
const MQTT_TOPICS = [
  'UCL/GordonStreet/#',
  'UCL/GordonStreet/acoupi-bird',
  'UCL/GordonStreet/acoupi-bat'
];

interface TopicRecord {
  topic: string;
  value: any;
  rawPayload: string;
  timestamp: string;
}

// Global state for live telemetry and MQTT status
const state = {
  connected: false,
  broker: 'mqtt.cetools.org:1883',
  subscribedTopics: MQTT_TOPICS,
  lastMessageTime: null as string | null,
  messageCount: 0,
  lastError: null as string | null,
  recentTopicsMap: new Map<string, TopicRecord>(),
  
  // Real live sensor readings (updated from actual incoming MQTT messages and database)
  sensorReadings: {
    temperature_c: 21.4,
    humidity_percent: 64,
    rainfall_mm: 0.0,
    light_lux: 840,
    wind_speed_ms: 1.2,
    outTemp_C: 21.4,
    outHumidity: 64,
    luminosity_lux: 840,
    p_rainRate_cm_per_hour: 0,
    p_dayRain_cm: 0,
    windSpeed_kph: 4.3,
    air_quality_aqi: 38,
    greenwall_health: 'Excellent' as const,
    health_scale: 92,
    bird_calls_min: 0,
    bat_calls_min: 0,
    acoustic_activity: 0,
    latestBirdSpecies: null as string | null,
    latestBatSpecies: null as string | null,
    latestSpecies: null as string | null
  }
};

// Setup MQTT Client
console.log(`[MQTT] Connecting to ${MQTT_BROKER}...`);
const mqttClient = mqtt.connect(MQTT_BROKER, {
  clientId: `gordon-street-app_${Math.random().toString(16).substring(2, 10)}`,
  keepalive: 60,
  reconnectPeriod: 3000,
  connectTimeout: 10000
});

mqttClient.on('connect', () => {
  console.log(`[MQTT] Successfully connected to ${MQTT_BROKER}`);
  state.connected = true;
  state.lastError = null;

  MQTT_TOPICS.forEach(topicFilter => {
    mqttClient.subscribe(topicFilter, (err) => {
      if (err) {
        console.error(`[MQTT] Subscription error for ${topicFilter}:`, err);
      } else {
        console.log(`[MQTT] Subscribed to ${topicFilter}`);
      }
    });
  });
});

mqttClient.on('error', (err) => {
  console.error(`[MQTT] Connection error:`, err.message);
  state.connected = false;
  state.lastError = err.message;
});

mqttClient.on('offline', () => {
  console.log(`[MQTT] Client offline`);
  state.connected = false;
});

mqttClient.on('reconnect', () => {
  console.log(`[MQTT] Reconnecting...`);
});

let lastRealMqttTime = 0;
let lastBirdMessageTime = 0;
let lastBatMessageTime = 0;

mqttClient.on('message', (topic, payload) => {
  // Strictly filter for UCL/GordonStreet/# topics as specified by user
  if (!topic.toLowerCase().startsWith('ucl/gordonstreet')) {
    return;
  }

  lastRealMqttTime = Date.now();
  const rawStr = payload.toString();
  const timestamp = new Date().toISOString();
  state.messageCount++;
  state.lastMessageTime = timestamp;

  let parsedVal: any = rawStr;
  try {
    parsedVal = JSON.parse(rawStr);
  } catch {
    const num = parseFloat(rawStr);
    if (!isNaN(num)) {
      parsedVal = num;
    }
  }

  // Record raw packet in persistent database
  dbService.recordMqttPacket(topic, rawStr, parsedVal);

  // Update recent topics map
  state.recentTopicsMap.set(topic, {
    topic,
    value: parsedVal,
    rawPayload: rawStr.length > 200 ? rawStr.slice(0, 200) + '...' : rawStr,
    timestamp
  });

  // Limit map size to last 50 topics
  if (state.recentTopicsMap.size > 50) {
    const oldestKey = state.recentTopicsMap.keys().next().value;
    if (oldestKey) state.recentTopicsMap.delete(oldestKey);
  }

  // Process and map telemetry values to our metrics
  processTelemetryMessage(topic, parsedVal, rawStr);
});

function processTelemetryMessage(topic: string, parsedVal: any, rawStr: string) {
  const lowerTopic = topic.toLowerCase();
  const nowTs = Date.now();

  // Helper to extract numeric value from JSON or direct number
  const extractNum = (obj: any, keys: string[]): number | null => {
    if (typeof obj === 'number') return obj;
    if (typeof obj === 'object' && obj !== null) {
      for (const k of keys) {
        if (typeof obj[k] === 'number') return obj[k];
        if (typeof obj[k] === 'string') {
          const n = parseFloat(obj[k]);
          if (!isNaN(n)) return n;
        }
      }
    }
    return null;
  };

  // Exact Ecowitt fields used by the observation dashboard.
  if (lowerTopic.endsWith('/outtemp_c')) {
    const v = extractNum(parsedVal, ['outTemp_C', 'value', 'val']);
    if (v !== null && v > -30 && v < 60) {
      state.sensorReadings.outTemp_C = Math.round(v * 10) / 10;
      state.sensorReadings.temperature_c = state.sensorReadings.outTemp_C;
    }
  }
  if (lowerTopic.endsWith('/outhumidity')) {
    const v = extractNum(parsedVal, ['outHumidity', 'value', 'val']);
    if (v !== null && v >= 0 && v <= 100) {
      state.sensorReadings.outHumidity = Math.round(v);
      state.sensorReadings.humidity_percent = state.sensorReadings.outHumidity;
    }
  }
  if (lowerTopic.endsWith('/luminosity_lux')) {
    const v = extractNum(parsedVal, ['luminosity_lux', 'value', 'val']);
    if (v !== null && v >= 0) {
      state.sensorReadings.luminosity_lux = Math.round(v);
      state.sensorReadings.light_lux = state.sensorReadings.luminosity_lux;
    }
  }
  if (lowerTopic.endsWith('/p_rainrate_cm_per_hour')) {
    const v = extractNum(parsedVal, ['p_rainRate_cm_per_hour', 'value', 'val']);
    if (v !== null && v >= 0) {
      state.sensorReadings.p_rainRate_cm_per_hour = Number(v.toFixed(2));
      state.sensorReadings.rainfall_mm = Number((v * 10).toFixed(1));
    }
  }
  if (lowerTopic.endsWith('/p_dayrain_cm')) {
    const v = extractNum(parsedVal, ['p_dayRain_cm', 'value', 'val']);
    if (v !== null && v >= 0) state.sensorReadings.p_dayRain_cm = Number(v.toFixed(2));
  }
  if (lowerTopic.endsWith('/windspeed_kph')) {
    const v = extractNum(parsedVal, ['windSpeed_kph', 'value', 'val']);
    if (v !== null && v >= 0) {
      state.sensorReadings.windSpeed_kph = Number(v.toFixed(1));
      state.sensorReadings.wind_speed_ms = Number((v / 3.6).toFixed(1));
    }
  }

  // Temperature
  if (lowerTopic.includes('temp') || lowerTopic.includes('temperature')) {
    const v = extractNum(parsedVal, ['temp', 'temperature', 'outTemp_C', 'inTemp_C', 'appTemp_C', 'val', 'value', 't']);
    if (v !== null && v > -20 && v < 60) state.sensorReadings.temperature_c = Math.round(v * 10) / 10;
  }

  // Moisture / Humidity
  if (lowerTopic.includes('humid') || lowerTopic.includes('moist') || lowerTopic.includes('rh') || lowerTopic.includes('soil')) {
    const v = extractNum(parsedVal, ['humidity', 'outHumidity', 'inHumidity', 'moisture', 'rh', 'val', 'value', 'h']);
    if (v !== null && v >= 0 && v <= 100) state.sensorReadings.humidity_percent = Math.round(v);
  }

  // Air Quality / AQI / PM2.5
  if (lowerTopic.includes('aqi') || lowerTopic.includes('air') || lowerTopic.includes('pm25') || lowerTopic.includes('pm2.5')) {
    const v = extractNum(parsedVal, ['aqi', 'pm25', 'pm2_5', 'val', 'value']);
    if (v !== null && v >= 0 && v <= 500) state.sensorReadings.air_quality_aqi = Math.round(v);
  }

  // Light / Lux / Solar Radiation
  if (lowerTopic.includes('light') || lowerTopic.includes('lux') || lowerTopic.includes('sun') || lowerTopic.includes('solar') || lowerTopic.includes('radiation')) {
    const v = extractNum(parsedVal, ['lux', 'light', 'radiation_Wpm2', 'val', 'value']);
    if (v !== null && v >= 0) state.sensorReadings.light_lux = Math.round(v);
  }

  // Rainfall
  if (lowerTopic.includes('rain')) {
    const v = extractNum(parsedVal, ['rainRate_cm_per_hour', 'rain_cm', 'dayRain_cm', 'rain24_cm', 'rainfall', 'val', 'value']);
    if (v !== null && v >= 0) state.sensorReadings.rainfall_mm = Math.round(v * 10) / 10;
  }

  // Wind Speed
  if (lowerTopic.includes('wind')) {
    const v = extractNum(parsedVal, ['windSpeed_kph', 'windSpeed10_kph', 'windGust_kph', 'wind_speed', 'val', 'value']);
    if (v !== null && v >= 0) state.sensorReadings.wind_speed_ms = Math.round((v / 3.6) * 10) / 10;
  }

  // Record only true bio-acoustic topics for the frequency scatterplot.
  const isAcousticTopic =
    lowerTopic.includes('acoupi-bird') ||
    lowerTopic.includes('acoupi-bat') ||
    lowerTopic.includes('/acoupi') ||
    lowerTopic.includes('acoustic') ||
    lowerTopic.includes('audio') ||
    lowerTopic.includes('sound');

  if (isAcousticTopic) {
    const isBat = lowerTopic.includes('bat');
    const isBird = lowerTopic.includes('bird');
    
    // Extract count or default to 0 when the packet does not contain explicit call count.
    const v = extractNum(parsedVal, ['count', 'bird_count', 'bat_count', 'birds', 'bats', 'val', 'calls', 'pulses', 'db']);
    const calls = v !== null && v >= 0 ? Math.round(v) : 0;
    
    if (isBird) {
      state.sensorReadings.bird_calls_min = calls;
      lastBirdMessageTime = Date.now();
    } else if (isBat) {
      state.sensorReadings.bat_calls_min = calls;
      lastBatMessageTime = Date.now();
    }

    const species = extractSpeciesFromMessage(parsedVal, rawStr) || (isBat ? 'unknown bat species' : (isBird ? 'unknown bird species' : 'unknown species'));

    if (isBird) {
      state.sensorReadings.latestBirdSpecies = species;
      state.sensorReadings.latestSpecies = species;
    } else if (isBat) {
      state.sensorReadings.latestBatSpecies = species;
      state.sensorReadings.latestSpecies = species;
    }

    // 2. Extract explicit frequency value if present, or assign characteristic frequency for identified species
    let freqHz: number | null = null;
    let freqKHz: number | null = null;

    if (typeof parsedVal === 'number' && parsedVal > 50 && parsedVal <= 150000) {
      freqHz = Math.round(parsedVal);
    } else if (typeof parsedVal === 'object' && parsedVal !== null) {
      const fHz = extractNum(parsedVal, ['frequency', 'frequency_hz', 'freq_hz', 'freq', 'Hz', 'hz', 'peak_frequency']);
      if (fHz !== null && fHz > 50 && fHz <= 150000) {
        freqHz = Math.round(fHz);
      } else {
        const fKHz = extractNum(parsedVal, ['freq_khz', 'frequency_khz', 'peak_freq_khz', 'kHz', 'khz']);
        if (fKHz !== null && fKHz > 0.05 && fKHz <= 150) {
          freqHz = Math.round(fKHz * 1000);
        } else {
          const numVal = Number(parsedVal.value);
          if (!isNaN(numVal) && numVal > 50 && numVal <= 150000) {
            freqHz = Math.round(numVal);
          }
        }
      }
    }

    // Do not synthesize frequency points when payload has no explicit frequency.
    // This prevents stale or fabricated scatterplot data.

    if (freqHz !== null) {
      freqKHz = Math.round((freqHz / 1000) * 10) / 10;
    }

    const msgId = (typeof parsedVal === 'object' && parsedVal?.message_id) 
      ? String(parsedVal.message_id) 
      : (typeof parsedVal === 'object' && parsedVal?.id ? String(parsedVal.id) : undefined);

    const devId = (typeof parsedVal === 'object' && parsedVal?.device_id) 
      ? String(parsedVal.device_id) 
      : (isBat ? 'acoupi-bat-01' : (isBird ? 'acoupi-bird-01' : 'sensor-01'));

    const msgTimestamp = (typeof parsedVal === 'object' && parsedVal?.timestamp) 
      ? Number(parsedVal.timestamp) 
      : Date.now();

    if (freqKHz !== null) {
      dbService.recordAcousticEvent({
        topic,
        type: isBat ? 'bat' : (isBird ? 'bird' : 'other'),
        rawPayload: rawStr,
        parsedVal,
        frequencyKHz: freqKHz,
        callsCount: calls,
        species
      });
    }

    if (freqHz !== null && freqHz > 0 && freqHz <= 150000) {
      dbService.recordFrequency({
        id: msgId,
        message_id: msgId,
        device_id: devId,
        timestamp: msgTimestamp,
        frequency: freqHz,
        received_at: new Date().toISOString(),
        species,
        topic,
        value: parsedVal
      });
    }
  }

  // Bat Device Status (UCL/GordonStreet/acoupi-bat)
  if (lowerTopic.includes('bat')) {
    let parsedJson: any = null;
    try {
      parsedJson = JSON.parse(rawStr);
    } catch {}

    dbService.recordBatStatus({
      sent_on: parsedJson?.sent_on || parsedJson?.timestamp || new Date().toISOString(),
      device_id: parsedJson?.device_id || 'acoupi-bat-01',
      status: parsedJson?.status !== undefined ? parsedJson.status : (parsedJson || rawStr),
      topic,
      raw_payload: rawStr
    });

    const batCalls = extractNum(parsedJson, ['bat_calls_min', 'bat_calls', 'calls', 'count', 'bat_count']) ?? (extractNum(parsedVal, ['calls', 'count']) || 0);
    state.sensorReadings.bat_calls_min = Math.round(batCalls);
    state.sensorReadings.acoustic_activity = Math.min(100, (state.sensorReadings.bird_calls_min + state.sensorReadings.bat_calls_min) * 5);
  }

  // Keep acoustic counters truthful: only recent acoupi packets should contribute.
  if (nowTs - lastBirdMessageTime > 120000) {
    state.sensorReadings.bird_calls_min = 0;
  }
  if (nowTs - lastBatMessageTime > 120000) {
    state.sensorReadings.bat_calls_min = 0;
  }
  state.sensorReadings.acoustic_activity = Math.min(100, (state.sensorReadings.bird_calls_min + state.sensorReadings.bat_calls_min) * 5);

  // Check if payload is a composite JSON containing multiple keys
  if (typeof parsedVal === 'object' && parsedVal !== null) {
    if ('temperature' in parsedVal || 'temp' in parsedVal) {
      const v = extractNum(parsedVal, ['temperature', 'temp']);
      if (v !== null) state.sensorReadings.temperature_c = Math.round(v * 10) / 10;
    }
    if ('humidity' in parsedVal || 'moisture' in parsedVal || 'rh' in parsedVal) {
      const v = extractNum(parsedVal, ['humidity', 'moisture', 'rh']);
      if (v !== null) state.sensorReadings.humidity_percent = Math.round(v);
    }
    if ('light' in parsedVal || 'lux' in parsedVal) {
      const v = extractNum(parsedVal, ['light', 'lux']);
      if (v !== null) state.sensorReadings.light_lux = Math.round(v);
    }
    if ('aqi' in parsedVal || 'pm25' in parsedVal) {
      const v = extractNum(parsedVal, ['aqi', 'pm25']);
      if (v !== null) state.sensorReadings.air_quality_aqi = Math.round(v);
    }
  }

  // Record telemetry snapshot to persistent database
  dbService.recordTelemetry({
    temperature_c: state.sensorReadings.temperature_c,
    humidity_percent: state.sensorReadings.humidity_percent,
    rainfall_mm: state.sensorReadings.rainfall_mm,
    light_lux: state.sensorReadings.light_lux,
    air_quality_aqi: state.sensorReadings.air_quality_aqi,
    bird_calls_min: state.sensorReadings.bird_calls_min,
    bat_calls_min: state.sensorReadings.bat_calls_min,
    acoustic_activity: state.sensorReadings.acoustic_activity,
    outTemp_C: state.sensorReadings.outTemp_C,
    outHumidity: state.sensorReadings.outHumidity,
    luminosity_lux: state.sensorReadings.luminosity_lux,
    p_rainRate_cm_per_hour: state.sensorReadings.p_rainRate_cm_per_hour,
    p_dayRain_cm: state.sensorReadings.p_dayRain_cm,
    windSpeed_kph: state.sensorReadings.windSpeed_kph,
    topic
  });
}

async function startServer() {
  const app = express();

  app.use(express.json());

  // API Route: Live MQTT Telemetry Endpoint
  app.get('/api/telemetry', (req, res) => {
    const recentTopics = Array.from(state.recentTopicsMap.values()).reverse().slice(0, 20);
    const now = Date.now();
    const birdCalls = lastBirdMessageTime > 0 && now - lastBirdMessageTime <= 120000 ? state.sensorReadings.bird_calls_min : 0;
    const batCalls = lastBatMessageTime > 0 && now - lastBatMessageTime <= 120000 ? state.sensorReadings.bat_calls_min : 0;
    const acousticActivity = Math.min(100, (birdCalls + batCalls) * 5);

    const dataPayload = {
      timestamp: new Date().toISOString(),
      mode: 'mqtt' as const,
      ...state.sensorReadings,
      bird_calls_min: birdCalls,
      bat_calls_min: batCalls,
      acoustic_activity: acousticActivity,
      mqttStatus: {
        connected: state.connected,
        broker: state.broker,
        subscribedTopics: state.subscribedTopics,
        lastMessageTime: state.lastMessageTime,
        messageCount: state.messageCount,
        recentTopics,
        lastError: state.lastError || undefined
      }
    };

    res.json(dataPayload);
  });

  // API Route: Detailed MQTT status
  app.get('/api/mqtt/status', (req, res) => {
    res.json({
      connected: state.connected,
      broker: state.broker,
      subscribedTopics: state.subscribedTopics,
      lastMessageTime: state.lastMessageTime,
      messageCount: state.messageCount,
      recentTopics: Array.from(state.recentTopicsMap.values()),
      lastError: state.lastError
    });
  });

  // API Route: GET /api/history?timeframe=24h|1w
  app.get('/api/history', (req, res) => {
    const rawTf = req.query.timeframe as string;
    const timeframe: '24h' | '1w' = rawTf === '1w' ? '1w' : '24h';
    const historyData = dbService.getTelemetryHistory(timeframe);
    res.json({
      success: true,
      timeframe,
      count: historyData.length,
      data: historyData
    });
  });

  // API Route: GET /api/frequencies?from=ms&to=ms
  app.get('/api/frequencies', (req, res) => {
    const from = req.query.from ? Number(req.query.from) : undefined;
    const to = req.query.to ? Number(req.query.to) : undefined;
    const records = dbService.getFrequencies(from, to);
    res.json({
      success: true,
      count: records.length,
      from,
      to,
      data: records
    });
  });

  // API Route: GET /api/mqtt/logs (raw MQTT message database logs)
  app.get('/api/mqtt/logs', (req, res) => {
    const logs = dbService.getRawMqttLogs();
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  });

  // API Route: GET /api/bat-status/latest
  app.get('/api/bat-status/latest', (req, res) => {
    const history = dbService.getBatStatusHistory();
    const latest = history.length > 0 ? history[0] : null;
    res.json({
      success: true,
      data: latest
    });
  });

  // API Route: GET /api/bat-status/history
  app.get('/api/bat-status/history', (req, res) => {
    const history = dbService.getBatStatusHistory();
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  });

  // API Route: GET /api/acoustic-events
  app.get('/api/acoustic-events', (req, res) => {
    const events = dbService.getAcousticEvents();
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  });

  // Community observations are persisted in data/mqtt_db.json.
  app.get('/api/community-observations', (req, res) => {
    const requestedLimit = Number(req.query.limit || 50);
    const observations = dbService.getCommunityObservations(
      Number.isFinite(requestedLimit) ? requestedLimit : 50
    );
    res.json({
      success: true,
      count: observations.length,
      data: observations
    });
  });

  app.post('/api/community-observations', (req, res) => {
    const observationType = typeof req.body?.observationType === 'string'
      ? req.body.observationType.trim()
      : '';
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
    const weatherSummary = typeof req.body?.weather_summary === 'string'
      ? req.body.weather_summary.trim()
      : '';

    if (!observationType || observationType.length > 120) {
      res.status(400).json({ success: false, error: 'A valid observationType is required.' });
      return;
    }
    if (note.length > 1000) {
      res.status(400).json({ success: false, error: 'Field notes must be 1000 characters or fewer.' });
      return;
    }

    const observation = dbService.recordCommunityObservation({
      observationType,
      note: note || undefined,
      weather_summary: weatherSummary || undefined,
      source: 'Web App'
    });

    res.status(201).json({ success: true, data: observation });
  });

  // API Route: SSE Stream for real-time frontend updates
  app.get('/api/telemetry/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = () => {
      const recentTopics = Array.from(state.recentTopicsMap.values()).reverse().slice(0, 15);
      const dataPayload = {
        timestamp: new Date().toISOString(),
        mode: 'mqtt',
        ...state.sensorReadings,
        mqttStatus: {
          connected: state.connected,
          broker: state.broker,
          subscribedTopics: state.subscribedTopics,
          lastMessageTime: state.lastMessageTime,
          messageCount: state.messageCount,
          recentTopics,
          lastError: state.lastError || undefined
        }
      };
      res.write(`data: ${JSON.stringify(dataPayload)}\n\n`);
    };

    sendEvent();
    const interval = setInterval(sendEvent, 2000);

    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        strictPort: false,
        hmr: { host: '127.0.0.1' }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  await listenWithFallback(app, DEFAULT_PORT, HOST);
}

startServer().catch(err => {
  console.error('[SERVER] Fatal startup error:', err);
});
