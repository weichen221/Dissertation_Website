import test from 'node:test';
import assert from 'node:assert/strict';

import { extractSpeciesFromMessage } from './species.js';

test('extracts species from a value field in an MQTT payload object', () => {
  const payload = { value: 'Blue Tit' };
  assert.equal(extractSpeciesFromMessage(payload), 'Blue Tit');
});

test('extracts a species name from a plain string payload', () => {
  assert.equal(extractSpeciesFromMessage('Robin'), 'Robin');
});

test('ignores numeric payload values when extracting species', () => {
  assert.equal(extractSpeciesFromMessage({ value: '4200' }), null);
});

test('prefers a specific species name over a generic bird label', () => {
  assert.equal(extractSpeciesFromMessage({ value: 'Bird', species: 'Blue Tit' }), 'Blue Tit');
});

test('extracts a species name from a nested value.value payload', () => {
  assert.equal(extractSpeciesFromMessage({ value: { value: 'Robin' } }), 'Robin');
});
