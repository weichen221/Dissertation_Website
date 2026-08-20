import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldSeedDemoData } from './mqttStorage';

test('demo data seeding is disabled by default', () => {
  delete process.env.MQTT_SEED_DEMO_DATA;
  assert.equal(shouldSeedDemoData(), false);
});

test('demo data seeding can be enabled explicitly', () => {
  process.env.MQTT_SEED_DEMO_DATA = 'true';
  assert.equal(shouldSeedDemoData(), true);
  delete process.env.MQTT_SEED_DEMO_DATA;
});
