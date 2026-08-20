const GENERIC_SPECIES_LABELS = new Set([
  'bird',
  'birds',
  'bat',
  'bats',
  'animal',
  'animals',
  'species',
  'unknown',
  'unspecified',
  'observed',
  'acoupi-bird',
  'acoupi-bat',
  'avian',
  'avian vocalization',
  'bat ultrasonic echolocation',
  'ultrasonic echolocation'
]);

function isGenericSpeciesLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return GENERIC_SPECIES_LABELS.has(normalized) || normalized.includes('bird') && normalized.includes('species');
}

export function normalizeSpeciesName(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return null;

    const withoutPrefix = trimmed
      .replace(/^(species|bird|name|label|value)\s*[:=-]\s*/i, '')
      .replace(/^(species|bird|name|label)\s+/i, '')
      .trim();

    if (!withoutPrefix) return null;
    if (withoutPrefix.startsWith('{') || withoutPrefix.startsWith('[')) return null;
    if (isGenericSpeciesLabel(withoutPrefix)) return null;

    return withoutPrefix.replace(/\s+/g, ' ');
  }

  if (typeof value === 'number') return null;

  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    for (const key of ['species', 'bird', 'name', 'label', 'value']) {
      const normalized = normalizeSpeciesName(record[key]);
      if (normalized) return normalized;
    }
  }

  return null;
}

export function extractSpeciesFromMessage(payload: unknown, rawMessage?: string): string | null {
  if (typeof payload === 'string') {
    const normalized = normalizeSpeciesName(payload);
    if (normalized) return normalized;
  }

  if (typeof payload === 'object' && payload !== null) {
    const normalized = normalizeSpeciesName(payload);
    if (normalized) return normalized;
  }

  if (typeof rawMessage === 'string') {
    const trimmed = rawMessage.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const matches = Array.from(trimmed.matchAll(/"(?:value|species|bird|name|label)"\s*:\s*"([^"]+)"/gi));
      for (const match of matches) {
        const candidate = normalizeSpeciesName(match[1]);
        if (candidate) return candidate;
      }
    }

    const fallback = normalizeSpeciesName(trimmed);
    if (fallback) return fallback;
  }

  return null;
}
