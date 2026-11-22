import { booleanPointInPolygon, point } from '@turf/turf';
import ktmZonesRaw from '../data/ktm_zones.json';
import type { HydroZoneId } from '../types/simulator';

export interface ZoneMetadata {
  zoneId: HydroZoneId;
  zoneName: string;
  infiltrationMultiplier: number;
  soilDescription: string;
  engineeringRecommendation: string;
}

interface ZoneFeature {
  type: 'Feature';
  properties: ZoneMetadata;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface ZoneCollection {
  type: 'FeatureCollection';
  features: ZoneFeature[];
}

const ktmZones = ktmZonesRaw as unknown as ZoneCollection;

export function lookupHydroZone(lat: number, lng: number): ZoneMetadata {
  // GeoJSON uses [longitude, latitude] order
  const userPoint = point([lng, lat]);

  for (const feature of ktmZones.features) {
    if (booleanPointInPolygon(userPoint, feature)) {
      return {
        zoneId: feature.properties.zoneId,
        zoneName: feature.properties.zoneName,
        infiltrationMultiplier: feature.properties.infiltrationMultiplier,
        soilDescription: feature.properties.soilDescription,
        engineeringRecommendation: feature.properties.engineeringRecommendation,
      };
    }
  }

  // Fallback for outer valley rim coordinates
  return {
    zoneId: 'OUTSIDE_VALLEY',
    zoneName: 'Outer Valley Rim (Moderate Recharge)',
    infiltrationMultiplier: 0.6,
    soilDescription:
      'Sloped colluvial foothill deposits outside the core valley floor polygons.',
    engineeringRecommendation:
      'Contour Recharge Trench (1.5m depth) with silt trap to prevent hillside runoff.',
  };
}