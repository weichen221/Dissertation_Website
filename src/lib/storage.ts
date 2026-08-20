/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommunityObservation } from './types';

const OBS_KEY = 'ucl_greenwall_observations';
const MODE_KEY = 'ucl_greenwall_global_mode';

const INITIAL_OBSERVATIONS: CommunityObservation[] = [
  {
    id: 'obs-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    observationType: 'I heard a bird',
    note: 'A pair of blue tits were nested in the lower ivy segment. Very energetic!',
    weather_summary: 'Slight breeze, 21.3°C',
    source: 'Web App'
  },
  {
    id: 'obs-2',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    observationType: 'It feels cooler here',
    note: 'The air near the canopy feels noticeably cooler and more refreshing than the main street pavement.',
    weather_summary: 'Overcast, 15.8°C',
    source: 'Web App'
  }
];

export function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function saveObservations(observations: CommunityObservation[]): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(OBS_KEY, JSON.stringify(observations));
  } catch (error) {
    console.error('Failed to save observations', error);
  }
}

export function loadObservations(): CommunityObservation[] {
  if (!isClient()) return INITIAL_OBSERVATIONS;
  try {
    const data = localStorage.getItem(OBS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load observations', error);
  }
  return INITIAL_OBSERVATIONS;
}

export function saveGlobalMode(mode: 'day' | 'night' | 'auto'): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch (error) {
    console.error('Failed to save mode', error);
  }
}

export function loadGlobalMode(): 'day' | 'night' | 'auto' {
  if (!isClient()) return 'auto';
  try {
    const mode = localStorage.getItem(MODE_KEY);
    if (mode === 'day' || mode === 'night' || mode === 'auto') {
      return mode;
    }
  } catch (error) {
    console.error('Failed to load mode', error);
  }
  return 'auto';
}
