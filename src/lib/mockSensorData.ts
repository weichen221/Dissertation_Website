/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SensorData } from './types';

export function generateMockSensorData(globalMode: 'day' | 'night' | 'auto'): SensorData {
  const now = new Date();
  
  // Determine if it's currently day or night. If auto, base on local hour (6 AM to 8 PM is day)
  let isDay = true;
  if (globalMode === 'auto') {
    const hour = now.getHours();
    isDay = hour >= 6 && hour < 20;
  } else {
    isDay = globalMode === 'day';
  }

  // Helper to add minor random fluctuation
  const wobble = (min: number, max: number) => min + Math.random() * (max - min);

  // Values based on time of day
  const temperature_c = isDay ? wobble(19.0, 24.5) : wobble(13.5, 17.0);
  const humidity_percent = isDay ? Math.round(wobble(55, 68)) : Math.round(wobble(72, 85));
  const rainfall_mm = Math.random() > 0.85 ? Math.round(wobble(0.1, 2.4) * 10) / 10 : 0.0;
  const light_lux = isDay ? Math.round(wobble(15000, 45000)) : Math.round(wobble(0, 15));
  const wind_speed_ms = Math.round(wobble(1.2, 4.8) * 10) / 10;
  const air_quality_aqi = Math.round(wobble(15, 42)); // low AQI is cleaner, typical for outdoor living wall
  
  const health_scale = Math.round(wobble(88, 96));
  let greenwall_health: SensorData['greenwall_health'] = 'Excellent';
  if (health_scale < 70) greenwall_health = 'Needs Attention';
  else if (health_scale < 85) greenwall_health = 'Fair';
  else if (health_scale < 92) greenwall_health = 'Good';

  // Soundscape data
  const bird_calls_min = isDay ? Math.round(wobble(4, 15)) : Math.round(wobble(0, 2));
  const bat_calls_min = isDay ? 0 : Math.round(wobble(3, 11));
  const acoustic_activity = isDay ? Math.round(wobble(45, 58)) : Math.round(wobble(32, 40)); // quieter at night

  const outTemp_C = Number((temperature_c + (isDay ? 1.6 : 2.4)).toFixed(1));
  const outHumidity = Math.min(100, Math.max(10, Math.round(humidity_percent - (isDay ? 10 : 6))));
  const luminosity_lux = light_lux;
  const p_rainRate_cm_per_hour = rainfall_mm > 0 ? Number((rainfall_mm * 0.1).toFixed(2)) : 0;
  const p_dayRain_cm = Number((rainfall_mm * 0.1 + Math.random() * 0.05).toFixed(2));
  const windSpeed_kph = Number((wind_speed_ms * 3.6).toFixed(1));

  return {
    timestamp: now.toISOString(),
    mode: 'mock',
    temperature_c,
    humidity_percent,
    rainfall_mm,
    light_lux,
    wind_speed_ms,
    air_quality_aqi,
    greenwall_health,
    health_scale,
    bird_calls_min,
    bat_calls_min,
    acoustic_activity,
    outTemp_C,
    outHumidity,
    luminosity_lux,
    p_rainRate_cm_per_hour,
    p_dayRain_cm,
    windSpeed_kph,
  };
}
