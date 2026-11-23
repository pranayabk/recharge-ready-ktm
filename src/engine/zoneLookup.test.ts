import { describe, expect, it } from 'vitest';
import { KTM_ZONES, lookupHydroZone } from './zoneLookup';

describe('lookupHydroZone', () => {
  it.each([
    ['Budhanilkantha', 27.7785, 85.3621, 'NORTH_ALLUVIAL'],
    ['Tokha', 27.7686, 85.3245, 'NORTH_ALLUVIAL'],
    ['Putalisadak', 27.7032, 85.3228, 'CENTRAL_CLAY'],
    ['Kirtipur', 27.678, 85.278, 'CENTRAL_CLAY'],
    ['Bhaktapur Durbar Square', 27.6722, 85.428, 'CENTRAL_CLAY'],
    ['Harisiddhi', 27.6385, 85.3412, 'SOUTH_MIXED'],
    ['Pokhara (outside valley)', 28.2096, 83.9856, 'OUTSIDE_VALLEY'],
  ])('%s -> %s', (_name, lat, lng, expected) => {
    expect(lookupHydroZone(lat, lng).zoneId).toBe(expected);
  });

  it('falls back to OUTSIDE_VALLEY for non-finite coordinates', () => {
    expect(lookupHydroZone(Number.NaN, 85.3).zoneId).toBe('OUTSIDE_VALLEY');
  });

  it('every zone (incl. fallback) has a colour for the map legend', () => {
    for (const f of KTM_ZONES.features) expect(f.properties.color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(KTM_ZONES.fallback.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('returns a copy so callers cannot mutate the shared zone data', () => {
    const z = lookupHydroZone(27.7785, 85.3621);
    z.infiltrationMultiplier = 0;
    expect(lookupHydroZone(27.7785, 85.3621).infiltrationMultiplier).toBe(1);
  });
});
