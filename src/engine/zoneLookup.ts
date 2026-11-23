import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import ktmZonesRaw from '../data/ktm_zones.json';
import type { HydroZoneId } from '../types/simulator';

export interface ZoneMetadata {
  zoneId: HydroZoneId;
  zoneName: string;
  infiltrationMultiplier: number;
  soilDescription: string;
  engineeringRecommendation: string;
  color: string;
}

export type ZoneFeatureCollection = FeatureCollection<Polygon, ZoneMetadata> & {
  fallback: ZoneMetadata;
};

/** Zone polygons, exported so the map layer can render exactly what the engine uses. */
export const KTM_ZONES = ktmZonesRaw as unknown as ZoneFeatureCollection;

export function lookupHydroZone(lat: number, lng: number): ZoneMetadata {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ...KTM_ZONES.fallback };
  }

  // GeoJSON uses [longitude, latitude] order
  const userPoint = point([lng, lat]);

  const match = KTM_ZONES.features.find((feature: Feature<Polygon, ZoneMetadata>) =>
    booleanPointInPolygon(userPoint, feature)
  );

  return { ...(match ? match.properties : KTM_ZONES.fallback) };
}
