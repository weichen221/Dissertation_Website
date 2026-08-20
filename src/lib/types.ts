/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MqttTopicEntry {
  topic: string;
  value: any;
  rawPayload: string;
  timestamp: string;
}

export interface MqttStatus {
  connected: boolean;
  broker: string;
  subscribedTopics: string[];
  lastMessageTime: string | null;
  messageCount: number;
  recentTopics: MqttTopicEntry[];
  lastError?: string;
}

export interface BatDeviceStatus {
  id?: string;
  sent_on?: string;
  device_id?: string;
  status?: any;
  received_at: string;
  topic: string;
  raw_payload: string;
}

export interface SensorData {
  timestamp: string;
  mode: 'mock' | 'mqtt' | 'api';
  temperature_c: number;
  humidity_percent: number;
  rainfall_mm: number;
  light_lux: number;
  wind_speed_ms: number;
  air_quality_aqi: number;
  greenwall_health: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
  health_scale: number; // 0 to 100
  bird_calls_min: number;
  bat_calls_min: number;
  acoustic_activity: number; // overall sound level in dB or index
  latestBirdSpecies?: string | null;
  latestBatSpecies?: string | null;
  latestSpecies?: string | null;
  outTemp_C?: number;
  outHumidity?: number;
  luminosity_lux?: number;
  p_rainRate_cm_per_hour?: number;
  p_dayRain_cm?: number;
  windSpeed_kph?: number;
  mqttStatus?: MqttStatus;
}

export interface CommunityObservation {
  id: string;
  timestamp: string;
  observationType: string;
  note?: string;
  weather_summary?: string;
  source: string;
}

export type GlobalMode = 'day' | 'night' | 'auto';
