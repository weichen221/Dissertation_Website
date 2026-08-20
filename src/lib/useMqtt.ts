/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { SensorData } from './types';
import { extractSpeciesFromMessage } from './species';

export interface MqttMessageRecord {
  id: string;
  topic: string;
  message: any;
  rawMessage: string;
  receivedAt: string;
}

export interface MqttState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  brokerUrl: string;
  subscribedTopics: string[];
  lastMessageTime: string | null;
  lastTopic: string | null;
  lastPayload: any;
  messageCount: number;
  recentMessages: MqttMessageRecord[];
  lastError: string | null;
}

export function useMqtt(enabled: boolean = true) {
  const [mqttState, setMqttState] = useState<MqttState>({
    status: 'connecting',
    brokerUrl: '',
    subscribedTopics: ['UCL/GordonStreet/#'],
    lastMessageTime: null,
    lastTopic: null,
    lastPayload: null,
    messageCount: 0,
    recentMessages: [],
    lastError: null,
  });

  const [liveSensorData, setLiveSensorData] = useState<SensorData>(() => ({
    timestamp: new Date().toISOString(),
    mode: 'mqtt',
    temperature_c: 0,
    humidity_percent: 0,
    rainfall_mm: 0,
    light_lux: 0,
    wind_speed_ms: 0,
    air_quality_aqi: 0,
    greenwall_health: 'Needs Attention',
    health_scale: 0,
    bird_calls_min: 0,
    bat_calls_min: 0,
    acoustic_activity: 0,
    latestBirdSpecies: null,
    latestBatSpecies: null,
    latestSpecies: null,
    outTemp_C: 0,
    outHumidity: 0,
    luminosity_lux: 0,
    p_rainRate_cm_per_hour: 0,
    p_dayRain_cm: 0,
    windSpeed_kph: 0
  }));

  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (clientRef.current) {
        clientRef.current.end();
        clientRef.current = null;
      }
      setMqttState(prev => ({ ...prev, status: 'disconnected' }));
      return;
    }

    // Determine WebSocket URL based on window protocol
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const brokerUrl = isHttps
      ? 'wss://mqtt.cetools.org:8081'
      : 'ws://mqtt.cetools.org:8080';

    const clientId = `bird-web-${Math.random().toString(16).slice(2)}`;

    setMqttState(prev => ({
      ...prev,
      status: 'connecting',
      brokerUrl: 'mqtt.cetools.org:1883 (Server Proxy)',
      lastError: null
    }));

    console.log(`[MQTT Frontend] Using backend proxy for telemetry with clientId: ${clientId}`);

    // Keep frontend stable by using backend telemetry as the primary source.
    const useBackendProxyOnly = true;

    let isUsingBackendFallback = false;
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const applyBackendTelemetry = (data: any) => {
      if (!data || !data.mqttStatus) return;

      const backendBrokerConnected = data.mqttStatus.connected === true;

      setMqttState(prev => ({
        ...prev,
        status: 'connected',
        brokerUrl: 'mqtt.cetools.org:1883 (Server Proxy)',
        subscribedTopics: ['UCL/GordonStreet/#', 'UCL/GordonStreet/WST/ecowitt', 'UCL/GordonStreet/acoupi-bird', 'UCL/GordonStreet/acoupi-bat'],
        lastMessageTime: data.mqttStatus.lastMessageTime || new Date().toISOString(),
        lastTopic: data.mqttStatus.recentTopics?.[0]?.topic || prev.lastTopic || null,
        lastPayload: data.mqttStatus.recentTopics?.[0]?.value || prev.lastPayload || null,
        messageCount: data.mqttStatus.messageCount || prev.messageCount,
        recentMessages: (data.mqttStatus.recentTopics || []).map((t: any, idx: number) => ({
          id: `${t.timestamp}-${idx}`,
          topic: t.topic,
          message: t.value,
          rawMessage: t.rawPayload,
          receivedAt: t.timestamp
        })),
        lastError: backendBrokerConnected ? null : 'Broker unstable; frontend is using backend proxy cache/stream.'
      }));

      setLiveSensorData(prev => ({
        ...prev,
        timestamp: data.timestamp || new Date().toISOString(),
        mode: 'mqtt' as const,
        temperature_c: data.temperature_c ?? prev.temperature_c,
        humidity_percent: data.humidity_percent ?? prev.humidity_percent,
        wind_speed_ms: data.wind_speed_ms ?? prev.wind_speed_ms,
        health_scale: data.health_scale ?? prev.health_scale,
        rainfall_mm: data.rainfall_mm ?? prev.rainfall_mm,
        light_lux: data.light_lux ?? prev.light_lux,
        air_quality_aqi: data.air_quality_aqi ?? prev.air_quality_aqi,
        greenwall_health: data.greenwall_health ?? prev.greenwall_health,
        bird_calls_min: data.bird_calls_min ?? prev.bird_calls_min,
        bat_calls_min: data.bat_calls_min ?? prev.bat_calls_min,
        acoustic_activity: data.acoustic_activity ?? prev.acoustic_activity,
        outTemp_C: data.outTemp_C ?? prev.outTemp_C,
        outHumidity: data.outHumidity ?? prev.outHumidity,
        luminosity_lux: data.luminosity_lux ?? prev.luminosity_lux,
        p_rainRate_cm_per_hour: data.p_rainRate_cm_per_hour ?? prev.p_rainRate_cm_per_hour,
        p_dayRain_cm: data.p_dayRain_cm ?? prev.p_dayRain_cm,
        windSpeed_kph: data.windSpeed_kph ?? prev.windSpeed_kph,
        latestBirdSpecies: data.latestBirdSpecies ?? prev.latestBirdSpecies ?? null,
        latestBatSpecies: data.latestBatSpecies ?? prev.latestBatSpecies ?? null,
        latestSpecies: data.latestSpecies ?? prev.latestSpecies ?? null
      }));
    };

    const startBackendFallback = (reason: string) => {
      if (isUsingBackendFallback) return;
      isUsingBackendFallback = true;
      console.log(`[MQTT Frontend] Using backend server MQTT proxy (${reason})...`);

      if (clientRef.current) {
        try { clientRef.current.end(true); } catch {}
        clientRef.current = null;
      }

      setMqttState(prev => ({
        ...prev,
        status: 'connected',
        brokerUrl: 'mqtt.cetools.org:1883 (Server Proxy)',
        subscribedTopics: ['UCL/GordonStreet/#', 'UCL/GordonStreet/WST/ecowitt', 'UCL/GordonStreet/acoupi-bird', 'UCL/GordonStreet/acoupi-bat'],
        lastError: null
      }));

      // Initial fast fetch
      fetch('/api/telemetry')
        .then(res => res.json())
        .then(data => applyBackendTelemetry(data))
        .catch(() => {});

      // Set up SSE stream
      try {
        eventSource = new EventSource('/api/telemetry/stream');
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            applyBackendTelemetry(data);
          } catch (e) {
            console.error('[MQTT Frontend] SSE parse error:', e);
          }
        };

        eventSource.onerror = () => {
          // Backup polling if SSE encounters transient network glitch
          if (!pollInterval) {
            pollInterval = setInterval(async () => {
              try {
                const res = await fetch('/api/telemetry');
                if (res.ok) {
                  const data = await res.json();
                  applyBackendTelemetry(data);
                }
              } catch {}
            }, 3000);
          }
        };
      } catch (err: any) {
        console.error('[MQTT Frontend] Failed to initialize SSE stream:', err);
      }
    };

    // Start backend proxy immediately so the UI stays stable.
    startBackendFallback('Backend proxy preferred');
    const fallbackTimer = setTimeout(() => {
      startBackendFallback('Fallback timer');
    }, 100);

    let client: MqttClient | null = null;
    if (!useBackendProxyOnly) {
      try {
        client = mqtt.connect(brokerUrl, {
          clientId,
          reconnectPeriod: 0,
          connectTimeout: 1500,
          keepalive: 30,
          clean: true,
        });

        clientRef.current = client;

        client.on('connect', () => {
          console.log('MQTT connected directly via WebSocket');
          setMqttState(prev => ({
            ...prev,
            status: 'connected',
            brokerUrl,
            lastError: null
          }));

          if (client && client.connected) {
            client.subscribe('UCL/GordonStreet/#', (err) => {
              if (err && !err.message.includes('disconnecting')) {
                console.warn('MQTT subscription warning:', err.message);
              } else if (!err) {
                console.log('MQTT subscribed to UCL/GordonStreet/#');
              }
            });
          }
        });

        client.on('error', () => {
          // Avoid endless reconnect loops; fall back to the stable proxy.
        });
      } catch (err: any) {
        console.warn('[MQTT Frontend] Direct connect not available:', err?.message || 'init failed');
      }
    }

    if (client) {
      client.on('message', (topic: string, payload: Buffer) => {
      const rawMessage = payload.toString();
      const receivedAt = new Date().toISOString();

      let parsedMessage: any = rawMessage;
      try {
        parsedMessage = JSON.parse(rawMessage);
      } catch {
        const num = parseFloat(rawMessage);
        if (!isNaN(num)) {
          parsedMessage = num;
        } else {
          parsedMessage = rawMessage;
        }
      }

      console.log({
        topic,
        message: parsedMessage,
        receivedAt,
      });

      // Update MQTT State
      setMqttState(prev => {
        const newRecord: MqttMessageRecord = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          topic,
          message: parsedMessage,
          rawMessage: rawMessage.length > 250 ? rawMessage.slice(0, 250) + '...' : rawMessage,
          receivedAt
        };

        const updatedMessages = [newRecord, ...prev.recentMessages].slice(0, 20);

        return {
          ...prev,
          lastMessageTime: receivedAt,
          lastTopic: topic,
          lastPayload: parsedMessage,
          messageCount: prev.messageCount + 1,
          recentMessages: updatedMessages
        };
      });

      // Map incoming MQTT message to live SensorData
      setLiveSensorData(prev => {
        const updated = { ...prev, timestamp: receivedAt, mode: 'mqtt' as const };
        const lowerTopic = topic.toLowerCase();

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

        const species = extractSpeciesFromMessage(parsedMessage, rawMessage);

        // Temperature
        if (lowerTopic.includes('temp') || lowerTopic.includes('temperature')) {
          const val = extractNum(parsedMessage, ['temp', 'temperature', 'val', 'value', 't']);
          if (val !== null && val > -20 && val < 60) {
            updated.temperature_c = Math.round(val * 10) / 10;
          }
        }

        // Outdoor / external temperature
        if (lowerTopic.includes('outtemp') || lowerTopic.includes('out_temp') || lowerTopic.includes('outdoor temperature')) {
          const val = extractNum(parsedMessage, ['outTemp_C', 'outTemp', 'temperature', 'temp', 'val', 'value']);
          if (val !== null && val > -30 && val < 60) {
            updated.outTemp_C = Math.round(val * 10) / 10;
          }
        }

        // Moisture / Humidity
        if (lowerTopic.includes('humid') || lowerTopic.includes('moist') || lowerTopic.includes('rh') || lowerTopic.includes('soil')) {
          const val = extractNum(parsedMessage, ['humidity', 'moisture', 'rh', 'val', 'value', 'h']);
          if (val !== null && val >= 0 && val <= 100) {
            updated.humidity_percent = Math.round(val);
          }
        }

        // Outdoor humidity
        if (lowerTopic.includes('outhumid') || lowerTopic.includes('out_humidity') || lowerTopic.includes('outdoor humidity')) {
          const val = extractNum(parsedMessage, ['outHumidity', 'humidity', 'hum', 'val', 'value']);
          if (val !== null && val >= 0 && val <= 100) {
            updated.outHumidity = Math.round(val);
          }
        }

        // Air Quality / AQI / PM2.5
        if (lowerTopic.includes('aqi') || lowerTopic.includes('air') || lowerTopic.includes('pm25')) {
          const val = extractNum(parsedMessage, ['aqi', 'pm25', 'val', 'value']);
          if (val !== null && val >= 0 && val <= 500) {
            updated.air_quality_aqi = Math.round(val);
          }
        }

        // Light / Lux
        if (lowerTopic.includes('light') || lowerTopic.includes('lux') || lowerTopic.includes('sun')) {
          const val = extractNum(parsedMessage, ['lux', 'light', 'val', 'value']);
          if (val !== null && val >= 0) {
            updated.light_lux = Math.round(val);
          }
        }

        if (lowerTopic.includes('luminosity')) {
          const val = extractNum(parsedMessage, ['luminosity_lux', 'lux', 'value', 'val']);
          if (val !== null && val >= 0) {
            updated.luminosity_lux = Math.round(val);
          }
        }

        // Rainfall metrics
        if (lowerTopic.includes('rain') || lowerTopic.includes('rainfall') || lowerTopic.includes('p_rain') || lowerTopic.includes('p_day')) {
          const val = extractNum(parsedMessage, ['p_rainRate_cm_per_hour', 'p_rainRate', 'rain_rate', 'rainRate', 'rainfall', 'value', 'val']);
          if (val !== null && val >= 0) {
            updated.p_rainRate_cm_per_hour = Number(val.toFixed(2));
          }
          const dayVal = extractNum(parsedMessage, ['p_dayRain_cm', 'dayRain', 'day_rain', 'rainfall_day', 'dayRain_cm']);
          if (dayVal !== null && dayVal >= 0) {
            updated.p_dayRain_cm = Number(dayVal.toFixed(2));
          }
        }

        // Wind speed
        if (lowerTopic.includes('windspeed') || lowerTopic.includes('wind_speed') || lowerTopic.includes('kph')) {
          const val = extractNum(parsedMessage, ['windSpeed_kph', 'wind_speed_kph', 'windSpeed', 'wind_speed', 'value', 'val']);
          if (val !== null && val >= 0) {
            updated.windSpeed_kph = Number(val.toFixed(1));
          }
        }

        // Acoustic / Bird calls (e.g. acoupi-bird)
        if (lowerTopic === 'ucl/gordonstreet/acoupi-bird') {
          const val = extractNum(parsedMessage, ['count', 'bird_count', 'birds', 'db', 'val', 'value']);
          if (val !== null) {
            if (val >= 0 && val < 120) {
              updated.bird_calls_min = Math.round(val);
              updated.acoustic_activity = Math.min(95, Math.max(30, Math.round(val * 2.5 + 25)));
            }
          }

          const resolvedBirdSpecies = species || 'unknown bird species';
          updated.latestBirdSpecies = resolvedBirdSpecies;
          updated.latestSpecies = resolvedBirdSpecies;
        }

        if (lowerTopic === 'ucl/gordonstreet/acoupi-bat') {
          const val = extractNum(parsedMessage, ['count', 'bat_count', 'bats', 'calls', 'value', 'val']);
          updated.bat_calls_min = val !== null && val >= 0 ? Math.round(val) : 0;
          const resolvedBatSpecies = species || 'unknown bat species';
          updated.latestBatSpecies = resolvedBatSpecies;
          updated.latestSpecies = resolvedBatSpecies;
        }

        // Composite object handling
        if (typeof parsedMessage === 'object' && parsedMessage !== null) {
          const t = extractNum(parsedMessage, ['temperature', 'temp']);
          if (t !== null) updated.temperature_c = Math.round(t * 10) / 10;

          const h = extractNum(parsedMessage, ['humidity', 'moisture', 'rh']);
          if (h !== null) updated.humidity_percent = Math.round(h);

          const l = extractNum(parsedMessage, ['light', 'lux']);
          if (l !== null) updated.light_lux = Math.round(l);

          const lum = extractNum(parsedMessage, ['luminosity_lux', 'lux']);
          if (lum !== null) updated.luminosity_lux = Math.round(lum);

          const outTemp = extractNum(parsedMessage, ['outTemp_C', 'outTemp', 'temperature', 'temp']);
          if (outTemp !== null) updated.outTemp_C = Math.round(outTemp * 10) / 10;

          const outHum = extractNum(parsedMessage, ['outHumidity', 'humidity', 'hum']);
          if (outHum !== null) updated.outHumidity = Math.round(outHum);

          const rainRate = extractNum(parsedMessage, ['p_rainRate_cm_per_hour', 'rainRate', 'rain_rate']);
          if (rainRate !== null) updated.p_rainRate_cm_per_hour = Number(rainRate.toFixed(2));

          const dayRain = extractNum(parsedMessage, ['p_dayRain_cm', 'dayRain', 'day_rain']);
          if (dayRain !== null) updated.p_dayRain_cm = Number(dayRain.toFixed(2));

          const windKph = extractNum(parsedMessage, ['windSpeed_kph', 'wind_speed_kph', 'windSpeed', 'wind_speed']);
          if (windKph !== null) updated.windSpeed_kph = Number(windKph.toFixed(1));

          const a = extractNum(parsedMessage, ['aqi', 'pm25']);
          if (a !== null) updated.air_quality_aqi = Math.round(a);
        }

        return updated;
      });
    });

    client.on('reconnect', () => {
      if (!isUsingBackendFallback) {
        setMqttState(prev => ({ ...prev, status: 'connecting' }));
      }
    });

    client.on('close', () => {
      if (!isUsingBackendFallback) {
        setMqttState(prev => ({ ...prev, status: 'disconnected' }));
      }
    });
  }

    return () => {
      console.log('[MQTT Frontend] Cleaning up MQTT client connection');
      clearTimeout(fallbackTimer);
      if (pollInterval) clearInterval(pollInterval);
      if (eventSource) {
        try { eventSource.close(); } catch {}
      }
      if (clientRef.current) {
        try { clientRef.current.end(true); } catch {}
        clientRef.current = null;
      }
    };
  }, [enabled]);

  return { mqttState, liveSensorData };
}
