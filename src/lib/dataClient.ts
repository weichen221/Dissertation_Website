/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SensorData } from './types';

type StreamCallback = (data: SensorData) => void;

const buildUnavailableTelemetry = (): SensorData => ({
  timestamp: new Date().toISOString(),
  mode: 'api',
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
  mqttStatus: {
    connected: false,
    broker: 'mqtt.cetools.org:1883',
    subscribedTopics: ['UCL/GordonStreet/#', 'UCL/GordonStreet/WST/ecowitt'],
    lastMessageTime: null,
    messageCount: 0,
    recentTopics: [],
    lastError: 'Telemetry service unavailable'
  }
});

class GreenWallDataClient {
  private timer: NodeJS.Timeout | null = null;
  private currentMode: 'mqtt' | 'api' = 'mqtt';
  private currentGlobalMode: 'day' | 'night' | 'auto' = 'auto';

  /**
   * Starts a real-time stream that invokes the callback every 5 seconds.
   */
  public startStream(
    callback: StreamCallback, 
    mode: 'mqtt' | 'api', 
    globalMode: 'day' | 'night' | 'auto'
  ) {
    this.stopStream();
    this.currentMode = mode;
    this.currentGlobalMode = globalMode;

    // Send initial packet immediately
    this.fetchAndEmit(callback);

    // Setup 5-second interval
    this.timer = setInterval(() => {
      this.fetchAndEmit(callback);
    }, 5000);
  }

  /**
   * Stops any running stream.
   */
  public stopStream() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private fetchAndEmit(callback: StreamCallback) {
    fetch('/api/telemetry')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data: SensorData) => {
        callback(data);
      })
      .catch(err => {
        console.warn('[DataClient] Backend telemetry fetch error:', err);
        callback(buildUnavailableTelemetry());
      });
  }
}

export const dataClient = new GreenWallDataClient();
export type { StreamCallback };
